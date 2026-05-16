const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate user via JWT token in headers or cookies.
 */
function authenticateUser(req, res, next) {
  let token = null;

  // 1. Check Authorization Header
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // 2. Check Cookie (Critical for SSR and Vercel)
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'takeone_fallback_secret_32_chars_long';
    const decoded = jwt.verify(token, secret);
    
    // Ensure critical fields exist
    if (!decoded.id || !decoded.email) {
      throw new Error('Invalid token payload');
    }

    req.user = decoded;
    return next();
  } catch (error) {
    console.error(`[AUTH_FAILURE] ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please login again.'
    });
  }
}

/**
 * Middleware to restrict access to specific roles.
 * @param {...string} roles - Allowed roles
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase();

    // Developers and Admins have global access
    const isSuperUser = 
      userRole === 'developer' || 
      userRole === 'admin' ||
      userEmail === 'aarushgupta289@gmail.com' ||
      userEmail === 'alok.r25012@csds.rishihood.edu.in';

    if (isSuperUser) return next();

    if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to ensure the user is accessing their own resource.
 */
function requireSameUser(req, res, next) {
  const resourceId = Number(req.params.id);
  const userId = Number(req.user?.id);

  if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

  // Admins can bypass same-user check
  const isAdmin = ['admin', 'developer'].includes((req.user.role || '').toLowerCase());
  if (isAdmin) return next();

  if (resourceId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: You can only access your own records'
    });
  }

  return next();
}

module.exports = {
  authenticateUser,
  authorizeRoles,
  requireSameUser
};
