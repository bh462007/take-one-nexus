# 🏛️ TAKE ONE Nexus — Architecture

TAKE ONE Nexus uses a highly optimized, hybrid architecture designed to balance SEO, rapid client-side interactivity, robust real-time communication, and production-grade security.

---

## 1. The Dual-Server Model

Due to the transition from a purely static/Express application to a modern Next.js ecosystem, the platform employs a **Dual-Server Model** hosted on Vercel:

### A. Next.js App Router (`src/app/`)
- **Purpose**: Authenticated pages, auth flows, and all API routes that require server-side logic or database access.
- **Execution**: SSR, Static Generation, and Client Components.
- **Key Routes**:
  | Route | Type | Purpose |
  |---|---|---|
  | `/` | Static | Landing page |
  | `/profile` | Dynamic SSR | Authenticated user profile |
  | `/chat` | Static shell | Real-time messaging (verified users only) |
  | `/admin` | Dynamic SSR | Admin dashboard (role-gated) |
  | `/verify-email` | Static | Email verification status page |
  | `/forgot-password` | Static | Password recovery request |
  | `/reset-password` | Static | New password form |
  | `/api/auth/verify-email` | API Route | Token validation + resend |
  | `/api/auth/forgot-password` | API Route | Reset email dispatch |
  | `/api/auth/reset-password` | API Route | Password update |
  | `/leaderboard` | Dynamic SSR | Top 50 creators |

### C. Script Review Platform (`scripts-platform/`)
- **Purpose**: Internal moderation tool for Admin / Developer roles. Not accessible to the public (`noindex, nofollow`).
- **Port**: 3001 (local) | Separate Vercel project or subdomain (`scripts.takeone-nexus.net.in`) in production.
- **Auth**: Independent JWT (`SP_JWT_SECRET`) stored in `sp_token` HTTP-only cookie. Session duration 8 hours.
- **Key Routes**:
  | Route | Purpose |
  |---|---|
  | `/login` | Admin-only login (bcrypt verify, role-gated to Admin/Developer) |
  | `/dashboard` | Live stats grid + recent submissions & issues |
  | `/scripts` | Filterable moderation queue (pending / approved / rejected) |
  | `/scripts/[id]` | Full script review: PDF iframe, moderator notes, approve/reject/reset |
  | `/issues` | Issue triage with status transitions (open → in_progress → resolved) |
  | `GET /api/scripts` | Internal API: script list filtered by `approval_status` |
  | `PATCH /api/scripts/[id]/moderate` | Apply moderation action + send rejection email |
  | `GET /api/issues` | Internal API: issue list filtered by `status` |
  | `PATCH /api/issues/[id]` | Update issue status / priority / assigned_admin |

### B. Legacy Express Server (`server.js`)
- **Purpose**: Core REST API for data mutations. Serves legacy static `.htm` pages (`/public`).
- **Execution**: Serverless Function on Vercel.
- **Routing**: `/api/*` handles all data operations.
- **Key Express Routes**:
  | Route | Auth | Purpose |
  |---|---|---|
  | `POST /api/users/register` | None | Registration + verification email |
  | `POST /api/users/login` | None | Login + `email_verified` in response |
  | `GET /api/users/me` | JWT | Session data (incl. `email_verified`) |
  | `GET /api/users/public/:id` | None | Public profile view |
  | `GET /api/chat/*` | JWT | Real-time message history |
  | `GET /api/system/stats` | Admin | Live platform metrics |

> **Routing Magic**: `vercel.json` rewrite rules map `/api/*` to Express while Next.js handles everything else.

---

## 2. Middleware & Authentication

### `src/middleware.ts` → `src/proxy.ts`
The Next.js Edge Middleware validates the HTTP-only JWT cookie and enforces access rules before any page renders.

