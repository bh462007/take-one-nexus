const jwt = require('jsonwebtoken');

function authenticateUser(req, res, next) {
  let token = null;

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
    const isChatRequest = req.originalUrl.includes('/api/chat');
    console.warn(`[AUTH_FAILURE] No token provided for ${req.method} ${req.originalUrl}`);
    if (isChatRequest) {
      console.warn(`[CHAT_AUTH_DEBUG] Headers:`, JSON.stringify({
        host: req.headers.host,
        origin: req.headers.origin,
        'user-agent': req.headers['user-agent'],
        cookie: req.headers.cookie ? 'present' : 'missing'
      }));
    }
    return res.status(401).json({
      success: false,
      message: 'Login required'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'takeone_fallback_secret_32_chars_long';
    req.user = jwt.verify(token, secret);
    return next();
  } catch (error) {
    console.error(`[AUTH_FAILURE] Token verification failed for ${req.method} ${req.originalUrl}:`, error.message);
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.'
    });
  }
}

function requireSameUser(req, res, next) {
  if (Number(req.params.id) !== Number(req.user?.id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own account'
    });
  }

  return next();
}

module.exports = {
  authenticateUser,
  requireSameUser
};
