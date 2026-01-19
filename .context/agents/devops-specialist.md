# Devops Specialist Agent Playbook

## Mission
The DevOps Specialist agent is responsible for the reliability, scalability, and security of the FiscalZen platform. This includes managing the lifecycle of the monorepo applications (API and Web), maintaining the background job infrastructure (BullMQ/Redis), ensuring secure certificate storage for SEFAZ integrations, and optimizing the Meilisearch indexing pipeline.

## Responsibilities
- **Infrastructure Management**: Maintain Docker configurations and orchestration for local and production environments.
- **CI/CD Pipelines**: Manage GitHub Actions for automated testing, linting, and deployment of multiple packages and apps.
- **Database Lifecycle**: Oversee Drizzle ORM migrations and Postgres health.
- **Security**: Ensure encryption of sensitive data (certificates, API keys) using the project's utility patterns.
- **Monitoring**: Configure health checks and alerts for the SEFAZ/NFSe monitors and background workers.
- **Environment Parity**: Maintain `.env` consistency across the monorepo.

## Codebase Focus Areas

### 1. Application Orchestration
- **`apps/api/`**: Fastify-based backend. Focus on `src/config/`, health checks, and worker processes.
- **`apps/web/`**: Next.js frontend. Focus on build optimizations and environment variable injection.
- **`docker/`**: Contains Dockerfiles and compose configurations for the full stack (Postgres, Redis, Meilisearch, API, Web).

### 2. Background Jobs & State (Critical)
- **`apps/api/src/jobs/`**: BullMQ queue definitions (`queues.ts`), worker implementations (`workers.ts`), and the scheduler (`scheduler.ts`).
- **`apps/api/src/config/redis.ts`**: Redis connection management for queues and caching.

### 3. Data & Persistence
- **`packages/database/`**: Schema definitions and Drizzle migration files. Focus on `src/schema/` and migration scripts.
- **`apps/api/src/config/meilisearch.ts`**: Search engine configuration and index setup.

### 4. External Integrations (SEFAZ/NFSe)
- **`packages/sefaz-client/`**: Handles SOAP requests. Monitoring timeout and connectivity issues here is vital.
- **`packages/nfse-client/`**: Municipality-specific adapters. Deployment of new scrapers or adapters often requires environmental config updates.

---

## Specific Workflows

### Deployment of Background Workers
When scaling or deploying the job system:
1. Verify `apps/api/src/jobs/workers.ts` to ensure all necessary processor types (`XmlProcessor`, `SefazMonitor`, `SearchSync`) are registered.
2. Check `apps/api/src/config/redis.ts` for connection pooling limits.
3. Ensure the `REDIS_URL` is correctly injected in the target environment.
4. Monitor worker health via the `getWorkerHealth` symbol in `apps/api/src/jobs/events.ts`.

### Database Migrations
1. **Generation**: Run migration generation scripts from `packages/database`.
2. **Execution**: Migrations should run as a pre-deploy step for `apps/api`. 
3. **Safety**: Verify that `packages/database/src/schema/` changes don't cause breaking changes for the `apps/web` types.

### Handling Sensitive Certificates
FiscalZen handles A1/A3 certificates for SEFAZ:
1. Ensure `apps/api/src/utils/encryption.ts` is used for encrypting certificates before database storage.
2. Verify the `ENCRYPTION_KEY` is rotated and managed via a secure Vault or Environment Secrets.
3. Use `packages/sefaz-client/src/certificate.ts` to validate certificate metadata during the CI process.

### CI/CD for Monorepo Packages
1. Use `pnpm` workspace commands to run tests only on affected packages.
2. Ensure `packages/shared` is built before `apps/api` or `apps/web`.
3. Validate that `packages/ui` components are linted and built correctly for the web app.

---

## Best Practices

### Automation & Reproducibility
- **Prefer pnpm**: The repository uses pnpm workspaces. Always use `pnpm recursive` for cross-package tasks.
- **Immutable Infrastructure**: Use the `Dockerfile` in the root or app directories for consistent builds.
- **Environment Schema**: Always update `apps/api/src/config/env.ts` (Zod schema) when adding new variables to ensure the app fails fast on missing config.

### Reliability
- **Graceful Shutdown**: Ensure `closeQueues`, `stopWorkers`, and `stopScheduler` in `apps/api` are called on `SIGTERM`.
- **Job Retries**: Configure exponential backoff for SEFAZ-related jobs in `queues.ts` to handle intermittent government web service downtime.
- **Search Indexing**: Use `setupMeilisearchIndexes` during deployment to ensure search attributes (filterable/sortable) are consistent with the schema.

### Security
- **Least Privilege**: Database users should only have access to the `fiscalzen` schema.
- **Data Masking**: Ensure `AuditLog` entries in `packages/database/src/schema/audit.ts` do not store raw XML payloads containing sensitive financial data.

---

## Key Files & Purposes

| File Path | Purpose |
|:--- |:--- |
| `apps/api/src/config/env.ts` | Source of truth for all environment variables (validated with Zod). |
| `apps/api/src/jobs/queues.ts` | Central definition for all BullMQ queues and job data types. |
| `packages/database/drizzle.config.ts` | Configuration for database migrations and introspection. |
| `apps/api/src/utils/encryption.ts` | Core logic for encrypting/decrypting sensitive tax data. |
| `apps/api/src/app.ts` | Fastify application entry point where plugins and routes are registered. |
| `docker-compose.yml` | Definition of the local development services stack. |

---

## Hand-off & Monitoring
When a DevOps task is completed:
- Verify that `apps/api/src/jobs/events.ts` metrics show successful job processing.
- Check that `apps/api/src/config/database.ts` connection check returns success.
- Ensure all new packages added to `packages/` are correctly included in the workspace build graph.
- Update `docs/architecture.md` if any infrastructure components (e.g., new S3 bucket, new Redis instance) are added.
