const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authenticateUser, requireSameUser } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');
const { PrismaClient } = require('@prisma/client');
const { formatDisplayName, getCanonicalDisplayName } = require('../utils/formatting');
const Pusher = require('pusher');

const prisma = new PrismaClient();
const router = express.Router();

// Configure Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true
});

function createToken(user) {
  const secret = process.env.JWT_SECRET || 'takeone_fallback_secret_32_chars_long';
  
  // Ensure primary admin/dev email always has the Developer role in the session token
  let role = user.role || '';
  if (user.email?.toLowerCase() === 'aarushgupta289@gmail.com') {
    role = 'Developer';
  }

  return jwt.sign(
    { id: user.id, email: user.email, role: role },
    secret,
    { expiresIn: '10d' }
  );
}

async function getProfileData(userId) {
  const [userRows] = await pool.query(
    `SELECT id, name, email, role, college, city, bio, skills, portfolio, avatar_url, gender, credits, screen_name, display_preference, social_links, created_at
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
    name: formatDisplayName(userRows[0].name),
    scripts: scriptRows
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, college, city, gender, screen_name, display_preference } = req.body;
    
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

    if (!role || role === 'Select Role') {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid role'
      });
    }

    if (!gender || gender === 'Choose Gender') {
      return res.status(400).json({
        success: false,
        message: 'Please select your gender'
      });
    }

    if (!display_preference || display_preference === 'Select Display Preference') {
      return res.status(400).json({
        success: false,
        message: 'Please select a display preference'
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
      `INSERT INTO users (name, email, password, role, college, city, gender, screen_name, display_preference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        role || null,
        college || null,
        city || null,
        gender || 'Prefer not to say',
        screen_name || null,
        display_preference || 'Show Real Name Only'
      ]
    );

    const user = {
      id: result.insertId,
      name: formatDisplayName(name.trim()),
      email: normalizedEmail,
      role: role || '',
      college: college || '',
      city: city || '',
      gender: gender || 'Prefer not to say'
    };

    const token = createToken(user);
    const cookieOptions = {
      httpOnly: true, // Secure: cannot be accessed via JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
    };


    res.cookie('token', token, cookieOptions);

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
        screen_name: screen_name || null,
        display_preference: display_preference || 'Show Real Name Only',
        credits: 0
      },
      token: token
    });

    // Send welcome email asynchronously (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('[Registration] Background email task failed:', err.message);
    });

    // Trigger Pusher update for admin dashboard
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger('admin-dashboard', 'update', {
        type: 'USER_CREATED',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college,
          city: user.city,
          created_at: new Date().toISOString()
        }
      });
    }
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    let rows;
    try {
      [rows] = await pool.query(
        `SELECT id, name, email, password, role, college, city, gender, screen_name, display_preference, social_links, credits
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
    
    // Cookie configuration optimized for Vercel
    const cookieOptions = {
      httpOnly: true, // Secure: cannot be accessed via JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
    };


    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: formatDisplayName(user.name),
        email: user.email,
        role: user.role || '',
        college: user.college || '',
        city: user.city || '',
        gender: user.gender || 'Prefer not to say',
        screen_name: user.screen_name || null,
        display_preference: user.display_preference || 'Show Real Name Only',
        social_links: user.social_links || null,
        credits: user.credits || 0
      },
      token: token
    });
  } catch (error) {
    console.error('--- Login Crash ---');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
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
      message: `Login failed: ${error.message || 'Internal Server Error'}`
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
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

/**
 * GET /api/users/me
 * Get current authenticated user data from session
 */
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const profile = await getProfileData(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: profile,
      pusherKey: process.env.NEXT_PUBLIC_PUSHER_KEY,
      pusherCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });
  } catch (error) {
    console.error('Fetch me error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not load session data'
    });
  }
});


router.get('/search', async (req, res) => {
  try {
    const role = String(req.query.role || '').trim();
    const city = String(req.query.city || '').trim();
    const q = String(req.query.q || '').trim();

    let sql = `
      SELECT id, name, email, role, college, city, bio, skills, avatar_url, gender, credits, screen_name, display_preference, social_links, created_at
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
      data: rows.map(r => ({ ...r, name: formatDisplayName(r.name) }))
    });
  } catch (error) {
    console.error('User search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not load crew members'
    });
  }
});

router.get('/admin/list', authenticateUser, async (req, res) => {
  try {
    const role = String(req.user.role || '').toLowerCase();
    const email = String(req.user.email || '').toLowerCase();
    const isAuthorized =
      role === 'developer' ||
      role === 'admin' ||
      role === 'moderator' ||
      email === 'aarushgupta289@gmail.com' ||
      email === 'alok.r25012@csds.rishihood.edu.in';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const rows = await safeQuery(
      `SELECT id, name, email, role, college, city, created_at
       FROM users
       ORDER BY created_at DESC, id DESC
       LIMIT 500`
    );

    return res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        name: formatDisplayName(row.name)
      }))
    });
  } catch (error) {
    console.error('Admin user list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load users'
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
      gender,
      screen_name,
      display_preference,
      social_links
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
        screen_name: typeof screen_name === 'string' ? screen_name.trim() : undefined,
        display_preference: typeof display_preference === 'string' ? display_preference.trim() : undefined,
        social_links: typeof social_links === 'string' ? social_links.trim() : undefined,
      },
      include: {
        scripts: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    // Trigger Pusher update for admin dashboard
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger('admin-dashboard', 'update', {
        type: 'USER_UPDATED',
        user: {
          id: updatedUser.id,
          name: formatDisplayName(updatedUser.name),
          role: updatedUser.role,
          college: updatedUser.college,
          city: updatedUser.city
        }
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully via Prisma',
      data: {
        ...updatedUser,
        name: formatDisplayName(updatedUser.name)
      }
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

/**
 * GET /api/users/public/:id
 * Get public profile data for any user
 */
router.get('/public/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Valid user id is required'
      });
    }

    const [userRows] = await pool.query(
      `SELECT id, name, role, college, city, bio, skills, portfolio, avatar_url, gender, credits, screen_name, display_preference, social_links, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [scriptRows] = await pool.query(
      `SELECT id, title, genre, synopsis, status, roles_needed, poster_url, work_type, media_links, role_data, created_at
       FROM scripts
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...userRows[0],
        name: getCanonicalDisplayName(userRows[0]),
        scripts: scriptRows
      }
    });
  } catch (error) {
    console.error('Public profile fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not load public profile'
    });
  }
});

/**
 * GET /api/users/leaderboard
 * Get top users ranked by credits
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const rows = await safeQuery(
      `SELECT id, name, role, college, city, avatar_url, gender, credits, screen_name, display_preference
       FROM users
       WHERE credits > 0
       ORDER BY credits DESC, name ASC
       LIMIT 100`
    );

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        displayName: getCanonicalDisplayName(r)
      }))
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load leaderboard signal' });
  }
});

/**
 * GET /api/users/transactions
 * Get credit transaction history for the authenticated user
 */
router.get('/transactions', authenticateUser, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const transactions = await prisma.creditTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Transactions fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load transaction history' });
  }
});

module.exports = router;
