# PROJECT CONTEXT — TAKE ONE Nexus

> A cinematic film crew collaboration platform. Connects student filmmakers across campuses to share scripts, find crew, and build productions.

---

## Overview

**TAKE ONE Nexus** is a role-based creative ecosystem where filmmakers can:
- Browse and post scripts/projects looking for collaborators
- Find crew members filtered by their creative role
- Send and manage collaboration requests
- Chat in real-time (DMs and group conversations)
- Maintain a professional cinematic profile with a work showcase
- Report platform issues directly from the UI

The platform targets student film communities and indie filmmakers, with an aesthetic inspired by cinematic dark UI design.

**Live URL:** https://take-one-nexus.vercel.app  
**Landing Page:** `project.htm` (served at `/`)

---

## Latest Stability Fixes (May 2026)

- Fixed JWT verification instability by aligning middleware token verification fallback with token creation fallback secret.
- Hardened admin authorization checks in system APIs to support normalized role casing (`admin`, `developer`, `moderator`) and avoid false 403s.
- Added `/api/users/admin/list` (authorized) to serve latest users directly from MySQL for admin user management.
- Updated admin users UI to fetch live user data from backend API with explicit loading/error states and no stale-only dependency on server-rendered data.
- Added explicit `credentials: 'include'` and request failure logging in the shared frontend API wrapper to prevent silent auth/session failures.
- Standardized crew navigation paths to `/crew` across shared navbar, homepage, and admin layout to avoid route drift.
- Removed duplicate React landing implementation at `/` by converting `src/app/page.tsx` to a hard redirect to `/project.htm`, keeping `project.htm` as the only landing page surface.
- Synced static `project.htm` navigation links to `/crew` so root rewrite and asset loading remain stable with a single route pattern.
- Added server-backed session validation in the frontend auth layer (`/api/users/me`) so localStorage auth state cannot drift from cookie/session state.
- Hardened navbar CTA bindings to avoid inline logout dependency and to safely handle missing API/auth globals without freezing navigation.
- Added additional null checks in project page auth/search interactions to prevent runtime crashes that could break navbar/login listeners.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript (Next.js app), JavaScript (Express + static pages) |
| **Static UI** | Vanilla HTML + CSS + JS (`.htm` pages in `public/`) |
| **Styling** | Vanilla CSS 3 with custom design tokens; Tailwind CSS available but minimally used |
| **Fonts** | Space Mono (body), Bebas Neue (titles), Cormorant Garamond (accent) — via Google Fonts |
| **Backend Server** | Node.js + Express.js (`server.js`) |
| **ORM** | Prisma (`@prisma/client` v5) |
| **Database** | MySQL (optimized for TiDB Cloud) |
| **Authentication** | JWT (`jsonwebtoken` + `jose`) stored in secure HTTP-only cookies |
| **Real-time** | Pusher (server SDK + `pusher-js` client) |
| **Email** | Nodemailer (SMTP — collaboration request notifications) |
| **Deployment** | Vercel (hybrid: Next.js + Express serverless via `@vercel/node`) |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Icons** | Lucide React |

---

## Database

- **Engine:** MySQL (TiDB Cloud compatible)
- **ORM:** Prisma with `prisma-client-js`
- **Connection:** Via `DATABASE_URL` env var or individual `DB_*` vars processed in `config/db.js`
- **Schema location:** `prisma/schema.prisma`

### Models

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | Identity, role, profile, credits, social links |
| `Script` | `scripts` | Film projects / work showcase entries |
| `CollaborationRequest` | `collaboration_requests` | State-machine for project matching |
| `Conversation` | `conversations` | Chat threads (DMs and groups) |
| `Message` | `messages` | Individual chat messages |
| `Issue` | `issues` | Platform bug reports and feature requests |

---

## Routing

The project uses a **dual-server architecture**:

