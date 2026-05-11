# FEATURE LOG — TAKE ONE Nexus

> Living changelog. Update this file with every meaningful change, decision, or known issue. Entries are in reverse chronological order within each section.

---

## Features Added

### 2026-05

- **Homepage default route** — `vercel.json` rewrite added so that `https://take-one-nexus.vercel.app/` cleanly serves `project.htm` without a redirect. URL stays at `/`.
- **Designer role** — Added `Designer` to `TAKE_ONE_ROLES` constant and `ROLE_ICONS` map. Created `public/designer.html` landing page with full cinematic branding.
- **Centralized role system** — Moved all role definitions to a single source of truth: `public/scripts/constants/roles.js`. Exposes `TAKE_ONE_ROLES`, `ROLE_ICONS`, `ROLE_SLUGS`, and `LEGACY_ROLE_MAPPING` on both `window.*` (browser) and `module.exports` (Node.js).
- **Legacy role mapping** — `LEGACY_ROLE_MAPPING` introduced in `roles.js` to normalize old database values (`Cinematographer`, `Sound`, `Gaffer`, etc.) to current role names without a migration.
- **Screen name + display preference** — Added `screen_name` and `display_preference` fields to the `User` model and profile page. Users can choose "Show Real Name Only", "Show Screen Name Only", or "Show Both".
- **Social links field** — Added `social_links` (Text) to `User` model; stores JSON array of `{ platform, url }` objects.
- **Credits system** — Added `credits` (UnsignedInt, default 0) to `User` model. Displayed on profile page with defensive fallback to prevent hydration mismatches.
- **Work Showcase** — `Script` model extended with `work_type`, `media_links`, and `role_data` fields to support role-specific portfolio submissions beyond scripts.
- **Cinematic profile page** — New Next.js `/profile` route with full cinematic dark UI, role badge, avatar, social links, work showcase cards, and collaboration history.
- **Real-time chat** — `/chat` Next.js route with Pusher integration for DMs and group conversations. `Conversation` and `Message` models added to schema.
- **Group chat creation** — `CreateGroupModal.tsx` component for creating named group conversations from the chat UI.
- **Issue reporting system** — `Issue` model added to schema. `GlobalIssueReporter.tsx` injected into the root Next.js layout so any user can file a bug report from any page.
- **Admin panel** — `/admin` Next.js route with sub-routes for issue tracker (`/admin/issues`) and user management (`/admin/users`).
- **Global Chat FAB** — Floating action button (`global-chat-fab.js`) injected on all Next.js pages via `layout.tsx` for quick access to chat.
- **SEO metadata** — Unique `<title>`, meta descriptions, viewport, and Open Graph tags added across all `.htm` pages. `robots.ts` and `sitemap.ts` added to Next.js app.
- **Email notifications** — `config/mailer.js` with Nodemailer SMTP. Collaboration request emails sent to project owners on new request submission.
- **Health check endpoint** — `GET /api/health` returns server status, DB connectivity, latency, memory usage, and environment configuration.

---

## Fixes Made

### 2026-05

