# FiscalZen — Repository Overview

## Visão Geral
- Monorepo (pnpm workspace + turborepo)
- Linguagem principal: TypeScript (ESM)
- Backend: Fastify 4 + TypeScript
- Filas: BullMQ (workers + scheduler)
- ORM: Drizzle + PostgreSQL
- Cache/queue infra: Redis
- Search: Meilisearch
- Storage: MinIO (S3)
- Frontend: Next.js 14 + Clerk

## Estrutura
- `apps/api`: API Fastify (config, jobs, modules, plugins, providers, routes, services, utils)
- `apps/web`: Next.js (app router + components + lib)
- `packages/*`:
  - `sefaz-client`: NF-e/CT-e/MDF-e
  - `nfse-client`: NFS-e
  - `xml-parser`: parsing XML fiscal
  - `database`: schema Drizzle
  - `pdf-generator`: pdfmake
  - `shared`: tipos/utilidades
  - `ui`: design system
  - `cli`: comandos internos

## Infra local (Docker)
- PostgreSQL 16 (porta 5433:5432)
- Redis 7 (6379)
- Meilisearch 1.6 (7700)
- MinIO (9000/9001)

## Pontos de entrada
- API: `apps/api/src/index.ts`, `apps/api/src/app.ts`
- Web: Next.js App Router
- DB: migrations (drizzle)

## Padrões
- Service Layer predominante
- Multi-tenant (tenantId em queries)
- Logging: Pino
- Validação: Zod

## Pontos de atenção (não-bloqueantes)
- ESLint central ausente
- versões divergentes de date-fns / Radix (avaliar padronização)
- roadmap: upgrade Next.js 15
