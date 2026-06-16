/**
 * CSRF Protection middleware using csurf
 *
 * sameSite: "None" + secure: true is required for cross-subdomain cookie sharing.
 * With sameSite: "Lax", the browser will NOT send the CSRF cookie when
 * navigating from admin.takeone-nexus.net.in → takeone-nexus.net.in or vice-versa.
 *
 * On Vercel preview deployments (VERCEL_URL contains "vercel.app"), the domain
 * is intentionally left undefined so the browser scopes the cookie to the
 * active Vercel subdomain, preventing the cookie-domain mismatch that causes
 * "Invalid CSRF Token" errors on preview URLs.
 */

const csrf = require('csurf');

const isProd = process.env.NODE_ENV === 'production';
// Detect Vercel preview deployments (VERCEL_URL is set by Vercel for every deployment)
const isVercelPreview = Boolean(process.env.VERCEL_URL?.includes('vercel.app'));

const rawCsrfProtection = csrf({
  cookie: {
    httpOnly: false,       // Must be readable by JS for double-submit pattern
    secure: isProd,        // Always secure to protect CSRF tokens and satisfy CodeQL checks
    sameSite: isProd ? 'None' : 'Lax', // None required for cross-subdomain; Lax safe for localhost
    // Only pin the domain on the custom production domain.
    // On Vercel previews, leave domain undefined so the browser uses the
    // current host automatically (e.g. take-one-nexus.vercel.app).
    domain: isProd && !isVercelPreview ? '.takeone-nexus.net.in' : undefined
  }
});

const csrfProtection = (req, res, next) => {
  // If the request is authenticated via Bearer token, bypass CSRF validation.
  // Bearer tokens are not subject to CSRF because browsers do not automatically
  // attach them to cross-origin requests.
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    if (!isProd) {
      console.log(`[CSRF_DEBUG] Bypassing CSRF for Bearer token authenticated request: ${req.method} ${req.originalUrl}`);
    }
    return next();
  }

  if (!isProd) {
    console.log(`[CSRF_DEBUG] Incoming Request: ${req.method} ${req.originalUrl}`);
    console.log(`[CSRF_DEBUG] CSRF Cookie Present: ${Boolean(req.cookies?.['_csrf'] || req.cookies?.['csrf'])}`);
    console.log(`[CSRF_DEBUG] CSRF Header (X-CSRF-Token) Present: ${Boolean(req.headers['x-csrf-token'])}`);
  }
  
  rawCsrfProtection(req, res, (err) => {
    if (err) {
      if (!isProd) {
        console.error(`[CSRF_DEBUG] ❌ CSRF Validation Failed for ${req.method} ${req.originalUrl}`);
        console.error(`[CSRF_DEBUG] Error details: ${err.message}`);
      }
      return next(err);
    }
    
    if (!isProd) {
      console.log(`[CSRF_DEBUG] ✅ CSRF Validation Passed for ${req.method} ${req.originalUrl}`);
    }
    next();
  });
};

module.exports = csrfProtection;
