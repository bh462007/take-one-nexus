# 🛡️ Security Policy

At TAKE ONE Nexus, the security of our filmmakers' intellectual property (scripts) and personal data is our highest priority. We take security vulnerabilities very seriously and appreciate the efforts of security researchers and our community in keeping our platform safe.

## 🟢 Supported Versions

We currently provide security updates and patches for the following versions of our platform:

| Version | Supported          |
| ------- | ------------------ |
| v2.0.x  | :white_check_mark: |
| v1.x.x  | :x:                |

*(Note: Since we operate as a live SaaS platform, users always interact with the latest production version).*

## 🛑 Reporting a Vulnerability

If you discover a security vulnerability, we kindly ask that you do **not** report it via public GitHub issues or public forums. Instead, please follow our responsible disclosure process:

1. **Email the maintainer** at: `aarushgupta289@gmail.com`.
2. **Include detailed information**: Provide a thorough description of the vulnerability, the environment where it was discovered, and steps to reproduce it.
3. **Wait for confirmation**: We will acknowledge receipt of your vulnerability report within 24 hours.

We will work diligently to validate and fix the vulnerability. Once resolved, we will notify you and may publicly acknowledge your contribution (with your permission).

## 🔒 Security Architecture & Best Practices

To maintain a secure ecosystem, we adhere to the following security architectures:

### 1. Cross-Site Request Forgery (CSRF) Protection
We implement a stateless **Double-Submit Cookie Pattern** globally on all state-changing API routes (POST, PUT, PATCH, DELETE).
- On every response, the server sets a JS-readable cookie `csrf_token` with `SameSite: strict` (and `Secure` in production).
- The client-side (Next.js/admin panel) reads this token from the cookie and must include it in the `X-CSRF-Token` request header.
- The server checks if the header matches the cookie in constant-time to block unauthorized cross-site requests.
- Razorpay Webhooks and GET/OPTIONS routes are exempt.

### 2. Authentication & Subdomain Session Sharing
- Session validation uses JSON Web Tokens (JWT) signed with a robust key (`JWT_SECRET`).
- Authentication cookies are configured with `httpOnly: true`, `secure: true` (in production), and `sameSite` set conditionally (`None` in production for cross-subdomain sharing; `Lax` in development for localhost support).
- **Subdomain Sharing**: In production, the session cookie is configured with `domain: '.takeone-nexus.net.in'`. This allows a user logged in on the apex domain to access elevated panels on the admin subdomain (`admin.takeone-nexus.net.in`) seamlessly without re-authenticating. Locally, the domain attribute is omitted to support port-based testing on localhost.
- `secondary_role` permissions (such as `admin` and `moderator`) are packed directly into the JWT payload during login, resolving route redirect loops.

### 3. Granular Rate Limiting
Endpoint-specific rate limiters are applied on both the Next.js API router and Express middleware:
**Persistence**: Rate limit counters are stored in an in-memory sliding-window store, ensuring lightweight execution with no external infrastructure dependencies.
- **Authentication**: Login requests are limited to 5 requests per 15 minutes. Registration is limited to 3 attempts per hour.
- **Payments**: Order creation, verification, and cancellations are strictly restricted to 10 requests per 15 minutes to prevent order-flooding and brute-forcing.
- **Portfolios**: Portfolio script uploads bypass the moderation queue but are limited to 20 uploads per hour.
- **Issues/Telemetry**: Issue reporting and feedback ingestion are limited to 20 requests per 15 minutes.
- **Task Management**: Task creation is rate limited to 30 requests per 15 minutes.

### 4. Input Sanitization & Parameterization
- **XSS Prevention**: All requests pass through a global middleware that automatically cleans and sanitizes `req.body`, `req.query`, and `req.params` against malicious HTML injection using the `xss` utility.
- **SQL Injection**: Parameterized SQL queries with placeholder `?` inputs are strictly enforced across the entire backend. All interactions with the database are fully structured, eliminating dynamic string interpolation.
- **Object Schema Validation**: Critical routes use `express-validator` schema chains to validate payloads before entering controller logic, returning a validation response.

### 5. Multi-Platform Ingestion Security
- Telemetry, logging, and bug reporting modals run validation schemas to prevent abuse.
- Administrative triage and moderation updates are restricted to verified accounts possessing the `Admin`, `Developer`, or elevated `secondary_role` privileges via `requireRole` check.

---

## 🌐 Community & Collaboration Programs

TAKE ONE Nexus is developed as a source-available filmmaking collaboration platform and participates in community-driven development initiatives including NSoC'26.

Contributors are encouraged to explore issues, submit pull requests, improve documentation, and help build tools for filmmakers and creative teams under the project's source-available license.

