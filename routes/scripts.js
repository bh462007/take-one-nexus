const express = require('express');
const { pool } = require('../config/db');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

function isCreatorRole(role) {
  const normalized = String(role || '').toLowerCase();

  return (
    normalized.includes('director') ||
    normalized.includes('writer') ||
    normalized.includes('producer') ||
    normalized.includes('screenwriter')
  );
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
        users.name AS author_name
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

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, genre, synopsis, roles_needed, status } = req.body;

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
      `INSERT INTO scripts (user_id, title, genre, synopsis, roles_needed, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(req.user.id),
        String(title).trim(),
        genre || null,
        synopsis || null,
        roles_needed || null,
        status || 'Open for collaboration'
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
        scripts.created_at,
        users.name AS author_name
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
  } catch (error) {
    console.error('Script upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not upload script'
    });
  }
});

module.exports = router;
