# FiscalZen Documentation Index

Welcome to the **FiscalZen** developer documentation. This repository contains a monorepo structure for managing fiscal documents (NFe, NFSe, CTe, MDFe), interacting with SEFAZ and municipal web services, and providing a centralized dashboard for fiscal management.

## 📚 Core Documentation

| Guide | Description |
| :--- | :--- |
| **[Project Overview](./project-overview.md)** | General introduction, business goals, and project roadmap. |
| **[Architecture Notes](./architecture.md)** | Detailed look at the monorepo structure, service boundaries, and tech stack. |
| **[Development Workflow](./development-workflow.md)** | Setup instructions, branching strategies, and CI/CD pipelines. |
| **[Testing Strategy](./testing-strategy.md)** | Overview of unit, integration, and E2E testing across packages. |
| **[Glossary & Domain Concepts](./glossary.md)** | Key fiscal terms (NSU, Abrasf, SEFAZ, Manifestação) and business rules. |
| **[Data Flow & Integrations](./data-flow.md)** | How data moves from SEFAZ/Prefeituras to our database and search engine. |
| **[Security & Compliance](./security.md)** | Authentication (Clerk), certificate management (A1), and audit logging. |
| **[Tooling & Productivity](./tooling.md)** | Internal scripts, CLI tools, and IDE configurations. |

## 🏗️ Repository Structure

This project is managed as a **pnpm workspace** with the following key areas:

### Applications (`apps/`)
- `api`: Fastify-based backend providing REST endpoints and background jobs.
- `web`: Next.js frontend dashboard for end-users.

### Packages (`packages/`)
- `sefaz-client`: Low-level SOAP client and services for SEFAZ (NFe, CTe, MDFe).
- `nfse-client`: Integration with municipal services (ABRASF standards and RPA scrapers).
- `xml-parser`: Robust utility for detecting, decoding (Gzip/Base64), and parsing fiscal XMLs.
- `database`: Drizzle ORM schemas and migrations for PostgreSQL.
- `shared`: Common TypeScript types, Zod schemas, and validation logic.
- `ui`: Shared React component library based on Tailwind CSS and Radix UI.

## 🛠️ Main Entry Points

### Backend API
The API is built with Fastify and organized into modules:
- **Agents**: Manages local synchronization agents.
- **Companies**: Tenant and company management.
- **Documents**: Querying and processing of fiscal documents.
- **Jobs**: BullMQ workers for background sync and XML processing.

### SEFAZ Integration
The `SefazClient` handles the heavy lifting of communication with government servers:
- **Digital Signature**: `signXml` handles A1 certificate signing.
- **Distribution**: `NFeDistDFe` fetches documents by NSU.
- **Events**: `Manifestacao` handles "Ciência da Operação" and "Confirmação".

### NFSe Integration
The system supports multiple municipal integration strategies:
- **ABRASF**: Standardized SOAP communication for supported cities.
- **RPA**: Playwright-based `BrowserManager` for cities without API access.

## 🚀 Quick Start for Developers

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Environment Setup**:
    Copy `.env.example` to `.env` in `apps/api` and `apps/web`.

3.  **Run Development Environment**:
    ```bash
    pnpm dev
    ```

4.  **Database Migrations**:
    ```bash
    pnpm --filter database db:generate
    pnpm --filter database db:push
    ```

## 🔍 Key Symbols and APIs

For detailed implementation details, refer to:
- `AbrasfClient`: Core class for municipal service integration.
- `SefazClient`: Core class for national service integration.
- `detectDocumentType`: Automated XML identification utility.
- `addXmlProcessorJob`: Entry point for document processing pipeline.

---
*Last Updated: 2023. This documentation is maintained by the FiscalZen Engineering team.*
