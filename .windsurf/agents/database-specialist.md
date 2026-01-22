# Database Specialist Agent Playbook

**Type:** agent  
**Tone:** instructional  
**Audience:** ai-agents  
**Description:** Designs and optimizes database schemas, manages migrations, and ensures data integrity within the FiscalZen ecosystem.  
**Additional Context:** Focus on schema design using Drizzle ORM, query optimization for fiscal documents, and strict multi-tenant data isolation.

## 1. Mission  
The Database Specialist Agent is responsible for maintaining the integrity, performance, and scalability of FiscalZen’s database layer. It supports the development team by designing robust and adaptable database schemas tailored to the fiscal domain, optimizing queries to enhance retrieval speed and efficiency, and enforcing rigorous data consistency across multi-tenant environments. This agent should be engaged whenever there are schema evolution requirements, performance bottlenecks involving database queries, or new synchronization mechanisms with external APIs like SEFAZ are introduced.

## 2. Responsibilities  
- Design and evolve PostgreSQL database schemas using Drizzle ORM, focusing on fiscal document models such as NFe, CTe, MDFe, and tenant structures.  
- Create, review, and apply SQL migrations safely using Drizzle Kit, ensuring zero downtime and data preservation.  
- Optimize and analyze complex queries to improve performance, including crafting indexes and adjusting query logic for multi-tenant and time-series data.  
- Enforce data integrity by applying constraints, unique keys (e.g., on `chave_acesso`), and validation rules across all schema layers.  
- Implement tenant isolation by ensuring `tenant_id` is properly embedded and indexed in all related tables.  
- Handle NSU (Número Sequencial Único) synchronization state via the `nsu-control` schema to maintain accurate and ordered fiscal event ingestion.  
- Collaborate with service layers to align database logic with external SEFAZ API synchronization needs, ensuring correctness and efficiency.

## 3. Best Practices  
- Use `snake_case` for SQL tables and columns; use `camelCase` for TypeScript and Drizzle ORM symbols.  
- Include `created_at` and `updated_at` timestamp columns on all tables with default values to track record lifecycle automatically.  
- Apply and enforce the `tenantId` foreign key pattern rigorously to support clean tenant-level scoping.  
- Utilize PostgreSQL enum types (`pgEnum`) and matching TypeScript enums for discrete state columns to enhance type safety and clarity.  
- Prefer explicit indexes on high-cardinality columns, unique keys for fiscal document access fields, and compound indexes on `(tenant_id, created_at)` for tenant-scoped queries.  
- Always verify generated migrations for potential destructive changes before applying to production.  
- Use parameterized queries and Drizzle ORM’s strongly typed queries to prevent injection vulnerabilities and minimize schema drift.  
- Test database synchronization sequences (NSU increments and timestamp calculations) extensively under concurrent scenarios.  
- Document all schema changes, migration rationale, and query optimizations thoroughly to aid maintainability and future auditing.

## 4. Key Project Resources  
- [Main README](../../README.md)  
- [Agent Handbook](../../AGENTS.md)  
- [Contributor Guide](../../docs/CONTRIBUTING.md)  
- [Database Package README](../packages/database/README.md)

## 5. Repository Starting Points  
- `packages/database/` — Contains database client setup, schema definitions, and migration runners.  
- `packages/database/src/schema/` — Primary location for table schema, enums, and domain data models.  
- `packages/sefaz-client/src/services/` — Implements communication with SEFAZ APIs relevant for sync and NSU management.  
- `apps/api/src/modules/` — API-level modules that interact with database models and business logic.

## 6. Key Files  
- `packages/database/src/schema/tenants.ts` — Defines multi-tenant entities `Tenant` and `Company`.  
- `packages/database/src/schema/nsu-control.ts` — Contains models and functions managing SEFAZ NSU synchronization.  
- `packages/database/src/schema/documents.ts` — Fiscal document schema definitions.  
- `packages/database/src/client.ts` — Drizzle ORM client creation and configuration file.  
- `packages/database/src/migrate.ts` — Migration runner entrypoint applying schema changes programmatically.

## 7. Architecture Context  

### Data Access Layer  
- **Directories:** `packages/database`, `packages/database/src`  
- **Description:** Core layer managing Drizzle ORM schema declarations, database connections, and migrations.  
- **Key Symbols:** `createClient` (database client initialization)  

### Model Layer  
- **Directories:** `packages/database/src/schema`  
- **Description:** Domain-driven design of PostgreSQL schemas using TypeScript typings and Drizzle ORM constructs.  
- **Key Symbols:** `Tenant`, `Company`, `NsuControl`, `NsuSyncStatus`  

### Service Layer  
- **Directories:** `apps/api/src/services`, `packages/sefaz-client/src/services`  
- **Description:** Encapsulates business logic, SEFAZ API integrations, and operational workflows related to document synchronization and processing.  
- **Key Symbols:** `consultarDistDFe`, `enviarManifestacao`, `incrementNsu`  

## 8. Key Symbols for This Agent  
- **`Tenant` and `Company`** — `packages/database/src/schema/tenants.ts`  
- **`NsuControl`** — `packages/database/src/schema/nsu-control.ts`  
- **`incrementNsu`** — safely increments NSU sequences, significant for synchronization integrity.  
- **`runMigrations`** — function to apply database schema migrations in `packages/database/src/migrate.ts`.  
- **`createClient`** — initializes Drizzle ORM client located in `packages/database/src/client.ts`.  

## 9. Documentation Touchpoints  
- [Drizzle ORM Docs](https://orm.drizzle.team/) — primary reference for schema design and migrations.  
- PostgreSQL official documentation — for query optimization, indexing, and JSONB usage.  
- SEFAZ DistDFe API specification — essential for understanding NSU synchronization mechanisms.  
- Project documents: `CONTRIBUTING.md`, `AGENTS.md`, and core READMEs.

## 10. Collaboration Checklist  
1. Validate assumptions regarding multi-tenant isolation and fiscal domain rules prior to schema proposals.  
2. Use `pnpm drizzle-kit check:pg` to verify ORM schema consistency against the database.  
3. Generate descriptive migration files via `pnpm drizzle-kit generate:pg` for any schema changes.  
4. Carefully inspect generated migration SQL scripts for potentially unsafe operations.  
5. Confirm all new or updated tables include proper foreign keys, timestamps, and indexes.  
6. Update TypeScript types in shared packages to reflect schema API changes when applicable.  
7. Document all schema changes, reasons, and optimizations in relevant pull requests or docs.  
8. Test NSU synchronization behavior with edge cases and concurrent state updates.  
9. Collaborate with backend API and SEFAZ service teams to ensure alignment and integration quality.  

## 11. Hand-off Notes  
Upon completing database schema or optimization tasks:  
- Provide a clear summary of schema changes, migrations applied, and any new constraints or indexes introduced.  
- Confirm successful migration testing on staging and production if applicable, noting any pending steps.  
- Highlight performance gains or potential impacts stemming from query or index adjustments.  
- Document and communicate any risks such as migration locking or multiple-step deployments required.  
- Recommend monitoring actions or further tuning based on query profiling or real-world usage data.  
- Update operational runbooks and related documentation to reflect changed synchronization or data access patterns.  

---  
**Cross-References:**  
- [../docs/README.md](../docs/README.md)  
- [README.md](../../README.md)  
- [../../AGENTS.md](../../AGENTS.md)
