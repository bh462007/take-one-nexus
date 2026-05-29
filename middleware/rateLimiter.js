/**
 * middleware/rateLimiter.js
 *
 * Express rate limiter middleware.
 * API surface unchanged — existing call sites in routes/users.js work as-is.
 *
 * Behavior preserved exactly:
 *   limit=5 → 5 allowed, 6th blocked
 *   (count > limit with Redis INCR equals original count >= limit pre-increment)
 */

'use strict';

const { increment } = require('../utils/rateLimiterStore');

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
  return async function rateLimiterMiddleware(req, res, next) {
    try {
      const ip =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        'unknown';

      const key = keyFn ? keyFn(req) : `${keyPrefix}:${ip}`;

      const { count, ttlSeconds } = await increment(key, windowMs);

      // count > limit with Redis INCR:
      //   INCR returns post-increment value.
      //   count 1-5: allowed. count 6: blocked.
      //   Matches original pre-increment count >= limit behavior exactly.
      if (count > limit) {
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('Retry-After', ttlSeconds);
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please wait before trying again.',
          retryAfter: ttlSeconds
        });
      }

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

      next();
    } catch (err) {
      // FIX 3: cleaner log message — ADR-004 fail open still applies
      console.error('[RateLimiter] Store error:', err.message);
      next();
    }
  };
}

module.exports = { createRateLimiter };