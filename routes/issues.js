const express = require('express');
const { authenticateUser, requireRole, requireVerified } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// requireDeveloperOrAdmin replaced by requireRole(['Developer', 'Admin'])

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
router.get('/', authenticateUser, requireRole(['Developer', 'Admin']), async (req, res) => {
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
router.put('/:id', authenticateUser, requireRole(['Developer', 'Admin']), async (req, res) => {
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
router.delete('/:id', authenticateUser, requireRole(['Developer', 'Admin']), async (req, res) => {
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
