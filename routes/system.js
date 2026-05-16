const express = require('express');
const { pool } = require('../config/db');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const {
  getEmailStatus,
  sendSmtpTestEmail,
  verifyEmailConnection
} = require('../config/mailer');

const Pusher = require('pusher');
const router = express.Router();

// Configure Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true
});

router.get('/email/status', authenticateUser, async (req, res) => {
  try {
    const status = getEmailStatus();
    let smtpReachable = false;
    let smtpReason = null;

    if (status.enabled) {
      try {
        const verifyResult = await verifyEmailConnection();
        smtpReachable = Boolean(verifyResult.success);
      } catch (error) {
        smtpReason = error.message;
      }
    }

    res.json({
      success: true,
      data: {
        ...status,
        smtp_reachable: smtpReachable,
        smtp_reason: smtpReason
      }
    });
  } catch (error) {
    console.error('Email status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not check email status'
    });
  }
});

router.post('/email/test', authenticateUser, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [Number(req.user.id)]
    );

    if (rows.length === 0 || !rows[0].email) {
      return res.status(404).json({
        success: false,
        message: 'Logged-in user email not found'
      });
    }

    const result = await sendSmtpTestEmail({
      to: rows[0].email,
      name: rows[0].name
    });

    if (!result.sent) {
      return res.status(400).json({
        success: false,
        message: result.reason || 'SMTP test could not be sent'
      });
    }

    res.json({
      success: true,
      message: `SMTP test sent to ${rows[0].email}`
    });
  } catch (error) {
    console.error('SMTP test error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Could not send SMTP test'
    });
  }
});

router.get('/analytics', authenticateUser, authorizeRoles('Admin', 'Developer', 'Moderator'), async (req, res) => {
  try {

    const [userRows] = await pool.query(`
      SELECT DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(CONVERT_TZ(created_at, '+00:00', '+05:30'))
      ORDER BY date ASC
    `);

    const [scriptRows] = await pool.query(`
      SELECT DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) as date, COUNT(*) as count 
      FROM scripts 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(CONVERT_TZ(created_at, '+00:00', '+05:30'))
      ORDER BY date ASC
    `);

    // Format dates to string
    const formatRows = (rows) => rows.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' }),
      count: Number(r.count)
    }));

    res.json({
      success: true,
      data: {
        users: formatRows(userRows),
        scripts: formatRows(scriptRows)
      }
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load analytics' });
  }
});

router.get('/stats', authenticateUser, authorizeRoles('Admin', 'Developer', 'Moderator'), async (req, res) => {
  try {

    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [scriptCount] = await pool.query('SELECT COUNT(*) as count FROM scripts');
    const [requestCount] = await pool.query('SELECT COUNT(*) as count FROM collaboration_requests');
    
    const [recentUsers] = await pool.query(`
      SELECT id, name, email, role, college, city, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        counts: {
          users: userCount[0].count,
          scripts: scriptCount[0].count,
          requests: requestCount[0].count
        },
        recentUsers: recentUsers
      }
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load stats' });
  }
});

module.exports = router;
