# 🤝 Contributing to TAKE ONE Nexus

First off, thank you for considering contributing to TAKE ONE Nexus! It's people like you that make this ecosystem such a great tool for filmmakers and creators.

Whether you're participating in **SSOC**, **GSSoC**, or just dropping by, we welcome contributions of all kinds: bug fixes, feature additions, documentation improvements, and design tweaks.

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

## 💻 Coding Standards

We maintain a high standard for code quality to ensure scalability and maintainability.

- **TypeScript / Next.js**: Use strict typing where possible. Avoid `any`. Follow modern React patterns (functional components, hooks).
- **Styling**: We use Vanilla CSS for static pages and Tailwind/CSS Modules for Next.js components. Please adhere to the established futuristic/cinematic design tokens (e.g., `var(--neon)`, `var(--cyber-bg)`).
- **Express Backend**: Use `asyncHandler` for wrapping async routes. Ensure all API responses return consistent JSON: `{ success: boolean, message?: string, data?: any }`.
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
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools and libraries such as documentation generation

**Example Commit:**
`feat: add global timezone formatting for admin analytics`

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

---

## 🐛 Reporting Issues

If you find a bug, please create an issue using the following format:

- **Environment**: OS, Browser, Node version
- **Steps to Reproduce**: Detailed steps on how to trigger the bug
- **Expected Result**: What should have happened
- **Actual Result**: What actually happened (include screenshots if applicable)

---

Thank you for contributing to TAKE ONE Nexus and helping build the cinematic future!
