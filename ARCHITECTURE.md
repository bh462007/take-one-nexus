# Technical Architecture 🏗️

TAKE ONE Nexus is built as a high-performance, cinematic creative ecosystem. It employs a **Hybrid Architecture** that bridges modern dynamic React interfaces with robust, scalable legacy backend services.

---

## 🛰️ System Overview

The system is composed of three primary layers:

### 1. Dynamic Frontend (Next.js 14+)
- **Location**: `src/app/`
- **Core Role**: Handles authenticated user experiences, real-time dashboards, and cinematic profiles.
- **Key Technologies**: React Server Components, Client Components, Framer Motion (for animations).
- **Communication**: Communicates with the Backend layer via standard REST APIs.

### 2. API & Legacy Layer (Express.js)
- **Location**: `server.js` and `routes/`
- **Core Role**: Manages business logic, database orchestration, and authentication.
- **Key Technologies**: Node.js, Express, JWT, Pusher.
- **Static Pages**: Serves high-speed static HTML files located in `public/` (e.g., `crew.htm`).

### 3. Data Infrastructure (Prisma & MySQL)
- **Location**: `prisma/`
- **Core Role**: Persistent storage and schema management.
- **Database**: MySQL (optimized for TiDB Cloud).
- **Audit Logs**: Includes a `CreditTransaction` system for immutable tracking of user rewards.

---

## 🔄 Data Flow

### Authentication Flow
1. User logs in via `/api/users/login`.
2. Express server validates credentials and issues a **JWT**.
3. JWT is stored in a **Secure, HTTP-Only Cookie**.
4. Both Next.js and the Express backend can verify this cookie for subsequent requests.

### Real-Time Synchronization (Pusher)
The platform uses **Pusher** for event-driven updates:
- `conversation-{id}`: New messages, typing indicators, and task updates.
- `user-{id}`: Credit notifications and private system alerts.
- `global-leaderboard`: Real-time ranking updates.

---

## 🛠 Project Structure

```text
/
├── prisma/             # Database Models & Migrations
├── routes/             # Backend API Domain Logic
│   ├── users.js        # Auth & Profile Management
│   ├── chat.js         # Conversation & Message Logic
│   └── tasks.js        # Mission Control & Reward System
├── src/
│   ├── app/            # Next.js Pages (Leaderboard, Chat, Profile)
│   ├── components/     # Shared React Components
│   └── lib/            # Shared Utilities (Auth, Database, Avatars)
├── public/             # Static Assets & Vanilla JS
├── middleware/         # Auth Guard & Security Layers
├── server.js           # Hybrid Server Entry Point
└── vercel.json         # Routing & Deployment Configuration
```

---

## 💎 Reward System Design

The **Nexus Credits** system is architected for transparency and security:
- **Task Creation**: Mission assigners specify `reward_credits`.
- **Task Completion**: Assignees mark tasks as `Done`.
- **Approval Flow**: Directors/Admins must approve the task.
- **Transaction**: Upon approval, a database transaction:
  1. Updates user credit balance.
  2. Creates a `CreditTransaction` record.
  3. Triggers a Pusher `credit-update` event.

---

## 🔒 Security Posture

- **Session**: JWT with expiration and rotation.
- **Data**: Input sanitization via Express middleware.
- **ORMs**: Prisma prevents SQL injection.
- **API**: Role-based access control (RBAC) enforced on sensitive routes (e.g., `POST /approve`).

---

Designed for Scalability. Built for the Future of Film.
