<div align="center">
  <img src="https://via.placeholder.com/1000x300/0a0a0a/ffffff?text=TAKE+ONE+NEXUS" alt="TAKE ONE Nexus Banner" />

  <h1>🎬 TAKE ONE NEXUS</h1>

  <p><strong>A cinematic collaborative ecosystem bridging the gap between raw scripts and full-scale production crews.</strong></p>

  <p>
    <a href="https://take-one-nexus.vercel.app"><b>Explore the Live Platform</b></a> •
    <a href="#-getting-started"><b>Getting Started</b></a> •
    <a href="CONTRIBUTING.md"><b>Contribute</b></a>
  </p>

  <p>
    <img alt="Version" src="https://img.shields.io/badge/version-2.0.0-blue.svg?cacheSeconds=2592000" />
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    <img alt="Production Ready" src="https://img.shields.io/badge/PRODUCTION_READY-FF4D1A?style=flat&logo=vercel" />
  </p>
</div>

---

## 📽️ The Vision

> **Nexus [nɛksəs]:** A connection or series of connections linking two or more things.

TAKE ONE Nexus is the definitive digital ecosystem for the next generation of filmmakers, screenwriters, and creative technocrats. 

**The Problem**: Student filmmakers and independent creatives often struggle to find dedicated, skilled crew members for their passion projects. Traditional networking is fragmented.

**The Solution**: A platform designed with a cinematic "Director-style" aesthetic that acts as a secure, real-time hub for showcasing portfolios, discovering talent based on creative roles, and forming production crews. 

---

## ⚡ Core Features

- **🎭 Cinematic Production Profiles:** Live creator profiles serving as a digital reel, complete with skill badges, production history, and portfolio showcase.
- **🛰️ Secure Transmission (Chat):** Real-time communication suite powered by Pusher. Direct messaging, group chats, live sync, and intelligent unread tracking.
- **🏆 Live Leaderboard:** Real-time community ranking system powered by our internal Credits engine to reward platform engagement.
- **💎 Creator Credits & Task System:** Secure, role-based task management where only verified creators can assign and complete production tasks.
- **🛡️ Production-Grade Security:** Custom stateless double-submit CSRF validation, subdomain cookie sharing, global and per-route rate limiting, CSP/security headers, HTML sanitization, and parameterized SQL queries.
- **📊 Observability & Analytics:** Integrated PostHog telemetry (GDPR compliant) and Sentry error tracking for robust production monitoring.
- **✉️ Cinematic Automation:** Resend-powered transactional email system for seamless, cinematic user onboarding and verification.
- **💳 Payment Integration:** Secure backend-verified Razorpay payment flow guarding public script listings.

---

## 📸 Screenshots

| Dashboard / Feed | Cinematic Profile |
| :---: | :---: |
| <img src="https://via.placeholder.com/500x300/111/eee?text=Project+Feed" alt="Feed" /> | <img src="https://via.placeholder.com/500x300/111/eee?text=Cinematic+Profile" alt="Profile" /> |

| Real-Time Chat | Leaderboard |
| :---: | :---: |
| <img src="https://via.placeholder.com/500x300/111/eee?text=Real-Time+Chat" alt="Chat" /> | <img src="https://via.placeholder.com/500x300/111/eee?text=Global+Leaderboard" alt="Leaderboard" /> |

*(Note: Replace placeholders with actual product screenshots prior to launch)*

---

## 🛠️ Tech Stack

This project is built using a modern, scalable hybrid architecture.

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Vanilla HTML/CSS (Static UI), React |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (optimized for TiDB Cloud) |
| **ORM** | Prisma |
| **Real-time** | Pusher |
| **Authentication** | JWT stored in secure HTTP-only cookies |
| **Mailing** | Resend API |
| **Observability** | PostHog (Analytics), Sentry (Error Tracking) |
| **Deployment** | Vercel (Hybrid Serverless & Static) |

---

## 🏗️ Architecture Overview

TAKE ONE Nexus utilizes a **dual-server architecture** running side-by-side on Vercel:
- **Next.js App (`src/app/`):** Handles dynamic authenticated routes (e.g., `/profile`, `/chat`, `/admin`), PostHog analytics, and Sentry monitoring.
- **Express Server (`server.js`):** Acts as the API layer (`/api/*`), processes complex SQL queries securely, handles rate limiting, and serves high-performance static HTML files (`public/*.htm`).

### Subdomain Strategy
The Administrative Moderation Console is decoupled and hosted on the `admin` subdomain:
- **Main App**: `takeone-nexus.net.in` (Apex)
- **Admin Portal**: `admin.takeone-nexus.net.in` (Subdomain)
- **Shared Session**: Auth cookies share a common apex domain configuration: `domain: '.takeone-nexus.net.in'`. Users with the appropriate `secondary_role` permissions (e.g. `Admin`, `Developer`) can navigate to the admin console without re-authenticating.

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- **Node.js**: v18+
- **Database**: MySQL / TiDB instance
- **Pusher**: Account for real-time WebSockets
- **Resend**: API key for transactional emails
- **PostHog**: API key for local analytics tracking (optional)
- **Sentry**: DSN for error monitoring (optional)
- **Git**: For version control

### 1. Clone the repository

```bash
git clone https://github.com/alokr25012-lab/take-one-nexus.git
cd take-one-nexus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Create a `.env` file in the root directory based on `.env.example`:

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# Authentication
JWT_SECRET="your_secure_secret_min_32_chars"

# Real-time Chat (Pusher)
PUSHER_APP_ID="your_app_id"
PUSHER_SECRET="your_secret"
NEXT_PUBLIC_PUSHER_KEY="your_key"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"

# Email Automation (Resend)
RESEND_API_KEY="re_your_key"

# Observability (PostHog & Sentry)
NEXT_PUBLIC_POSTHOG_KEY="phc_your_key"
NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"
NEXT_PUBLIC_SENTRY_DSN="https://your_dsn@sentry.io/project"

# Local Development API Proxy
LEGACY_API_ORIGIN="http://127.0.0.1:5001"
```

### 4. Database Setup

Initialize your database schema using Prisma:

```bash
npx prisma generate
npx prisma db push
```

Alternatively, you can initialize and seed the raw database tables and test accounts (password for all: `password123`) using our dedicated scripts:

```bash
# Create database schema tables
npm run db:init

# Seed the database with creative profiles and sample scripts
npm run db:seed
```

### 5. Start Local Development

Because of the hybrid architecture, run the Next.js dev server (which proxies API requests to Express):

```bash
npm run dev
```

In a separate terminal, run the Express backend:

```bash
npm run legacy:dev
```

The platform should now be running at `http://localhost:3000`.

---

## 🚢 Production Deployment

TAKE ONE Nexus is optimized for deployment on **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Configure the environment variables in the Vercel Dashboard.
3. Vercel will use the `vercel.json` file to handle complex routing between Next.js and the Express backend automatically.
4. The build command is pre-configured to `npm run build` which runs `prisma generate && next build`.

---

## 🌐 Open Source Programs

TAKE ONE Nexus is actively developed as an open-source filmmaking collaboration platform and participates in community-driven open-source initiatives including NSoC'26.

Contributors are encouraged to explore issues, submit pull requests, improve documentation, and help build tools for filmmakers and creative teams.

---

## 👥 Maintainers & Credits

Maintainership and Production of **Aarush Gupta** and **Alok Rawat**.
All Rights Reserved.

