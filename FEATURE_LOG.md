# Changelog / Feature Log

All notable changes to the TAKE ONE Nexus platform will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project aims to eventually adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — Nexus Security Suite - 2026-05-16

### Added
- **Email Verification Flow**: Full signup → verification email → verified gate. Token lifecycle: generate (crypto) → hash (SHA-256) → store hash → email raw → validate hash → clear.
- **EmailVerificationBanner**: Sticky top banner for unverified users. Calls `POST /api/auth/verify-email` with 60-second resend cooldown. Detects unverified state via `GET /api/users/me`.
- **Password Reset Flow**: `forgot-password` page → `POST /api/auth/forgot-password` (rate-limited, enumeration-safe) → reset email → `reset-password` page with strength meter.
- **3 New Auth Pages**: `/verify-email` (7-state FSM), `/forgot-password`, `/reset-password`.
- **4 New API Routes**: `GET|POST /api/auth/verify-email`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- **Cyberpunk Email Templates** (`src/lib/email-templates/`): Inline-HTML emails matching platform design system. Neon gradient headers, expiry timers, feature unlock lists.
- **IP Rate Limiting**: Dual-layer — `src/lib/rate-limiter.ts` (Next.js) and `middleware/rateLimiter.js` (Express). Sliding window, in-memory, fail-open.
- **GDPR Cookie Consent Banner** (`src/components/CookieConsentBanner.tsx`): Slide-up animated banner. Per-category toggles (Essential, Analytics, Replay, Flags). Consent persisted in `localStorage`.
- **PostHog Integration** (`src/lib/posthog.ts` + `PostHogProvider`): Consent-gated. Lazy-loaded via dynamic import. Full input masking. IST timestamps on all events.
- **Sentry Integration** (`src/lib/sentry.ts`): Backend-only. `captureError()` + `withSentry()` wrappers. `beforeSend` PII scrubber.
- **6 New Prisma Fields**: `email_verified`, `email_verified_at`, `verification_token`, `verification_token_expires`, `reset_token`, `reset_token_expires` on `User` model.

### Changed
- `src/proxy.ts`: Email verification gate for `/chat` route.
- `src/app/layout.tsx`: `PostHogProvider` wrapper + two banner components.
- `routes/users.js`: Verification email on register, rate limiters on login/register, `email_verified` in `/me` response.
- `.env.example` + `.env`: Documented and set `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `SENTRY_DSN`.

---

## [Unreleased / Open Source Prep] - 2026-05

### Added
- **Open Source Documentation:** Complete overhaul of documentation to make the repository production-grade and friendly for SSOC / GSSoC contributors. Added `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `ROADMAP.md`, and `SECURITY.md`.
- **GitHub Templates:** Added standard Issue and Pull Request templates in `.github`.

### Changed
- Refactored `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, and `CODING_RULES.md` to align with professional open-source standards.
- Cleaned up legacy documentation and removed duplicated or incomplete markdown files.

---

## [1.0.0-beta] - 2026-05 (Stability Release)

### Added
- **Leaderboard System:** Real-time top-100 ranking UI and backend endpoints based on user credits.
- **Chat Enhancements:** Cursor-based pagination for older messages and sticky date-grouping.
- **Cinematic Profile Page:** Next.js `/profile` route built with full cinematic dark UI, showcasing roles, avatars, credits, and portfolios.
- **Issue Reporting System:** Global bug reporting modal with screenshot support.
- **Admin Panel:** Next.js `/admin` route for issue tracking and user management.
- **Global Chat FAB:** Floating action button across all dynamic routes for quick messaging.
- **SEO Optimization:** Metadata, Open Graph tags, robots.txt, and sitemap generation.

### Changed
- **Unified Role System:** Centralized all role definitions to `public/scripts/constants/roles.js`.
- **Express Routing:** Modularized legacy routes into domain-specific files (`routes/`).
- **Prisma Integration:** Fully replaced raw `mysql2` queries with Prisma ORM for type safety.
- **App Router Migration:** Migrated Next.js components from Pages Router to App Router.

### Fixed
- **Auth Hardening:** Fixed Next.js middleware JWT verification on Vercel Edge. Standardized secure cookie persistence.
- **Admin Authorization:** Hardened admin and moderator role checks.
- **Chat System Null Safety:** Resolved crashes related to deleted users and system messages.
- **Hydration Mismatches:** Fixed client/server render discrepancies on the Profile and Dashboard pages.
- **CORS Policies:** Configured strict wildcard matching for Vercel preview environments.
- **CSS Loading:** Fixed path resolution issues for static assets served by the Express API.

### Security
- Validated server-backed session fetching to prevent local token spoofing.
- Configured HTTP-only cookies to prevent XSS attacks against JWT tokens.

---

*(For older legacy changes, refer to git commit history prior to May 2026)*
