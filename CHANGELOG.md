# 🔄 Changelog

All notable changes to the TAKE ONE Nexus project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-05-16
### Added
- **Global Timezone Support**: Admin analytics and charts now natively support Indian Standard Time (IST) out of the box, ensuring midnight resets occur correctly for the target demographic.
- **Cinematic Markdown Documentation**: Complete rewrite of all standard open-source documentation including README, CONTRIBUTING, SECURITY, and ROADMAP.
- **Clerk Authentication Ready**: Backend models and middleware refactored to support seamless migration to Clerk.

### Changed
- **Codebase Optimization**: Removed all unused components, dead code, and debug spam (`console.log`) across frontend and backend for a smaller bundle size and faster execution.
- **UI Architecture**: Moved multiple Express-served pages into the Next.js App Router for better client-side transitions and SEO.

### Fixed
- **API Response Leaks**: Fixed an issue where raw HTML error pages were leaking to the frontend during failed API requests. All API endpoints now return strict JSON.
- **Realtime Listener Leaks**: Cleaned up unmounted component listeners to prevent Pusher memory leaks.
- **Dashboard Synchronization**: Corrected the SQL `GROUP BY` logic so charts don't misalign dates due to UTC offsets.

---

## [0.9.0] - 2026-05-10
### Added
- **Global Chat**: Added real-time direct messaging between users using Pusher Websockets.
- **Credits System**: Implemented the `credits` table and UI components to reward active filmmakers.
- **Admin Command Center**: Added a highly styled, cinematic dashboard for platform telemetry.

### Fixed
- **Database Connection Pooling**: Resolved `Too many connections` errors by using global Prisma singletons and robust Express connection pooling.

---

## [0.1.0] - 2026-01-01
### Added
- Initial project scaffold.
- Basic TiDB integration.
- Static UI shell (Project/Crew/Profile screens).
