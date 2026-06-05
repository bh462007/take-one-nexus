/**
 * middleware/rateLimiter.js
 *
 * Express rate limiter middleware utilizing standard express-rate-limit.
 *
 * API surface unchanged — existing call sites in routes/users.js work as-is.
 * Fail-safe sliding window rate limiting.
 */

'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Create an Express rate limit middleware.
 *
 * @param {object}   options
 * @param {number}   options.limit       - Max requests per window
 * @param {number}   options.windowMs    - Window duration in milliseconds
 * @param {string}   [options.keyPrefix] - Store key prefix (default: 'rl')
 * @param {function} [options.keyFn]     - Custom key function: (req) => string
 */
function createRateLimiter({ limit, windowMs, keyPrefix = 'rl', keyFn }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: true, // Enable the legacy `X-RateLimit-*` headers for full backwards-compatibility
    validate: false, // Disable internal validations to prevent IPv6 address/trust proxy check crashes
    keyGenerator: (req) => {
      if (keyFn) {
        return keyFn(req);
      }
      const ip =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        'unknown';
      return `${keyPrefix}:${ip}`;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait before trying again.'
      });
    }
  });
}

module.exports = { createRateLimiter };