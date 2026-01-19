---
status: filled
generated: 2026-01-18
---

# Development Workflow

Outline the day-to-day engineering process for this repository.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local infrastructure)

## Initial Setup

```bash
# Clone and install
git clone <repo-url>
cd fiscalzen
pnpm install

# Start infrastructure (Postgres, Redis, Meilisearch, MinIO)
docker compose -f docker/docker-compose.yml up -d

# Run database migrations
pnpm --filter @fiscalzen/database db:push

# Start development servers
pnpm dev
```

## Branching & Releases

### Branching Model
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `hotfix/*` - Production hotfixes

### Branch Naming
```
feature/add-nfse-support
fix/xml-parser-number-overflow
hotfix/security-patch
```

### Release Process
1. Create release branch from `develop`
2. Bump version in `package.json`
3. Update CHANGELOG.md
4. Merge to `main` and tag

## Local Development

### Common Commands

```bash
# Install all dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Start specific app
pnpm --filter @fiscalzen/api dev
pnpm --filter @fiscalzen/web dev

# Build all packages
pnpm build

# Run linter
pnpm lint

# Run tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch
```

### Package-Specific Commands

```bash
# Database
pnpm --filter @fiscalzen/database db:push      # Apply schema changes
pnpm --filter @fiscalzen/database db:generate  # Generate migrations
pnpm --filter @fiscalzen/database db:studio    # Open Drizzle Studio

# API
pnpm --filter @fiscalzen/api dev     # Start API server
pnpm --filter @fiscalzen/api test    # Run API tests

# Web
pnpm --filter @fiscalzen/web dev     # Start Next.js dev server
pnpm --filter @fiscalzen/web build   # Build for production
```

## Docker Services

Local development uses Docker for infrastructure:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Job queues, caching |
| Meilisearch | 7700 | Full-text search |
| MinIO | 9000 (API), 9001 (Console) | S3-compatible storage |

### Docker Commands

```bash
# Start all services
docker compose -f docker/docker-compose.yml up -d

# Stop all services
docker compose -f docker/docker-compose.yml down

# View logs
docker compose -f docker/docker-compose.yml logs -f

# Reset database
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

## Code Review Expectations

### PR Checklist
- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Code follows existing patterns
- [ ] Documentation updated if needed

### Review Guidelines
- Check for security issues (SQL injection, XSS, etc.)
- Verify multi-tenant isolation
- Ensure proper error handling
- Check for TypeScript type safety

## Adding New Features

### 1. Adding an API Endpoint

```
apps/api/src/modules/<module>/
├── index.ts       # Module exports
├── routes.ts      # Route handlers
├── service.ts     # Business logic
└── schemas.ts     # Zod validation schemas
```

### 2. Adding a Database Table

1. Add schema in `packages/database/src/schema/`
2. Export from `packages/database/src/schema/index.ts`
3. Run `pnpm --filter @fiscalzen/database db:push`

### 3. Adding a Background Job

1. Define job data type in `apps/api/src/jobs/queues.ts`
2. Create processor function in `apps/api/src/jobs/<job-name>.ts`
3. Register worker in `apps/api/src/jobs/workers.ts`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen

# Redis
REDIS_URL=redis://localhost:6379

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=fiscalzen
S3_SECRET_KEY=fiscalzen_minio_dev
S3_BUCKET=fiscalzen-docs

# Search
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=fiscalzen_meilisearch_dev_key

# SEFAZ
SEFAZ_AMBIENTE=homologacao

# Security
JWT_SECRET=<min-32-chars>
CERT_ENCRYPTION_KEY=<64-hex-chars>
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port
node kill-port.mjs 3000
```

### Next.js Cache Issues
```bash
# Clear Next.js cache
node clean-web-next-cache.mjs
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen
```

## CI/CD

GitHub Actions runs on every push and PR:
- **Lint**: ESLint checks
- **Build**: TypeScript compilation
- **Test**: Vitest test suites
- **Type Check**: TypeScript type validation

See `.github/workflows/ci.yml` for configuration.
