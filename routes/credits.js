const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/credits/tasks
 * Returns all active incentive tasks, plus completion status for the current user.
 */
router.get('/tasks', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const [tasks, completed] = await Promise.all([
      prisma.creditTask.findMany({
        where: { is_active: true },
        orderBy: { credits_rewarded: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          credits_rewarded: true,
          trigger_type: true,
        }
      }),
      prisma.userCompletedTask.findMany({
        where: { user_id: userId },
        select: { task_id: true, credits_awarded: true, completed_at: true }
      })
    ]);

    const completedIds = new Set(completed.map(c => c.task_id));

    const enrichedTasks = tasks.map(task => ({
      ...task,
      completed: completedIds.has(task.id),
      completed_at: completed.find(c => c.task_id === task.id)?.completed_at || null,
    }));

    return res.json({ success: true, data: enrichedTasks });
  } catch (error) {
    console.error('[CREDITS_TASKS_ERROR]', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch credit tasks' });
  }
});

/**
 * GET /api/credits/history
 * Returns credit transaction history for the current user.
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const transactions = await prisma.creditTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        amount: true,
        type: true,
        reason: true,
        created_at: true,
      }
    });

    return res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('[CREDITS_HISTORY_ERROR]', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch credit history' });
  }
});

/**
 * POST /api/credits/tasks
 * Admin-only: Create or update a credit task definition.
 */
router.post('/tasks', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, description, credits_rewarded, trigger_type, is_active = true } = req.body;

    if (!name || !trigger_type || credits_rewarded == null) {
      return res.status(400).json({ success: false, message: 'name, trigger_type, and credits_rewarded are required' });
    }

    // Upsert by trigger_type so you can update reward values safely
    const task = await prisma.creditTask.upsert({
      where: { trigger_type },
      update: { name, description, credits_rewarded: Number(credits_rewarded), is_active },
      create: { name, description, credits_rewarded: Number(credits_rewarded), trigger_type, is_active },
    });

    return res.json({ success: true, data: task });
  } catch (error) {
    console.error('[CREDITS_CREATE_ERROR]', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create credit task' });
  }
});

module.exports = router;
