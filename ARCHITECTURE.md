# 🏛️ TAKE ONE Nexus Architecture

TAKE ONE Nexus uses a highly optimized, hybrid architecture designed to balance SEO, rapid client-side interactivity, and robust real-time communication. This document outlines the core components of our system.

---

## 1. The Dual-Server Model

Due to the transition from a purely static/Express application to a modern Next.js ecosystem, the platform currently employs a **Dual-Server Model** hosted on Vercel:

### A. Next.js App Router (`src/app`)
- **Purpose**: Handles modern, highly interactive UI components (Admin Dashboards, Chat interfaces, dynamic profiles).
- **Execution**: Server-Side Rendering (SSR) and Client Components.
- **Routing**: `/*` (except specific API and legacy routes).

### B. Legacy Express Server (`server.js`)
- **Purpose**: Acts as the core REST API for data mutations and serves legacy static `.htm` pages (`/public`).
- **Execution**: Runs as a Serverless Function on Vercel (`api/index.js` or via `vercel.json` rewrites).
- **Routing**: `/api/*` handles data logic.

> **Routing Magic**: Vercel's `vercel.json` rewrite rules automatically map incoming `/api/*` requests to the Express serverless function, while allowing Next.js to handle the rest of the application seamlessly.

---

## 2. Database & ORM Layer

### TiDB Cloud (MySQL Compatible)
We use TiDB Cloud, a distributed SQL database, to ensure horizontal scalability. 

### Prisma ORM (`/prisma/schema.prisma`)
Prisma serves as the single source of truth for the database schema.
- **Connection Pooling**: Due to the serverless nature of our Express and Next.js APIs, Prisma is instantiated globally (`global.prisma`) to prevent connection exhaustion.
- **Type Safety**: Prisma generates strict TypeScript types used across the Next.js frontend.

---

## 3. Real-Time Telemetry (Pusher)

To give TAKE ONE Nexus its signature "live mission control" feel, we utilize Pusher WebSockets.
- **Global Chat**: Direct peer-to-peer messaging (`chat.js`).
- **Admin Dashboard**: Live metrics pushing (e.g., when a user registers, the admin graph pulses and increments).
- **Task Updates**: Live credits awarding and issue tracking.

---

## 4. Authentication Flow

Currently transitioning to **Clerk** from a custom JWT solution:
1. **Legacy JWT**: Express API issues an HTTP-only cookie (`token`) containing a signed payload of the user's ID and Role.
2. **Next.js Middleware**: Validates the cookie or Clerk session before allowing access to protected routes like `/admin`.
3. **Database Sync**: The `/api/webhooks/clerk` endpoint ensures TiDB stays perfectly synced with Clerk's identity state.

---

## 5. File & Media Storage (Planned)

Currently, assets are served statically from `/public`. Future architecture will utilize:
- **AWS S3 / Vercel Blob**: For user avatar uploads and PDF script storage.
- **Resend**: For automated transactional emails (Welcome, Reset Password).

---

## Architectural Decision Records (ADR)

*   **ADR 001 - Using IST globally for Admin**: To ensure analytics reset predictably for the core demographic, all `GROUP BY DATE` SQL calls and frontend charting components use `CONVERT_TZ` and `Intl.DateTimeFormat` mapped to `Asia/Kolkata`.
*   **ADR 002 - Preserving HTML Pages**: Moving perfectly functioning HTML pages to Next.js components would break existing cinematic animations. They are kept as static files until a 1:1 React conversion is feasible.
