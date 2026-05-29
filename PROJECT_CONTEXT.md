# PROJECT CONTEXT — TAKE ONE Nexus

> A cinematic film crew collaboration platform. Connects student filmmakers across campuses to share scripts, find crew, and build productions.

---

## 🎯 Product Vision

**TAKE ONE Nexus** is an open-source, role-based creative ecosystem designed specifically for the next generation of filmmakers, screenwriters, and creative technocrats.

Our goal is to solve a fundamental problem in independent and student filmmaking: **Crew Discovery**. By building a highly stylized, cinematic digital platform, we provide a unified space where creatives can:
- Showcase their work in a professional **Portfolio**.
- Find collaborators based on precise **Creative Roles** (Director, DP, Editor, Sound Designer, etc.).
- Communicate securely via **Real-Time Chat** (requires verified email).
- Earn **Creator Credits** as reputation points for participating in the ecosystem.

**Live URL:** [takeone-nexus.net.in](https://takeone-nexus.net.in)

---

## 🏗️ Architecture Summary

TAKE ONE Nexus uses a robust **dual-server architecture**:
- **Next.js App Router (`src/app/`)**: Handles dynamic, authenticated pages (Profile, Chat, Admin, Auth flows).
- **Express.js API (`server.js`)**: Serves as a standalone backend API and hosts static, vanilla HTML/JS/CSS pages (`public/*.htm`).

Both services are deployed simultaneously on **Vercel** using `@vercel/node` for the Express backend and the standard Next.js builder.

---

## ⚙️ Business Logic & Systems

### 1. The Role System
Roles are the central identifier for users and projects.
- **Source of Truth**: `public/scripts/constants/roles.js`
- **Supported Roles**: Director, Cinematographer / DP, Writer, Editor, Sound Designer, Designer, Developer, Actor, Producer, Lighting Crew, Set Support, Other.
- This taxonomy drives user registration, crew directory filtering, and dynamic portfolio generation.

### 2. Portfolio & Work Showcase
Creators use their profile as a digital reel.
- **Dynamic Forms**: Based on a user's role, the portfolio upload system requests different metadata (e.g., a "Writer" uploads a script synopsis, a "Director" embeds a Vimeo link).
- **Public Visibility**: Unauthenticated users can view public profiles (`GET /api/users/public/:id`) to vet collaborators before initiating a chat.

### 3. Real-Time Chat System
Secure transmission for project collaboration — **requires verified email**.
- **Powered by Pusher**: WebSockets provide instant message delivery.
- **Role-Based Groups**: Production channels feature explicit roles (Director, Admin, Member) via a junction table schema.
- **Mission Assignment & RBAC**: Integrated Task Management allows `creator` or `admin` roles to assign "missions" to crew members. Only authorized users can create/edit tasks, while crew can only mark their assigned tasks as complete.
- **Cinematic UI**: Cursor-based pagination, intelligent date-grouping, and tabbed interface for Transmissions vs. Missions.

### 4. Creator Credits & Leaderboard
The heartbeat of the Nexus economy.
- **Earning**: Users earn credits for completing missions. Missions are assigned in chat, completed by the operative, and approved by a Director/Admin.
- **Credit Transaction Engine**: Every credit earned is recorded in an immutable `CreditTransaction` audit log, ensuring transparency and security.
- **Real-Time Leaderboard**: A dynamic Next.js page (`/leaderboard`) ranks the top 50 creators globally, updating instantly via Pusher events (`leaderboard-update`) whenever credits are granted.

### 5. Email Verification System *(v1.1)*
Full lifecycle email verification to secure platform access.
- **On Registration**: A verification email is sent automatically via Resend with a 24-hour expiry token.
- **Access Gate**: Unverified users cannot access `/chat`. A sticky `EmailVerificationBanner` prompts resend with a 60-second cooldown.
- **Token Security**: Tokens are 32-byte cryptographically random values stored as SHA-256 hashes. The raw token only travels in the email link — never in the database.
- **Pages**: `/verify-email` (handles all verification states), `/forgot-password`, `/reset-password` (with password strength meter).

### 6. IP-Based Rate Limiting & Security Headers *(v1.1)*
Comprehensive network and browser-level security defenses.
- **Next.js API routes**: Sliding-window rate limiters via `src/lib/rate-limiter.ts`.
- **Express routes**: Helmet middleware for security headers, and `middleware/rateLimiter.js` for IP-based limits (Login: 5/15min, Register: 3/hour).
- **Security Headers**: Strict Content Security Policy (CSP), X-Frame-Options (DENY), and nosniff enabled globally to prevent XSS, clickjacking, and MIME-sniffing.
- **Fail-open design**: Limiter errors never block legitimate users.

### 7. GDPR Cookie Consent *(v1.1)*
Production-grade consent management with granular controls.
- **Banner**: Slide-up animated `CookieConsentBanner` with Accept All / Reject / Customize options.
- **Categories**: Essential (always on), Analytics, Session Replay, Feature Flags.
- **Persistence**: Consent stored in `localStorage` under `ton_cookie_consent`. Custom `consentUpdated` DOM event triggers PostHog re-initialization without page reload.

### 8. Observability *(v1.1)*
Separated concerns between analytics and error monitoring.
- **PostHog** (`src/lib/posthog.ts`): Frontend analytics, session replay (with full input masking), and feature flags. Only activates after explicit cookie consent.
- **Sentry** (`src/lib/sentry.ts`): Backend API and server error capture only. Never used for analytics. Scrubs `password`, `token`, `secret`, `key` from all events before sending.

### 9. Futuristic Payment Engine *(v1.2 Proposed)*
A premium financial layer to power the independent film economy, integrating monetization seamlessly into our role-based mission architecture.
- **Creator Monetization**: Standardizes script pricing, option agreements, and digital custom writing packages directly from the portfolio showcase.
- **Premium Memberships & Tiers**: Handles recurring subscription packages to grant advanced filters, prominent badge layouts, and prioritized crew listings.
- **Production Escrows & Milestones**: Directors can fund a project budget securely. Payments are held in a secure escrow engine and programmatically released as crew members successfully complete their assigned tasks/missions.
- **Revenue Splitting**: Seamless split-payouts for script co-writers and multi-partner packages.

---

## 🔒 Security & Auth

- **Authentication**: JWT-based auth. Tokens are stored in secure, `HttpOnly` cookies to prevent XSS attacks.
- **Email Verification**: Required to access messaging features. Token hashing prevents token enumeration attacks. All auth endpoints return generic success messages to prevent email enumeration.
- **Authorization**: Role-based access control (RBAC). Admin, Developer, and Moderator roles have access to the Next.js `/admin` dashboard.
- **Rate Limiting**: All auth endpoints are rate-limited by IP using sliding-window counters. See § 6 above.
- **Issue Tracking**: A global `GlobalIssueReporter` allows any user to report bugs or malicious behavior securely to the admin panel.

---

## 🚀 Deployment & Scaling Plans

### Current Deployment (Vercel)
- Vercel's Edge network routes static assets and Next.js pages.
- `vercel.json` rewrite rules proxy `/api/*` to the Express Serverless Function.
- Database: **MySQL** hosted on TiDB Cloud, managed via Prisma ORM.
- Transactional Email: **Resend** via `takeone-nexus.net.in` custom domain.

### Scaling Roadmap
As the platform grows, we plan to decouple the monolithic architecture:
1. **Persistent Collaboration**: Transitioning from ephemeral chat to persistent project hubs with centralized asset management.
2. **CDN Optimization**: User uploaded media (avatars, posters) will be migrated to dedicated object storage (AWS S3/CloudFront).
3. **Public API**: Implementing `/api/v1/` for external integrations and the upcoming mobile app.
4. **Rate Limiting at Scale**: Both Express and Next.js limiters employ highly optimized sliding-window in-memory stores, eliminating backing database latency and infrastructure requirements.
5. **Secure Payment Gateway Infrastructure**: Deploying PCI-compliant gateway endpoints utilizing Stripe and Razorpay. This system will introduce idempotent transaction processing to avoid double charges, custom ledger audit trails in MySQL, and highly secure, signature-validated webhook controllers.

## Critical Fixes: Current Enforcement

- Script uploads are temporary drafts until Razorpay payment is verified server-side.
- No script enters public pages, `scripts`, moderation, or leaderboard counts unless `payment_verified = TRUE`.
- Admins and moderators can delete scripts through an audited backend flow.
- The admin task system supports creation, approval, rejection, manual Nexus Credits, activity logs, and leaderboard updates.

---

## 🤝 Join the Production

We are constantly improving. If you are participating in **GSSoC 2026**, this document is your foundation. Check out the [ARCHITECTURE.md](ARCHITECTURE.md) for deep technical details and [CONTRIBUTING.md](CONTRIBUTING.md) to start pushing code!
