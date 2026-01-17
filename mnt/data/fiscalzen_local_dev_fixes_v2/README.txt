FiscalZen - Local Dev Fixes (tools)

What this bundle contains:
- tools/kill-port.mjs
- tools/clean-web-next-cache.mjs
- tools/apply-next-dev-cache-fix.mjs

How to apply:
1) Copy these files into your repo at: C:\FiscalZen\fiscalzen\tools\
   (overwrite existing ones)

2) Run (PowerShell):
   node tools/kill-port.mjs 3000
   node tools/kill-port.mjs 3001

3) Clean Next cache:
   node tools/clean-web-next-cache.mjs

4) Disable webpack persistent cache in Next dev:
   node tools/apply-next-dev-cache-fix.mjs

5) Start services again:
   pnpm --filter @fiscalzen/api dev
   pnpm --filter @fiscalzen/web dev
