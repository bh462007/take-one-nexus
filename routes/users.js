const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authenticateUser, requireSameUser } = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function getProfileData(userId) {
  const [userRows] = await pool.query(
    `SELECT id, name, email, role, college, city, bio, skills, portfolio, avatar_url, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (userRows.length === 0) {
    return null;
  }

  const [scriptRows] = await pool.query(
    `SELECT id, title, genre, status, roles_needed, poster_url, created_at
     FROM scripts
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );

  return {
    ...userRows[0],
    scripts: scriptRows
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, college, city } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, college, city)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        role || null,
        college || null,
        city || null
      ]
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: role || '',
      college: college || '',
      city: city || ''
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: createToken(user),
      user_id: user.id,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        college: user.college,
        city: user.city
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not create account'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [rows] = await pool.query(
      `SELECT id, name, email, password, role, college, city
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    res.json({
      success: true,
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        role: user.role || '',
        college: user.college || '',
        city: user.city || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not log in'
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const role = String(req.query.role || '').trim();
    const city = String(req.query.city || '').trim();
    const q = String(req.query.q || '').trim();

    let sql = `
      SELECT id, name, email, role, college, city, bio, skills
      FROM users
      WHERE 1 = 1
    `;
    const params = [];

    if (role) {
      sql += ` AND role LIKE ?`;
      params.push(`%${role}%`);
    }

    if (city) {
      sql += ` AND city LIKE ?`;
      params.push(`%${city}%`);
    }

    if (q) {
      sql += ` AND (name LIKE ? OR college LIKE ? OR skills LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY created_at DESC, id DESC LIMIT 50`;

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('User search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not load crew members'
    });
  }
});

router.put('/:id', authenticateUser, requireSameUser, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const existingProfile = await getProfileData(userId);

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      name,
      role,
      college,
      city,
      bio,
      skills,
      portfolio,
      avatar_url
    } = req.body;

    const nextName = typeof name === 'string' && name.trim()
      ? name.trim()
      : existingProfile.name;

    if (!nextName) {
      return res.status(400).json({
        success: false,
        message: 'Display name is required'
      });
    }

    await pool.query(
      `UPDATE users
       SET name = ?,
           role = ?,
           college = ?,
           city = ?,
           bio = ?,
           skills = ?,
           portfolio = ?,
           avatar_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nextName,
        typeof role === 'string' ? role.trim() || null : existingProfile.role,
        typeof college === 'string' ? college.trim() || null : existingProfile.college,
        typeof city === 'string' ? city.trim() || null : existingProfile.city,
        typeof bio === 'string' ? bio.trim() || null : existingProfile.bio,
        typeof skills === 'string' ? skills.trim() || null : existingProfile.skills,
        typeof portfolio === 'string' ? portfolio.trim() || null : existingProfile.portfolio,
        typeof avatar_url === 'string' ? avatar_url.trim() || null : existingProfile.avatar_url,
        userId
      ]
    );

    const updatedProfile = await getProfileData(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not update profile'
    });
  }
});

router.get('/:id', authenticateUser, requireSameUser, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Valid user id is required'
      });
    }

    const profile = await getProfileData(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not load profile'
    });
  }
});

module.exports = router;
