# FiscalZen - Project Overview

FiscalZen is a distributed, multi-tenant automation platform designed to manage Brazilian electronic fiscal documents (DF-e). It automates the acquisition, parsing, acknowledgment (manifestação), and long-term storage of various fiscal document types by interfacing directly with government tax authorities at both national (SEFAZ) and municipal levels.

---

## Core Value Proposition

- **Automated Monitoring**: Continuously polls SEFAZ and municipal web services for new fiscal documents issued against registered CNPJs.
- **Unified Data Model**: Normalizes diverse XML document structures into a standardized, TypeScript-typed model for consistency and safety.
- **Compliance Automation**: Handles mandatory legal workflows such as "Manifestação do Destinatário" with minimal manual intervention.
- **Search & Analytics**: Enables full-text search on document contents and participants through integration with Meilisearch.

---

## System Architecture

FiscalZen is organized as a monorepo leveraging **Turborepo** and **pnpm** for efficient workspace management. The architecture maintains a clear separation of concerns:

| Location                      | Purpose                                                                     |
| -----------------------------|----------------------------------------------------------------------------|
| **`apps/api`**                | Backend API built on Fastify; manages tenancy, authentication, and job scheduling. |
| **`apps/web`**                | Frontend dashboard built with Next.js for document management, manifestação, and configuration. |
| **`packages/sefaz-client`**   | Core service handling SOAP communication, digital signatures (A1 certificates), and protocol operations with SEFAZ. |
| **`packages/nfse-client`**    | NFSe specialized client supporting ABRASF standards and RPA-based municipal scraping techniques. |
| **`packages/xml-parser`**     | Parsing engine to convert complex XML and compressed payloads into strongly typed objects. |
| **`packages/database`**       | PostgreSQL schema and migrations implemented via Drizzle ORM.              |
| **`packages/shared`**         | Shared utilities including Zod schemas, TypeScript types, and validation logic used across frontend, backend, and services. |

---

## Supported Document Types

| Document Type                                   | Model Code | Data Source                                  |
|------------------------------------------------|------------|----------------------------------------------|
| **NFe (Nota Fiscal Eletrônica)**                | 55         | SEFAZ National Web Services                   |
| **CTe (Conhecimento de Transporte Eletrônico)**| 57         | SEFAZ National Web Services                   |
| **MDFe (Manifesto Eletrônico de Documentos Fiscais)** | 58  | SEFAZ National Web Services                   |
| **NFSe (Nota Fiscal de Serviços Eletrônica)**  | -          | Municipal Governments via ABRASF or RPA Scraper |

---

## Key Technical Workflows

### 1. Document Discovery and Ingestion

- The platform regularly polls SEFAZ services for the latest document references (NSU - Número Sequencial Único).
- When new documents are found, their XML payloads are queued for asynchronous processing.
- The **XML Parser** component detects the document type, validates digital signatures, and extracts metadata such as invoice items, taxes, and participant information.
- Parsed objects are persisted in PostgreSQL, while raw content is indexed in Meilisearch for performant full-text search capabilities.

### 2. Digital Certificate Management

- FiscalZen supports **A1 Digital Certificates** (commonly in PFX/PKCS12 format) to securely sign SOAP requests sent to SEFAZ web services.
- Cryptographic functions, including digest calculation, XML signature generation, and verification, are implemented within `packages/sefaz-client`.
- Certificate lifecycle management includes loading, caching, validation, and error handling.

### 3. Legal Document Events Management (Manifestação do Destinatário)

- Automates legally required workflows for document recipient acknowledgment.
- Supports event types such as:
  - **Ciência da Operação** (awareness of transaction) which authorizes access to full XML.
  - **Confirmação, Desconhecimento, e Operação Não Realizada** events that update the fiscal status accordingly.
- Seamlessly integrates with SEFAZ’s event web services to submit and track these acknowledgments.

---

## Infrastructure Stack

| Category          | Technology                                      |
| ----------------- | ---------------------------------------------- |
| **Runtime**       | Node.js 20+ (LTS)                              |
| **Language**      | TypeScript                                    |
| **Database**      | PostgreSQL 16                                |
| **Search Engine** | Meilisearch                                  |
| **Queue / Cache** | Redis + BullMQ                               |
| **ORM**           | Drizzle ORM                                  |
| **Frontend**      | Next.js 14 (App Router), TailwindCSS, Shadcn/UI |
| **API Framework** | Fastify                                      |

---

## Development Essentials

### Setting Up Development Environment

1. **Start infrastructure containers:** Run Docker containers for PostgreSQL, Redis, and Meilisearch.
2. **Install dependencies:** Execute `pnpm install` in the project root.
3. **Database setup:** Synchronize the database schema using `pnpm --filter @fiscalzen/database db:push`.
4. **Start development mode:** Run `pnpm dev` to initialize backend services and the frontend dashboard.

### Codebase Entry Points

| Area                      | Location                              | Description                                                  |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------|
| API Routes                | `apps/api/src/modules`               | Domain-specific REST endpoints for documents, companies, jobs, etc. |
| Background Jobs           | `apps/api/src/jobs`                  | Worker jobs for SEFAZ monitoring, XML processing, search indexing |
| Database Schema           | `packages/database/src/schema`       | Drizzle ORM entities and migration definitions              |
| Core SEFAZ Client Logic   | `packages/sefaz-client/src`           | SOAP client, signature utilities, certificate management, and service methods |
| XML Parsing Engine       | `packages/xml-parser/src`              | Document detection, typed parsing, and compressed payload handling |

---

## Usage Example: Document Retrieval Flow (Simplified)

```typescript
import { SefazClient } from '@fiscalzen/sefaz-client';

// Instantiate a configured SEFAZ client with certificate info and environment
const sefazClient = new SefazClient({
  certPath: '/path/to/cert.pfx',
  certPassword: 'your-cert-password',
  ambiente: 'homologacao', // 'producao' for production
});

// Background job polling for new documents
async function runMonitorJob() {
  const distResponse = await sefazClient.distDFe({
    // parameters like CNPJ, initial NSU, environment, etc.
  });

  if (distResponse.documents.length) {
    for (const doc of distResponse.documents) {
      // Enqueue each XML document for asynchronous processing
      queueXmlProcessor.add('processDocument', { xml: doc.xmlBase64 });
    }
  }
}
```

---

## Related Packages and Notes

- **`packages/nfse-client`**: Specialized client for municipal NFSe handling where standards vary or lack APIs, implementing ABRASF protocols or robotic process automation (RPA) for scraping.
- **`apps/web`**: Next.js-based dashboard providing document visualization, company and certificate management, and manifestação workflows.
- **`apps/api`**: Backend service exposing REST API, managing multi-tenant authentication, job scheduling, and business logic orchestration.
- **`packages/shared`**: Contains strongly-typed TypeScript models and validation logic reused across frontend, backend, and service packages for consistency.

---

## Additional Resources

- **API Documentation**: Generated OpenAPI docs accessible at the `/docs` endpoint of the API server.
- **Database Schema Documentation**: Located in `packages/database/src/schema`—includes entity models and relations.
- **Background Job Implementation**: Found in `apps/api/src/jobs`—contains source for worker processes and queue handling.
- **XML Parsing and Signature Validation**: Core logic in `packages/xml-parser` and `packages/sefaz-client`.
- **Frontend Components and Pages**: Implemented under `apps/web/components` and `apps/web/app`.

---

This overview provides new developers and contributors a foundational understanding of FiscalZen’s architecture, system capabilities, and development workflows. For deeper dives into specific modules, consult the respective package README files and source code directories.
