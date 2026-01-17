# FiscalZen - Postgres Docker Sync Fix (DEV)

Este patch corrige o erro:

- `password authentication failed for user "fiscalzen"` (Postgres 28P01)

## O que faz

- Lê `POSTGRES_USER`, `POSTGRES_DB` e `POSTGRES_PASSWORD` do container Docker Postgres (via `docker inspect` em JSON, sem templates).
- Atualiza `DATABASE_URL` em:
  - `.env`
  - `apps/api/.env`
  - `apps/api/.env.local` (se existir)

## Como aplicar

1) Extraia o zip na raiz do repo (onde existe a pasta `tools/`).
2) Rode:

```bash
node tools/print-postgres-docker-env.mjs
node tools/apply-postgres-docker-fix.mjs
```

3) Reinicie a API:

```bash
pnpm --filter @fiscalzen/api dev
```

4) Teste:

```bash
node tools/check-api-health.mjs
```
