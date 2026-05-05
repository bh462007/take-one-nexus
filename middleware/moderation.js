const { pool } = require('../config/db');

function isModeratorAccount(user, dbUser) {
  const envEmails = String(process.env.MODERATOR_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const email = String(user?.email || dbUser?.email || '').toLowerCase();
  const role = String(dbUser?.role || '').toLowerCase();

  return (
    envEmails.includes(email) ||
    role.includes('admin') ||
    role.includes('moderator')
  );
}

async function requireModerator(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [Number(req.user?.id)]
    );

    if (rows.length === 0 || !isModeratorAccount(req.user, rows[0])) {
      return res.status(403).json({
        success: false,
        message: 'Moderator access required'
      });
    }

    req.moderator = rows[0];
    return next();
  } catch (error) {
    console.error('Moderator check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not verify moderator access'
    });
  }
}

module.exports = {
  requireModerator
};
