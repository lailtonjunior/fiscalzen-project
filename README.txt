FiscalZen - Local DEV quick fixes (tools patch)

This patch fixes two blockers that prevent local development:

1) Postgres auth error (28P01)
   - API fails to start because DATABASE_URL password does not match the Docker container.

2) DEV auth bypass using non-UUID ids
   - When DISABLE_AUTH=true, auth.ts was setting tenantId/sub to strings like "dev-tenant",
     which breaks queries expecting UUID.

Included tools:
- tools/apply-postgres-docker-fix.mjs
- tools/print-postgres-docker-env.mjs
- tools/apply-auth-dev-ids-fix.mjs

How to use (PowerShell in repo root):

A) Sync DATABASE_URL with Docker Postgres
   node tools/print-postgres-docker-env.mjs
   node tools/apply-postgres-docker-fix.mjs

B) Fix DEV auth ids (UUID)
   node tools/apply-auth-dev-ids-fix.mjs

C) Start services
   pnpm --filter @fiscalzen/api dev
   pnpm --filter @fiscalzen/web dev

If port 3001 is already in use, kill the process:
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