- **CSS not loading on Vercel** — Resolved path mismatch between local and Vercel static asset serving. Verified `public/` is correctly included via `vercel.json` `includeFiles` and Express `express.static`.
- **JWT cookie not persisting across pages** — Standardized cookie configuration: `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`. Removed conflicting duplicate `Set-Cookie` calls.
- **Next.js middleware auth inconsistency** — Switched Next.js middleware from `jsonwebtoken` to `jose` for Edge-compatible JWT verification. Previously failing on Vercel Edge runtime.
- **Hydration mismatch on profile page** — Credits field read as `undefined` server-side vs `0` client-side. Fixed by adding `?? 0` fallback at the render level.
- **API proxy not working locally** — `next.config.js` now conditionally disables the proxy on Vercel (`process.env.VERCEL`) to avoid double-routing. Local dev proxies `/api/*` to Express on port 5001.
- **Missing modal component on homepage** — `modal.js` and `global-chat-fab.js` were not loaded on the Next.js homepage. Added as `<Script>` tags in `layout.tsx` with `afterInteractive` strategy.
- **Navigation buttons broken** — Hero section buttons in `project.htm` had mismatched element IDs. Corrected IDs to match the event listeners registered in `project.js`.
- **404 on `/project` route** — Vercel `routes` did not cover `/project`. Added `{ "src": "/project", "dest": "/" }` to `vercel.json`.
- **CORS blocking Vercel preview URLs** — Added `origin.endsWith('.vercel.app')` wildcard to CORS allowlist in `server.js`.
- **Roles Grid and Role Toolkit sections missing** — Surgically re-inserted missing HTML sections in `project.htm` that were accidentally removed during a refactor. Element IDs re-aligned with `project.js` selectors.
- **Dynamic form containers broken** — Role-specific form containers lost their IDs during a merge. Restored correct `id` attributes so `project.js` can inject form fields.

---

## Refactors

### 2026-05

- **Unified role configuration** — Eliminated duplicate role arrays scattered across `project.htm`, `project.js`, and profile components. All now import from `roles.js`.
- **Modular Express routing** — Route logic split into 9 domain-specific files under `routes/`. `server.js` is now only responsible for app setup and mounting.
- **Prisma ORM adoption** — Replaced raw `mysql2` queries in most routes with Prisma Client for type safety, auto-generated queries, and easier migrations.
- **Next.js App Router migration** — Project migrated from Pages Router to App Router. All routes restructured under `src/app/` with `page.tsx` convention.
- **Static page script organization** — Moved inline `<script>` blocks out of `.htm` files into dedicated files under `public/scripts/pages/`. `project.js` now ~71 KB of organized page logic.

---

## Deployment Fixes

### 2026-05

- **Homepage default** — Added `{ "src": "/", "dest": "/project.htm" }` as the first entry in `vercel.json` routes. Ensures the root URL serves the correct landing page.
- **`vercel.json` `includeFiles`** — Added `database/**` and `middleware/**` to the serverless function `includeFiles` to prevent runtime `MODULE_NOT_FOUND` errors on Vercel.
- **Build command** — Set build to `prisma generate && next build` to ensure Prisma client is generated before the Next.js build runs on Vercel.
- **`postinstall` script** — Added `"postinstall": "prisma generate"` to `package.json` to auto-generate Prisma client after `npm install` on Vercel.
- **Static file serving** — Express `express.static` mounts `public/` so `.htm` pages and assets are available through the serverless function.

---

## UI Changes

### 2026-05

- **Cinematic dark theme** — Platform-wide dark UI with neon accent colors, glassmorphism modals, and CSS keyframe animations.
- **Font system** — Space Mono (body), Bebas Neue (display headings), Cormorant Garamond (accent) loaded via `next/font`.
- **Role cards grid** — Visual role selection grid on `project.htm` with emoji icons and cinematic hover states.
- **Profile page redesign** — Full-screen cinematic profile with role badge, avatar, credit counter, social icons, and work showcase cards.
- **Scroll progress indicator** — Thin progress bar at the top of Next.js pages tied to scroll position (injected in `layout.tsx`).
- **Designer landing page** — `designer.html` with role-specific branding and call to action.
- **Mobile navigation** — Hamburger menu for `.htm` pages below 768px.

---

## Database Changes

### 2026-05