### Next.js Routes (`src/app/`)
| Route | Description |
|---|---|
| `/` (via Vercel rewrite) | Serves `project.htm` — main landing page |
| `/profile` | Full cinematic profile page (React) |
| `/chat` | Real-time messaging UI (React) |
| `/crew` | Crew directory (React) |
| `/admin` | Admin panel (issues, user management) |
| `/admin/issues` | Issue tracker |
| `/admin/users` | User management |
| `/legal` | Legal / terms page |
| `/moderation` | Moderation tools |
| `/developer` | Developer tooling page |

### Express API Routes (`routes/`)
| Prefix | File | Responsibility |
|---|---|---|
| `/api/home` | `home.js` | Homepage feed / aggregated data |
| `/api/users` | `users.js` | Auth, registration, profile CRUD |
| `/api/scripts` | `scripts.js` | Script/project CRUD and search |
| `/api/requests` | `requests.js` | Collaboration request workflow |
| `/api/notifications` | `notifications.js` | User notification system |
| `/api/chat` | `chat.js` | Conversation and message management |
| `/api/issues` | `issues.js` | Issue reporting |
| `/api/moderation` | `moderation.js` | Moderation actions |
| `/api/system` | `system.js` | System-level utilities |
| `/api/health` | (inline in server.js) | Health check endpoint |

### Static Pages (served from `public/`)
| File | URL |
|---|---|
| `project.htm` | `/` and `/project` |
| `profile.htm` | `/profile` (static fallback) |
| `crew.htm` | `/crew.htm` |
| `legal.htm` | `/legal` |
| `moderation.htm` | `/moderation` |
| `designer.html` | `/designer.html` |

### Vercel Routing (`vercel.json`)
- `/` → rewrites to `/project.htm` (clean URL, no redirect)
- `/api/*` → routed to `server.js` (Express serverless)
- `/uploads/*` → routed to `server.js` (static file serving)

### Local Development Proxy (`next.config.js`)
In local dev (non-Vercel), Next.js proxies `/api/*` to Express running on port `5001` via `LEGACY_API_ORIGIN`.

---

## User Flows

### Registration
1. User lands on `project.htm`
2. Clicks **Join** → opens registration modal
3. Fills name, email, password, role, college, city
4. `POST /api/users/register` → creates user, sets JWT cookie
5. Redirected to profile or project feed

### Login
1. Clicks **Login** → opens login modal
2. `POST /api/users/login` → validates credentials, sets JWT cookie
3. Session persists via secure cookie

### Browse Projects
1. `project.htm` loads → `GET /api/scripts/search` fetches projects
2. Role filter and search bar refine results
3. Clicking a card opens project detail modal

### Collaboration Request
1. User clicks **Collaborate** on a project card
2. Sends `POST /api/requests` with script ID and message
3. Script owner receives email notification via Nodemailer
4. Owner accepts/rejects from their profile or notification panel

### Profile & Work Showcase
1. User visits `/profile` (React page)
2. Profile data loaded from `GET /api/users/me`
3. Work showcase (scripts) loaded from `GET /api/scripts?user_id=...`
4. User can upload avatar, edit bio, manage social links

### Real-time Chat
1. User navigates to `/chat`
2. Conversations loaded via `GET /api/chat/conversations`
3. Pusher channel subscribed for real-time message events
4. Messages sent via `POST /api/chat/messages`

---

## Core Systems

| System | Location | Notes |
|---|---|---|
| **Role System** | `public/scripts/constants/roles.js` | Single source of truth; loaded globally |
| **Client API Layer** | `public/scripts/api/api.js` | Fetch wrapper used by all static pages |
| **Auth Middleware** | `middleware/` (Express), `src/middleware/` (Next.js) | JWT verification |
| **Modal System** | `public/scripts/components/modal.js` | Global modal controller for static pages |
| **Chat FAB** | `public/scripts/components/global-chat-fab.js` | Floating action button across all Next.js pages |
| **Navbar** | `public/scripts/components/navbar.js` | Shared nav logic for static pages |
| **Database Connection** | `config/db.js` | MySQL pool + connection helper |
| **Mailer** | `config/mailer.js` | SMTP transport via Nodemailer |
| **Issue Reporter** | `src/components/GlobalIssueReporter.tsx` | Injected into Next.js root layout |

