# FiscalZen Tooling & Productivity Guide

This document provides a comprehensive overview of the development tooling, environment setup, and operational workflows essential for efficient work with the FiscalZen monorepo. It is designed to support all developers working across the **API**, **Web**, shared libraries, and packages within the project.

---

## System Requirements

To ensure a consistent and stable development environment across different machines, use the following tooling versions:

| Tool         | Recommended Version | Installation Method                            |
| ------------ | ------------------- | ---------------------------------------------- |
| **Node.js**  | v20.x (LTS)         | Download from [nodejs.org](https://nodejs.org) or use `nvm install 20` |
| **pnpm**     | v9.x                | Install via `npm install -g pnpm`             |
| **Docker**   | v24.x or newer      | Use [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **PostgreSQL** | v16.x             | Managed via Docker Compose (see Local Infrastructure) |

Ensure these versions are installed and active before proceeding with development to avoid compatibility issues.

---

## Monorepo Management with Turborepo

FiscalZen uses [Turborepo](https://turbo.build/repo) for managing the monorepo workflow, including building, caching, and running tasks concurrently or in order.

### Core Commands

Run these commands from the repository root:

```bash
# Run full development environment (API backend, Web frontend, workers)
pnpm dev

# Build all packages and applications for production
pnpm build

# Check code quality using linters
pnpm lint

# Execute all unit and integration tests
pnpm test
```

### Workspace Filtering

You can target specific packages or apps to optimize resource usage and speed up workflows:

```bash
# Start only API backend development server
pnpm --filter @fiscalzen/api dev

# Start only the web frontend
pnpm --filter @fiscalzen/web dev

# Run tests only for the XML parser package
pnpm --filter @fiscalzen/xml-parser test
```

---

## Database & Persistence Layer

The project uses **Drizzle ORM** for type-safe SQL schema definitions and operations.

### Schema Location

Schema files are located at:

```
packages/database/src/schema/
```

### Database Scripts

Use these from repo root or inside `packages/database`:

```bash
# Push schema changes directly to the local database (development only)
pnpm db:push

# Generate migration files based on schema changes
pnpm db:generate

# Run migrations to update the database schema
pnpm db:migrate

# Open Drizzle Studio (GUI) for browsing and editing DB content
pnpm db:studio
```

### Local Database Defaults

- Host: `localhost:5432`
- User: `fiscalzen`
- Password: `fiscalzen_dev`
- Database: `fiscalzen`

The local database runs via Docker Compose (see next section).

---

## Local Infrastructure Services (Docker Compose)

To simplify running dependent services, the project includes a Docker Compose setup providing key infrastructure components:

### Starting Services

```bash
# Launch all services in background mode
docker compose -f docker/docker-compose.yml up -d

# Stop services (containers removed but data volumes persist)
docker compose -f docker/docker-compose.yml down

# Full reset including data volumes (data lost)
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

### Services & Access

| Service         | Port | Access / Credentials                                      |
| --------------- | -----| ---------------------------------------------------------|
| **Meilisearch** | 7700 | Web UI: `http://localhost:7700`                          |
| **MinIO**       | 9001 | Web Console: `http://localhost:9001` <br>Default creds: `minioadmin` / `minioadmin` |
| **Redis**       | 6379 | For BullMQ job queueing                                  |
| **PostgreSQL**  | 5432 | Primary relational database                              |

---

## Utility Scripts

The repository provides several helpful Node.js scripts intended for quick fixes to local development issues. Run from the repo root as needed.

| Script                      | Purpose                                  | Usage Example                    |
|-----------------------------|------------------------------------------|---------------------------------|
| `kill-port.mjs`             | Kill processes blocking specified port  | `node kill-port.mjs 3000`        |
| `clean-web-next-cache.mjs`  | Wipe Next.js `.next` cache to resolve build or Hot Module Replacement (HMR) errors | `node clean-web-next-cache.mjs` |
| `apply-next-dev-cache-fix.mjs` | Patch Next.js dev server cache issues | `node apply-next-dev-cache-fix.mjs` |

---

## Recommended IDE Setup: Visual Studio Code

### Extensions to Install

- **ESLint** and **Prettier**: Enforces consistent style and code quality
- **Tailwind CSS IntelliSense**: Assists in working with Tailwind CSS in the web app
- **Vitest**: Enables test runs inside VS Code for quick feedback

### Suggested `settings.json` Configuration

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

This setup supports seamless linting, formatting on save, and enhanced development experience with TypeScript.

---

## Troubleshooting & Best Practices

### Dealing with Module or Build Errors After Branch Changes

Run:

```bash
pnpm install
pnpm build --filter "@fiscalzen/*"
```

This ensures dependencies are installed correctly and internal packages are rebuilt fresh.

### Handling Ports Already in Use

If development servers fail to start due to port conflicts, free the ports with:

```bash
node kill-port.mjs 3000  # Web frontend default port
node kill-port.mjs 4000  # API backend default port
```

### Resetting Turborepo Cache if Builds Appear Stale

Clean cache and reinstall dependencies:

```bash
rm -rf .turbo
pnpm clean
pnpm install
```

### Pre-Push Validation Checklist

Before pushing code or creating pull requests, always verify your work by running:

```bash
pnpm build && pnpm lint && pnpm test
```

---

## Summary and Further Reading

This tooling guide centralizes crucial knowledge for setting up and maintaining an efficient FiscalZen development environment. Following these guidelines ensures you can develop with confidence, avoid common pitfalls, and maintain smooth workflows.

For deeper dives into specific modules:

- **Database & ORM:** [`packages/database`](./packages/database)
- **API Backend:** [`apps/api`](./apps/api)
- **Web Frontend:** [`apps/web`](./apps/web)
- **Shared Libraries:** [`packages/shared`](./packages/shared)

Each folder contains individual README files with their own context and instructions. Contributors are encouraged to consult them alongside this guide.

For any persistent issues, seek help from the maintainers or create an issue on the project's repository.

---

_End of documentation._
