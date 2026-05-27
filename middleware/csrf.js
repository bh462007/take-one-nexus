/**
 * CSRF Protection middleware using csurf
 */

const csrf = require('csurf');

const isProd = process.env.NODE_ENV === "production";

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    ...(isProd && { domain: ".takeone-nexus.net.in" })
  }
});

module.exports = csrfProtection;
