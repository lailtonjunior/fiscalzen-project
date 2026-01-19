# Project Overview: FiscalZen

FiscalZen is a distributed platform designed to automate the lifecycle of Brazilian electronic fiscal documents (DF-e). It handles the synchronization, parsing, storage, and legal compliance of NFe, CTe, MDFe, and NFSe documents by integrating directly with SEFAZ (Secretaria da Fazenda) and municipal web services.

## Core Purpose

The platform solves the complexity of managing fiscal documents in Brazil by providing:
- **Automated Monitoring**: Real-time polling of national and municipal tax authorities.
- **Data Centralization**: A single source of truth for all XML documents and their associated events (Cancellation, Correction, etc.).
- **Legal Compliance**: Ensuring documents are stored for the mandatory period and that "Manifestação do Destinatário" (Recipient Acknowledgment) is performed correctly.
- **Searchability**: Full-text search across XML contents (items, values, participants).

## System Architecture

The project is organized as a monorepo using Turborepo and pnpm, separating concerns into specialized packages and applications.

### 1. Applications (`apps/`)
- **`api`**: A Fastify-based REST API that handles business logic, tenant management, and job scheduling.
- **`web`**: A Next.js dashboard providing a user interface for document visualization, manifestação workflows, and configuration.

### 2. Core Packages (`packages/`)
- **`sefaz-client`**: Handles SOAP communication with SEFAZ, digital signature of XMLs using A1 certificates, and protocol management.
- **`nfse-client`**: Specialized client for Municipal invoices (NFSe), supporting ABRASF standards and RPA (Robotic Process Automation) for non-standard cities.
- **`xml-parser`**: High-performance parser that converts complex SEFAZ XML structures into standardized TypeScript objects and detects document types.
- **`database`**: Centralized schema using Drizzle ORM (PostgreSQL), managing tenants, companies, documents, and audit logs.
- **`shared`**: Common TypeScript interfaces, Zod schemas, and utility functions used across both frontend and backend.
- **`ui`**: Shared React component library based on TailwindCSS and shadcn/ui.

## Key Technical Workflows

### Document Synchronization (SEFAZ)
1. **Trigger**: A BullMQ worker (`sefaz-monitor`) runs periodically.
2. **Fetch**: The `SefazClient` calls the `distDFe` service using the company's A1 certificate.
3. **Queue**: New documents are placed in the `xml-processor` queue.
4. **Parse & Store**: The `xml-parser` extracts data, and the `api` saves it to PostgreSQL and indexes it in Meilisearch.

### Manifestação do Destinatário
1. **User Action**: User selects a document in the `web` dashboard and chooses an action (e.g., `Confirmação da Operação`).
2. **Execution**: The API sends a signed event to SEFAZ via `SefazClient`.
3. **Update**: Upon SEFAZ approval, the document status is updated, and the full XML is automatically queued for download if it wasn't available yet.

## Infrastructure Stack

| Component | Technology |
| :--- | :--- |
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript |
| **Primary Database** | PostgreSQL 16 |
| **Cache & Queues** | Redis |
| **Search Engine** | Meilisearch |
| **Object Storage** | S3-compatible (MinIO / AWS S3) |
| **Communication** | SOAP (SEFAZ) / REST (Internal) |

## Development Environment Entry Points

- **API Entry**: `apps/api/src/index.ts`
- **Frontend Entry**: `apps/web/app/page.tsx`
- **Database Schema**: `packages/database/src/schema/`
- **Job Definitions**: `apps/api/src/jobs/workers.ts`

## Getting Started Summary

To initialize the project locally:

1.  **Infrastructure**: Start the local services (DB, Redis, Meilisearch) via Docker.
    ```bash
    docker compose -f docker/docker-compose.yml up -d
    ```
2.  **Installation**: Install dependencies from the root.
    ```bash
    pnpm install
    ```
3.  **Database**: Push the schema to your local instance.
    ```bash
    pnpm --filter @fiscalzen/database db:push
    ```
4.  **Launch**: Run all applications in development mode.
    ```bash
    pnpm dev
    ```

## Document Types Supported

- **NFe** (Nota Fiscal Eletrônica - Models 55)
- **CTe** (Conhecimento de Transporte Eletrônico - Model 57)
- **MDFe** (Manifesto Eletrônico de Documentos Fiscais - Model 58)
- **NFSe** (Nota Fiscal de Serviço Eletrônica - Municipal)
