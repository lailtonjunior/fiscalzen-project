# Configuration Fix Runbook

## Overview

This runbook documents the configuration fixes applied to FiscalZen on 2026-01-31.

---

## What Was Changed

### 1. PostgreSQL Port Standardization

| File | Before | After |
|------|--------|-------|
| `docker/docker-compose.yml` | `5433:5432` | `5432:5432` |
| `.env.example` | port 5433 | port 5432 |
| `apps/api/.env.example` | port 5433 | port 5432 |

### 2. Deprecated Drizzle-Kit Commands

| File | Before | After |
|------|--------|-------|
| `packages/database/package.json` | `drizzle-kit generate:pg` | `drizzle-kit generate` |
| `packages/database/package.json` | `drizzle-kit push:pg` | `drizzle-kit push` |
| `package.json` (root) | `...generate:pg...` | `...generate...` |

### 3. Dependency Updates

| Package | Before | After |
|---------|--------|-------|
| `drizzle-orm` | 0.29.3 | 0.35.0 |
| `drizzle-kit` | 0.20.18 | 0.24.0 |
| `bullmq` | 5.1.0 | 5.40.0 |

---

## Why It Was Changed

1. **Port Consistency**: Docker exposed PostgreSQL on port 5433, but documentation and examples used 5432. Standardizing to 5432 (PostgreSQL default) reduces confusion.

2. **Deprecated Commands**: Drizzle-kit v0.21+ removed the `:pg` suffix from commands. The old syntax would fail on newer versions.

3. **Security & Bug Fixes**: Updated dependencies include security patches and bug fixes.

---

## How to Verify

### Automated Verification

```bash
# Run the verification script
pnpm verify-config

# Expected output: all checks pass (1 warning about minio user is expected)
```

### Manual Verification

```bash
# Check for any remaining 5433 references (should return empty)
grep -r "5433" --include="*.yml" --include="*.yaml" --include="*.env.example" .

# Verify drizzle-kit commands work
pnpm --filter @fiscalzen/database db:generate --help

# Test database connection (requires Docker running)
docker compose -f docker/docker-compose.yml up -d postgres
pnpm --filter @fiscalzen/database db:test
```

---

## Post-Update Actions

### For Developers with Existing .env.local

If you have an existing `.env.local` or `.env` file, update the PostgreSQL port:

```bash
# Old
DATABASE_URL=postgresql://fiscalzen:fiscalzen_dev@localhost:5433/fiscalzen

# New
DATABASE_URL=postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen
```

### For Docker Users

```bash
# Stop and remove old containers
docker compose -f docker/docker-compose.yml down

# Start with new port mapping
docker compose -f docker/docker-compose.yml up -d
```

---

## Rollback Procedure

If issues arise, revert the changes:

```bash
# Revert docker-compose port
sed -i "s/'5432:5432'/'5433:5432'/" docker/docker-compose.yml

# Revert env examples
sed -i "s/localhost:5432/localhost:5433/" .env.example apps/api/.env.example

# Revert drizzle versions (if needed)
pnpm --filter @fiscalzen/database add drizzle-orm@0.29.3
pnpm --filter @fiscalzen/database add -D drizzle-kit@0.20.18
```

---

## Related Files

- [verify-config.mjs](../../scripts/verify-config.mjs) - Verification script
- [docker-compose.yml](../../docker/docker-compose.yml) - Docker configuration
- [.env.example](../../.env.example) - Environment template
