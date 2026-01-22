# FiscalZen Development Workflow

This document outlines the recommended development workflow for the FiscalZen project. It covers environment setup, repository organization, branching and release strategies, common development commands, infrastructure setup, coding standards, and troubleshooting tips. Following this guide ensures smooth collaboration, consistent quality, and effective local development.

---

## Prerequisites

Ensure your development machine has the following installed and configured:

- **Node.js**: Version 20.x or later (LTS recommended)
- **pnpm**: Version 9.x or later (for monorepo package management)
- **Docker**: Used to spin up necessary infrastructure services such as PostgreSQL, Redis, Meilisearch, and MinIO
- **Git**: For version control and branching workflows

---

## Initial Setup

Follow these steps to initialize your local development environment:

```bash
# Clone the FiscalZen repository and navigate into it
git clone <repo-url>
cd fiscalzen-project

# Install dependencies across the pnpm monorepo workspace
pnpm install

# Setup environment variables by copying example environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start infrastructure services via Docker Compose
docker compose -f docker/docker-compose.yml up -d

# Initialize and sync the database schema with Drizzle ORM migrations
pnpm --filter @fiscalzen/database db:push

# Run all applications in development mode with hot reload
pnpm dev
```

---

## Monorepo Architecture Overview

FiscalZen follows a **pnpm workspace monorepo** architecture. Key areas of the codebase are organized as follows:

| Workspace                | Purpose                                                                      |
|--------------------------|------------------------------------------------------------------------------|
| `apps/api`               | Backend API server using Fastify; handles business logic & SEFAZ interactions |
| `apps/web`               | Frontend application built with Next.js                                     |
| `packages/database`      | Database schema definitions and Drizzle ORM client integrations             |
| `packages/sefaz-client`  | SOAP client library for Brazilian SEFAZ fiscal services                     |
| `packages/nfse-client`   | NFS-e municipal service invoice scrapers and SOAP clients                   |
| `packages/xml-parser`    | XML document detection and parsing library for Brazilian fiscal documents    |
| `packages/shared`        | Shared TypeScript types, constants, validators used both frontend & backend  |

For detailed architecture insights, refer to [Architecture Overview](./architecture-overview.md).

---

## Branching & Release Strategy

FiscalZen adopts a structured branching model to maintain code stability and manage releases effectively:

### Branches

- **main**: Production-ready branch; only merges from `develop` or critical `hotfix/*` branches.
- **develop**: Integration branch for ongoing development; all features and fixes merge here first.
- **feature/**: For new feature development (e.g., `feature/nfse-scraper-curitiba`).
- **fix/**: For standard bug fixes (e.g., `fix/cnpj-validation`).
- **hotfix/**: For urgent production fixes (e.g., `hotfix/fix-login-error`).

### Pull Request Requirements

Before merging into `develop`, ensure:

1. All unit and integration tests pass (`pnpm test`).
2. Code lints cleanly without warnings (`pnpm lint`).
3. Project builds successfully (`pnpm build`).
4. At least one peer review approval on the PR.

---

## Common Development Commands

Run these commands from the repository root using pnpm:

| Command          | Description                                               |
|------------------|-----------------------------------------------------------|
| `pnpm dev`       | Starts both `api` and `web` applications in watch mode    |
| `pnpm build`     | Builds all packages and applications                       |
| `pnpm test`      | Runs all tests across the monorepo                         |
| `pnpm lint`      | Runs ESLint and Prettier checks project-wide              |

### Targeting Specific Workspaces

Use the `--filter` option to run commands for individual packages or apps:

```bash
# Start only the API back-end app in development
pnpm --filter @fiscalzen/api dev

# Run database studio GUI
pnpm --filter @fiscalzen/database db:studio

# Build only shared types package after modifying type definitions
pnpm --filter @fiscalzen/shared build
```

---

## Local Infrastructure Setup with Docker

FiscalZen depends on several services spun up using Docker Compose (`docker/docker-compose.yml`):

| Service      | Default Port | Purpose                                                  |
|--------------|--------------|----------------------------------------------------------|
| PostgreSQL   | 5432         | Persistent relational database storage                    |
| Redis        | 6379         | Message broker for job queues and caching                 |
| Meilisearch  | 7700         | Full-text search engine for documents                      |
| MinIO        | 9000         | S3-compatible object storage for raw XML document files   |

Make sure Docker Desktop or your Docker environment is running, and the required containers are healthy before starting development.

---

## Common Development Tasks

### Modifying Database Schema

1. Update or add new tables in `packages/database/src/schema/<domain>.ts`.
2. Export new schemas via `packages/database/src/schema/index.ts`.
3. Push schema changes to local DB:

```bash
pnpm --filter @fiscalzen/database db:push
```

4. Update relevant TypeScript types if needed, especially for frontend consumption.

---

### Adding a New API Endpoint

1. Define input and output validation schemas using Zod in:

```
apps/api/src/modules/<module>/schemas.ts
```

2. Implement core business logic in the corresponding service file:

```
apps/api/src/modules/<module>/service.ts
```

3. Register routes with Fastify in:

```
apps/api/src/modules/<module>/routes.ts
```

4. Update shared API types in:

```
packages/shared/src/types/api.ts
```

---

### Creating Background Jobs

Background jobs use BullMQ and are organized under `apps/api/src/jobs/`:

1. Add your job to the queue definitions in `queues.ts`.
2. Implement processing logic in a separate file (e.g., `my-job.ts`).
3. Register the job processor within `apps/api/src/jobs/workers.ts`.

---

## Code Quality Guidelines

### TypeScript Best Practices

- Enforce *strong typing*; avoid using `any`.
- For external or uncertain data, use `unknown` and refine with Zod.
- Centralize shared interfaces and types in the `packages/shared` package to ensure consistency between frontend and backend.

### Error Handling

- Use centralized error types from `apps/api/src/utils/errors.ts`.
- Throw specific error classes (`NotFoundError`, `ValidationError`, `ExternalServiceError`) to provide meaningful HTTP status codes and messages.
- Global error handlers transform thrown errors into proper API responses.

### Testing

- **Unit tests** live next to source files with `.test.ts` extension.
- **Integration tests** are grouped inside `apps/api/tests` or respective `tests/` folders per package.
- For new XML document types, add fixtures in `packages/xml-parser/tests/fixtures/`.

---

## Troubleshooting Tips

| Issue                       | Suggested Solution                                               |
|-----------------------------|-----------------------------------------------------------------|
| Database schema out of sync  | Run `pnpm --filter @fiscalzen/database db:push --force` to force sync. Use caution as it may drop local data. |
| Frontend build errors        | Often caused by stale shared types. Rebuild all packages with `pnpm build` at root. |
| Redis connection failures    | Verify that `REDIS_URL` in `.env` matches the Docker service port (default: 6379). |
| Search functionality issues  | Ensure Meilisearch is running at `http://localhost:7700`. Check `MEILI_MASTER_KEY` in `.env` corresponds to your Meilisearch instance. |

---

## Additional Resources

- [Architecture Overview](./architecture-overview.md): Details on the overall system design and module responsibilities.
- README files in individual packages for specific usage and configuration info.
- API documentation (if generated) for endpoints and data contracts.

---

Adhering to this workflow helps maintain quality, streamlines onboarding, and facilitates effective collaboration in the FiscalZen project.
