---
status: filled
generated: 2026-01-18
---

# FiscalZen - Project Overview

## What is FiscalZen?

FiscalZen is a Brazilian fiscal document management platform that automates the synchronization, storage, and management of electronic tax documents (NFe, CTe, MDFe, NFSe) with SEFAZ (Secretaria da Fazenda) web services.

## Problem Statement

Brazilian companies are legally required to:
1. Monitor and download tax documents issued against them (as recipients)
2. Respond to NFe documents with "manifestação do destinatário" (recipient acknowledgment)
3. Store XML documents for 5+ years
4. Track document status and events

Manual processes are error-prone, time-consuming, and non-compliant with SEFAZ requirements.

## Solution

FiscalZen provides:
- **Automated SEFAZ Sync**: Periodic polling of DistDFe services for NFe, CTe, and MDFe
- **Document Management**: Storage, search, and retrieval of fiscal documents
- **Manifestação Workflow**: UI for acknowledging received documents (Ciência, Confirmação, etc.)
- **Multi-tenant Architecture**: Multiple companies per tenant with isolated data
- **Real-time Dashboard**: Document statistics, sync status, and integrity monitoring

## Target Users

- **Accountants**: Managing multiple client companies
- **Finance Teams**: Tracking incoming/outgoing fiscal documents
- **IT Departments**: Integrating with ERP systems

## Quick Facts

- Root path: `C:\FiscalZen\fiscalzen`
- Primary languages:
  - TypeScript (.ts): 171 files
  - React/TSX (.tsx): 61 files
  - JavaScript (.mjs): 37 files

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TailwindCSS, shadcn/ui |
| Backend | Fastify, Node.js 20 |
| Database | PostgreSQL 16 (Drizzle ORM) |
| Queue | Redis + BullMQ |
| Search | Meilisearch |
| Storage | S3-compatible (MinIO for dev) |
| Monorepo | Turborepo + pnpm |
| Testing | Vitest |

## Project Structure

```
fiscalzen/
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/          # Next.js frontend
├── packages/
│   ├── database/     # Drizzle schema and migrations
│   ├── sefaz-client/ # SEFAZ web service integration
│   ├── xml-parser/   # NFe/CTe/MDFe XML parsing
│   ├── nfse-client/  # NFSe (municipal) integration
│   ├── shared/       # Common types, validators, formatters
│   └── ui/           # Shared UI components
├── docker/           # Local development infrastructure
└── tools/            # Development utilities
```

## Key Entry Points

| Package | Entry Point |
|---------|-------------|
| API | [`apps/api/src/index.ts`](apps/api/src/index.ts) |
| Web | [`apps/web/app/page.tsx`](apps/web/app/page.tsx) |
| Database | [`packages/database/src/index.ts`](packages/database/src/index.ts) |
| SEFAZ Client | [`packages/sefaz-client/src/index.ts`](packages/sefaz-client/src/index.ts) |
| XML Parser | [`packages/xml-parser/src/index.ts`](packages/xml-parser/src/index.ts) |

## Key Features

### 1. SEFAZ Integration
- DistDFe (Distribuição de DFe) for NFe, CTe, MDFe
- Manifestação do Destinatário events
- Automatic retry and rate limiting
- Certificate (A1) management

### 2. Document Processing
- XML parsing with validation
- Full-text search indexing
- Event tracking (cancelamento, carta correção, etc.)

### 3. Background Jobs
- `sefaz-monitor`: Polls SEFAZ for new documents
- `xml-processor`: Parses and stores downloaded XMLs
- `search-sync`: Indexes documents in Meilisearch
- `nfse-monitor`: NFSe synchronization

### 4. Security
- JWT authentication
- Multi-tenant data isolation (tenant_id on all queries)
- Certificate encryption at rest
- Rate limiting

## Getting Started

```bash
# Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# Install dependencies
pnpm install

# Run migrations
pnpm --filter @fiscalzen/database db:push

# Start development
pnpm dev
```

## Core Classes

### Error Handling
- [`AppError`](apps/api/src/utils/errors.ts#L1) - Base error class
- [`NotFoundError`](apps/api/src/utils/errors.ts#L16)
- [`ValidationError`](apps/api/src/utils/errors.ts#L35)
- [`SefazError`](packages/sefaz-client/src/types.ts#L194)

### SEFAZ Integration
- [`SefazClient`](packages/sefaz-client/src/client.ts#L4) - Main SEFAZ client
- [`SoapClient`](packages/sefaz-client/src/soap-client.ts#L28) - SOAP communication

### NFSe Integration
- [`AbrasfClient`](packages/nfse-client/src/abrasf/client.ts#L27) - ABRASF standard client
- [`BrowserManager`](packages/nfse-client/src/rpa/browser.ts#L7) - RPA automation

## Next Steps

1. Review [Architecture](./architecture.md) for system design
2. See [Development Workflow](./development-workflow.md) for day-to-day tasks
3. Check [Testing Strategy](./testing-strategy.md) for quality guidelines
