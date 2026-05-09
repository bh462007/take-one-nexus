# 🏗️ TAKE ONE NEXUS: TECHNICAL ARCHITECTURE

The technical DNA of TAKE ONE Nexus is a hybrid architecture designed for performance, cinematic aesthetics, and scalable collaboration.

---

## 1. FRONTEND ARCHITECTURE
- **Framework:** Next.js 14 (App Router)
- **Styling:** Vanilla CSS 3.0
  - Custom design tokens for cinematic lighting (neon, void, machine).
  - CSS Variables used for consistent branding.
  - Zero-dependency animation system using CSS Keyframes.
- **State Management:** React Server Components (RSC) + Client-side Hooks (useState/useEffect).
- **Communication:** Fetch API with native Next.js caching.

## 2. BACKEND ARCHITECTURE
- **Server:** Node.js + Express.js
- **Routing:** Modular route handlers for specialized systems (Chat, Users, Scripts).
- **Middleware & Utilities:** 
  - Custom Authentication Layer (JWT).
  - Security headers and CORS configuration.
  - Display Name Formatting (Title Case) across API responses.
  - Static asset serving for legacy production files.

## 3. DATABASE DESIGN
- **Engine:** MySQL (Optimized for TiDB Cloud).
- **ORM:** Prisma
- **Models:**
  - `User`: Handles identity, roles, and the new **Credits System**.
  - `Script`: Central project repository.
  - `CollaborationRequest`: State machine for project matching.
  - `Conversation` & `Message`: Multi-user chat (Group chats) and DM persistence.
  - `Issue`: Platform bug tracking and feature requests.

## 4. REAL-TIME SYSTEMS
- **Provider:** Pusher
- **Implementation:** 
  - Event-driven message dispatching.
  - Client-side channel subscription with automatic cleanup.
  - Fallback mechanisms for offline transmission states.

## 5. CREDIT SYSTEM (V2.0)
- **Field:** `credits` (Unsigned Integer)
- **Default:** `0` for all new registrations.
- **UI Implementation:** Server-rendered in profile views with defensive fallback logic to prevent hydration mismatches.

## 6. DEPLOYMENT & INFRASTRUCTURE
- **Platform:** Vercel
- **Routing Layer:** `vercel.json` complex rewrites.
  - Next.js handles `/profile`, `/chat`, and UI routes.
  - Express handles `/api/*` and specialized legacy assets.
- **Security:** 
  - JWT tokens stored in secure cookies.
  - Environment variable isolation.
  - Prisma validation on every schema change.

---

## 🚀 SCALABILITY GOALS
1. **Micro-services:** Future extraction of the Chat system into a dedicated service.
2. **CDN Optimization:** Edge-cached assets for global filmmaker collaboration.
3. **API Versioning:** Moving towards `/api/v1/` for external integrations.

---
*Technical Documentation Version: 3.0.0*
