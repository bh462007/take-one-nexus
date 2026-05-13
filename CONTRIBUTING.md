# Contributing to TAKE ONE Nexus 🎬

First off, thank you for considering contributing to TAKE ONE Nexus! It's people like you that make this platform a powerful ecosystem for creators.

This project is a participant in **Social Summer of Code (SSOC)** and **GirlScript Summer of Code (GSSoC)**. We welcome contributors of all skill levels!

---

## 📑 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Style Guides](#-style-guides)
- [Pull Request Process](#-pull-request-process)
- [Community](#-community)

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a friendly, safe, and welcoming environment for all.

---

## 🚀 Getting Started

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/take-one-nexus.git
    cd take-one-nexus
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Set up your environment**:
    Copy `.env.example` to `.env` and fill in the required variables (Database, Pusher, JWT Secret).
5.  **Initialize Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```
6.  **Run the development servers**:
    You need two terminals:
    - Terminal 1: `npm run dev` (Next.js)
    - Terminal 2: `npm run legacy:dev` (Express Backend)

---

## 🛠 How Can I Contribute?

### Reporting Bugs 🐛
Before creating a bug report, please check the [Issue Tracker](https://github.com/alokr25012-lab/take-one-nexus/issues) to see if the problem has already been reported.

### Suggesting Enhancements ✨
We love new ideas! If you have a suggestion, please open an issue with the "enhancement" label.

### Code Contributions 💻
1.  Find an issue you'd like to work on. If it's not assigned, comment on it to express interest.
2.  Create a new branch for your work: `git checkout -b feat/your-feature-name` or `fix/your-bug-fix`.
3.  Write your code, following our [Style Guides](#-style-guides).
4.  Test your changes thoroughly.

---

## 🎨 Style Guides

### Git Commit Messages
- Use the present tense ("Add feature" not "Added feature").
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
- Reference issues and pull requests liberally after the first line.
- Example: `feat: add real-time credit updates to chat #123`

### Coding Standards
- **Next.js**: Use functional components and hooks. Follow the App Router conventions.
- **Express**: Maintain modularity in `routes/`. Use the `authenticateUser` middleware for protected routes.
- **CSS**: We use a "Cinematic UI" design system. Stick to the CSS variables defined in `index.css` (e.g., `--neon`, `--void`, `--silver`).
- **Aesthetics**: Every UI change should feel "premium". Use smooth transitions, subtle glows, and monospace fonts for data.

---

## 📥 Pull Request Process

1.  Ensure your code is well-formatted and documented.
2.  Update the `README.md` or `ARCHITECTURE.md` if your changes introduce new concepts or configurations.
3.  Provide a clear description of the changes in your PR.
4.  Link the PR to the relevant issue (e.g., `Closes #123`).
5.  Wait for a maintainer to review your PR. Be prepared to make changes based on feedback.

---

## 💬 Community

- **Discord**: [Join our Discord Server](https://discord.gg/yourlink)
- **Twitter**: [@TakeOneNexus](https://twitter.com/yourhandle)

Thank you for building the cinematic future with us! 🚀
