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

### Required Vercel Environment Variables

To ensure the production system works, you **MUST** add these variables in your Vercel Project Settings:

| Variable | Importance | Example / Description |
| :--- | :--- | :--- |
| `DB_HOST` | **CRITICAL** | Your MySQL host (e.g., `aws.connect.com`). Do NOT leave blank. |
| `DB_PORT` | Required | Usually `3306`. |
| `DB_NAME` | Required | Your database name (e.g., `take_one`). |
| `DB_USER` | Required | Your database username. |
| `DB_PASSWORD` | Required | Your database password. |
| `JWT_SECRET` | **CRITICAL** | A long random string (e.g., `32+ characters`). |
| `ALLOWED_ORIGINS`| Optional | Comma-separated list of extra CORS origins. |
| `SMTP_HOST` | Required | SMTP server host for notifications. |
| `SMTP_USER` | Required | SMTP username. |
| `SMTP_PASS` | Required | SMTP app password. |

### Troubleshooting Production Auth
If you see "Could not create account" or "Database unavailable" in production:
1. Check **Vercel Deployment Logs**: Look for `[DB] CRITICAL` or `JWT_SECRET is missing` errors.
2. Check **Health Endpoint**: Visit `https://your-app.vercel.app/api/health`.
   - Ensure `jwt_secret_set: true`.
   - Ensure `db_host_set: true`.
   - Ensure `database: connected`.
3. Check **CORS**: The app automatically allows `.vercel.app` subdomains. If using a custom domain, add it to `ALLOWED_ORIGINS`.

### 3. Safe Mode
The API routes are designed with "Safe Empty States". If the database is not yet initialized or becomes unreachable, read-only routes will return empty data (200 OK) instead of crashing. However, **Registration and Login will fail (503/500)** until the database and JWT_SECRET are correctly configured.

