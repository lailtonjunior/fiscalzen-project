# FiscalZen Developer Documentation

Welcome to the **FiscalZen** project! FiscalZen is a comprehensive fiscal management platform designed to automate the lifecycle management of Brazilian electronic fiscal documents such as NFe, NFSe, CTe, and MDFe. It integrates extensively with government SEFAZ web services and various municipal service providers.

---

## 📚 Documentation Overview

| Guide             | Description                                                                                  |
|-------------------|----------------------------------------------------------------------------------------------|
| **[Architecture](./architecture.md)**         | Overview of the monorepo structure, service boundaries, and technology stack.         |
| **[Data Flow](./data-flow.md)**               | Explanation of document flow from SEFAZ services to local database and search engine. |
| **[Security](./security.md)**                  | Managing A1 certificates, encryption strategies, and API authentication.              |
| **[Glossary](./glossary.md)**                  | Business terms and domain-specific explanations including NSU, ABRASF, Manifestação. |

---

## 🏗️ Repository Structure

FiscalZen is organized as a modular monorepo with applications and packages that separate concerns clearly:

### Applications (`apps/`)

- **`api`**  
  The backend API built on Fastify. Responsible for REST endpoints, background job processing (using BullMQ), and core business logic implementation.

- **`web`**  
  The frontend dashboard powered by Next.js, providing user-friendly tools to view, search, and manage fiscal documents.

### Core Packages (`packages/`)

- **`sefaz-client`**  
  Provides SOAP client capabilities to communicate with national SEFAZ services, including XML signing with A1 certificates, handling document distribution (NSU), and event manifestation.

- **`nfse-client`**  
  Integration for municipal NFSe services, supporting ABRASF SOAP standards and RPA automation using Playwright for municipalities without official APIs.

- **`xml-parser`**  
  Implements XML detection, decoding (gzip/base64), and schema-driven parsing to convert fiscal document XMLs into structured JSON.

- **`database`**  
  Defines database schemas and repository patterns using Drizzle ORM targeting PostgreSQL.

- **`shared`**  
  Contains shared types, Zod schemas, utilities, and constants used across the system.

---

## 🛠️ Key Technical Modules

### 1. SEFAZ Integration (`sefaz-client`)

The `SefazClient` class encapsulates all communication with SEFAZ web services, including SOAP envelope handling and digital XML signing using A1 certificates. It supports multiple fiscal document types such as NFe, CTe, and related events.

**Usage example:**

```typescript
import { SefazClient } from '@fiscalzen/sefaz-client';

const client = new SefazClient({
  certificado: certificadoA1Buffer,  // PKCS#12 (.pfx) certificate buffer
  password: 'your_cert_password',
  ambiente: 'producao',               // 'homologacao' or 'producao'
  uf: 'SP'                           // Brazilian state code (UF)
});

const response = await client.distribuicaoDFe({ lastNSU: '000000000000001' });
console.log(response);
```

**Features:**

- Automatic retries and error parsing via `SefazError`.
- SOAP envelope manipulation and XML digital signature support.
- Handles synchronous and asynchronous SEFAZ service calls.

---

### 2. XML Parser (`xml-parser`)

Provides a robust XML detection and parsing system tailored for the variety of fiscal document formats that FiscalZen processes.

**Usage example:**

```typescript
import { detectDocumentType, createParser } from '@fiscalzen/xml-parser';

const xmlString = '<NFe...';  // Raw fiscal document XML
const detection = detectDocumentType(xmlString);

if (detection.type === 'nfe') {
  const parser = createParser(detection.schema);
  const data = await parser.parse(xmlString);
  console.log(data.emitente.cnpj);
}
```

**Capabilities:**

- Support for multiple schemas (NFe 4.00, CTe, NFSe, etc.).
- Built-in base64 and gzip decoding.
- Schema-driven parsing producing strongly typed JSON output.
- Extensible with additional document types and versions.

---

### 3. Background Jobs (`apps/api/src/jobs`)

FiscalZen uses BullMQ for managing scalable, asynchronous job queues vital for processing large volumes of documents and integration points.

- **sefaz-monitor**: Monitors SEFAZ for new fiscal documents for registered companies.
- **xml-processor**: Parses and stores raw XML documents and metadata into the database.
- **search-sync**: Synchronizes document data with Meilisearch for fast, full-text querying in the frontend.

**Adding a job example:**

```typescript
import { addSefazMonitorJob } from 'apps/api/src/jobs/queues';

await addSefazMonitorJob(companyId);
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- pnpm v8+
- Docker (for PostgreSQL, Redis, Meilisearch in development)

### Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start required services**

   ```bash
   docker-compose up -d
   ```

3. **Apply database migrations**

   ```bash
   pnpm --filter @fiscalzen/database db:push
   ```

4. **Run the development servers**

   ```bash
   pnpm dev
   ```

---

## 🔍 Essential Public API Modules

| Module                | Package                 | Purpose                                     |
|-----------------------|-------------------------|---------------------------------------------|
| `SefazClient`         | `@fiscalzen/sefaz-client` | SOAP client for national SEFAZ services with XML signing |
| `AbrasfClient`        | `@fiscalzen/nfse-client`  | Client interface to ABRASF municipal NFSe services, SOAP and RPA based |
| `detectDocumentType`  | `@fiscalzen/xml-parser`   | Auto-identification of XML schema and document type |
| `addSefazMonitorJob`  | `apps/api/src/jobs/queues`| Queue job to trigger SEFAZ document sync |
| `loadCertificado`     | `@fiscalzen/sefaz-client` | Loads and validates PKCS#12 A1 certificates |

---

## 📖 Additional Resources

- [Architecture](./architecture.md) – Detailed monorepo layout and module dependencies.
- [Data Flow](./data-flow.md) – End-to-end processing of fiscal documents.
- [Security](./security.md) – Certificate handling, secure signing, and API authentication.
- [Glossary](./glossary.md) – Explanation of domain-specific terms and abbreviations.

---

*Last updated: June 2024 — FiscalZen Engineering Team*
