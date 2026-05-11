# CODING RULES — TAKE ONE Nexus

> Standards and conventions for all code written in this project. Follow these rules consistently across static pages, Next.js components, and backend routes.

---

## 1. Naming Conventions

### Files and Directories
- **kebab-case** for all file and directory names: `global-chat-fab.js`, `profile-page.css`
- **PascalCase** for React component files: `IssueReportModal.tsx`, `UserManagement.tsx`
- **camelCase** for plain JS utility files: `helpers.js`, `api.js`
- Pages in `src/app/` follow Next.js App Router conventions: directories = route segments, `page.tsx` inside

### Variables and Functions
- **camelCase** for variables and functions: `fetchScripts()`, `currentUser`, `isLoading`
- **PascalCase** for React components and TypeScript types/interfaces: `ProfileCard`, `UserRole`
- **SCREAMING_SNAKE_CASE** for global constants: `TAKE_ONE_ROLES`, `ROLE_ICONS`, `JWT_SECRET`
- **Descriptive names** — avoid abbreviations unless widely understood (`id`, `url`, `btn` are fine)

### Database / API
- Table names: **snake_case plural** (enforced by Prisma `@@map`): `users`, `collaboration_requests`
- Column names: **snake_case**: `avatar_url`, `created_at`, `user_id`
- API routes: **kebab-case**: `/api/collaboration-requests`, `/api/users/me`
- JSON response keys: **snake_case** to match database field names

### CSS
- CSS custom properties: `--font-main`, `--color-neon`, `--spacing-lg`
- Class names: **kebab-case**: `.project-card`, `.nav-link`, `.modal-overlay`
- No BEM required; flat, descriptive class names preferred
- Avoid generic class names like `.container`, `.wrapper`, `.box` — add context: `.profile-container`, `.card-wrapper`

---

## 2. Folder Structure Rules

```
take-one-nexus/
├── config/             # Shared server-side config (DB, mailer) — no business logic
├── database/           # Database-specific utilities and helpers
├── middleware/         # Express middleware (auth, validation, error handling)
├── prisma/             # Prisma schema only — never put business logic here
├── public/             # All static assets and .htm pages
│   ├── assets/         # Media only (fonts, icons, images, uploads, videos)
│   ├── scripts/        # Client-side JavaScript
│   │   ├── api/        # API client layer (one file: api.js)
│   │   ├── constants/  # Shared constants (roles.js etc.)
│   │   ├── components/ # Reusable UI JS components
│   │   ├── pages/      # One JS file per .htm page
│   │   └── utils/      # Pure utility functions (no DOM logic)
│   └── styles/         # CSS organized by scope
│       ├── components/ # Per-component CSS
│       ├── pages/      # Per-page CSS
│       └── themes/     # Design tokens and theme CSS
├── routes/             # Express route handlers (grouped by domain)
├── src/                # Next.js application
│   ├── app/            # App Router pages and layouts
│   ├── components/     # Reusable React components
│   ├── lib/            # Shared logic, formatting utilities
│   ├── styles/         # Next.js-specific shared styles
│   └── utils/          # TypeScript utilities for Next.js context
└── utils/              # Shared server utilities
```

**Rules:**
- Do not put business logic in `config/` — only configuration and initialization
- Route files in `routes/` handle one domain only (users, scripts, chat, etc.)
- Each `.htm` page has exactly one corresponding JS file in `public/scripts/pages/`
- New static assets go in `public/assets/` — never inline base64 images in CSS or JS
- Do not create new top-level directories without documenting the reason

---

## 3. CSS Guidelines

### Design Tokens
Define all design values as CSS custom properties in the theme files (`public/styles/themes/`). Never hardcode colors, font sizes, or spacing values.

```css
/* Good */
color: var(--color-neon);
font-size: var(--text-lg);
padding: var(--spacing-md);

/* Bad */
color: #00ff88;
font-size: 18px;
padding: 16px;
```

### Cinematic Aesthetic
This project uses a **cinematic dark UI** style. Key rules:
- Dark backgrounds with `void` and `machine` color palettes
- Neon accent colors sparingly — use for interactive states, not decoration
- CSS keyframe animations preferred over JS-driven animation for simple effects
- Glassmorphism effects (`backdrop-filter: blur`) for modal and overlay layers

### Structure
- One CSS file per page in `public/styles/pages/`
- One CSS file per component in `public/styles/components/`
- Never use `!important` unless overriding a third-party style
- Avoid inline styles in HTML — always use classes
- Use `z-index` values in defined steps: `10, 20, 50, 100, 200, 999` — document each layer's purpose

### Responsive Design
- Mobile-first: base styles target mobile, use `min-width` media queries to scale up
- Primary breakpoints: `480px`, `768px`, `1024px`, `1440px`
- Touch targets minimum `44px × 44px` for all interactive elements
- Use `clamp()` for fluid typography where appropriate
- Test all UI at 320px, 768px, and 1280px minimum

---

## 4. JavaScript Patterns

### Static Pages (Vanilla JS)
- Wrap all page logic in a `DOMContentLoaded` listener or an IIFE to prevent global scope pollution
- Use `async/await` with `try/catch` for all API calls — never unhandled promises
- All API calls must go through the `api.js` client — do not use `fetch` directly in page scripts
- Use `const` by default; `let` only when reassignment is necessary; never `var`
- Guard all DOM element access: check for `null` before accessing `.classList`, `.value`, etc.

