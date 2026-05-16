const express = require('express');
const { pool } = require('../config/db');
const { authenticateUser, requireVerified } = require('../middleware/auth');
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

/**
 * Helper to check if a user role is authorized to upload scripts.
 * In the new ecosystem, all roles are permitted to showcase their work.
 */
function isCreatorRole(role) {
  return true;
}

async function safeQuery(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error(`Database query failed: ${sql}`);
    console.error(`Error: ${error.message}`);
    return [];
  }
}

router.get('/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const genre = String(req.query.genre || '').trim();

    let sql = `
      SELECT
        scripts.id,
        scripts.user_id AS owner_id,
        scripts.title,
        scripts.genre,
        scripts.synopsis,
        scripts.status,
        scripts.roles_needed,
        scripts.poster_url,
        scripts.work_type,
        scripts.media_links,
        scripts.role_data,
        users.name AS author_name,
        users.screen_name,
        users.display_preference
      FROM scripts
      LEFT JOIN users ON users.id = scripts.user_id
      WHERE 1 = 1
    `;
    const params = [];

    if (query) {
      sql += ` AND (scripts.title LIKE ? OR scripts.genre LIKE ? OR scripts.synopsis LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (genre) {
      sql += ` AND scripts.genre LIKE ?`;
      params.push(`%${genre}%`);
    }

    sql += ` ORDER BY scripts.created_at DESC, scripts.id DESC LIMIT 20`;

    const rows = await safeQuery(sql, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Script search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not search scripts'
    });
  }
});

router.post('/', authenticateUser, requireVerified, async (req, res) => {
  try {
    const { title, genre, synopsis, roles_needed, status, work_type, media_links, role_data, poster_url } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Script title is required'
      });
    }

    const [userRows] = await pool.query(
      'SELECT id, name, role FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this script'
      });
    }

    const user = userRows[0];

    if (!isCreatorRole(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only directors, writers, and producers can upload scripts'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO scripts (user_id, title, genre, synopsis, roles_needed, status, work_type, media_links, role_data, poster_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(req.user.id),
        String(title).trim(),
        genre || null,
        synopsis || null,
        roles_needed || null,
        status || 'Open for collaboration',
        work_type || 'Script',
        media_links || null,
        role_data || null,
        poster_url || null
      ]
    );

    const [scriptRows] = await pool.query(
      `SELECT
        scripts.id,
        scripts.title,
        scripts.genre,
        scripts.synopsis,
        scripts.roles_needed,
        scripts.status,
        scripts.poster_url,
        scripts.work_type,
        scripts.media_links,
        scripts.role_data,
        scripts.created_at,
        users.name AS author_name,
        users.screen_name,
        users.display_preference
       FROM scripts
       LEFT JOIN users ON users.id = scripts.user_id
       WHERE scripts.id = ?
       LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Script uploaded successfully',
      data: scriptRows[0]
    });

    // Trigger Pusher update for admin dashboard
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger('admin-dashboard', 'update', {
        type: 'SCRIPT_CREATED',
        script: scriptRows[0]
      });
    }
  } catch (error) {
    console.error('Script upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not upload script'
    });
  }
});

router.put('/:id', authenticateUser, requireVerified, async (req, res) => {
  try {
    const scriptId = Number(req.params.id);
    const { title, genre, synopsis, roles_needed, status, work_type, media_links, role_data, poster_url } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Script title is required'
      });
    }

    // Check ownership
    const [rows] = await pool.query('SELECT user_id FROM scripts WHERE id = ? LIMIT 1', [scriptId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Script not found' });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this script' });
    }

    await pool.query(
      `UPDATE scripts SET 
        title = ?, genre = ?, synopsis = ?, roles_needed = ?, status = ?, 
        work_type = ?, media_links = ?, role_data = ?, poster_url = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        String(title).trim(),
        genre || null,
        synopsis || null,
        roles_needed || null,
        status || 'Open for collaboration',
        work_type || 'Script',
        media_links || null,
        role_data || null,
        poster_url || null,
        scriptId
      ]
    );

    const [scriptRows] = await pool.query(
      `SELECT * FROM scripts WHERE id = ? LIMIT 1`,
      [scriptId]
    );

    res.json({
      success: true,
      message: 'Script updated successfully',
      data: scriptRows[0]
    });
  } catch (error) {
    console.error('Script update error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not update script'
    });
  }
});

router.delete('/:id', authenticateUser, requireVerified, async (req, res) => {
  try {
    const scriptId = Number(req.params.id);

    // Check ownership
    const [rows] = await pool.query('SELECT user_id FROM scripts WHERE id = ? LIMIT 1', [scriptId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Script not found' });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this script' });
    }

    await pool.query('DELETE FROM scripts WHERE id = ?', [scriptId]);

    res.json({
      success: true,
      message: 'Script deleted successfully'
    });
  } catch (error) {
    console.error('Script deletion error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not delete script'
    });
  }
});

module.exports = router;
