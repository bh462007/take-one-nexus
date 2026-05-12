# ARCHITECTURE — TAKE ONE Nexus

> Technical architecture reference for developers working on the platform.

---

## System Overview

TAKE ONE Nexus is a **hybrid architecture** — a Next.js React app and a standalone Express.js server running side-by-side on Vercel, with static `.htm` pages served directly from `public/`.

### Recent Production Stability Updates

- **Auth consistency:** `middleware/auth.js` now uses the same JWT fallback strategy as `routes/users.js` token creation, preventing login sessions from failing when `JWT_SECRET` is missing in non-prod environments.
- **Admin data source hardening:** Added `GET /api/users/admin/list` in `routes/users.js` so admin user tables can always pull latest user rows from MySQL through a single authorized API boundary.
- **Admin frontend resilience:** `UserManagement` now loads users via API with loading/error states and avoids silent empty-table failures.
- **Authorization normalization:** `/api/system/stats` and `/api/system/analytics` now normalize role checks to lowercase and include moderator access.
- **Client API robustness:** shared browser API layer now forces cookie credentials and logs failed requests to avoid silent fetch failures.
- **Single landing source:** `src/app/page.tsx` no longer contains a separate homepage implementation and now redirects to `/project.htm`, ensuring one canonical landing page.
- **Routing consistency:** `public/project.htm` and shared navigation now point crew access to `/crew` while `vercel.json` continues rewriting `/` to `/project.htm`.
- **Session authority model:** frontend auth now validates persisted local session state against backend `/api/users/me` (cookie + JWT middleware), preventing stale local tokens from causing auth/UI desync.
- **Navbar interaction hardening:** shared navbar re-render flow now uses defensive event listeners (instead of inline handlers) with guarded API access to avoid broken CTA behavior when scripts hydrate in different orders.
- **Modal/runtime safety hardening:** static landing now explicitly loads `components/modal.js`, defers dependent page scripts, and uses fallback-safe modal open handlers so auth/login UI interactions continue working even if one helper script fails.
- **Chat Null Safety Architecture**: Hardened `routes/chat.js` to handle `null` message senders (deleted users/system messages) and added explicit `userId` validation to prevent database query crashes.
- **Specialized Auth Diagnostics**: Enhanced `middleware/auth.js` with targeted logging for `/api/chat` requests to identify session/cookie drift on the custom domain.
- **Frontend Sync Hardening**: Improved `src/app/chat/page.tsx` fetch logic with descriptive synchronization states and robust error recovery patterns.
- **Public Profile access:** Implemented `GET /api/users/public/:id` for unauthenticated profile fetching, enabling vetting before messaging.
- **Portfolio CRUD architecture:** Added full Create/Update/Delete endpoints for `Script` models to support user-managed portfolio entries via a shared cinematic modal.
- **Canonical Naming Logic**: Unified display name preferences (Real Name, Screen Name, Both) via a shared utility used by both Next.js and Express services.

```
┌─────────────────────────────────────────────────────────┐
│                   Vercel Edge / CDN                     │
│                    vercel.json routes                   │
└────────┬───────────────────────────┬────────────────────┘
         │                           │
         ▼                           ▼
  Next.js App                  Express (server.js)
  (src/app/)                   (serverless function)
  ─ /profile                   ─ /api/*
  ─ /chat                      ─ /uploads/*
  ─ /crew                      ─ /project.htm (static)
  ─ /admin                     ─ /profile.htm (static)
  ─ /legal                     ─ other .htm files
  ─ /moderation
         │                           │
         └───────────┬───────────────┘
                     ▼
              MySQL (TiDB Cloud)
              via Prisma ORM
```

---

## Frontend Architecture

### Next.js App (`src/app/`)

Uses the **App Router** (Next.js 14+). All pages are React Server Components by default; client interactivity is isolated with `"use client"` at the component level.

```
src/
├── app/
│   ├── layout.tsx          # Root layout — fonts, global scripts, GlobalIssueReporter
│   ├── globals.css         # Global reset and base styles for Next.js routes
│   ├── page.tsx            # Main homepage (React version of project.htm logic)
│   ├── robots.ts           # SEO: robots.txt generator
│   ├── sitemap.ts          # SEO: sitemap.xml generator
│   ├── profile/
│   │   ├── page.tsx        # Cinematic profile page
│   │   ├── profile.css     # Page-specific styles
│   │   ├── loading.tsx     # Loading skeleton
│   │   └── error.tsx       # Error boundary
│   ├── chat/
│   │   ├── page.tsx        # Real-time chat UI
│   │   └── chat.css        # Chat-specific styles
│   ├── crew/               # Crew directory
│   ├── admin/
│   │   ├── layout.tsx      # Admin shell layout
│   │   ├── page.tsx        # Admin dashboard
│   │   ├── issues/         # Issue tracker
│   │   └── users/          # User management
│   ├── legal/              # Legal/terms page
│   ├── moderation/         # Moderation tools
│   └── developer/          # Developer tools
├── components/
│   ├── GlobalIssueReporter.tsx   # Wrapper — injects IssueReportModal globally
│   ├── IssueReportModal.tsx      # Issue report form modal
│   ├── AddUserForm.tsx            # Admin: add user form
│   ├── CreateGroupModal.tsx       # Chat: create group conversation
│   ├── UserManagement.tsx         # Admin: user management table
│   └── admin/                     # Admin-specific components
├── config/                        # Shared config accessible to src/
├── database/                      # Database utilities for Next.js context
├── lib/                           # Shared utilities (helpers, formatting)
├── proxy.ts                       # API proxy configuration for local dev
├── styles/                        # Next.js shared styles
└── utils/                         # Shared utility functions
```