- **Added `User.screen_name`** — `VarChar(100)`, nullable. For display alias.
- **Added `User.display_preference`** — `VarChar(50)`, default `"Show Real Name Only"`.
- **Added `User.social_links`** — `Text`, nullable. JSON array of social platform links.
- **Added `User.credits`** — `UnsignedInt`, default `0`.
- **Added `Script.work_type`** — `VarChar(50)`, default `"Script"`. Categorizes showcase type.
- **Added `Script.media_links`** — `Text`, nullable. JSON array of external media URLs.
- **Added `Script.role_data`** — `Text`, nullable. Role-specific JSON form data.
- **Added `Conversation` model** — Supports both DMs (`is_group: false`) and group chats.
- **Added `Message` model** — With `conversation_id`, `sender_id`, `content`, and `is_read`.
- **Added `Issue` model** — For platform bug tracking with `title`, `description`, `location`, `severity`, `screenshot`, and `status`.
- **Indexes** — Added `idx_scripts_user_id`, `idx_scripts_genre`, `idx_messages_conversation_id`, `idx_messages_sender_id`, `idx_requests_owner_id`, `idx_requests_requester_id`.
- **Unique constraint** — `uq_script_requester` on `(script_id, requester_id)` in `collaboration_requests`.

---

## Decisions Taken

| Decision | Rationale |
|---|---|
| Use static `.htm` pages alongside Next.js | Allows fast iteration on the main UI without a React build step; Next.js handles dynamic/authenticated routes |
| Express as a serverless function (not Next.js API routes) | Legacy codebase; Express routes are mature and modular; avoids rewriting all route logic |
| JWT in HTTP-only cookies (not localStorage) | Prevents XSS token theft; cookies automatically sent with credentials |
| Prisma ORM over raw SQL | Type safety, auto-generated client, easier schema migrations, TiDB compatible |
| `roles.js` as universal constant (browser + Node) | Eliminates duplication; one file updated to add/modify roles everywhere |
| Pusher for real-time instead of raw WebSockets | Managed service; handles scaling, reconnection, and channel auth |
| `jose` for Next.js middleware JWT verification | `jsonwebtoken` uses Node.js crypto APIs not available in the Edge runtime |
| No Tailwind in static pages | Avoids build dependency for `.htm` files; CSS variables give equivalent design token support |
| Vercel route rewrite for `/` → `project.htm` | Clean URL, no redirect, preserves SEO; simpler than setting up a Next.js route that just renders a static file |

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| Chat FAB appears on admin pages | Low | Open |
| Avatar upload does not validate file type on client | Medium | Open |
| `profile.htm` (static) and `/profile` (Next.js) can get out of sync | Medium | Open — plan to deprecate `profile.htm` |
| Pusher not configured → chat silently fails with no UI error | Medium | Open |
| Long script titles overflow card layout on mobile | Low | Open |
| No pagination on `/api/scripts/search` — may slow on large datasets | Medium | Open |
| `Script.role_data` stored as raw JSON string — no schema validation | Medium | Open |
| Social links not validated for URL format on save | Low | Open |
| No rate limiting on auth endpoints (`/api/users/login`, `/api/users/register`) | High | Open |

---

## TODOs

### High Priority
- [ ] Add rate limiting to `/api/users/login` and `/api/users/register` (e.g., `express-rate-limit`)
- [ ] Add server-side file type and size validation for avatar uploads
- [ ] Implement pagination (`limit` + `offset`) on `/api/scripts/search`
- [ ] Validate `Script.role_data` JSON against a Zod schema before persisting

### Medium Priority
- [ ] Deprecate `public/profile.htm` — redirect to `/profile` Next.js route
- [ ] Add Zod validation to all Express POST/PUT handlers
- [ ] Add Pusher unavailability fallback UI (polling or status message)
- [ ] Extract Chat system into a dedicated service (`/services/chat/`)
- [ ] Add `/api/v1/` prefix for external API versioning

### Low Priority
- [ ] Hide Chat FAB on `/admin/*` routes
- [ ] Add character limits to bio, synopsis, and message fields
- [ ] Implement `LEGACY_ROLE_MAPPING` normalization as a DB migration to clean up old records
- [ ] Add `alt` text audit pass across all `.htm` pages
- [ ] Compress and WebP-convert images in `public/assets/images/`
- [ ] Add `cache-control` headers to static asset routes in Express
