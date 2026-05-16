const xss = require('xss');

/**
 * Sanitize a string to prevent XSS attacks.
 * @param {string} input 
 * @returns {string}
 */
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return xss(input);
}

/**
 * Sanitize an object recursively.
 * @param {object} obj 
 * @returns {object}
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params.
 */
function sanitizeMiddleware(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
}

module.exports = {
  sanitize,
  sanitizeObject,
  sanitizeMiddleware
};