### Static Pages (`public/`)

The static `.htm` pages are the **primary user-facing interface**. They are plain HTML with CSS and vanilla JavaScript — no build step required.

```
public/
├── project.htm         # Main landing page (scripts feed, modals, auth)
├── crew.htm            # Crew directory (static)
├── assets/
│   ├── fonts/          # Local font files
│   ├── icons/          # SVG / PNG icons
│   ├── images/         # Static image assets
│   ├── uploads/        # User-uploaded files (avatars, posters)
│   └── videos/         # Video assets
├── scripts/
│   ├── api/
│   │   └── api.js      # Centralized fetch wrapper for all static pages
│   ├── constants/
│   │   └── roles.js    # Platform role definitions (single source of truth)
│   ├── components/
│   │   ├── modal.js            # Global modal controller
│   │   ├── navbar.js           # Shared navigation logic
│   │   ├── global-chat-fab.js  # Floating chat button (injected in Next.js layout)
│   │   └── ui.js               # Generic UI helpers
│   ├── pages/
│   │   ├── project.js          # All logic for project.htm (~71 KB)
│   │   ├── profile.js          # Profile page logic
│   │   ├── crew.js             # Crew directory logic
│   │   └── moderation.js       # Moderation page logic
│   ├── utils/                  # Shared utility functions
│   └── animations/             # Animation helpers
└── styles/
    ├── components/             # Component-level CSS (e.g., global-chat-fab.css)
    ├── pages/                  # Page-level CSS
    └── themes/                 # CSS theme tokens
```

### Font System

Fonts are loaded in `src/app/layout.tsx` via `next/font/google`:

| Variable | Font | Usage |
|---|---|---|
| `--font-main` | Space Mono | Body text, monospace UI |
| `--font-title` | Bebas Neue | Section headings, hero titles |
| `--font-accent` | Cormorant Garamond | Decorative / cinematic accent text |

---

## Backend / Service Structure

### Express Server (`server.js`)

The Express server is the API layer. It runs as a Vercel serverless function in production.

**Startup sequence:**
1. Load env vars
2. Configure CORS (allowlist + `.vercel.app` wildcard)
3. Mount middleware: `express.json`, `urlencoded`, `cookieParser`
4. Serve static files from `public/` (including `/uploads`)
5. Mount all API route groups
6. Register static page routes (GET `/`, `/profile`, `/project`, `/crew`, `/legal`, `/moderation`)
7. Global 404 and error handler
8. `connectDB()` health check on boot

**Route files (`routes/`):**

| File | Key Endpoints |
|---|---|
| `users.js` | `POST /register`, `POST /login`, `GET /me`, `PUT /me`, `GET /public/:id` (public), avatar upload |
| `scripts.js` | `GET /search`, `POST /`, `PUT /:id` (edit portfolio), `DELETE /:id` (remove work) |
| `requests.js` | `POST /`, `GET /user/:id`, `PUT /:id/status` (unified display logic) |
| `chat.js` | `GET /conversations`, `POST /conversations`, `GET /messages/:id`, `POST /messages` |
| `notifications.js` | `GET /`, `PUT /:id/read` |
| `issues.js` | `POST /`, `GET /`, `PUT /:id/status` |
| `moderation.js` | User/content moderation actions |
| `system.js` | Admin system utilities |
| `home.js` | Aggregated feed data |

### Middleware (`middleware/`)
- JWT authentication middleware used in Express route handlers
- Validates `Authorization` cookie or header, attaches `req.user`

### Config (`config/`)
- `db.js` — MySQL connection pool; exports `pool` and `connectDB()`
- `mailer.js` — Nodemailer SMTP transport; exports `sendMail()`

---

## Database Relationships

```
User ─────────────────────────────────────────────┐
  │                                               │
  │ 1:N                                           │ M:N
  ├── Script                          Conversation ◄── (UserConversations join)
  │     │                                         │
  │     │ 1:N                                     │ 1:N
  │     └── CollaborationRequest              Message
  │               │
  │     (requester_id ─► User)
  │     (owner_id ─► User)
  │
  ├── CollaborationRequest (as requester)
  ├── CollaborationRequest (as owner)
  ├── Message (as sender)
  ├── Conversation (via M:N join)
  └── Issue
```

