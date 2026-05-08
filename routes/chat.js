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

function getConversationInclude() {
  return {
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
      take: 1,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            gender: true,
            role: true
          }
        }
      }
    }
  };
}

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
      include: getConversationInclude(),
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
 * POST /api/chat/conversations/direct
 * Create or reuse a direct two-person conversation.
 */
router.post('/conversations/direct', authenticateUser, async (req, res) => {
  try {
    const senderId = Number(req.user.id);
    const recipientId = Number(req.body.recipientId);

    if (!recipientId || Number.isNaN(recipientId)) {
      return res.status(400).json({ success: false, message: 'Valid recipient id is required' });
    }

    if (recipientId === senderId) {
      return res.status(400).json({ success: false, message: 'You cannot start a direct conversation with yourself' });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true }
    });

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Crew member not found' });
    }

    const candidates = await prisma.conversation.findMany({
      where: {
        AND: [
          { users: { some: { id: senderId } } },
          { users: { some: { id: recipientId } } }
        ]
      },
      include: getConversationInclude(),
      orderBy: { updated_at: 'desc' }
    });

    const existingConversation = candidates.find((conversation) => conversation.users.length === 2) || candidates[0];

    if (existingConversation) {
      return res.json({
        success: true,
        created: false,
        data: existingConversation
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [
            { id: senderId },
            { id: recipientId }
          ]
        }
      },
      include: getConversationInclude()
    });

    res.status(201).json({
      success: true,
      created: true,
      data: conversation
    });
  } catch (error) {
    console.error('Direct conversation error:', error.message);
    res.status(500).json({ success: false, message: 'Could not open conversation' });
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
            gender: true,
            role: true
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

    let targetConversationId = conversationId;
    let targetRecipientId = recipientId ? Number(recipientId) : null;

    if (targetConversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: Number(targetConversationId),
          users: {
            some: { id: senderId }
          }
        },
        include: {
          users: { select: { id: true } }
        }
      });

      if (!conversation) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      targetConversationId = conversation.id;
      targetRecipientId = conversation.users.find((member) => member.id !== senderId)?.id || null;
    }

    // If no conversationId, check if a conversation already exists with recipient
    if (!targetConversationId && targetRecipientId) {
      if (targetRecipientId === senderId) {
        return res.status(400).json({ success: false, message: 'You cannot message yourself' });
      }

      const recipient = await prisma.user.findUnique({
        where: { id: Number(targetRecipientId) },
        select: { id: true }
      });

      if (!recipient) {
        return res.status(404).json({ success: false, message: 'Recipient not found' });
      }

      const existingConversations = await prisma.conversation.findMany({
        where: {
          AND: [
            { users: { some: { id: senderId } } },
            { users: { some: { id: Number(targetRecipientId) } } }
          ]
        },
        include: { users: { select: { id: true } } },
        orderBy: { updated_at: 'desc' }
      });
      const existingConversation = existingConversations.find((conversation) => conversation.users.length === 2) || existingConversations[0];

      if (existingConversation) {
        targetConversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            users: {
              connect: [
                { id: senderId },
                { id: Number(targetRecipientId) }
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
            gender: true,
            role: true
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
      if (targetRecipientId) {
        pusher.trigger(`user-${targetRecipientId}`, 'message-notification', {
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
