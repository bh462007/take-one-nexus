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
| `MAIL_FROM` | Sender email address |

### 2. Database Initialization
Once your environment variables are set, you need to create the required tables. You can do this by running the initialization script:

```bash
# Run this locally with production env vars or via a Vercel one-off command
node database/init.js
```

Alternatively, you can manually execute the SQL found in `database/schema.sql` using your database client.

### 3. Safe Mode
The API routes are designed with "Safe Empty States". If the database is not yet initialized or becomes unreachable, read-only routes (like the homepage and search) will return empty data (200 OK) instead of crashing with 500 errors. This allows the frontend to load gracefully while you troubleshoot connection issues.
