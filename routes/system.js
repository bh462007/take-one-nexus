const express = require('express');
const { pool } = require('../config/db');
const { authenticateUser } = require('../middleware/auth');
const {
  getEmailStatus,
  sendSmtpTestEmail,
  verifyEmailConnection
} = require('../config/mailer');

const router = express.Router();

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

router.get('/analytics', authenticateUser, async (req, res) => {
  try {
    const role = req.user.role;
    const email = (req.user.email || '').toLowerCase();
    
    const isAuthorized = 
      role === 'Developer' || 
      role === 'Admin' || 
      email === 'aarushgupta289@gmail.com' ||
      email === 'alok.r25012@csds.rishihood.edu.in';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied: Requires Admin or Developer role' });
    }

    const [userRows] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const [scriptRows] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM scripts 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Format dates to string
    const formatRows = (rows) => rows.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

module.exports = router;
