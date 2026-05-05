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

module.exports = router;
