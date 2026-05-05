const jwt = require('jsonwebtoken');

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Login required'
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
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
