# PROJECT CONTEXT — TAKE ONE Nexus

> A cinematic film crew collaboration platform. Connects student filmmakers across campuses to share scripts, find crew, and build productions.

---

## 🎯 Product Vision

**TAKE ONE Nexus** is an open-source, role-based creative ecosystem designed specifically for the next generation of filmmakers, screenwriters, and creative technocrats. 

Our goal is to solve a fundamental problem in independent and student filmmaking: **Crew Discovery**. By building a highly stylized, cinematic digital platform, we provide a unified space where creatives can:
- Showcase their work in a professional **Portfolio**.
- Find collaborators based on precise **Creative Roles** (Director, DP, Editor, Sound Designer, etc.).
- Communicate securely via **Real-Time Chat**.
- Earn **Creator Credits** as reputation points for participating in the ecosystem.

**Live URL:** [take-one-nexus.vercel.app](https://take-one-nexus.vercel.app)

---

## 🏗️ Architecture Summary

TAKE ONE Nexus uses a robust **dual-server architecture**:
- **Next.js App Router (`src/app/`)**: Handles dynamic, authenticated pages (Profile, Chat, Admin).
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
Secure transmission for project collaboration.
- **Powered by Pusher**: WebSockets provide instant message delivery.
- **Role-Based Groups**: Production channels feature explicit roles (Director, Admin, Member) via a junction table schema.
- **Mission Assignment**: Integrated Task Management allows Directors to assign "missions" to crew members with real-time status tracking.
- **Cinematic UI**: Cursor-based pagination, intelligent date-grouping, and tabbed interface for Transmissions vs. Missions.

### 4. Creator Credits & Leaderboard
The heartbeat of the Nexus economy.
- **Earning**: Users earn credits for completing missions. Missions are assigned in chat, completed by the operative, and approved by a Director/Admin.
- **Credit Transaction Engine**: Every credit earned is recorded in an immutable `CreditTransaction` audit log, ensuring transparency and security.
- **Real-Time Leaderboard**: A dynamic Next.js page (`/leaderboard`) ranks the top 50 creators globally, updating instantly via Pusher events (`leaderboard-update`) whenever credits are granted.

---

## 🔒 Security & Roles

- **Authentication**: JWT-based auth. Tokens are stored in secure, `HttpOnly` cookies to prevent XSS attacks.
- **Authorization**: Role-based access control (RBAC). Admin, Developer, and Moderator roles have access to the Next.js `/admin` dashboard.
- **Issue Tracking**: A global `GlobalIssueReporter` allows any user to report bugs or malicious behavior securely to the admin panel.

---

## 🚀 Deployment & Scaling Plans

### Current Deployment (Vercel)
- Vercel's Edge network routes static assets and Next.js pages.
- `vercel.json` rewrite rules proxy `/api/*` to the Express Serverless Function.
- Database: **MySQL** hosted on TiDB Cloud, managed via Prisma ORM.

### Scaling Roadmap
As the platform grows, we plan to decouple the monolithic architecture:
1. **Persistent Collaboration**: Transitioning from ephemeral chat to persistent project hubs with centralized asset management.
2. **CDN Optimization**: User uploaded media (avatars, posters) will be migrated to dedicated object storage (AWS S3/CloudFront).
3. **Public API**: Implementing `/api/v1/` for external integrations and the upcoming mobile app.

---

## 🤝 Join the Production

We are constantly improving. If you are participating in **SSOC** or **GSSoC**, this document is your foundation. Check out the [ARCHITECTURE.md](ARCHITECTURE.md) for deep technical details and [CONTRIBUTING.md](CONTRIBUTING.md) to start pushing code!
