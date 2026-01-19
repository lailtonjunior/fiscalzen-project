# Development Workflow

This document outlines the day-to-day engineering processes and standards for the FiscalZen repository. It serves as a guide for setting up the local environment, following branching strategies, and implementing new features.

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js**: Version 20.x or higher
- **pnpm**: Version 9.x or higher
- **Docker**: For running local infrastructure (PostgreSQL, Redis, Meilisearch)
- **Git**: For version control

## Initial Setup

Follow these steps to get the project running locally:

```bash
# 1. Clone the repository
git clone <repo-url>
cd fiscalzen-project

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
# Copy .env.example from root and apps/api, apps/web to .env
cp .env.example .env

# 4. Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# 5. Initialize the database
pnpm --filter @fiscalzen/database db:push

# 6. Start development servers
pnpm dev
```

## Branching & Release Model

We use a structured branching strategy to maintain stability.

### Branching Strategy
- `main`: Reflects the current production state. Only merged from `develop` or `hotfix/*`.
- `develop`: The main integration branch. Feature branches are merged here.
- `feature/`: New features (e.g., `feature/nfse-abrasf-v2`).
- `fix/`: Bug fixes (e.g., `fix/xml-parsing-date-format`).
- `hotfix/`: Emergency fixes for production.

### Pull Request (PR) Requirements
Before a PR is merged into `develop`:
- All tests must pass (`pnpm test`).
- Linting must pass (`pnpm lint`).
- The build must succeed (`pnpm build`).
- At least one approval from the engineering team.

## Local Development Commands

### Global Commands (Root)
| Command | Description |
|---------|-------------|
| `pnpm dev` | Starts all applications (API, Web) in watch mode |
| `pnpm build` | Builds all packages and applications |
| `pnpm test` | Runs the entire test suite across the monorepo |
| `pnpm lint` | Runs ESLint and Prettier checks |

### Package-Specific Commands
Use the `--filter` flag to target specific components:

```bash
# Database management
pnpm --filter @fiscalzen/database db:push      # Sync schema to DB
pnpm --filter @fiscalzen/database db:studio    # Open GUI to view data

# API Development
pnpm --filter @fiscalzen/api dev               # Run only the API
pnpm --filter @fiscalzen/api test:watch        # TDD mode for API

# Web UI Development
pnpm --filter @fiscalzen/web dev               # Run only the Next.js app
```

## Local Infrastructure (Docker)

The project relies on several services defined in `docker/docker-compose.yml`:

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | `5432` | Primary relational data store |
| **Redis** | `6379` | BullMQ queues and caching |
| **Meilisearch** | `7700` | Full-text search for documents |
| **MinIO** | `9000` | S3-compatible storage for XML files |

## Development Patterns

### 1. Adding a New Database Schema
1. Create a new file in `packages/database/src/schema/`.
2. Define your table using Drizzle ORM syntax.
3. Export the schema in `packages/database/src/schema/index.ts`.
4. Run `pnpm --filter @fiscalzen/database db:push` to update your local instance.

### 2. Creating an API Endpoint
The API is organized by modules. To add a feature:
1. **Schema**: Define Zod validators in `apps/api/src/modules/<module>/schemas.ts`.
2. **Service**: Implement business logic in `apps/api/src/modules/<module>/service.ts`.
3. **Routes**: Register Fastify routes in `apps/api/src/modules/<module>/routes.ts`.

### 3. Background Jobs
Jobs are managed via BullMQ in `apps/api/src/jobs/`:
1. Add the job name to the `Queue` definitions.
2. Implement the processor logic in a dedicated file.
3. Register the worker in `apps/api/src/jobs/workers.ts`.

## Code Quality Standards

### TypeScript
- Avoid `any`. Use `unknown` or specific interfaces.
- Export shared types from `packages/shared/src/types/` to ensure frontend-backend synchronization.

### Error Handling
- Use the `AppError` class in the API for consistent HTTP responses.
- Wrap external service calls (like SEFAZ or NFSe cities) in `try/catch` blocks that map to `ExternalServiceError`.

### Testing
- **Unit Tests**: Place `.test.ts` files next to the source code.
- **Integration Tests**: Focus on API endpoints in `apps/api/tests/`.
- **Fixtures**: Use `packages/xml-parser/tests/fixtures/` for raw XML samples.

## Troubleshooting

### Common Issues

**Database out of sync?**
Run `pnpm --filter @fiscalzen/database db:push --force`. Note: This might data-loss on local dev if columns are deleted.

**Redis connection errors?**
Ensure Docker is running and the `REDIS_URL` in your `.env` matches the port in `docker-compose.yml`.

**Type errors in Web/API after changing Shared?**
Run `pnpm build` from the root to ensure all package distributions are updated.

---

*For architectural overview, refer to [Architecture Documentation](./architecture-overview.md).*
