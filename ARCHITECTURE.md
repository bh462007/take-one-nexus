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

## 6. Observability

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

## 8. Real-Time Telemetry (Pusher)

To give TAKE ONE Nexus its signature "live mission control" feel, we utilize Pusher WebSockets.
- **Global Chat**: Direct peer-to-peer messaging (`chat.js`).
- **Admin Dashboard**: Live metrics (user registration, issue submission).
- **Task Updates**: Live credits awarding and issue tracking.

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
