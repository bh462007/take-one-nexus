/**
 * CSRF Protection — Stateless Double-Submit Cookie Pattern
 *
 * How it works:
 *   1. generateCsrfToken  — Sets a `csrf_token` cookie on every response.
 *      The cookie is readable by JavaScript (httpOnly: false) so the frontend
 *      can read it and echo it back as the X-CSRF-Token header.
 *
 *   2. verifyCsrfToken — On every state-changing request (POST/PUT/PATCH/DELETE),
 *      confirms that the X-CSRF-Token header matches the csrf_token cookie.
 *      GET / HEAD / OPTIONS are exempt (safe methods).
 *
 * Why not csurf?
 *   The `csurf` package is officially deprecated. This custom implementation
 *   achieves the same security guarantee without additional dependencies.
 *
 * Frontend integration:
 *   Read document.cookie to extract `csrf_token`, then attach it to all
 *   mutating requests as: headers: { 'X-CSRF-Token': csrfToken }
 */

const crypto = require('crypto');

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Generate a cryptographically secure CSRF token and set it as a cookie.
 * Called globally — runs on every request so the cookie is always fresh/present.
 */
function generateCsrfToken(req, res, next) {
  // Only set a new token if one isn't already present
  if (!req.cookies || !req.cookies[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString('hex');
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,    // Must be readable by JavaScript
      secure: isProd,
      sameSite: 'strict', // Strict is fine here — this is a CSRF guard cookie, not auth
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      ...(isProd && { domain: '.takeone-nexus.net.in' })
    });
  }
  next();
}

/**
 * Verify the CSRF token on all state-changing requests.
 * Skips safe HTTP methods (GET, HEAD, OPTIONS).
 * Skips Razorpay webhook endpoint (uses signature verification instead).
 */
function verifyCsrfToken(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Skip CSRF check for Razorpay webhook — it uses HMAC signature verification
  if (req.path === '/webhook' || req.path.includes('/webhook')) {
    return next();
  }

  // In development, log but skip strict enforcement to ease local testing
  if (process.env.NODE_ENV !== 'production' && process.env.CSRF_DISABLED === 'true') {
    return next();
  }

  const tokenFromCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const tokenFromHeader = req.headers?.[CSRF_HEADER_NAME];

  if (!tokenFromCookie || !tokenFromHeader) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing. Ensure X-CSRF-Token header is set.',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // Constant-time comparison to prevent timing attacks
  const cookieBuf = Buffer.from(tokenFromCookie);
  const headerBuf = Buffer.from(tokenFromHeader);

  if (
    cookieBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, headerBuf)
  ) {
    console.warn(`[SECURITY] CSRF validation failed for ${req.method} ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      message: 'CSRF token invalid. Request rejected.',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
}

module.exports = { generateCsrfToken, verifyCsrfToken };
