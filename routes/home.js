const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

function firstNumber(value) {
  return Number(value) || 0;
}

function normalizeRoleCounts(rows) {
  const base = {
    director: 0,
    camera: 0,
    writer: 0,
    sound: 0,
    editor: 0,
    gaffer: 0,
    actor: 0,
    spot_boy: 0
  };

  rows.forEach((row) => {
    const role = String(row.role || '').toLowerCase();
    const count = firstNumber(row.count);

    if (role.includes('director')) {
      base.director += count;
    } else if (
      role.includes('camera') ||
      role.includes('dp') ||
      role.includes('cinematographer')
    ) {
      base.camera += count;
    } else if (role.includes('writer')) {
      base.writer += count;
    } else if (role.includes('sound')) {
      base.sound += count;
    } else if (role.includes('editor')) {
      base.editor += count;
    } else if (role.includes('gaffer')) {
      base.gaffer += count;
    } else if (role.includes('actor')) {
      base.actor += count;
    } else if (role.includes('spot')) {
      base.spot_boy += count;
    }
  });

  return base;
}

async function safeQuery(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error(`Database query failed: ${sql}`);
    console.error(`Error: ${error.message}`);
    // If table doesn't exist or connection fails, return empty result instead of throwing
    return [];
  }
}

router.get('/', async (req, res) => {
  try {
    const userCountRows = await safeQuery('SELECT COUNT(*) AS total FROM users');
    const scriptCountRows = await safeQuery('SELECT COUNT(*) AS total FROM scripts');
    const collegeCountRows = await safeQuery(`
      SELECT COUNT(DISTINCT college) AS total
      FROM users
      WHERE college IS NOT NULL AND TRIM(college) <> ''
    `);
    const roleRows = await safeQuery(`
      SELECT role, COUNT(*) AS count
      FROM users
      WHERE role IS NOT NULL AND TRIM(role) <> ''
      GROUP BY role
    `);
    const scriptRows = await safeQuery(`
      SELECT
        scripts.id,
        scripts.user_id,
        scripts.title,
        scripts.genre,
        scripts.synopsis,
        scripts.status,
        scripts.roles_needed,
        scripts.created_at,
        users.name AS author_name
      FROM scripts
      LEFT JOIN users ON users.id = scripts.user_id
      ORDER BY created_at DESC, id DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      stats: {
        creators: firstNumber(userCountRows[0]?.total),
        scripts: firstNumber(scriptCountRows[0]?.total),
        colleges: firstNumber(collegeCountRows[0]?.total),
        roleCounts: normalizeRoleCounts(roleRows)
      },
      scripts: scriptRows.map((script, index) => ({
        id: script.id,
        owner_id: script.user_id,
        number: String(index + 1).padStart(3, '0'),
        title: script.title,
        genre: script.genre || 'General',
        synopsis: script.synopsis || '',
        status: script.status || '',
        tag: script.roles_needed || script.status || 'Open for collaboration',
        author_name: script.author_name || 'TAKE ONE creator'
      }))
    });
  } catch (error) {
    console.error('Fatal error in homepage route:', error.message);

    res.status(500).json({
      success: false,
      message: 'Could not load homepage data. Please try again later.'
    });
  }
});

module.exports = router;
