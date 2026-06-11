/**
 * middleware/rateLimiter.js
 *
 * Enhanced Sliding-Window Counter Rate Limiter.
 * Retains 100% exact API backward compatibility with legacy call sites.
 */

'use strict';

// Global memory tracker for sliding timestamps
const ipStore = new Map(); // Key: fully-qualified tracking key, Value: Array of timestamps (ms)

/**
 * Create an Express sliding-window rate limit middleware.
 *
 * @param {object}   options
 * @param {number}   options.limit       - Max requests per window
 * @param {number}   options.windowMs    - Window duration in milliseconds
 * @param {string}   [options.keyPrefix] - Store key prefix (default: 'rl')
 * @param {function} [options.keyFn]     - Custom key function: (req) => string
 */
function createRateLimiter({ limit, windowMs, keyPrefix = 'rl', keyFn }) {
  const finalLimit = limit || 60;
  const finalWindowMs = windowMs || 60 * 1000;

  return (req, res, next) => {
    const startTime = performance.now();
    const now = Date.now();

    // 1. Exact replica of legacy key generation to maintain consistency across proxies
    let key;
    if (keyFn) {
      key = keyFn(req);
    } else {
      const ip =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        'unknown';
      key = `${keyPrefix}:${ip}`;
    }

    // Initialize map track if first hit
    if (!ipStore.has(key)) {
      ipStore.set(key, []);
    }
    const timestamps = ipStore.get(key);

    // 2. OPTIMIZED INLINE PRUNING: Evict ticks outside the active sliding timeline
    // Chronological order guarantees old entries sit exclusively at index 0.
    const windowStart = now - finalWindowMs;
    while (timestamps.length > 0 && timestamps[0] <= windowStart) {
      timestamps.shift(); // Amortized O(1) removal, dramatically faster than .filter()
    }
=======
    let timestamps = ipStore.get(key);

    // 2. Sliding Window Calculation: Evict ticks outside the active sliding timeline
    const windowStart = now - finalWindowMs;
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);

    const currentRequestCount = timestamps.length;

    // 3. Acceptance/Throttling Guard Check
    if (currentRequestCount >= finalLimit) {
      const oldestActiveTimestamp = timestamps[0];
      // Dynamic mathematical backup calculation for Retry-After (seconds)
      const retryAfterSeconds = Math.ceil((finalWindowMs - (now - oldestActiveTimestamp)) / 1000);

      // Return both legacy and modern metadata compliance headers
      res.set({
        'X-RateLimit-Limit': finalLimit,
        'X-RateLimit-Remaining': 0,
        'Retry-After': retryAfterSeconds,
        'RateLimit-Limit': finalLimit,
        'RateLimit-Remaining': 0,
        'RateLimit-Reset': retryAfterSeconds
      });

      const endTime = performance.now();
      console.log(`[SLIDING-LIMITER] Blocked Key: ${key} | Latency Overhead: ${(endTime - startTime).toFixed(4)}ms`);

      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait before trying again.'
      });
    }

    // 4. Track current loop execution tick
    timestamps.push(now);
    ipStore.set(key, timestamps);


    // 5. Standard and Backward-Compatible Compliance Response Headers
    res.set({
      'X-RateLimit-Limit': finalLimit,
      'X-RateLimit-Remaining': finalLimit - currentRequestCount - 1,
      'RateLimit-Limit': finalLimit,
      'RateLimit-Remaining': finalLimit - currentRequestCount - 1

      'X-RateLimit-Remaining': finalLimit - timestamps.length,
      'RateLimit-Limit': finalLimit,
      'RateLimit-Remaining': finalLimit - timestamps.length
    });

    const endTime = performance.now();
    // Verification logging check (<1ms threshold requirement verification)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SLIDING-LIMITER] Allowed Key: ${key} | Overhead: ${(endTime - startTime).toFixed(4)}ms | Remaining: ${finalLimit - timestamps.length}`);
    }

    next();
  };

}

// 6. Non-Blocking Memory Eviction Daemon
// Periodically eliminates dead client keys whose request history has decayed down to zero.
const intervalId = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of ipStore.entries()) {
    // Check if the latest registered hit for the tracking context falls out of scope
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 15 * 60 * 1000) {
      ipStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Runs every 5 minutes

// Prevent the daemon timer from keeping the primary Node event loop open during test suites
if (typeof intervalId.unref === 'function') {
  intervalId.unref();

}

// 6. Memory Eviction Daemon to prevent leaks from dead connection keys
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of ipStore.entries()) {
    // Evict entirely if stagnant for more than 15 minutes
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 15 * 60 * 1000) {
      ipStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Runs every 5 minutes

module.exports = { createRateLimiter };