---

## Dependencies

### Key Production Dependencies
| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.2.4 | React framework |
| `react` / `react-dom` | ^19.2.5 | UI library |
| `express` | ^4.21.2 | Backend HTTP server |
| `@prisma/client` | ^5.22.0 | Database ORM |
| `prisma` | ^5.22.0 | Schema and migration tooling |
| `jsonwebtoken` | ^9.0.2 | JWT signing |
| `jose` | ^6.2.3 | JWT verification (Edge-compatible) |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `pusher` | ^5.3.3 | Real-time server SDK |
| `pusher-js` | ^8.5.0 | Real-time client SDK |
| `nodemailer` | ^6.10.1 | Email notifications |
| `mysql2` | ^3.11.5 | MySQL driver |
| `zod` | ^4.4.3 | Runtime schema validation |
| `cors` | ^2.8.5 | CORS middleware |
| `cookie-parser` | ^1.4.7 | Cookie handling |
| `recharts` | ^3.8.1 | Charts (admin/analytics) |
| `lucide-react` | ^1.14.0 | Icon library |

### Key Dev Dependencies
| Package | Purpose |
|---|---|
| `typescript` | Type checking |
| `tailwindcss` | Utility CSS (available, minimally used) |
| `nodemon` | Local Express hot-reload |
| `eslint` / `eslint-config-next` | Linting |

---

## Deployment Details

**Platform:** Vercel  
**Build command:** `prisma generate && next build`  
**Start command:** `next start`  
**Serverless function:** `server.js` (via `@vercel/node`)

### Vercel Build Configuration (`vercel.json`)
- `server.js` built as a serverless function with `includeFiles` for `public/`, `routes/`, `config/`, `middleware/`, `utils/`, `database/`
- `package.json` built with `@vercel/next` for the Next.js app

### Local Development
```bash
# Start Next.js dev server (proxies /api to Express)
npm run dev

# Start Express server separately (for local API)
npm run legacy:dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes* | Full MySQL connection string (alternative to individual DB_* vars) |
| `DB_HOST` | Yes* | MySQL host |
| `DB_PORT` | No | MySQL port (default: 3306) |
| `DB_NAME` | Yes* | Database name |
| `DB_USER` | Yes* | Database user |
| `DB_PASSWORD` | Yes* | Database password |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (min 32 chars) |
| `SMTP_HOST` | No | SMTP server host (e.g., smtp.gmail.com) |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP login email |
| `SMTP_PASS` | No | SMTP app password |
| `MAIL_FROM` | No | Sender name + email for outgoing mail |
| `PUSHER_APP_ID` | No | Pusher app ID (real-time chat) |
| `NEXT_PUBLIC_PUSHER_KEY` | No | Pusher public key (client-side) |
| `PUSHER_SECRET` | No | Pusher secret |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | No | Pusher cluster region |
| `ALLOWED_ORIGINS` | No | Comma-separated extra CORS origins |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Express server port (default: 3000) |
| `LEGACY_API_ORIGIN` | No | Local Express URL for Next.js proxy (default: http://127.0.0.1:5001) |

*Either `DATABASE_URL` or the full set of `DB_*` variables is required.

---

## Current Platform Goals

1. **Role-Based Creative Ecosystem** — Finalize role-specific work showcase forms per each creative role (Director, Writer, Editor, etc.)
2. **Profile Completeness** — Screen name, display preferences, social links, and avatar all surfaced on the cinematic profile page
3. **Crew Discovery** — Filter-based crew search by role, city, college, and skills
4. **Production Stability** — Consistent auth, cookie handling, and API proxy across local and Vercel environments
5. **Scalability Path** — Planned extraction of Chat into a standalone service; `/api/v1/` versioning for external integrations
6. **SEO & Performance** — Unique titles, Open Graph tags, robots.txt, and sitemap across all pages; Core Web Vitals optimization
