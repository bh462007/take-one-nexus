const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authenticateUser, requireSameUser } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set!');
    throw new Error('Server configuration error: JWT_SECRET is missing');
  }

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || '' },
    process.env.JWT_SECRET,
    { expiresIn: '10d' }
  );
}

async function getProfileData(userId) {
  const [userRows] = await pool.query(
    `SELECT id, name, email, role, college, city, bio, skills, portfolio, avatar_url, gender, credits, created_at
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
    const { name, email, password, role, college, city, gender } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check for existing user
    let existingUsers;
    try {
      [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [normalizedEmail]
      );
    } catch (dbError) {
      console.error('[DB] Register check failed:', dbError.message);
      throw dbError; // Caught by outer try-catch
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please try logging in.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, college, city, gender)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        role || null,
        college || null,
        city || null,
        gender || 'Prefer not to say'
      ]
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: role || '',
      college: college || '',
      city: city || '',
      gender: gender || 'Prefer not to say'
    };

    const token = createToken(user);
    res.cookie('token', token, { 
      httpOnly: false, // Set to false so client can read if needed, or true for better security
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user_id: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        city: user.city,
        gender: user.gender,
        credits: 0
      },
      token: token
    });
  } catch (error) {
    console.error('--- Registration Failed ---');
    console.error(`Error Type: ${error.constructor.name}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    
    // JWT configuration error
    if (error.message.includes('JWT_SECRET')) {
      return res.status(500).json({
        success: false,
        message: 'Authentication system is not configured. Please contact the administrator.'
      });
    }

    // Database duplicate entry
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please try logging in.'
      });
    }

    // Database connection issues
    const connErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR'];
    if (connErrors.includes(error.code) || error.message.includes('connect')) {
      return res.status(503).json({
        success: false,
        message: 'The database is currently unavailable. We are working to restore the connection. Please try again in a few minutes.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration. Please try again later.'
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

    const normalizedEmail = email.trim().toLowerCase();

    let rows;
    try {
      [rows] = await pool.query(
        `SELECT id, name, email, password, role, college, city, credits
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [normalizedEmail]
      );
    } catch (dbError) {
      console.error('[DB] Login query failed:', dbError.message);
      throw dbError;
    }

    if (!rows || rows.length === 0) {
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

    const token = createToken(user);
    res.cookie('token', token, { 
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || '',
        college: user.college || '',
        city: user.city || '',
        gender: user.gender || 'Prefer not to say',
        credits: user.credits || 0
      },
      token: token
    });
  } catch (error) {
    console.error('--- Login Failed ---');
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    
    if (error.message.includes('JWT_SECRET')) {
      return res.status(500).json({
        success: false,
        message: 'Authentication system is not configured. Please contact the administrator.'
      });
    }

    const connErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR'];
    if (connErrors.includes(error.code) || error.message.includes('connect')) {
      return res.status(503).json({
        success: false,
        message: 'The database is currently unavailable. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login. Please try again later.'
    });
  }
});


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
    const role = String(req.query.role || '').trim();
    const city = String(req.query.city || '').trim();
    const q = String(req.query.q || '').trim();

    let sql = `
      SELECT id, name, email, role, college, city, bio, skills, avatar_url, gender, credits
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

    const rows = await safeQuery(sql, params);

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
    const {
      name,
      role,
      college,
      city,
      bio,
      skills,
      portfolio,
      avatar_url,
      gender
    } = req.body;

    if (name && typeof name === 'string' && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Display name cannot be empty'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: name.trim() }),
        role: typeof role === 'string' ? role.trim() : undefined,
        college: typeof college === 'string' ? college.trim() : undefined,
        city: typeof city === 'string' ? city.trim() : undefined,
        bio: typeof bio === 'string' ? bio.trim() : undefined,
        skills: typeof skills === 'string' ? skills.trim() : undefined,
        portfolio: typeof portfolio === 'string' ? portfolio.trim() : undefined,
        avatar_url: typeof avatar_url === 'string' ? avatar_url.trim() : undefined,
        gender: typeof gender === 'string' ? gender.trim() : undefined,
      },
      include: {
        scripts: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully via Prisma',
      data: updatedUser
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
