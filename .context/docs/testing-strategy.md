# Testing Strategy

This document outlines the testing strategy, tools, and standards used to maintain quality across the FiscalZen project.

## Overview

FiscalZen uses a multi-layered testing approach focusing on automated verification of business logic, XML parsing reliability, and API stability.

| Category | Tooling | Focus |
| :--- | :--- | :--- |
| **Unit Testing** | Vitest | Parsers, validators, utility functions, and business logic. |
| **Integration Testing** | Vitest + Supertest | API endpoints, database interactions, and queue jobs. |
| **Mocking** | Vitest Mocks/Spy | External SEFAZ/NFSe SOAP services and Redis connections. |
| **Coverage** | Vitest (v8) | Measurement of code path execution. |

## Test Infrastructure

### Framework: Vitest
We use **Vitest** across the entire monorepo for its speed, compatibility with Vite/ESM, and built-in mocking capabilities.

### Execution Commands

```bash
# Run all tests in the workspace
pnpm test

# Run tests for a specific package (e.g., xml-parser)
pnpm --filter @fiscalzen/xml-parser test

# Run tests with coverage report
pnpm test -- --coverage

# Run tests in watch mode for development
pnpm test -- --watch
```

## Layered Testing Strategy

### 1. Unit Tests
Located within each package's `tests/` directory. These tests are isolated and do not require external dependencies like databases or APIs.

*   **xml-parser**: High-priority tests for document detection (`detectDocumentType`) and GZIP decoding.
*   **sefaz-client**: Verification of XML signing (`signXml`), certificate parsing, and SOAP envelope construction.
*   **shared**: Validation logic for CNPJ/CPF and Access Keys.

### 2. Integration Tests
Primarily located in `apps/api/tests/`. These tests verify the interaction between different modules of the system.

*   **API Routes**: Uses `supertest` with `buildApp()` to verify HTTP responses, status codes, and JSON schemas.
*   **Job Workers**: Tests the logic of Background Jobs (SEFAZ monitor, Search sync) by mocking the BullMQ queues.
*   **Database**: Uses a test database instance (configured via `DATABASE_URL` in test environment).

### 3. External Service Mocking
Since the system relies heavily on SEFAZ and Municipal (ABRASF) web services, we use fixtures and mocks to simulate these interactions.

*   **Fixtures**: Stored in `tests/fixtures/` (e.g., `.xml` files representing real NFe/NFSe responses).
*   **SoapClient Mocks**: The `SoapClient` class is often mocked to return fixed XML responses to test the parsing and error handling logic.

## Test Standards & Patterns

### File Naming
Tests must follow the pattern `[name].test.ts` or `[name].spec.ts` and reside in a `tests/` directory relative to the source code.

### Sample Test Case (API)
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';

describe('Documents Module', () => {
  it('should return 401 if unauthorized', async () => {
    const app = await buildApp();
    const response = await request(app.server).get('/v1/documents');
    expect(response.status).toBe(401);
  });
});
```

### Setup and Teardown
For tests involving databases or global state, use the global setup files:
*   `apps/api/tests/setup.ts`: Handles database connections and environment variable overrides.

## Quality Gates

To ensure code quality, the following checks are integrated into the CI/CD pipeline (`.github/workflows/ci.yml`):

1.  **Linting**: `pnpm lint` must pass (no errors).
2.  **Type Checking**: `pnpm typecheck` must pass across all packages.
3.  **Test Suite**: All 100+ tests must pass.
4.  **Build**: `pnpm build` must succeed to ensure no broken dependencies.

## Target Coverage Goals

While not strictly enforced by a blocking threshold yet, the following targets are recommended:

*   **Packages (Core Logic)**: > 80% coverage.
*   **Apps (API/Web)**: > 60% coverage.
*   **Critical Paths**: 100% coverage for XML Parsing and Access Key validation.

## Troubleshooting Tests

### Database Conflicts
If tests are failing due to unique constraints or existing data, ensure that each test suite uses the `cleanup` helpers in `tests/utils/database.ts` (if available) or runs within a transaction.

### Timeout Issues
Tests interacting with the `BrowserManager` (RPA) or complex XML signing might require longer timeouts. Use `vitest.config.ts` to adjust:
```typescript
testTimeout: 15000 // 15 seconds for heavy integration tests
```
