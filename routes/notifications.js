const express = require('express');
const { pool } = require('../config/db');
const { authenticateUser, requireSameUser } = require('../middleware/auth');
const {
  ensureNotificationsTable,
  listNotifications,
  unreadNotificationCount
} = require('../utils/notifications');

const router = express.Router();

router.get('/user/:id', authenticateUser, requireSameUser, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const notifications = await listNotifications(userId);
    const unreadCount = await unreadNotificationCount(userId);

    res.json({
      success: true,
      unread_count: unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Notification list error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not load notifications'
    });
  }
});

router.patch('/:id/read', authenticateUser, async (req, res) => {
  try {
    await ensureNotificationsTable();

    const [result] = await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [Number(req.params.id), Number(req.user.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Notification read error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not update notification'
    });
  }
});

router.patch('/user/:id/read-all', authenticateUser, requireSameUser, async (req, res) => {
  try {
    await ensureNotificationsTable();

    await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ?`,
      [Number(req.params.id)]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Notification read all error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not update notifications'
    });
  }
});

module.exports = router;