```js
// Good
const btn = document.getElementById('submitBtn');
if (btn) {
  btn.addEventListener('click', handleSubmit);
}

// Bad
document.getElementById('submitBtn').addEventListener('click', handleSubmit);
```

### React / TypeScript (Next.js)
- Prefer **React Server Components** for data fetching; mark components `"use client"` only when needed
- Keep `"use client"` components small and focused — push state as far down the tree as possible
- Type all props with TypeScript interfaces; do not use `any`
- Use `useEffect` cleanup functions to prevent memory leaks (especially Pusher subscriptions)
- Validate all user inputs with Zod before sending to the API

### Error Handling
- Every `try/catch` block must log the error with context: `console.error('[FunctionName]', error)`
- API routes return a consistent shape: `{ success: boolean, message: string, data?: any }`
- Never expose stack traces or internal error messages to the client in production (`NODE_ENV === 'production'`)
- Show user-friendly error messages in the UI — never raw `err.message`

---

## 5. Component Reuse Rules

### Static Page Components
- Reusable UI behaviors (modals, navbars, tooltips) go in `public/scripts/components/`
- Each component file exports a single initialization function (e.g., `initModal()`, `initNavbar()`)
- Components must not depend on page-specific globals — accept parameters instead
- Shared styles go in `public/styles/components/`, named to match the JS file

### React Components
- Components in `src/components/` must be **stateless or self-contained** — no business logic that belongs in a route handler
- If a component is only used in one route, co-locate it in that route's directory
- Only promote a component to `src/components/` if it's used in 2+ routes
- Props must be explicitly typed — no spreading unknown `{...props}` unless intentional

---

## 6. Formatting Standards

- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Single quotes in JS/TS; double quotes in JSX attributes and JSON
- **Semicolons:** Always (in TS/JS)
- **Line length:** Max 100 characters — break long chains across lines
- **Trailing commas:** Yes, in multi-line arrays and objects
- **Blank lines:** One blank line between logical sections; two before exported functions in a module
- **File endings:** All files must end with a single newline

Run `eslint` before committing: `npm run lint`

---

## 7. Error Handling Rules

### Backend (Express)
- Every route handler must be wrapped in `try/catch`
- Pass errors to `next(err)` — let the global error handler respond
- Set `err.status` before passing to `next()` for non-500 errors

```js
// Good
router.get('/:id', async (req, res, next) => {
  try {
    const data = await db.query(...);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
```

- The global error handler in `server.js` handles all uncaught route errors
- HTTP status codes must be semantically correct: `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `500` server error

### Frontend
- Display a user-friendly fallback message on all API failures
- Never leave the user on a blank/broken state — show an error state UI
- Log errors to the console in development; silence them in production client code
- Validation errors from Zod should surface per-field, not as a single generic message

---

## 8. Performance Rules

### General
- Avoid synchronous operations in request handlers — always use async versions
- Database queries must use indexed columns in `WHERE` clauses (see schema indexes)
- Do not `SELECT *` — specify only the fields the client actually needs
- Paginate all list endpoints — never return unbounded result sets

### Frontend
- Lazy-load images: use `loading="lazy"` on `<img>` tags below the fold
- Do not block the main thread: heavy computation goes in a `setTimeout` or Web Worker
- Debounce search inputs — minimum 300ms delay before triggering API calls
- Minimize DOM queries in loops — cache element references outside loops
- CSS animations must use `transform` and `opacity` only — do not animate `width`, `height`, `top`, `left`

### Next.js
- Prefer RSC data fetching over client-side `useEffect` fetching for initial page data
- Use `next/image` for all images in the Next.js app — do not use raw `<img>` tags
- Use `next/font` for all font loading — do not add `<link>` tags manually in `<head>`

---

## 9. Responsive Design Rules

- All layouts must work at **320px minimum width**
- Use CSS Grid and Flexbox — do not use `float` for layout
- Scrollable containers must have `-webkit-overflow-scrolling: touch` for iOS
- Never use fixed pixel heights on containers that contain text
- Modal overlays must be scrollable on mobile — account for virtual keyboard pushing content
- Navigation must collapse to a hamburger menu or bottom bar below `768px`
- Test interactive states (hover, focus, active) on both pointer and touch devices

### Accessibility
- All interactive elements must be keyboard-accessible (`tabindex`, `Enter`/`Space` handlers)
- Images must have `alt` attributes — use `alt=""` for decorative images
- Modals must trap focus and restore it on close
- Color contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- Form inputs must have associated `<label>` elements

---

## 10. Git and Code Review Rules

- Branch names: `feature/short-description`, `fix/issue-description`, `refactor/area`
- Commit messages: imperative mood, present tense — `Add role filter to crew page`, `Fix JWT cookie not persisting`
- One logical change per commit — do not bundle unrelated changes
- Do not commit `.env` files, `node_modules/`, or `.next/` build artifacts
- Run `npm run lint` and verify there are no TypeScript errors before opening a PR
- All new API routes must have manual testing notes in the PR description
