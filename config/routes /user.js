const express = require('express');
const router  = express.Router();
const db      = require('../db');
const bcrypt  = require('bcryptjs');   // for hashing passwords safely
const jwt     = require('jsonwebtoken'); // for login tokens
const multer  = require('multer');
const path    = require('path');
 
// ── MULTER SETUP for avatar images ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '-'))
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB max


// ── MIDDLEWARE: Verify Login Token ────────────────────────────
// This is a "guard" function — it runs BEFORE certain routes
// and checks if the user is actually logged in
//
// HOW IT WORKS:
// When a user logs in, the server gives them a "token" (like a
// wristband at an event). For protected actions (like updating
// a profile), the frontend sends that token back. This function
// checks if the token is valid before allowing the action.
 
function verifyToken(req, res, next) {
  // The token is sent in the Authorization header like:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // get part after "Bearer "
 
  if (!token) {
    return res.status(401).json({ success: false, message: 'Login required' });
  }
 
  try {
    // jwt.verify checks if the token is real and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // attach user info to the request
    next();              // allow the route to continue
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}
 
 // ── ROUTE 1: REGISTER (Create Account) ───────────────────────
// URL: POST http://localhost:3000/api/users/register
//
// Frontend sends: { name, email, password, role, college, city }
// Returns: { success, message, user_id, token }
 
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, college, city } = req.body;
 
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password are required' });
    }
 
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
 
    // NEVER store passwords in plain text
    // bcrypt.hash scrambles it — even if DB leaks, passwords are safe
    // The "10" is how many times to scramble (higher = safer but slower)
    const hashedPassword = await bcrypt.hash(password, 10);
 
    // Insert new user
    const [result] = await db.query(`
      INSERT INTO users (name, email, password, role, college, city)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, email, hashedPassword, role || '', college || '', city || '']);
 
    // Create a login token for the new user
    // jwt.sign packs { id, email } into an encrypted token
    // The token expires in 7 days — user must login again after that
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
 
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user_id: result.insertId,
      token
    });
 
  } catch (err) {
    console.error('Error registering:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
 
 
// ── ROUTE 2: LOGIN ────────────────────────────────────────────
// URL: POST http://localhost:3000/api/users/login
//
// Frontend sends: { email, password }
// Returns: { success, token, user: { id, name, role } }
 
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
 
    // Find user by email
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
 
    const user = rows[0];
 
    // bcrypt.compare checks if the submitted password matches
    // the hashed one stored in DB — returns true or false
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
 
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
 
    // Send back token + basic user info (NOT the password)
    res.json({
      success: true,
      token,
      user: {
        id:      user.id,
        name:    user.name,
        role:    user.role,
        college: user.college,
        city:    user.city
      }
    });
 
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
 
 
// ── ROUTE 3: SEARCH CREW MEMBERS ─────────────────────────────
// URL: GET http://localhost:3000/api/users/search?role=Director&city=Mumbai
//
// What it does: Lets you find filmmakers by role, skill, or city
//
// Query params:
//   ?role=Director        → find Directors
//   ?skill=colour+grading → find people with that skill
//   ?city=Mumbai          → find people in Mumbai
//   ?q=arjun              → search by name
//
// Example from frontend:
//   fetch('/api/users/search?role=DP&city=Pune')
 
router.get('/search', async (req, res) => {
  try {
    const { q, role, skill, city } = req.query;
 
    let sql = `
      SELECT
        id, name, role, college, city, bio, skills, avatar_url, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
 
    // Search by name
    if (q) {
      sql += ` AND name LIKE ?`;
      params.push(`%${q}%`);
    }
 
    // Filter by role (exact match)
    if (role) {
      sql += ` AND role LIKE ?`;
      params.push(`%${role}%`);
    }
 
    // Filter by skill (searches inside the comma-separated skills column)
    if (skill) {
      sql += ` AND skills LIKE ?`;
      params.push(`%${skill}%`);
    }
 
    // Filter by city (partial match so "Mum" finds "Mumbai")
    if (city) {
      sql += ` AND city LIKE ?`;
      params.push(`%${city}%`);
    }
 
    sql += ` ORDER BY created_at DESC LIMIT 50`;
 
    const [users] = await db.query(sql, params);
 
    // Remove password field before sending — never expose it
    const safeUsers = users.map(({ password, ...user }) => user);
 
    res.json({
      success: true,
      count:   safeUsers.length,
      data:    safeUsers
    });
 
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
 
 
// ── ROUTE 4: GET ONE USER'S PROFILE ──────────────────────────
// URL: GET http://localhost:3000/api/users/3
 
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
 
    // Get user + their scripts in one go
    const [rows] = await db.query(`
      SELECT id, name, role, college, city, bio, skills, portfolio, avatar_url, created_at
      FROM users
      WHERE id = ?
    `, [id]);
 
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
 
    // Also fetch their scripts
    const [scripts] = await db.query(`
      SELECT id, title, genre, poster_url, roles_needed, status, created_at
      FROM scripts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [id]);
 
    res.json({
      success: true,
      data: {
        ...rows[0],
        scripts        // include their scripts in the profile response
      }
    });
 
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
 
 
// ── ROUTE 5: UPDATE PROFILE ───────────────────────────────────
// URL: PUT http://localhost:3000/api/users/3
//
// What it does: Updates the logged-in user's profile info
//
// verifyToken runs FIRST — if not logged in, request is rejected
// upload.single('avatar') — handles the profile photo upload
//
// Frontend sends form data with fields:
//   name, role, college, city, bio, skills, portfolio, avatar (file)
 
router.put('/:id', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
 
    // Security check: you can only update YOUR OWN profile
    // req.user.id comes from the decoded JWT token
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ success: false, message: 'You can only update your own profile' });
    }
 
    const { name, role, college, city, bio, skills, portfolio } = req.body;
 
    // If a new avatar was uploaded, update the URL
    // Otherwise keep whatever was already in the DB
    let avatarUpdate = '';
    if (req.file) {
      avatarUpdate = `, avatar_url = '/uploads/avatars/${req.file.filename}'`;
    }
 
    // Build UPDATE query — only update fields that were sent
    // COALESCE(?, column) means: use new value if provided, else keep old value
    await db.query(`
      UPDATE users SET
        name      = COALESCE(?, name),
        role      = COALESCE(?, role),
        college   = COALESCE(?, college),
        city      = COALESCE(?, city),
        bio       = COALESCE(?, bio),
        skills    = COALESCE(?, skills),
        portfolio = COALESCE(?, portfolio)
        ${avatarUpdate}
      WHERE id = ?
    `, [
      name || null,
      role || null,
      college || null,
      city || null,
      bio || null,
      skills || null,
      portfolio || null,
      id
    ]);
 
    // Fetch and return the updated profile
    const [updated] = await db.query(`
      SELECT id, name, role, college, city, bio, skills, portfolio, avatar_url
      FROM users WHERE id = ?
    `, [id]);
 
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data:    updated[0]
    });
 
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
 
 
module.exports = router;