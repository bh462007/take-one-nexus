const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator results.
 * Returns a 400 response with formatted errors if validation fails.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

module.exports = { validateRequest };
