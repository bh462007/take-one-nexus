const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate user via JWT (Cookie or Header)
 */
function authenticateUser(req, res, next) {
  let token = null;
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Check Authorization Header
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // 2. Check Cookie (Critical for Next.js SSR and Vercel production)
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    if (!isProd) {
      console.log(`[AUTH_DEBUG] ❌ Access blocked: No auth token found in cookies or authorization headers.`);
    }
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.'
    });
  }

  try {
    // JWT_SECRET must be set explicitly. The fallback string was public in the
    // repository; any deployment that omits the variable would silently use it
    // and be vulnerable to token forgery. Throw early so the misconfiguration
    // surfaces immediately rather than allowing forged tokens through.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const decoded = jwt.verify(token, secret);
    
    // Attach user to request
    req.user = decoded;
    
    if (!isProd) {
      console.log(`[AUTH_DEBUG] ✅ Token verified successfully for user: ${decoded.email} (ID: ${decoded.id}, Role: ${decoded.role})`);
    }
    
    // Explicitly check for expiration if not handled by verify
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      if (!isProd) {
        console.log(`[AUTH_DEBUG] ❌ Token expired for user: ${decoded.email}`);
      }
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.'
      });
    }

    return next();
  } catch (error) {
    if (!isProd) {
      console.error(`[AUTH_DEBUG] ❌ Token verification failed: ${error.message}`);
    }
    console.error(`[AUTH_FAILURE] Token verification failed:`, error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed session token.'
    });
  }
}

/**
 * Middleware to require specific roles
 * @param {string[]} allowedRoles 
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = String(req.user.role || '').toLowerCase();
    const isAuthorized = allowedRoles.some(role => role.toLowerCase() === userRole);

    // Special case for lead dev email override
    const email = String(req.user.email || '').toLowerCase();
    const isAdminOverride = 
      email === 'aarushgupta289@gmail.com' || 
      email === 'alok.r25012@csds.rishihood.edu.in';

    if (!isAuthorized && !isAdminOverride) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to require a specific secondary_role (or fall back to primary role)
 * @param {string[]} allowedRoles
 */
function requireSecondaryRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const primaryRole = String(req.user.role || '').toLowerCase();
    const secondaryRole = String(req.user.secondary_role || '').toLowerCase();
    const email = String(req.user.email || '').toLowerCase();

    // Admin email override always passes
    const isAdminOverride =
      email === 'aarushgupta289@gmail.com' ||
      email === 'alok.r25012@csds.rishihood.edu.in';

    const isAuthorized = allowedRoles.some(role => {
      const r = role.toLowerCase();
      return primaryRole === r || secondaryRole === r;
    });

    if (!isAuthorized && !isAdminOverride) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Convenience middleware: requires primary role 'admin' OR secondary_role 'admin'
 */
function requireAdmin(req, res, next) {
  return requireSecondaryRole(['admin'])(req, res, next);
}

/**
 * Convenience middleware: requires primary or secondary role 'moderator' or 'admin'
 */
function requireModerator(req, res, next) {
  return requireSecondaryRole(['admin', 'moderator'])(req, res, next);
}

/**
 * Middleware to require email verification
 */
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Allow access if email_verified is true OR missing (for legacy tokens)
  // If explicitly false, block access
  if (req.user.email_verified === false) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please check your inbox.',
      verificationRequired: true
    });
  }

  next();
}

/**
 * Middleware to ensure the authenticated user is the one they are trying to access/modify
 */
function requireSameUser(req, res, next) {
  const targetId = Number(req.params.id || req.body.userId);
  const authId = Number(req.user?.id);

  if (targetId !== authId && req.user?.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access attempt'
    });
  }

  return next();
}

module.exports = {
  authenticateUser,
  requireRole,
  requireVerified,
  requireSameUser,
  requireSecondaryRole,
  requireAdmin,
  requireModerator
};
