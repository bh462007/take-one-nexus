# TAKE ONE Go-Live Next Steps

This file is the practical checklist before TAKE ONE becomes public.

## SMTP

1. Create a verified sender address such as `hello@takeone.example`.
2. Add real SMTP values to `.env`:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MAIL_FROM`
3. Restart the server.
4. Login and call `POST /api/system/email/test`.
5. If the test email arrives, collaboration request emails can be trusted for launch testing.

## HTTPS Deployment

1. Use a real domain.
2. Put the Node app behind Nginx, Caddy, Render, Railway, Fly.io, or another HTTPS provider.
3. Set production CORS to only the real domain.
4. Replace `JWT_SECRET` with a long random secret.
5. Keep `.env` private and never commit it.
6. Run the app with a process manager such as PM2 or the platform's built-in process runner.

## Backups

1. Run daily MySQL backups.
2. Store backups outside the server machine.
3. Test restoring a backup before launch.
4. Keep at least 7 daily backups and 4 weekly backups.

## Monitoring

1. Use `GET /api/health` for uptime monitoring.
2. Add error tracking such as Sentry later.
3. Log failed login attempts, failed SMTP sends, server errors, and database errors.
4. Add disk, CPU, memory, and database storage alerts.

## Legal And Safety

1. Finish privacy policy, terms, community rules, and copyright takedown process.
2. Add a public report button on script cards and profile cards.
3. Give at least one trusted account moderator access using `MODERATOR_EMAILS`.
4. Review moderation reports from `/moderation`.

## Still Needed

- Real file upload for scripts/posters with size and file-type checks.
- Password reset and email verification.
- Rate limiting for login, register, request, and email endpoints.
- Admin dashboard for users, scripts, and reports.
- Full testing on desktop and mobile browsers.
