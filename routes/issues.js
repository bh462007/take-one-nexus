const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Helper to check if user is a developer/admin
const ADMIN_EMAILS = [
  'aarushgupta289@gmail.com',
  'alok.r25012@csds.rishihood.edu.in'
];

function requireDeveloperOrAdmin(req, res, next) {
  // Execute async wrapper to avoid uncaught promises in middleware
  (async () => {
    try {
      const userId = Number(req.user.id);
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!dbUser) {
        return res.status(403).json({ success: false, message: 'User not found' });
      }

      const email = (dbUser.email || '').toLowerCase();
      let role = (dbUser.role || '').toLowerCase();

      // Auto-promote explicitly authorized emails to developer role if they aren't already
      if (ADMIN_EMAILS.includes(email) && role !== 'developer' && role !== 'admin') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'developer' }
        });
        role = 'developer';
      }

      if (role !== 'developer' && role !== 'admin' && !ADMIN_EMAILS.includes(email)) {
        return res.status(403).json({ success: false, message: 'Access denied: Requires Developer role' });
      }

      // Populate user info for downstream routes
      req.user.role = role;
      req.user.email = email;
      next();
    } catch (error) {
      console.error('Role validation error:', error.message);
      res.status(500).json({ success: false, message: 'Server error during role validation' });
    }
  })();
}

/**
 * POST /api/issues
 * Create a new issue report
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, location, severity, screenshot } = req.body;
    let userId = null;
    
    // Optional auth
    if (req.headers.authorization || req.cookies?.token) {
       // Just grab it if passed, let the frontend send user details
       // Normally we'd use authenticateUser middleware, but we allow anonymous reports if needed
       // The prompt says "Users should be able to report", meaning logged in or out? Let's assume anyone can.
       // We'll trust the user_id if passed by the client or extract from token.
    }
    
    // If we want it strictly authenticated, we'd add `authenticateUser` to the route. Let's make it optional.
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        location,
        severity: severity || 'low',
        screenshot,
        user_id: req.user ? req.user.id : null // If auth middleware was used
      }
    });

    res.status(201).json({ success: true, data: issue });
  } catch (error) {
    console.error('Create issue error:', error.message);
    res.status(500).json({ success: false, message: 'Could not create issue report' });
  }
});

/**
 * GET /api/issues
 * Get all issues (Developer/Admin only)
 */
router.get('/', authenticateUser, requireDeveloperOrAdmin, async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.json({ success: true, data: issues });
  } catch (error) {
    console.error('Fetch issues error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load issues' });
  }
});

/**
 * PUT /api/issues/:id
 * Update issue status
 */
router.put('/:id', authenticateUser, requireDeveloperOrAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const issue = await prisma.issue.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, data: issue });
  } catch (error) {
    console.error('Update issue error:', error.message);
    res.status(500).json({ success: false, message: 'Could not update issue' });
  }
});

/**
 * DELETE /api/issues/:id
 * Delete an issue
 */
router.delete('/:id', authenticateUser, requireDeveloperOrAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.issue.delete({ where: { id } });
    res.json({ success: true, message: 'Issue deleted' });
  } catch (error) {
    console.error('Delete issue error:', error.message);
    res.status(500).json({ success: false, message: 'Could not delete issue' });
  }
});

module.exports = router;
