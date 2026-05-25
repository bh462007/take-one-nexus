const express = require('express');
const { pool } = require('../config/db');
const { TAKE_ONE_ROLES, ROLE_SLUGS, LEGACY_ROLE_MAPPING } = require('../public/scripts/constants/roles.js');
const { captureError } = require('../src/lib/sentry');

const router = express.Router();

function firstNumber(value) {
  return Number(value) || 0;
}

function normalizeRoleCounts(rows) {
  const base = {};
  TAKE_ONE_ROLES.forEach(role => {
    base[ROLE_SLUGS[role]] = 0;
  });

  rows.forEach((row) => {
    const rawRole = String(row.role || '').trim();
    // Check legacy mapping first
    let finalRole = LEGACY_ROLE_MAPPING[rawRole] || rawRole;
    
    // Check if the finalRole matches any valid role (case insensitive)
    const validRole = TAKE_ONE_ROLES.find(r => r.toLowerCase() === finalRole.toLowerCase());
    
    const count = firstNumber(row.count);
    if (validRole) {
      base[ROLE_SLUGS[validRole]] += count;
    } else if (base[ROLE_SLUGS['Other']] !== undefined) {
      // Catch-all for undefined or custom legacy roles
      base[ROLE_SLUGS['Other']] += count;
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
    // Report to Sentry with parameters context
    captureError(error, {
      action: 'database_query_failure',
      extra: { sql, params }
    });
    throw error;
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
