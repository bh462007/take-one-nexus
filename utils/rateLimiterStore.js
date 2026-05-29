/**
 * utils/rateLimiterStore.js
 *
 * Shared backing store for rate limiting.
 * Production: Upstash Redis (persistent across serverless cold starts).
 * Development: in-memory Map (single-process only, resets on restart).
 *
 * Returns { count, ttlSeconds } — callers compute success/remaining/retryAfter.
 */

'use strict';

let _redis = null;

// MICRO FIX 1: timestamp-based cooldown instead of permanent disable.
// If Redis init fails (transient outage, DNS issue, cold boot timing),
// retry after 60 seconds rather than permanently falling back to memory
// for the entire process lifetime.
let redisInitFailedUntil = 0;

function getRedis() {
  if (_redis) return _redis;

  if (Date.now() < redisInitFailedUntil) return null;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const { Redis } = require('@upstash/redis');
    _redis = new Redis({ url, token });
    return _redis;
  } catch (err) {
    // Retry allowed after 60s — not permanent
    redisInitFailedUntil = Date.now() + 60 * 1000;
    console.warn('[RateLimiter] Redis init failed, retrying in 60s:', err.message);
    return null;
  }
}

// ── IN-MEMORY STORE (development fallback only) ──

// MICRO FIX 2: JSDoc type for editor inference and accidental misuse prevention
/** @type {Map<string, { count: number, expiresAt: number }>} */
const memStore = new Map();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memStore) {
    if (now >= val.expiresAt) memStore.delete(key);
  }
}, 10 * 60 * 1000);

cleanupTimer.unref?.();

async function incrementMemory(key, windowMs) {
  const now   = Date.now();
  const entry = memStore.get(key);

  if (!entry || now >= entry.expiresAt) {
    const expiresAt = now + windowMs;
    memStore.set(key, { count: 1, expiresAt });
    return {
      count: 1,
      ttlSeconds: Math.ceil(windowMs / 1000)
    };
  }

  entry.count++;
  const ttlSeconds = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
  return { count: entry.count, ttlSeconds };
}

// ── REDIS STORE ──

async function incrementRedis(key, windowMs) {
  const redis         = getRedis();
  const windowSeconds = Math.ceil(windowMs / 1000);

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  let ttlSeconds = await redis.ttl(key);

  // -1 = no expiry set (race between INCR and EXPIRE)
  // -2 = key disappeared (extreme race condition)
  // both cases: re-set expiry safely
  if (ttlSeconds < 0) {
    await redis.expire(key, windowSeconds);
    ttlSeconds = windowSeconds;
  }

  return { count, ttlSeconds };
}

// ── PUBLIC API ──

let hasWarnedMissingRedis = false;

/**
 * Atomically increment the counter for a key within a time window.
 *
 * @param {string} key      - Unique rate limit key (e.g. "login:192.168.1.1")
 * @param {number} windowMs - Window duration in milliseconds
 * @returns {Promise<{ count: number, ttlSeconds: number }>}
 */
async function increment(key, windowMs) {
  const redis = getRedis();

  if (redis) {
    return incrementRedis(key, windowMs);
  }

  if (process.env.NODE_ENV === 'production' && !hasWarnedMissingRedis) {
    hasWarnedMissingRedis = true;
    console.warn(
      '[RateLimiter] PRODUCTION WARNING: UPSTASH_REDIS_REST_URL not set. ' +
      'Rate limiting is NOT distributed across serverless instances. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to fix this.'
    );
  }

  return incrementMemory(key, windowMs);
}

/**
 * Returns true if Redis credentials are configured.
 */
function isRedisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

module.exports = { increment, isRedisConfigured };