### Key Constraints
- `CollaborationRequest` has a unique composite index on `(script_id, requester_id)` — prevents duplicate requests
- `Message.sender_id` and `Script.user_id` use `SetNull` on delete — preserve history when users are removed
- `CollaborationRequest` cascades on script/user delete

---

## Module Structure

### Data Flow for Static Pages

```
project.htm
    │
    ├── <link> public/styles/...
    │
    ├── <script> /scripts/constants/roles.js    ← global window vars
    ├── <script> /scripts/api/api.js            ← API client
    ├── <script> /scripts/utils/helpers.js      ← formatting, display
    ├── <script> /scripts/components/modal.js   ← modal controller
    └── <script> /scripts/pages/project.js      ← page logic
```

### Data Flow for Next.js Pages

```
layout.tsx
    │
    ├── Google Fonts (next/font)
    ├── GlobalIssueReporter (client component)
    ├── <Script> roles.js (beforeInteractive)
    ├── <Script> api.js, helpers.js, modal.js, global-chat-fab.js (afterInteractive)
    └── {children}
            │
            └── page.tsx (RSC or client component)
                    │
                    └── fetch() → /api/* → Express → MySQL
```

---

## Role System Architecture

The role system is the central identifier for every user and project on the platform.

**Single source of truth:** `public/scripts/constants/roles.js`

Exports (available on `window.*` in browser, `module.exports` in Node):
- `TAKE_ONE_ROLES` — ordered array of all valid roles
- `ROLE_ICONS` — emoji icon per role
- `ROLE_SLUGS` — URL-safe slug per role
- `LEGACY_ROLE_MAPPING` — maps old database values to current role names

```
TAKE_ONE_ROLES = [
  "Director", "Cinematographer / DP", "Writer", "Editor",
  "Sound Designer", "Designer", "Developer", "Actor",
  "Producer", "Lighting Crew", "Set Support", "Other"
]
```

**Where roles are used:**
- User registration form (role selection)
- User profile display (`User.role` field)
- Script/project `roles_needed` field (comma-separated)
- Crew directory filter
- Work showcase (`Script.role_data` — JSON blob per role)
- Role-specific landing pages (`/designer.html`)

---

## Authentication Flow

```
Client                          Express                         Database
  │                                │                                │
  │  POST /api/users/login         │                                │
  │ ─────────────────────────────► │                                │
  │                                │  SELECT user WHERE email=...   │
  │                                │ ──────────────────────────────►│
  │                                │ ◄────────────────────────────── │
  │                                │  bcrypt.compare(password, hash) │
  │                                │                                │
  │                                │  jwt.sign({ id, email, role }) │
  │  Set-Cookie: token=<JWT>       │                                │
  │ ◄───────────────────────────── │                                │
  │                                │                                │
  │  Subsequent requests           │                                │
  │  Cookie: token=<JWT>           │                                │
  │ ─────────────────────────────► │                                │
  │                                │  jwt.verify(token)             │
  │                                │  req.user = decoded            │
```

- Token is stored in an **HTTP-only secure cookie** named `token`
- Cookie is parsed by `cookie-parser` middleware
- Protected routes use the auth middleware in `middleware/`
- Next.js middleware uses `jose` for Edge-compatible JWT verification
- Token payload: `{ id, email, role }`

---

## Upload / Work Showcase Flow

```
User                        Express                       Filesystem
  │                            │                               │
  │  POST /api/users/avatar    │                               │
  │  (multipart/form-data)     │                               │
  │ ─────────────────────────► │                               │
  │                            │  multer processes file        │
  │                            │ ──────────────────────────────►
  │                            │  Saved to:                    │
  │                            │  public/assets/uploads/       │
  │                            │                               │
  │                            │  UPDATE users SET avatar_url  │
  │                            │  = '/uploads/filename.jpg'    │
  │  { avatar_url: "..." }     │                               │
  │ ◄───────────────────────── │                               │
```

**Work Showcase (Script model):**
- `Script.work_type` — categorizes the submission (e.g., "Script", "Film", "Design")
- `Script.role_data` — JSON string containing role-specific form data (varies per creative role)
- `Script.media_links` — JSON array of external media URLs
- `Script.poster_url` — thumbnail/poster image path
- `Script.roles_needed` — roles the project is seeking (comma-separated)

---

## Deployment Architecture

```
GitHub Push
    │
    ▼
Vercel Build
    ├── prisma generate
    └── next build
          │
          ▼
    Vercel Edge
    ┌────────────────────────────────────────┐
    │  vercel.json routing                   │
    │  ┌──────────┬──────────────────────┐   │
    │  │  "/"     │  /project.htm        │   │  (static file)
    │  │  /api/*  │  server.js (Express) │   │  (serverless fn)
    │  │ /uploads │  server.js           │   │  (static uploads)
    │  │  rest    │  Next.js app         │   │  (SSR/RSC)
    │  └──────────┴──────────────────────┘   │
    └────────────────────────────────────────┘
          │
          ▼
    TiDB Cloud (MySQL)
    Pusher Cloud
    SMTP Provider
```
