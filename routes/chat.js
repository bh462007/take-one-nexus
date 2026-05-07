const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const Pusher = require('pusher');

const prisma = new PrismaClient();
const router = express.Router();

// Configure Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true
});

/**
 * GET /api/chat/conversations
 * Get all conversations for the logged-in user
 */
router.get('/conversations', authenticateUser, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: { id: userId }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            gender: true,
            role: true
          }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Fetch conversations error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load conversations' });
  }
});

/**
 * GET /api/chat/messages/:conversationId
 * Get message history for a conversation
 */
router.get('/messages/:conversationId', authenticateUser, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = Number(req.user.id);

    // Check if user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: { id: userId }
        }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            gender: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Fetch messages error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load messages' });
  }
});

/**
 * POST /api/chat/messages
 * Send a new message
 */
router.post('/messages', authenticateUser, async (req, res) => {
  try {
    const { conversationId, content, recipientId } = req.body;
    const senderId = Number(req.user.id);

    if (!content || (!conversationId && !recipientId)) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (!process.env.PUSHER_APP_ID) {
      return res.status(503).json({ success: false, message: 'Chat system is offline (Pusher not configured)' });
    }

    let targetConversationId = conversationId;

    // If no conversationId, check if a conversation already exists with recipient
    if (!targetConversationId && recipientId) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { users: { some: { id: senderId } } },
            { users: { some: { id: Number(recipientId) } } }
          ]
        }
      });

      if (existingConversation) {
        targetConversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            users: {
              connect: [
                { id: senderId },
                { id: Number(recipientId) }
              ]
            }
          }
        });
        targetConversationId = newConversation.id;
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversation_id: targetConversationId,
        sender_id: senderId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            gender: true
          }
        }
      }
    });

    // Update conversation updated_at
    await prisma.conversation.update({
      where: { id: targetConversationId },
      data: { updated_at: new Date() }
    });

    // Trigger Pusher event
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger(`conversation-${targetConversationId}`, 'new-message', {
        message
      });
      
      // Also notify recipient's personal channel for unread indicators/sidebar updates
      if (recipientId) {
        pusher.trigger(`user-${recipientId}`, 'message-notification', {
          conversationId: targetConversationId,
          message
        });
      }
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({ success: false, message: 'Could not send message' });
  }
});

module.exports = router;
