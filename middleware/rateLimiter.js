/**
 * middleware/rateLimiter.js
 *
 * Express rate limiter middleware.
 * Lightweight in-memory sliding window — no external dependencies.
 *
 * API surface unchanged — existing call sites in routes/users.js work as-is.
 * Fail-open rate limiting applied (errors never block legitimate traffic).
 */

'use strict';

const store = new Map();

function checkLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { success: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { success: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, retryAfter: 0 };
}

// Cleanup entries older than 2 hours every 10 minutes to prevent memory leaks
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 2 * 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

cleanupTimer.unref?.();

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
  return function rateLimiterMiddleware(req, res, next) {
    try {
      const ip =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        'unknown';

      const key = keyFn ? keyFn(req) : `${keyPrefix}:${ip}`;

      const result = checkLimit(key, limit, windowMs);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.success) {
        res.setHeader('Retry-After', result.retryAfter);
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please wait before trying again.',
          retryAfter: result.retryAfter
        });
      }

      next();
    } catch (err) {
      console.error('[RateLimiter] Store error:', err.message);
      next();
    }
  };
}

module.exports = { createRateLimiter };