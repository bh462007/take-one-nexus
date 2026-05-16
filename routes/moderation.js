const express = require('express');
const { pool } = require('../config/db');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { requireModerator } = require('../middleware/moderation');

const router = express.Router();

async function ensureReportsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS moderation_reports (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      reporter_id INT UNSIGNED NOT NULL,
      target_type VARCHAR(40) NOT NULL,
      target_id INT UNSIGNED DEFAULT NULL,
      reason VARCHAR(160) NOT NULL,
      details TEXT DEFAULT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'open',
      moderator_notes TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_reports_status (status, created_at),
      KEY idx_reports_reporter (reporter_id),
      CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `);
}

router.post('/reports', authenticateUser, async (req, res) => {
  try {
    await ensureReportsTable();

    const targetType = String(req.body.target_type || 'general').trim().toLowerCase();
    const reason = String(req.body.reason || '').trim();
    const details = String(req.body.details || '').trim();

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO moderation_reports
       (reporter_id, target_type, target_id, reason, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Number(req.user.id),
        targetType,
        req.body.target_id ? Number(req.body.target_id) : null,
        reason,
        details || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted for review',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Moderation report create error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not submit report'
    });
  }
});

router.get('/reports', authenticateUser, requireModerator, async (req, res) => {
  try {
    await ensureReportsTable();

    const status = String(req.query.status || '').trim().toLowerCase();
    const params = [];
    let where = '';

    if (status) {
      where = 'WHERE moderation_reports.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT
        moderation_reports.id,
        moderation_reports.target_type,
        moderation_reports.target_id,
        moderation_reports.reason,
        moderation_reports.details,
        moderation_reports.status,
        moderation_reports.moderator_notes,
        moderation_reports.created_at,
        users.name AS reporter_name,
        users.email AS reporter_email
       FROM moderation_reports
       JOIN users ON users.id = moderation_reports.reporter_id
       ${where}
       ORDER BY moderation_reports.created_at DESC
       LIMIT 80`,
      params
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Moderation report list error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not load reports'
    });
  }
});

router.patch('/reports/:id', authenticateUser, requireModerator, async (req, res) => {
  try {
    await ensureReportsTable();

    const status = String(req.body.status || '').trim().toLowerCase();
    const notes = String(req.body.moderator_notes || '').trim();
    const allowed = ['open', 'reviewing', 'resolved', 'dismissed'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report status'
      });
    }

    const [result] = await pool.query(
      `UPDATE moderation_reports
       SET status = ?,
           moderator_notes = ?
       WHERE id = ?`,
      [status, notes || null, Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report updated'
    });
  } catch (error) {
    console.error('Moderation report update error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not update report'
    });
  }
});

module.exports = router;