**Access Matrix:**
| Route | Unauthenticated | Authenticated (Unverified) | Authenticated (Verified) | Admin |
|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/profile` | 🔀 login | ✅ (sees banner) | ✅ | ✅ |
| `/chat` | 🔀 login | 🔀 `/?verify=required` | ✅ | ✅ |
| `/admin` | 🔀 login | 🔀 unauthorized | 🔀 unauthorized | ✅ |

**JWT Payload fields checked by middleware:**
- `id`, `email`, `role` — authorization
- `email_verified` — chat access gate (only gates when explicitly `false`; older tokens without the field are allowed through)

### Express `middleware/auth.js`
Stateless JWT verification for Express API routes. Re-uses the same `JWT_SECRET`.

### Role-Based Access Control (RBAC) & Task System
Tasks can only be created and managed by users with the `creator` role.
- Creators can create, edit, and assign tasks.
- Standard users (`crew`, etc.) can only be assigned to tasks and mark them as completed.
- Gated securely at both the middleware (`/admin/*` and task endpoints) and frontend UI levels.

---

## 3. Database & ORM Layer

### TiDB Cloud (MySQL-compatible)
Distributed SQL database. Accessed from both the Express API (via `mysql2` connection pool) and Next.js App Router (via Prisma).

### Prisma ORM (`prisma/schema.prisma`)
Single source of truth for the database schema. Generated client types are used across all Next.js API routes.

**`User` model security fields (added v1.1):**
```prisma
email_verified          Boolean?   @default(false)
email_verified_at       DateTime?
verification_token      String?    @unique  // SHA-256 hash of raw token
verification_token_expires DateTime?
reset_token             String?    @unique  // SHA-256 hash of raw token
reset_token_expires     DateTime?
```

**`Script` model moderation fields (added v1.2):**
```prisma
approval_status   String?   @default("pending")  // pending | approved | rejected
approved_by       Int?      // FK → User.id of the moderating admin
approved_at       DateTime?
moderation_notes  String?   @db.Text
```

**`Issue` model admin fields (added v1.2):**
```prisma
priority          String?   @default("medium")   // low | medium | high
assigned_admin    Int?      // FK → User.id of assigned moderator
resolved_at       DateTime?
```

> **Security principle**: Raw tokens are 32-byte `crypto.randomBytes` values. Only SHA-256 hashes are stored in the database. The raw token travels exclusively in the email link.

### Connection Strategy
- **Express**: `mysql2` connection pool (configured in `config/db.js`).
- **Next.js API Routes**: Prisma singleton via `src/lib/prisma.ts` to prevent connection exhaustion in serverless environments.

---

## 4. Email Infrastructure (Resend)

All transactional emails are delivered via **Resend** using the custom domain `takeone-nexus.net.in`.

| Email | Trigger | Template |
|---|---|---|
| Welcome | On registration | `utils/email.js` |
| Email Verification | On registration + resend | `src/lib/email-templates/verify-email.ts` |
| Password Reset | On forgot-password request | `src/lib/email-templates/reset-password.ts` |
| Script Rejection | On admin rejection via scripts-platform | Inline HTML in `scripts-platform/src/app/api/scripts/[id]/moderate/route.ts` |

**Template design**: Cyberpunk/cinematic theme matching the platform UI. HTML-only, table-based layout for maximum email client compatibility.

---

## 5. Rate Limiting

Dual-layer rate limiting — Next.js and Express both protected independently.

### `src/lib/rate-limiter.ts` (Next.js API Routes)
- Sliding-window in-memory counter.
- Key format: `prefix:ip` or `prefix:type:value` for per-resource limits.
- Fail-open: limiter errors never block legitimate traffic.

### `middleware/rateLimiter.js` (Express Routes)
- Identical algorithm, CommonJS module for Express compatibility.
- Applied as route-level middleware via `createRateLimiter({ limit, windowMs })`.

**Configured limits (`src/lib/rate-limit-config.ts`):**
| Endpoint | Limit | Window |
|---|---|---|
| Login | 5 requests | 15 min |
| Register | 3 requests | 60 min |
| Verify Email | 10 requests | 60 min |
| Resend Verification | 3 requests | 60 min |
| Forgot Password | 5 requests | 60 min |
| Reset Password | 10 requests | 15 min |

> **Scaling note**: The in-memory store is reset on cold starts. For production horizontal scaling, replace with Redis/Upstash by setting `RATE_LIMIT_STORE=redis` (planned, not yet implemented).

---

## 6. Security Headers (CSP & Helmet)

TAKE ONE Nexus employs strict HTTP security headers to achieve an A/A+ security rating.

- **Content Security Policy (CSP)**: Blocks inline scripts (except nonces/hashes where needed), restricts font/image sources, and mandates `https:` for external assets.
- **X-Frame-Options (`DENY`)**: Completely mitigates clickjacking attacks.
- **X-Content-Type-Options (`nosniff`)**: Prevents MIME-type sniffing.
- **Referrer-Policy (`strict-origin-when-cross-origin`)**: Protects cross-origin request data.
- **Permissions-Policy**: Disables unnecessary browser features (geolocation, camera, microphone) globally.

Applied globally via `next.config.js` and Express helmet middleware.

---

## 7. Observability

Strictly separated between two tools to avoid scope creep:

### PostHog (`src/lib/posthog.ts`)
- **Used for**: Frontend analytics (page views, custom events), session replay, feature flags.
- **NOT used for**: Error tracking.
- **Activation**: Consent-gated. Only initializes after the user accepts analytics cookies.
- **Privacy**: All inputs masked by default. Sensitive field names (`password`, `token`, `secret`, `key`) are stripped from user identity traits before sending.
- **Config**: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.

### Sentry (`src/lib/sentry.ts`)
- **Used for**: Backend API failures, database errors, server-side exceptions.
- **NOT used for**: Analytics, frontend UX, session tracking.
- **Scrubbing**: `beforeSend` hook strips `password`, `token`, `secret`, `key` from all request bodies and cookies before transmitting to Sentry.
- **Config**: `SENTRY_DSN`.

---

## 7. GDPR Cookie Consent

### `src/components/CookieConsentBanner.tsx`
- Slide-up animated banner shown on first visit (1.2s delay).
- Persist preferences in `localStorage` under `ton_cookie_consent`.
- Three action modes: Accept All, Reject Non-Essential, Customize.
- Customize panel has per-category toggle switches (Essential always on).
- Dispatches `consentUpdated` DOM event → `PostHogProvider` re-reads consent and opts in/out without page reload.

### `src/lib/cookie-consent.ts`
- Pure utility for reading/writing consent to `localStorage`.
- Exported: `setConsent()`, `getConsent()`, `hasConsented()`.

---

## 9. Real-Time Telemetry (Pusher)

To give TAKE ONE Nexus its signature "live mission control" feel, we utilize Pusher WebSockets.
- **Global Chat**: Direct peer-to-peer messaging (`chat.js`).
- **Admin Dashboard**: Live metrics (user registration, issue submission).
- **Task Updates**: Live credits awarding and issue tracking.
- **Script Moderation** (`SCRIPT_MODERATED`): Triggered by `PATCH /api/scripts/:id/moderate`. Admin dashboard updates in real-time when a script is approved or rejected from the scripts-platform.

---

## 10. Verified Account Badge System

Creators with `email_verified = true` receive a visual verified badge (neon ✦ SVG) across all platform surfaces:

| Surface | Implementation |
|---|---|
| Leaderboard (`/leaderboard`) | `LeaderboardClient.tsx` — inline SVG badge next to creator name |
| Profile page (`/profile`) | `src/app/profile/page.tsx` — badge in the profile header |
| Crew Finder (`/crew.htm`) | `public/scripts/pages/crew.js` — badge injected into `personCard()` HTML |

Both `GET /api/users/search` and `GET /api/users/leaderboard` now return `email_verified` in their SQL `SELECT` statements.

---

## Future Payment Engine & Escrow Architecture

To safely transition the Take One Nexus platform into a commercial creative ecosystem, the following architectural boundaries are planned for the upcoming Payment Engine:

### A. Idempotency & Transaction Safety
- All payment execution API requests (`POST /api/payments/charge`) will require an `Idempotency-Key` header generated client-side. This ensures duplicate clicks or networking retries do not result in duplicate transactions.
- The transaction engine will use database-level transactional locks (`PRISMA TRANSACTION`) to ensure database states (e.g. credit updates, script license transfers) align atomically with external provider results.

### B. Secure Webhook Validation
- Stripe / Razorpay webhook notifications will be routed through `/api/payments/webhooks`.
- Webhook payloads will be processed asynchronously via an isolated worker queue to keep the main event loop non-blocking.
- The webhook controller will enforce cryptographically signed headers, validating signatures against a secure, local environment variable secret (`STRIPE_WEBHOOK_SECRET`).

### C. Ledgers & Audit Trails
- A dedicated `TransactionLedger` table will maintain an immutable history of all charges, refunds, split distributions, and payouts.
- Every transaction log is tied back to the specific `User` and, if applicable, the specific script `Task` (Mission) that prompted the escrow payment.

---

## Architectural Decision Records (ADR)

| # | Title | Decision |
|---|---|---|
| ADR-001 | IST for Admin Analytics | All `GROUP BY DATE` SQL calls use `CONVERT_TZ` to `Asia/Kolkata`. Frontend uses `Intl.DateTimeFormat` with `Asia/Kolkata`. |
| ADR-002 | Preserve Legacy HTML Pages | Cinematic vanilla HTML pages kept as-is to avoid breaking animations. Next.js conversion deferred until feasible 1:1 parity. |
| ADR-003 | Dual Rate Limiter | Express and Next.js have independent rate limiters (same algorithm) because they run in separate runtimes. Shared Redis is deferred. |
| ADR-004 | Fail-Open Rate Limiting | Limiter errors return `success: true` and call `next()`. Platform availability > perfect rate limiting. |
| ADR-005 | PostHog vs. Sentry Separation | Analytics and error tracking are strictly separate tools with separate scopes. PostHog = behaviour. Sentry = exceptions. |
| ADR-006 | Email-Only Verification Gate | Only `/chat` is hard-gated by email verification. `/profile` is accessible so unverified users can see the banner and resend. |
| ADR-007 | Token Hashing Strategy | SHA-256 of a 32-byte random token. Hash stored in DB. Raw token in email URL only. Prevents token enumeration from DB breach. |
| ADR-008 | Secure Webhook Signature Validation | Webhook processing MUST cryptographically verify signatures using raw request buffers. Avoid parsed bodies to ensure security against signature spoofing. |
| ADR-009 | Independent scripts-platform JWT | The scripts-platform uses a separate `SP_JWT_SECRET` and `sp_token` cookie, isolated from the main platform's auth session. This means a compromised main JWT cannot grant moderation access. |
