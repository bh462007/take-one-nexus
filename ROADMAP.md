# 🗺️ Feature Roadmap

Welcome to the TAKE ONE Nexus Roadmap! This document outlines our strategic vision for the future of the platform. We are building a cinematic ecosystem, and these features represent the next leap in connecting filmmakers, crew members, and screenwriters.

---

## 🟢 Phase 1: Foundation (Completed)
- [x] Basic user registration and profile creation
- [x] Script uploading and showcase repository
- [x] Direct peer-to-peer chat system
- [x] Real-time global issue reporting
- [x] Core cinematic UI framework and design language

## 🟡 Phase 2: Production Hardening & Economy (Current)
- [x] **Credits Economy System**: Users earn credits for uploading scripts and engaging with the community.
- [x] **Global Leaderboard**: Ranking users based on activity and peer reviews.
- [x] **Real-time Synchronization**: Pusher implementation for live chat, task updates, and notifications.
- [x] **Admin Telemetry Dashboard**: Complete command center for tracking platform metrics.
- [x] **Production Security Suite**: Strict CSP headers, rate limiting, and RBAC to achieve A-grade security.
- [x] **Observability**: PostHog telemetry and Sentry error tracking integrated.
- [x] **Cinematic Automation**: Resend integration for transactional emails.
- [x] **Verified Account Badge**: Neon ✦ badge displayed across Leaderboard, Profile, and Crew Finder for creators with `email_verified = true`.
- [x] **Script Moderation Pipeline**: Admin-only `PATCH /api/scripts/:id/moderate` endpoint with approval status tracking, automated rejection emails, and Pusher real-time events.
- [x] **Issue Admin Controls**: Issues now support `priority`, `assigned_admin`, and `resolved_at` for full triage lifecycle management.
- [x] **Scripts Review Platform** (`scripts-platform/`): Standalone Next.js admin dashboard at `scripts.takeone-nexus.net.in` with JWT-isolated auth, script queue, PDF review, and issue management.

## 🔵 Phase 3: The AI Production Board (Upcoming)
- [ ] **AI-Powered Crew Matching**: Algorithmic suggestions connecting directors with the ideal cinematographers, editors, and sound engineers based on past projects and skills.
- [ ] **Interactive Storyboards**: Built-in collaborative storyboarding tools where multiple users can sketch and annotate frames in real time.
- [ ] **Call Sheet Generator**: Automated dynamic call sheets synced with users' registered email addresses.
- [ ] **Advanced Portfolio Analytics**: Creators can see exactly who viewed their scripts and profiles.

## 🟣 Phase 4: Expansion & Ecosystem
- [ ] **Native Mobile App**: Porting the Next.js/React architecture to React Native for iOS and Android.
- [ ] **Freelance Escrow Integration**: Safe, integrated payment gateways for freelance crew members.
- [ ] **Film Festival Integration**: Direct submission API links to global film festivals.
- [ ] **Hardware Synchronization**: Integrating with digital clapperboards and on-set devices.

## 🪙 Phase 5: Introducing Payment System (Futuristic Monetization & Escrow)
- [ ] **Creator Monetization**: Empower screenwriters and filmmakers to list, option, and license scripts, or offer specialized freelance custom writing packages.
- [ ] **Premium Memberships & Subscriptions**: Tiered membership levels unlocking unlimited real-time chat transmissions, premium profile tags, and higher directory sorting weights.
- [ ] **Secure Escrow Payments**: Safe, automated holding systems for production budgets, allowing directors to fund projects and release payments to crew operatives upon verification.
- [ ] **Automated Revenue Sharing**: Real-time transaction splitting for co-authored screenplays or co-produced collaborative film packages.
- [ ] **Paid Collaboration Contracts**: Digital agreements and signature tools integrated into the task engine for contractually protected creative gigs.
- [ ] **Payment Gateway Integrations**: Seamless, production-ready integration with Stripe and Razorpay using highly resilient, idempotent webhook processing pipelines.

---

*Note: This roadmap is a living document. Features are subject to change based on community feedback and open-source contributions. Have an idea? Open an issue on GitHub!*
