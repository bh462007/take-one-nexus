# 🛡️ Security Policy

At TAKE ONE Nexus, the security of our filmmakers' intellectual property (scripts) and personal data is our highest priority. We take security vulnerabilities very seriously and appreciate the efforts of security researchers and our community in keeping our platform safe.

## 🟢 Supported Versions

We currently provide security updates and patches for the following versions of our platform:

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |
| v0.x.x  | :x:                |

*(Note: Since we operate as a live SaaS platform, users always interact with the latest production version).*

## 🛑 Reporting a Vulnerability

If you discover a security vulnerability, we kindly ask that you do **not** report it via public GitHub issues or public forums. Instead, please follow our responsible disclosure process:

1. **Email the core team** at: `alok.r25012@csds.rishihood.edu.in` or `aarushgupta289@gmail.com`.
2. **Include detailed information**: Provide a thorough description of the vulnerability, the environment where it was discovered, and steps to reproduce it. 
3. **Wait for confirmation**: We will acknowledge receipt of your vulnerability report within 48 hours.

We will work diligently to validate and fix the vulnerability. Once resolved, we will notify you and may publicly acknowledge your contribution (with your permission).

## 🔒 Security Best Practices

To maintain a secure ecosystem, we adhere to the following practices:
- **Authentication**: JWT tokens stored securely via HTTP-only, secure cookies. Migration to Clerk identity services is actively maintained.
- **Database**: Parameterized queries using Prisma and prepared SQL statements to prevent SQL Injection.
- **Data Privacy**: Passwords are cryptographically hashed using bcrypt. Sensitive user data is never exposed to the frontend.
- **XSS Prevention**: React/Next.js automatically sanitizes inputs, and we strictly validate HTML rendered on static routes.

Thank you for helping us keep TAKE ONE Nexus secure!
