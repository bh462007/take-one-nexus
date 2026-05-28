# 🤝 Contributing to TAKE ONE Nexus

First off, thank you for considering contributing to TAKE ONE Nexus! It's people like you that make this ecosystem such a great tool for filmmakers and creators.

If this project has been useful to you, consider giving it a ⭐ on GitHub — it helps others discover the project and keeps us motivated!

We welcome contributions of all kinds: bug fixes, feature additions, documentation improvements, and design tweaks.

---

## 🚀 Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
```bash
   git clone https://github.com/YOUR_USERNAME/take-one-nexus.git
   cd take-one-nexus
```
3. **Add the original repository as an upstream remote**:
```bash
   git remote add upstream https://github.com/alokr25012-lab/take-one-nexus.git
```
4. **Install dependencies**:
```bash
   npm install
```
5. **Set up your environment variables** as detailed in the `README.md` (duplicate `.env.example` to `.env`).
   - *Note*: For local development, `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_SENTRY_DSN` are optional. If left blank, analytics and error tracking will be bypassed in dev mode.
   - *Note*: Rate limiting is active locally. If you encounter 429 errors during testing, you can disable it locally by setting `CSRF_DISABLED=true` (do not commit these changes).

---

## 🌿 Branching Strategy

To keep the repository clean and manageable, please use the following branch naming conventions:

- `feature/your-feature-name` (For new features)
- `bugfix/issue-description` (For fixing bugs)
- `docs/what-you-documented` (For documentation updates)
- `chore/update-dependencies` (For routine tasks)

Example:
```bash
git checkout -b feature/ai-crew-matching
```

---

## 💻 Coding & Security Standards

We maintain a high standard for code quality to ensure scalability and maintainability.

### 🛡️ Security Guidelines (Mandatory)
- **CSRF Token Handling**: All state-changing API endpoints must check for CSRF token parity. If adding new POST/PUT/PATCH/DELETE endpoints, ensure they go through the `verifyCsrfToken` middleware in `server.js`.
- **Session Cookie Security**: In production, auth cookies must enforce `domain: '.takeone-nexus.net.in'` to permit session validation on subdomains. Do not override this logic in `users.js`.
- **Database Interactivity**: Under no circumstances should you dynamically concatenate strings for SQL commands. All database interactions must use parameterized queries (via `?` placeholder inputs or Prisma).
- **Payment Operations**: Razorpay Webhook handlers must use signature-verification on raw buffers before executing state transitions.
- **Credit Ledgers**: Operations that modify user credits must be performed inside a database transaction block to ensure atomic safety.

### 🎨 Visual & Frontend Code
- **Typography & Styling**: We use Vanilla CSS for static pages and Tailwind/CSS Modules for Next.js components. Adhere strictly to the cinematic tokens (e.g., `var(--neon)`, `var(--cyber-bg)`).
- **Error Handling**: API endpoints must catch exceptions using `try-catch` blocks and return consistent JSON structures: `{ success: boolean, message: string, data?: any }`.
- **Linting**: Before committing, ensure your code passes our linting rules:
```bash
  npm run lint
```

---

## 📝 Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Formatting changes (white-space, formatting, missing semi-colons, etc)
- `refactor:` Code restructuring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Example Commit:**
`feat: add custom double-submit csrf token verification`

---

## 🔄 Pull Request Guidelines

1. **Keep it focused**: A PR should ideally do one thing. If you're fixing a bug and adding a feature, open two separate PRs.
2. **Sync with upstream**: Before submitting, ensure your branch is up-to-date with `upstream/main`:
```bash
   git fetch upstream
   git rebase upstream/main
```
3. **Write a clear description**: Detail what the PR does, why it's needed, and how to test it. Link any relevant issues using `Closes #123`.
4. **Pass Checks**: Ensure your PR passes all automated checks (linting, build process) before requesting a review.
