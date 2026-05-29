/**
 * src/lib/rate-limiter.ts
 *
 * Next.js API route rate limiter.
 *
 * PUBLIC API — all three functions preserved exactly:
 *   checkRateLimit(key, options)  → Promise<RateLimitResult>
 *   buildRateLimitKey(prefix, id) → string
 *   getClientIP(req)              → string
 */

// Minimal structural type instead of NextRequest — preserves compatibility
// with plain Request objects and test mocks.
type RequestLike = {
  headers: {
    get(name: string): string | null;
  };
};

const { increment } = require('../../utils/rateLimiterStore');

// ── TYPES ──
// RateLimitOptions has NO prefix field — callers build keys via
// buildRateLimitKey() before calling checkRateLimit(), so adding prefix
// here would cause double-prefixing: 'login:ip' → 'rl:login:ip'.

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number;
  limit: number;
}

// ── PRESERVED HELPER FUNCTIONS ──
// Do not remove or change signatures — existing Next.js routes call these.

/**
 * Extract the real client IP from a request.
 * Uses RequestLike instead of NextRequest to stay compatible with
 * plain Request objects and test mocks.
 */
export function getClientIP(req: RequestLike): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Build a namespaced rate limit store key.
 * Call this before checkRateLimit — do not rely on checkRateLimit to prefix.
 *
 * e.g. buildRateLimitKey('login', '192.168.1.1') → 'login:192.168.1.1'
 */
export function buildRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

// ── CORE FUNCTION ──

/**
 * Check and increment the rate limit for a given key.
 *
 * Usage pattern:
 *   const key = buildRateLimitKey('login', getClientIP(req));
 *   const result = await checkRateLimit(key, { limit: 5, windowMs: 900000 });
 *
 * @param key     - Fully-formed key from buildRateLimitKey()
 * @param options - limit and windowMs
 */
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    // Pass key directly — caller already prefixed it via buildRateLimitKey()
    const { count, ttlSeconds } = await increment(key, windowMs) as {
      count: number;
      ttlSeconds: number;
    };

    const success   = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      success,
      remaining,
      retryAfter: success ? 0 : ttlSeconds,
      limit
    };
  } catch (err) {
    // ADR-004: fail open — store errors must not block legitimate traffic
    console.error('[RateLimiter] Store error:', err instanceof Error ? err.message : err);
    return {
      success: true,
      remaining: limit,
      retryAfter: 0,
      limit
    };
  }
}