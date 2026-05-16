const { z } = require('zod');

/**
 * Higher-order middleware to validate request data using Zod schemas.
 * @param {object} schemas - Object containing schemas for body, query, and/or params
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

// --- SCHEMAS ---

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.string().min(1, 'Role is required').refine(val => val !== 'Select Role', 'Invalid role selected'),
  college: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  screen_name: z.string().max(100).optional().nullable(),
  display_preference: z.string().optional().default('Show Real Name Only'),
  social_links: z.string().optional().nullable()
});

const scriptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  genre: z.string().max(100).optional().nullable(),
  synopsis: z.string().max(2000).optional().nullable(),
  roles_needed: z.string().max(500).optional().nullable(),
  status: z.string().optional().default('Open for collaboration'),
  work_type: z.string().optional().default('Script'),
  media_links: z.string().max(1000).optional().nullable(),
  role_data: z.string().max(2000).optional().nullable(),
  poster_url: z.string().url('Invalid URL format').optional().nullable().or(z.literal(''))
});

const taskSchema = z.object({
  conversationId: z.number().positive(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(1000).optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  assigneeId: z.number().positive().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  rewardCredits: z.number().nonnegative().default(0)
});

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.string().max(50).optional(),
  college: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  skills: z.string().max(500).optional().nullable(),
  portfolio: z.string().max(500).optional().nullable(),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  gender: z.string().max(20).optional().nullable(),
  screen_name: z.string().max(100).optional().nullable(),
  display_preference: z.string().max(50).optional().nullable(),
  social_links: z.string().max(1000).optional().nullable()
});

module.exports = {
  validate,
  schemas: {
    login: loginSchema,
    register: registerSchema,
    script: scriptSchema,
    task: taskSchema,
    profileUpdate: profileUpdateSchema
  }
};
