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
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
    <img alt="Production Ready" src="https://img.shields.io/badge/PRODUCTION_READY-FF4D1A?style=flat&logo=vercel" />
  </p>

  <p>
    <img alt="SSOC" src="https://img.shields.io/badge/SSOC-2026-blueviolet" />
    <img alt="GSSoC" src="https://img.shields.io/badge/GSSoC-2026-orange" />
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
- **💎 Creator Credits:** The heartbeat of the Nexus economy. Earn credits for collaborations and active participation.
- **🛡️ Developer & Platform Security:** Integrated global bug reporting, role-based admin dashboard, and robust session security.
- **📊 Live Production Telemetry:** Admin dashboards reporting real-time, IST-synced metrics of user onboarding, scripting activity, and platform usage.

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
| **Authentication** | JWT stored in secure HTTP-only cookies (Clerk integration ready) |
| **Deployment** | Vercel (Hybrid Serverless & Static) |

---

## 🏗️ Architecture Overview

TAKE ONE Nexus utilizes a **dual-server architecture** running side-by-side on Vercel:
- **Next.js App (`src/app/`):** Handles dynamic authenticated routes (e.g., `/profile`, `/chat`, `/admin`).
- **Express Server (`server.js`):** Acts as the API layer (`/api/*`) and serves high-performance static HTML files (`public/*.htm`).

> For a deep dive into the system design, read the [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📁 Folder Structure

```text
take-one-nexus/
├── .github/            # GitHub templates and workflows
├── config/             # Server configuration (DB, mailer)
├── middleware/         # Express middleware (Auth, Error handling)
├── prisma/             # Database schema and migrations
├── public/             # Static Assets, CSS, Vanilla JS, and .htm pages
├── routes/             # Express API routes grouped by domain
├── src/                # Next.js Application (React components, App Router)
├── utils/              # Shared backend utilities
├── server.js           # Hybrid Express Server entry point
└── vercel.json         # Production Deployment Configuration
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- **Node.js**: v18+
- **Database**: MySQL / TiDB instance
- **Pusher**: Account for real-time WebSockets
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

# Local Development API Proxy
LEGACY_API_ORIGIN="http://127.0.0.1:5001"
```

### 4. Database Setup

Initialize your database schema using Prisma:

```bash
npx prisma generate
npx prisma db push
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

## 🤝 Open Source Contribution Guide

We actively welcome contributions from the community, especially participants of **SSOC** and **GSSoC**!

### Contributor Workflow

1. **Fork** the repository and clone it locally.
2. **Create a branch** for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3. **Commit** your changes following our [Commit Conventions](CONTRIBUTING.md).
4. **Push** to your fork and open a **Pull Request**.

> Please read our full [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on coding standards, testing, and UI consistency.
> 
> Check out [CODING_RULES.md](CODING_RULES.md) for our engineering standards.

---

## 🗺️ Roadmap

We have ambitious plans for the future of TAKE ONE Nexus. See our detailed [ROADMAP.md](ROADMAP.md) for upcoming phases, including:
- AI Crew Matching Engine
- Realtime Production Storyboards
- Native Mobile App Development

---

## 🐛 Known Issues

- Chat FAB occasionally overlaps UI on certain admin pages.
- Client-side file type validation for avatar uploads needs hardening.
- See the [Issue Tracker](https://github.com/alokr25012-lab/take-one-nexus/issues) for an up-to-date list.

If you find a bug, please report it using the in-app Global Issue Reporter or via our GitHub Issues.

---

## 🛡️ Security & Conduct

- Please read our [SECURITY.md](SECURITY.md) for responsible disclosure policies and supported versions.
- This project enforces a strict [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code to foster an inclusive environment.

---

## 👥 Maintainers & Credits

Production of **ALOK R** & the **TAKE ONE** Team.
A special thanks to all open-source contributors and the SSOC/GSSoC communities.

---

## 💬 Community

Join our community to discuss features, get help, or showcase your creative work!
*(Add Discord / Community links here)*

<div align="center">
  <p>Designed for the Cinematic Future. All Rights Reserved.</p>
</div>
