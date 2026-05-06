# TAKE ONE Nexus

A collaboration platform for film crews and scriptwriters.

## Vercel Deployment & Database Setup

To deploy this backend to Vercel and connect it to a MySQL database, follow these steps:

### 1. Environment Variables
Add the following environment variables in your Vercel Project Settings:

| Variable | Description |
| :--- | :--- |
| `DB_HOST` | MySQL database host |
| `DB_PORT` | MySQL database port (default 3306) |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | A long random string for auth tokens |
| `SMTP_HOST` | SMTP server host (for notifications) |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
## Getting Started

1. **Install Dependencies**: `npm install`
2. **Setup Environment**: Copy `.env.example` to `.env` and fill in your details.
   - **IMPORTANT**: Ensure `JWT_SECRET` is set to a secure random string.
   - **IMPORTANT**: Ensure all `DB_` variables point to a valid MySQL instance.
3. **Initialize Database**: Run `node database/init.js` to create the schema.
4. **Start Server**: `npm run dev`

## Deployment

This app is designed to be deployed on Vercel. Ensure all environment variables from `.env.example` are added to your Vercel project settings.

### Required Environment Variables
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Your MySQL database credentials.
- `JWT_SECRET`: A secure string for session management.
- `SMTP_*`: Credentials for sending system notifications.

---

### 3. Safe Mode
The API routes are designed with "Safe Empty States". If the database is not yet initialized or becomes unreachable, read-only routes (like the homepage and search) will return empty data (200 OK) instead of crashing with 500 errors. This allows the frontend to load gracefully while you troubleshoot connection issues.
