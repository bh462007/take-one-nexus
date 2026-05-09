# 🎬 TAKE ONE NEXUS

> **Nexus [nɛksəs]:** A connection or series of connections linking two or more things.

![TAKE ONE Nexus](https://img.shields.io/badge/PRODUCTION-READY-FF4D1A?style=for-the-badge&logo=vercel)
![Tech Stack](https://img.shields.io/badge/STACK-NEXT.JS%20|%20EXPRESS%20|%20PRISMA-00D4FF?style=for-the-badge)

TAKE ONE Nexus is the definitive collaborative platform for the next generation of filmmakers, screenwriters, and creative technocrats. Built with a cinematic "Director-style" aesthetic, it bridges the gap between raw scripts and full-scale production crews.

---

## ⚡ CORE SYSTEMS

### 🛰️ Secure Transmission (Chat)
A fully integrated, real-time communication suite powered by Pusher.
- **Direct Messaging:** Secure channels for collaboration requests.
- **Group Chats:** Create multi-user channels for production crews and teams.
- **Live Sync:** Real-time message delivery with cinematic animations.
- **Intelligent Unread:** Accurate unread message tracking and global notifications.

### 🛡️ Developer & Platform Security
Robust systems for maintaining platform integrity.
- **Issue Reporting:** Integrated global bug reporting modal with screenshot support.
- **Developer Dashboard:** Secure, role-based dashboard for managing platform issues.
- **Intelligent Formatting:** Automated display name normalization (Title Case) across all APIs.

### 💎 Creator Credits
The heartbeat of the Nexus economy.
- **System Integrity:** Every new creator starts with 0 credits.
- **Visual Identity:** Cinematic glowing credit badges on every profile.
- **Scaling:** Designed for future integration with project rewards and premium features.

### 🎭 Production Profiles
Dynamic, live creator profiles that serve as a digital reel.
- **Smart Onboarding:** College and City autocomplete logic during registration.
- **Skill Badges:** Highlight your technical expertise.
- **Production History:** Showcase your uploaded scripts and collaborations.
- **Live Status:** Real-time activity indicators.

---

## 🛠️ TECH STACK

- **Frontend:** Next.js 14 (App Router), Vanilla CSS (Cinematic Theme)
- **Backend:** Node.js, Express.js
- **Database:** MySQL / TiDB
- **ORM:** Prisma
- **Real-time:** Pusher
- **Authentication:** JWT (JSON Web Tokens) with secure cookie handling

---

## 🚀 LOCAL DEVELOPMENT

### Prerequisites
- Node.js 18+
- MySQL / TiDB Database
- Pusher Account (for Chat)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alokr25012-lab/take-one-nexus.git
   cd take-one-nexus
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="mysql://user:password@host:port/database"
   JWT_SECRET="your_secure_secret"
   
   # Pusher Configuration
   PUSHER_APP_ID="your_app_id"
   PUSHER_SECRET="your_secret"
   NEXT_PUBLIC_PUSHER_KEY="your_key"
   NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"
   ```

4. **Database Initialization**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 📁 FOLDER STRUCTURE

```text
├── src/app/          # Next.js App Router (Frontend)
├── routes/           # Express API Routes (Backend)
├── prisma/           # Database Schema & Migrations
├── public/           # Static Assets & Legacy HTML
├── server.js         # Hybrid Express/Next.js Server
└── vercel.json       # Production Deployment Config
```

---

## 🚢 DEPLOYMENT

TAKE ONE Nexus is optimized for **Vercel**.
1. Connect your repository to Vercel.
2. Configure environment variables in the Vercel Dashboard.
3. The `vercel.json` file handles the complex routing between Next.js and the Express backend automatically.

---

## 📜 LICENSE

Production of **ALOK R** & the **TAKE ONE** Team. All Rights Reserved.
Designed for the Cinematic Future.
