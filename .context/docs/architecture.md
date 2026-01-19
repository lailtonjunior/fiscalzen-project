---
status: filled
generated: 2026-01-18
---

# Architecture Notes

## System Architecture Overview

FiscalZen follows a **modular monorepo** architecture using Turborepo. The system consists of:

- **Frontend**: Next.js 14 application (apps/web)
- **Backend**: Fastify REST API (apps/api)
- **Shared Packages**: Reusable libraries for database, parsing, and integrations
- **Background Workers**: BullMQ workers for async processing

### Deployment Model

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│                    (Browser / Mobile)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│                      (apps/web)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Fastify API                              │
│                      (apps/api)                              │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Modules    │    Jobs      │   Services   │    Plugins     │
│  (routes)    │  (workers)   │  (business)  │   (auth, etc)  │
└──────────────┴──────────────┴──────────────┴────────────────┘
        │              │              │
        ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│ PostgreSQL│  │   Redis   │  │Meilisearch│  │  MinIO/S3 │
│ (Drizzle) │  │ (BullMQ)  │  │ (Search)  │  │ (Storage) │
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

## Architectural Layers

### 1. Config Layer
Configuration and constants for SEFAZ endpoints and environments.

- **Location**: `packages/sefaz-client/src/constants/`
- **Key exports**:
  - [`getNFeDistDFeEndpoint`](packages/sefaz-client/src/constants/endpoints.ts#L145)
  - [`getCTeDistDFeEndpoint`](packages/sefaz-client/src/constants/endpoints.ts#L153)
  - [`getMDFeDistDFeEndpoint`](packages/sefaz-client/src/constants/endpoints.ts#L157)
  - [`getAmbienteCode`](packages/sefaz-client/src/constants/endpoints.ts#L161)

### 2. Models Layer
Database schema definitions using Drizzle ORM.

- **Location**: `packages/database/src/schema/`
- **Key tables**:
  - `tenants` - Multi-tenant organizations
  - `companies` - Companies within tenants
  - `documents` - Fiscal documents (NFe, CTe, MDFe)
  - `documentEvents` - Document events (cancellation, correction, etc.)
  - `nsuControl` - SEFAZ sync state per company/docType
  - `nfseConfigs` - NFSe municipality configurations

### 3. Repositories Layer
Data access using Drizzle queries.

- **Location**: `packages/database/src/`
- **Pattern**: Direct Drizzle queries in service layer (no separate repository classes)

### 4. Services Layer
Business logic for each domain.

- **Location**: `apps/api/src/modules/*/service.ts`
- **Key services**:
  - `companiesService` - Company CRUD and certificate management
  - `documentsService` - Document CRUD and search
  - `manifestacaoService` - Manifestação workflow
  - `dashboardService` - Analytics and statistics

### 5. Controllers Layer
API route handlers using Fastify.

- **Location**: `apps/api/src/modules/*/routes.ts`
- **Pattern**: Each module exports a route registration function
- **Key routes**:
  - `/api/companies` - Company management
  - `/api/documents` - Document operations
  - `/api/manifestacao` - Manifestação endpoints
  - `/api/dashboard` - Dashboard data
  - `/api/jobs` - Job control

### 6. Utils Layer
Shared utilities across the application.

- **Location**: `packages/shared/src/`
- **Categories**:
  - `validators/` - CPF, CNPJ, chave de acesso validation
  - `formatters/` - Date, currency, document formatting
  - `constants/` - Estados, doc types, situações

### 7. Components Layer
React components for the frontend.

- **Location**: `apps/web/components/`
- **Structure**:
  - `dashboard/` - Dashboard widgets
  - `documents/` - Document list and details
  - `companies/` - Company management
  - `manifestacao/` - Manifestação workflow
  - `layout/` - Header, sidebar, etc.

## Background Job Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Scheduler                              │
│              (apps/api/src/jobs/scheduler.ts)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BullMQ Queues                           │
├───────────────┬───────────────┬──────────────┬──────────────┤
│ sefaz-monitor │ xml-processor │ search-sync  │ nfse-monitor │
└───────────────┴───────────────┴──────────────┴──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Workers                                │
│            (apps/api/src/jobs/workers.ts)                   │
└─────────────────────────────────────────────────────────────┘
```

### Job Flow

1. **Scheduler** runs every 30 minutes
2. Checks `nsu_control` table for companies needing sync
3. Adds jobs to `sefaz-monitor` queue
4. Worker calls SEFAZ DistDFe service
5. Downloaded XMLs are queued to `xml-processor`
6. Parsed documents are saved and queued to `search-sync`

## Multi-Tenancy

All data is isolated by `tenant_id`:

```sql
-- Every query includes tenant filter
SELECT * FROM documents
WHERE tenant_id = $1
AND company_id = $2;
```

- `tenants` table stores organization data
- `companies` belong to a tenant
- All document queries filter by `tenant_id`
- JWT token includes `tenantId` claim

## Security Architecture

### Authentication Flow
1. User logs in → JWT token generated
2. Token includes: `userId`, `tenantId`, `email`
3. All API routes require valid JWT (via `fastify.authenticate`)
4. `getTenantId(request)` extracts tenant from token

### Certificate Security
- A1 certificates stored encrypted (AES-256-GCM)
- Encryption key from `CERT_ENCRYPTION_KEY` env var
- Certificates decrypted only when needed for SEFAZ calls

## Design Decisions

### Why Drizzle ORM?
- Type-safe queries without heavy abstraction
- Direct SQL when needed
- Good TypeScript integration

### Why BullMQ?
- Reliable job queue with Redis
- Built-in retry logic
- Job events and monitoring

### Why Meilisearch?
- Fast full-text search
- Typo-tolerant
- Easy to set up

### Why Turborepo?
- Efficient monorepo builds
- Shared dependencies
- Parallel execution
