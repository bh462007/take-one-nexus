/**
 * CSRF Protection middleware using csurf
 * 
 * sameSite: "None" + secure: true is required for cross-subdomain cookie sharing.
 * With sameSite: "Lax", the browser will NOT send the CSRF cookie when
 * navigating from admin.takeone-nexus.net.in → takeone-nexus.net.in or vice-versa.
 */

const csrf = require('csurf');

const isProd = process.env.NODE_ENV === 'production';

const csrfProtection = csrf({
  cookie: {
    httpOnly: false,       // Must be readable by JS for double-submit pattern
    secure: isProd,        // HTTPS only in production
    sameSite: isProd ? 'None' : 'Lax', // None required for cross-subdomain; Lax safe for localhost
    ...(isProd && { domain: '.takeone-nexus.net.in' })
  }
});

module.exports = csrfProtection;
