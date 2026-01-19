---
status: filled
generated: 2026-01-18
---

# Testing Strategy

Document how quality is maintained across the codebase.

## Test Framework

**Vitest** is used as the testing framework across all packages.

### Packages with Tests

| Package | Tests | File Location |
|---------|-------|---------------|
| @fiscalzen/xml-parser | 22 | `packages/xml-parser/tests/` |
| @fiscalzen/sefaz-client | 48 | `packages/sefaz-client/tests/` |
| @fiscalzen/api | 38 | `apps/api/tests/` |
| **Total** | **108** | |

## Test Types

### Unit Tests
- **Framework**: Vitest
- **File naming**: `*.test.ts`
- **Location**: `tests/` folder in each package
- **Coverage**: Core business logic, parsers, utilities, validation

### Integration Tests
- **Location**: `apps/api/tests/`
- **Scenarios**: API routes, error handling, response formats
- **Mocking**: Uses Vitest mocks for database and external services

### End-to-End Tests
- Not yet implemented
- Planned for critical flows: document sync, manifestação workflow

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm test --filter @fiscalzen/xml-parser

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage
```

## Test Configuration

Each package has its own `vitest.config.ts`:

```typescript
// Example: apps/api/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    testTimeout: 10000,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

## Quality Gates

### Pre-merge Requirements
- All tests must pass (`pnpm test`)
- Lint must pass with 0 errors (`pnpm lint`)
- Build must succeed (`pnpm build`)
- Type check must pass

### Coverage Expectations
- Minimum coverage: Not enforced yet
- Target: 70% for critical packages (xml-parser, sefaz-client)

## CI Integration

Tests run automatically on:
- Push to `main`, `master`, `develop`
- Pull requests

See `.github/workflows/ci.yml` for configuration.

## Troubleshooting

### Common Issues

1. **Tests hanging**: Ensure `--run` flag is used in CI to avoid watch mode
2. **Environment variables**: Check `tests/setup.ts` for required env vars
3. **Port conflicts**: API tests use port 3099 to avoid conflicts

### Flaky Tests
- None identified yet
- Report flaky tests as issues with `[flaky]` label
