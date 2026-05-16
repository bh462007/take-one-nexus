# 🔄 Changelog

All notable changes to the TAKE ONE Nexus project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-05-16 — Nexus Security Suite

### Added
- **Email Verification System**: Automatic verification email on registration via Resend. Tokens are 32-byte crypto-random values stored as SHA-256 hashes. 24-hour expiry with resend support.
- **Email Verification Gate**: `/chat` requires a verified email. Unverified users see a sticky `EmailVerificationBanner` with resend + cooldown timer.
- **Verification Pages**: `/verify-email` (7-state handler), `/forgot-password`, `/reset-password` (real-time strength meter + show/hide toggle).
- **Password Reset Flow**: Secure forgot-password → reset-password. Single-use token (nulled after use), 60-minute expiry.
- **IP-Based Rate Limiting**: Sliding-window in-memory limiters on all auth endpoints. Separate implementations for Next.js (`src/lib/rate-limiter.ts`) and Express (`middleware/rateLimiter.js`). Fail-open design.
- **GDPR Cookie Consent Banner**: Slide-up animated banner — Accept All / Reject / Customize with per-category toggles. Persisted in `localStorage`.
- **PostHog Analytics**: Consent-gated analytics, session replay (all inputs masked), and feature flags via `PostHogProvider`.
- **Sentry Error Monitoring**: Backend-only error capture with PII scrubbing (`beforeSend` hook strips password/token/secret fields).
- **Cyberpunk Email Templates**: `src/lib/email-templates/` — HTML templates for verification and password reset matching the platform's cinematic design system.

### Changed
- `routes/users.js`: Registration sends verification email (async, non-blocking). Rate limiters applied to login (5/15min) and register (3/hr). `email_verified` now returned in login and `/me` responses.
- `src/proxy.ts`: Added email verification gate — unverified users are redirected from `/chat` to `/?verify=required`.
- `src/app/layout.tsx`: Wrapped body in `PostHogProvider`. Added `EmailVerificationBanner` and `CookieConsentBanner`.
- `prisma/schema.prisma` + `db push`: Added 6 security fields to `User` model.
- `.env.example`: Documented all new env vars with purpose comments.

### Security
- SHA-256 token hashing — raw tokens never stored in DB.
- Generic success messages on all auth endpoints to prevent email enumeration.
- Sentry `beforeSend` scrubs PII before transmission.
- PostHog identity traits sanitized before sending.

---

## [1.0.0] - 2026-05-16

### Added
- **Global Timezone Support**: Admin analytics and charts now natively support Indian Standard Time (IST) out of the box, ensuring midnight resets occur correctly for the target demographic.
- **Cinematic Markdown Documentation**: Complete rewrite of all standard open-source documentation including README, CONTRIBUTING, SECURITY, and ROADMAP.
- **Clerk Authentication Ready**: Backend models and middleware refactored to support seamless migration to Clerk.

### Changed
- **Codebase Optimization**: Removed all unused components, dead code, and debug spam (`console.log`) across frontend and backend for a smaller bundle size and faster execution.
- **UI Architecture**: Moved multiple Express-served pages into the Next.js App Router for better client-side transitions and SEO.

### Fixed
- **API Response Leaks**: Fixed an issue where raw HTML error pages were leaking to the frontend during failed API requests. All API endpoints now return strict JSON.
- **Realtime Listener Leaks**: Cleaned up unmounted component listeners to prevent Pusher memory leaks.
- **Dashboard Synchronization**: Corrected the SQL `GROUP BY` logic so charts don't misalign dates due to UTC offsets.

---

## [0.9.0] - 2026-05-10
### Added
- **Global Chat**: Added real-time direct messaging between users using Pusher Websockets.
- **Credits System**: Implemented the `credits` table and UI components to reward active filmmakers.
- **Admin Command Center**: Added a highly styled, cinematic dashboard for platform telemetry.

### Fixed
- **Database Connection Pooling**: Resolved `Too many connections` errors by using global Prisma singletons and robust Express connection pooling.

---

## [0.1.0] - 2026-01-01
### Added
- Initial project scaffold.
- Basic TiDB integration.
- Static UI shell (Project/Crew/Profile screens).
