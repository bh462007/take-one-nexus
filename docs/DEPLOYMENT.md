# Deployment Guide - TAKE ONE Nexus

This guide explains how to deploy and configure the TAKE ONE Nexus project on Vercel with a production MySQL database.

## 1. Database Setup

You will need a hosted MySQL database. Recommended providers:
- **Aiven for MySQL** (Reliable, easy SSL setup)
- **DigitalOcean Managed Databases**
- **PlanetScale** (Requires `sslmode=require`)

### SQL Schema
Ensure you run your database initialization scripts. If you have a `database/schema.sql` file, run it against your production database.

## 2. Environment Variables

Set the following variables in your Vercel project dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `mysql-instance.aivencloud.com` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `take_one` |
| `DB_USER` | Database user | `avnadmin` |
| `DB_PASSWORD`| Database password | `your-secret-password` |
| `DB_SSL` | Enable SSL (Required for cloud DBs) | `true` |
| `JWT_SECRET` | Secret key for JWT | `a-long-random-string-here` |
| `NODE_ENV` | Environment mode | `production` |
| `SMTP_USER` | Email for notifications | `your-email@gmail.com` |
| `SMTP_PASS` | App password for SMTP | `xxxx-xxxx-xxxx-xxxx` |

**Alternative:** Use `DATABASE_URL` for a single connection string:
`mysql://user:password@host:port/database?sslmode=require`

## 3. Vercel Deployment

1. Connect your GitHub repository to Vercel.
2. Add the environment variables listed above.
3. Vercel will automatically detect the `vercel.json` and deploy the `server.js` using `@vercel/node`.

## 4. Verification

After deployment, visit your production URL and check the health status:
`https://your-app.vercel.app/api/health`

It should return `"status": "ok"` and `"database": {"status": "online"}`.

## Troubleshooting

### "Database is currently unavailable"
- Check if `DB_SSL=true` is set. Most cloud providers require SSL.
- Verify your database host allows connections from the public internet or Vercel IPs.
- Double-check your credentials by running `node scripts/test-db.js` locally with production env vars.

### "Authentication system not configured"
- Ensure `JWT_SECRET` is set in Vercel.
