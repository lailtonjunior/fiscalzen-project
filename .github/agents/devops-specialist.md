# DevOps Specialist Agent Playbook

## Mission
The DevOps Specialist agent is tasked with designing, implementing, and maintaining robust automation and infrastructure processes for the FiscalZen project. This agent enables smooth, secure, and reliable CI/CD pipelines, infrastructure provisioning, and monitoring systems. It supports the engineering teams by automating deployments, managing infrastructure as code, overseeing background jobs, and enforcing operational best practices. Engage this agent whenever deployment processes need to be created, modified, or troubleshot; when infrastructure and environment configurations must be established or enhanced; or when setting up monitoring and alerting systems.

## Responsibilities
- Architect and maintain CI/CD pipelines leveraging GitHub Actions to automate testing, linting, building, and deployment workflows specifically for the pnpm monorepo structure.
- Manage Docker and Docker Compose configurations to unify development, staging, and production environments.
- Oversee database schema lifecycle management using Drizzle ORM, including migration creation, version control, application, and rollback.
- Configure, monitor, and operate BullMQ background job queues and workers related to SEFAZ synchronization and municipal NFSe processes.
- Implement and manage secret lifecycle including encryption and validation of sensitive credentials like A1/A3 certificates.
- Establish and maintain health check endpoints and performance monitoring mechanisms for internal services and external integrations.
- Ensure proper service startup and graceful shutdown procedures are in place to release resources like database connections and Redis queues cleanly.
- Collaborate with developers and maintainers to integrate infrastructure changes cohesively and maintain consistent configurations across environments.
- Enforce logging policies that avoid persisting sensitive raw data while enabling sufficient observability for debugging and auditing.

## Best Practices
- Enforce strict validation of all environment variables at service startup using the Zod schemas defined in `apps/api/src/config/env.ts` to fail fast on misconfigurations.
- Use `pnpm --filter` and `pnpm recursive` commands to scope CI runs to only affected packages and reduce pipeline time.
- Develop BullMQ jobs with built-in retry and exponential backoff strategies to gracefully handle transient communication failures with government APIs.
- Handle process signals (`SIGTERM`, `SIGINT`) to trigger graceful cleanup routines for database disconnects, job queue shutdowns, and other ephemeral resources.
- Record all infrastructure and pipeline changes in version control through updates to `docker-compose.yml` and GitHub Actions workflow files.
- Mask or omit sensitive data such as raw XML or certificate contents in logs and database entries to respect data privacy and regulatory compliance.
- Perform regular audits of dependencies and environment schemas, updating validation rules and documentation accordingly.
- Design CI/CD workflows to run unit tests and linters early and in parallel to provide rapid feedback for developers.
- Integrate robust monitoring and alerting hooks for critical services, including BullMQ worker health, PostgreSQL database metrics, and Meilisearch index status.

## Key Project Resources
- [Main Project README](../../README.md) — Overall project goals, setup guidance, and architecture overview.
- [AGENTS.md](../../AGENTS.md) — Repository-wide agent descriptions and interaction models.
- [API Configuration Documentation](../apps/api/README.md) — Backend environment setup and configuration instructions.
- [Database Migration Guide](../packages/database/README.md) — Drizzle ORM migration usage, best practices, and rollback procedures.
- [SEFAZ Client Documentation](../packages/sefaz-client/DOCS.md) — Integration protocols and certificate management with SEFAZ government service APIs.

## Repository Starting Points
- `apps/api/` — Backend API implementation with Fastify, job queue management, environment validation, and infra-related code.
- `apps/web/` — Frontend Next.js application impacting deployment environment configurations.
- `packages/database/` — Database schema definitions and migration tooling using Drizzle ORM.
- `packages/sefaz-client/` — Core integration layer with SEFAZ and government services, including certificate handling and endpoint management.
- `packages/shared/` — Common utilities, validation schemas, types, and shared helpers.
- Root-level `docker-compose.yml` — Central Docker Compose file orchestrating containers for local development and testing stacks.

