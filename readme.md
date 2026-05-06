# 🎬 TAKE ONE Nexus
### **The Digital Soundstage for Cinematic Collaboration.**

[![Production](https://img.shields.io/badge/Production-Live-00E676?style=for-the-badge&logo=vercel)](https://take-one-nexus.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F5F5F5?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Status: Stable](https://img.shields.io/badge/Status-Stable-0070f3?style=for-the-badge)](https://github.com/alokr25012-lab/take-one-nexus)
[![Stack: Express-Vanilla](https://img.shields.io/badge/Stack-Express--Vanilla-FF4D1A?style=for-the-badge)](https://expressjs.com/)
[![Responsive: Optimized](https://img.shields.io/badge/Responsive-Optimized-BD00FF?style=for-the-badge)](#features)

---

## 📽️ Hero Description

**TAKE ONE Nexus** is a high-performance collaboration ecosystem designed for the modern independent filmmaker. It bridges the gap between scriptwriters and technical film crews, providing a "Modular Monolith" platform where ideas become productions.

### 🧩 The Problem
Traditional networking for film crews is fragmented across social media groups and private lists. Finding a Cinematographer for a specific genre or a Writer for a unique vision is often slow and inefficient.

### ⚡ The Solution
Nexus provides a centralized, cinematic hub where:
- **Directors** can post calls and build their dream teams.
- **Writers** can showcase scripts to a curated audience of creators.
- **Crews** (DPs, Sound, Editors) can find projects that match their specific craft and location.

---

## 🚀 Live Demo

Experience the cinematic interface live:
👉 **[Launch TAKE ONE Nexus](https://take-one-nexus.vercel.app/)**

> [!TIP]
> Visit the `/api/health` endpoint to verify the system status and database connectivity in real-time.

---

## ✨ Features

- 🎭 **Role-Based Workspaces**: Tailored interfaces for Directors, Writers, Actors, and Technical Crew.
- 📜 **Script Showcase**: Live script cards with genre filtering and "Director's Vision" previews.
- 🤝 **Collaboration Engine**: Seamless request-to-join flow with real-time status tracking.
- 🛠️ **Admin Control Room**: Secure dashboard for user management, real-time stats, and manual creator onboarding.
- 🌑 **Cinematic UI**: A premium dark-mode aesthetic designed for visual storytellers.
- ⚡ **Lightweight Performance**: Hybrid Express/Next.js architecture for instant interactions.
- 🔒 **Secure Auth**: JWT-based session sharing between legacy and modern app layers.
- 📱 **Fully Responsive**: Optimized for scouting and networking on any device.
- 🔒 **Secure Auth**: JWT-based authentication with robust password hashing.
- 🔔 **Notification System**: Built-in email and platform notifications for collaboration requests.

---

## 🛠️ Tech Stack

### **Frontend**
- **Vanilla HTML5/CSS3**: Custom-engineered design system with CSS variables and glassmorphism.
- **ES6+ JavaScript**: Native browser modules and asynchronous API handlers.
- **High-Fidelity Animations**: Native CSS transitions and keyframe orchestrations.

### **Backend**
- **Node.js & Express.js**: Modular API architecture with robust middleware routing.
- **JWT (JSON Web Token)**: Stateless authentication for secure session management.
- **Bcrypt.js**: Industry-standard salt-and-hash security for user data.

### **Infrastructure**
- **MySQL (v8.0+)**: Relational database with advanced connection pooling.
- **Vercel**: Serverless deployment with edge routing and environment security.
- **Nodemailer**: SMTP-driven email notification engine.

---

## 📂 Project Structure

```text
take-one-nexus/
├── config/             # System configurations (DB, Mailer)
├── database/           # SQL schemas and migration scripts
├── docs/               # Technical and deployment documentation
├── middleware/         # Auth and Moderation logic
├── public/             # Static assets and uploads
├── routes/             # API endpoint handlers (Modular)
├── utils/              # Helper functions and shared logic
├── server.js           # Main Express entry point
├── vercel.json         # Deployment configuration
├── *.htm / *.css       # Cinematic frontend pages
└── README.md           # This document
```

---

## ⚙️ Installation Guide

Follow these steps to set up the Nexus locally:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/alokr25012-lab/take-one-nexus.git
   cd take-one-nexus
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

46. **Set up the Database**: 
   - Initialize your MySQL/TiDB database.
   - Set up the environment variables:
     ```env
     PORT=3000
     DB_HOST=your_host
     DB_USER=your_user
     DB_PASSWORD=your_password
     DB_NAME=take_one
     JWT_SECRET=your_secret
     DATABASE_URL="mysql://USER:PASS@HOST:PORT/DB" # For Prisma Admin Panel
     ```
7. **Run the Application**:
   ```bash
   npm run dev
   ```
   *This starts both the Express backend and the Next.js Admin interface.*

## Admin Access
Access the control room at `/admin`. Authorization is restricted to specific emails (defined in `src/middleware.ts`) and users with the `admin` role.


---

## 🔐 Environment Variables

Ensure the following variables are configured in your `.env` or Vercel dashboard:

| Variable | Description |
| :--- | :--- |
| `DB_HOST` | Database host (e.g., localhost or cloud provider) |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Name of the schema (`take_one`) |
| `JWT_SECRET` | Secret key for authentication (32+ characters) |
| `SMTP_HOST` | SMTP server for email notifications |
| `SMTP_USER` | Email sender account |
| `SMTP_PASS` | SMTP application password |

---

## 📈 Performance + Optimization

- **Hydration-Free**: By avoiding heavy JS frameworks, the TBT (Total Blocking Time) is reduced to near zero.
- **Native Routing**: Vercel-optimized routing ensures sub-millisecond response times for static assets.
- **Optimized SQL**: Advanced connection pooling prevents "bottlenecking" during high-traffic intervals.
- **Asset Efficiency**: Lightweight CSS-driven effects replace heavy image assets wherever possible.

---

## ☁️ Deployment Guide

### **Deploying to Vercel**

1. Connect your GitHub repository to Vercel.
2. Add the **Environment Variables** listed above in the Vercel Project Settings.
3. Use the following build settings:
   - **Framework Preset**: `Other` (Express/Node.js)
   - **Install Command**: `npm install`
   - **Build Command**: (Leave blank)
   - **Output Directory**: (Leave blank)

---

## 🤝 Contributing

We welcome collaborators who want to build the future of film!

1. **Fork** the project.
2. Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

## 🗺️ Roadmap

- [ ] **Nexus Chat**: Real-time messaging between crew members.
- [ ] **AI Crew Match**: Smart suggestions based on project genre and skillsets.
- [ ] **Portfolio Hosting**: Integrated hosting for video reels and scripts.
- [ ] **Mobile App**: Native iOS/Android experience for on-set coordination.
- [ ] **Verified Creator Badges**: Trust system for industry professionals.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Authors

**Alok Rawat**
- GitHub: [@alokr25012-lab](https://github.com/alokr25012-lab)

**Aarush Gupta**
- GitHub: [@Aarush2112](https://github.com/Aarush2112)

---
<p align="center">Built for creators, by creators. 🎬</p>
