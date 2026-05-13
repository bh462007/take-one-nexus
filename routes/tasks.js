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
 * GET /api/tasks/:conversationId
 * Get all tasks for a conversation
 */
router.get('/:conversationId', authenticateUser, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = Number(req.user.id);

    // Check if user is part of the conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId
        }
      }
    });

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tasks = await prisma.task.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load tasks' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { conversationId, title, description, priority, assigneeId, dueDate, rewardCredits } = req.body;
    const userId = Number(req.user.id);

    // Check if user is Director or Admin
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: Number(conversationId),
          user_id: userId
        }
      }
    });

    if (!member || !['Director', 'Admin'].includes(member.role)) {
      return res.status(403).json({ success: false, message: 'Only Directors and Admins can assign tasks.' });
    }

    const task = await prisma.task.create({
      data: {
        conversation_id: Number(conversationId),
        creator_id: userId,
        assignee_id: assigneeId ? Number(assigneeId) : null,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'Medium',
        due_date: dueDate ? new Date(dueDate) : null,
        reward_credits: rewardCredits ? Number(rewardCredits) : 0
      }
    });

    // Trigger Pusher update
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger(`conversation-${conversationId}`, 'task-update', {
        type: 'TASK_CREATED',
        task
      });
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({ success: false, message: 'Could not create task' });
  }
});

/**
 * PATCH /api/tasks/:id
 * Update task status or details
 */
router.patch('/:id', authenticateUser, async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const userId = Number(req.user.id);
    const { status, priority, title, description, assigneeId, dueDate } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if user is member of the conversation
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: task.conversation_id,
          user_id: userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only Director/Admin can change priority, title, etc.
    // Assignee or Director/Admin can change status.
    const isLead = ['Director', 'Admin'].includes(member.role);
    const isAssignee = task.assignee_id === userId;

    if (!isLead && !isAssignee && status) {
       return res.status(403).json({ success: false, message: 'You are not assigned to this task.' });
    }

    if (!isLead && (priority || title || description || assigneeId || dueDate)) {
      return res.status(403).json({ success: false, message: 'Only Directors and Admins can modify task details.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(status && { status }),
        ...(priority && isLead && { priority }),
        ...(title && isLead && { title: title.trim() }),
        ...(description !== undefined && isLead && { description: description?.trim() || null }),
        ...(assigneeId !== undefined && isLead && { assignee_id: assigneeId ? Number(assigneeId) : null }),
        ...(dueDate !== undefined && isLead && { due_date: dueDate ? new Date(dueDate) : null }),
        ...(status === 'Done' && { completed_at: new Date() })
      }
    });

    // Trigger Pusher update
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger(`conversation-${task.conversation_id}`, 'task-update', {
        type: 'TASK_UPDATED',
        task: updatedTask
      });
    }

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Update task error:', error.message);
    res.status(500).json({ success: false, message: 'Could not update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const userId = Number(req.user.id);

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if user is Director or Admin
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: task.conversation_id,
          user_id: userId
        }
      }
    });

    if (!member || !['Director', 'Admin'].includes(member.role)) {
      return res.status(403).json({ success: false, message: 'Only Directors and Admins can delete tasks.' });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    // Trigger Pusher update
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger(`conversation-${task.conversation_id}`, 'task-update', {
        type: 'TASK_DELETED',
        taskId
      });
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ success: false, message: 'Could not delete task' });
  }
});

/**
 * POST /api/tasks/:id/approve
 * Approve a completed task and award credits
 */
router.post('/:id/approve', authenticateUser, async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const userId = Number(req.user.id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { conversation: true }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.status !== 'Done') {
      return res.status(400).json({ success: false, message: 'Only completed tasks can be approved.' });
    }

    if (task.approval_status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Task is already approved.' });
    }

    // Check if user is Director or Admin in the conversation
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: task.conversation_id,
          user_id: userId
        }
      }
    });

    if (!member || !['Director', 'Admin'].includes(member.role)) {
      return res.status(403).json({ success: false, message: 'Only Directors and Admins can approve tasks.' });
    }

    // Update task and award credits in a transaction
    const [updatedTask, updatedUser] = await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: {
          approval_status: 'Approved',
          approved_at: new Date()
        }
      }),
      ...(task.assignee_id && task.reward_credits > 0 ? [
        prisma.user.update({
          where: { id: task.assignee_id },
          data: {
            credits: { increment: task.reward_credits }
          }
        }),
        prisma.creditTransaction.create({
          data: {
            user_id: task.assignee_id,
            amount: task.reward_credits,
            reason: `Task Completed: ${task.title}`,
            type: 'CREDIT'
          }
        })
      ] : [])
    ]);

    // Trigger Pusher update for conversation
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger(`conversation-${task.conversation_id}`, 'task-update', {
        type: 'TASK_UPDATED',
        task: updatedTask
      });

      // Trigger update for specific user's credits if assigned
      if (task.assignee_id && task.reward_credits > 0) {
        pusher.trigger(`user-${task.assignee_id}`, 'credit-update', {
          credits: updatedUser.credits,
          change: task.reward_credits,
          reason: task.title
        });
      }
      
      // Global leaderboard update trigger
      pusher.trigger('global-events', 'leaderboard-update', {});
    }

    res.json({ 
      success: true, 
      message: 'Task approved and rewards granted.',
      data: updatedTask 
    });
  } catch (error) {
    console.error('Approve task error:', error.message);
    res.status(500).json({ success: false, message: 'Could not approve task' });
  }
});

module.exports = router;