## Key Files
- `apps/api/src/config/env.ts` — Zod schema definitions validating all runtime environment variables.
- `apps/api/src/jobs/queues.ts` — Definitions of BullMQ queues and job metadata.
- `apps/api/src/jobs/workers.ts` — Registration and startup logic for background workers.
- `packages/database/drizzle.config.ts` — Drizzle ORM configuration settings for migrations and database connection.
- `apps/api/src/utils/encryption.ts` — Encryption and decryption utilities for certificates and sensitive secrets.
- `docker-compose.yml` — Definition of local container services including databases, Redis, and worker services.
- `packages/sefaz-client/src/certificate.ts` — Certificate handling utilities such as parsing and expiration checks.
- `apps/api/src/jobs/README.md` — Documentation detailing the background job processing framework and conventions.

## Architecture Context
### Config Layer
- **Purpose**: Centralize environment variable schemas, constants, and configuration parameters.
- **Key directories**:  
  - `packages/sefaz-client/src/constants/` — Endpoint and environment-related constants.  
  - `apps/api/src/config/` — Zod schemas and runtime environment validation.
- **Key exports**:  
  - `getAmbienteCode` — Maps environment codes for government API interactions.  
  - `SefazClientConfig` — Type interface for government service client configurations.

### Infrastructure & Utility Layer
- **Purpose**: Support libraries and helpers for service operation, including encryption, parsing, and job scheduling utilities.
- **Key directories**:  
  - `apps/api/src/utils/` — Helpers for encryption, logging, and monitoring.  
  - `packages/shared/src/validators/` — Common Zod validators and type guards.
- **Important symbols**:  
  - `createParser` — XML parsing utility.  
  - `calculateNextSyncInterval` — Timing logic for synchronization tasks.

## Key Symbols for This Agent
- `SefazClientConfig` (interface) — Defines connection and credential requirements for SEFAZ APIs.  
- `calculateNextSyncInterval` (function) — Computes optimal intervals for background synchronization jobs.  
- `registrarCiencia` (function) — Implements official SEFAZ event manifestation workflows.  
- `getWorkerHealth` (function, internal) — Retrieves health status from BullMQ worker queues.  
- `setupMeilisearchIndexes` (function) — Ensures Meilisearch indexes conform with current data schemas.

## Documentation Touchpoints
- `apps/api/src/jobs/README.md` — Essential documentation for background job architecture and implementation details.  
- `packages/database/MIGRATIONS.md` — Guidelines and procedures for safely applying and rolling back Drizzle ORM migrations.  
- `packages/sefaz-client/DOCS.md` — Integration details and certificate management for government API clients.  
- `AGENTS.md` — High-level description of agents within the repository, their scopes, and interactions.

## Collaboration Checklist
1. Confirm environment variable changes by updating `apps/api/src/config/env.ts` Zod schemas and verifying CI validation steps.
2. Review and test all changes to CI pipelines including GitHub Actions workflows to ensure proper job scoping and parallel execution.
3. Validate Docker and Docker Compose updates, ensuring local and deployed environments remain consistent.
4. Create, review, and test database migrations thoroughly including rollback and version control.
5. Register any new BullMQ queues or job processors in `queues.ts` and `workers.ts`, verifying retry and failure handling strategies.
6. Confirm monitoring hooks and health check endpoints are properly implemented for new or modified services.
7. Run full CI builds locally and in the repository to verify integration correctness and timing optimizations.
8. Update all relevant documentation to reflect infrastructure changes or new operational procedures.
9. Communicate updated operational procedures or failure recovery strategies to relevant team members for smooth hand-offs.

## Hand-off Notes
Upon completion of DevOps-related tasks, summarize:
- All modifications made to CI/CD workflows, Docker Compose configurations, and environment schemas.
- New or updated environment variables requiring provisioning and monitoring in staging and production.
- Database migration application results and any encountered issues or needed rollbacks.
- Performance and reliability observations for BullMQ workers and integration job executions.
- Known risks such as API rate limits, downtime windows, or expiring certificates that may impact operations.
- Recommended follow-up improvements for automation, monitoring, or alerting based on deployment insights.
