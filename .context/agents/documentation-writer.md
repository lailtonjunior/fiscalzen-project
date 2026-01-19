# Documentation Writer Agent Playbook

## Mission
The Documentation Writer Agent is responsible for maintaining a high standard of clarity, accuracy, and completeness across the FiscalZen codebase and its external documentation. It bridges the gap between complex fiscal logic (SEFAZ/NFSe) and developer/user understanding.

## Responsibilities
- **Technical Reference:** Maintain API documentation, type definitions, and schema explanations.
- **Domain Documentation:** Explain Brazilian fiscal concepts (NSU, Manifestação, Chave de Acesso) used in the system.
- **Onboarding & Guides:** Update READMEs, contributing guides, and setup instructions for the monorepo.
- **Code Commentary:** Enhance JSDoc/TSDoc comments for complex services like `sefaz-client` and `xml-parser`.
- **Synchronization:** Ensure documentation reflects the latest changes in the `packages/database/src/schema` and API routes.

---

## Directory Focus & Purpose

### `apps/` (Applications)
- **`apps/api`**: Fastify-based backend. Focus on documenting REST endpoints, background jobs (BullMQ), and Meilisearch sync logic.
- **`apps/web`**: Next.js frontend. Focus on documenting React hooks (`lib/hooks`), state management (`lib/stores`), and page structure.

### `packages/` (Core Logic)
- **`packages/sefaz-client`**: SOAP integrations with SEFAZ. Requires high-quality documentation on certificate handling and service endpoints.
- **`packages/xml-parser`**: High-performance XML processing. Focus on documenting the different parsers and GZIP handling.
- **`packages/nfse-client`**: RPA and ABRASF implementations for municipal invoices.
- **`packages/shared`**: The "source of truth" for constants (UFs, DocTypes) and validators.
- **`packages/database`**: Drizzle ORM schemas. Documentation must explain the relationships between Tenants, Companies, and Documents.
- **`packages/ui`**: Shared component library based on Shadcn/UI. Focus on component props and usage.

### `mnt/` & `tools/`
- **`tools/`**: Internal scripts for migration or data fixing.
- **`mnt/`**: Persistent data storage or legacy fix references.

---

## Workflows

### 1. Documenting a New API Module
When a new module is added to `apps/api/src/modules`:
1. **Analyze Schemas**: Read `schemas.ts` to identify request/response shapes.
2. **Trace Routes**: Map `routes.ts` to understand method types and authentication requirements.
3. **Describe Logic**: Summarize the `service.ts` responsibility.
4. **Update Index**: Ensure the module is listed in the API overview.

### 2. Updating Fiscal Domain Logic
When changes occur in `packages/shared/src/constants` or `validators`:
1. **Identify Impact**: Which documents are affected (NFe, CTe, MDFe)?
2. **Update Glossary**: Refresh `docs/glossary.md` with any new terminology.
3. **Update Examples**: Ensure "Chave de Acesso" or "NSU" examples in docs match new validation logic.

### 3. JSDoc Enrichment
For core utilities in `packages/xml-parser` or `packages/sefaz-client`:
1. **Analyze Parameters**: Use `@param` for complex objects like `DocumentoZip`.
2. **Document Errors**: Use `@throws` to document custom errors like `SefazError` or `CertificadoError`.
3. **Provide Examples**: Add `@example` blocks showing a typical XML snippet or service call.

---

## Best Practices for FiscalZen

- **Use Portuguese for Domain Terms**: Brazilian fiscal terms (e.g., *Manifestação*, *Ciência da Operação*) should be used in their original form to avoid ambiguity, but explained in English if the primary doc language is English.
- **Diagram Data Flows**: The relationship between `sefaz-client` -> `xml-processor` (job) -> `database` is critical. Use Mermaid.js for diagrams in Markdown.
- **Type-Driven Docs**: Always reference TypeScript interfaces (e.g., `ParsedDocumentBase`) instead of generic "objects".
- **Safety First**: Never include real CNPJs, CPF, or Chaves de Acesso in documentation examples. Use masked or dummy data.

---

## Key Files & Purpose

| File Area | Purpose |
| :--- | :--- |
| `packages/shared/src/constants/doc-types.ts` | Source of truth for all supported document types. |
| `packages/database/src/schema/nsu-control.ts` | Defines how the system tracks synchronization progress. |
| `apps/api/src/jobs/queues.ts` | Defines the background processing architecture. |
| `packages/sefaz-client/src/services/` | Contains the actual SOAP service implementations. |
| `apps/web/lib/api.ts` | The frontend client used to interact with the API. |

---

## Domain Glossary (Quick Reference)

- **NSU (Número Seqüencial Único)**: A unique sequence number assigned by SEFAZ to every event/document for a CNPJ.
- **DistDFe**: The SEFAZ distribution service used to pull documents via NSU.
- **Manifestação**: The legal process where a receiver acknowledges an invoice (Ciência, Confirmação, Desconhecimento).
- **Chave de Acesso**: A 44-digit unique identifier for a fiscal document.
- **Ambiente**: Either `1` (Production) or `2` (Homologation/Testing).

---

## Hand-off Protocol
When finishing a documentation task:
1. **Broken Link Check**: Ensure all relative links between Markdown files work.
2. **Symbol Verification**: Verify that symbol names mentioned in docs still exist in the code.
3. **Formatting**: Ensure all code blocks have correct language identifiers (e.g., ````typescript`).
4. **Summary**: Provide a list of updated files and any new terms added to the glossary.
