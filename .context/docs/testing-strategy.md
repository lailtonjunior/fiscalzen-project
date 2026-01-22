# FiscalZen Testing Strategy

This document provides a comprehensive overview of the testing strategy used in the FiscalZen project. It describes the frameworks, methodologies, test categories, quality standards, and best practices essential for maintaining the software's reliability, accuracy, and stability, particularly in the context of fiscal document processing and external service integration.

---

## Core Philosophy

FiscalZen adopts a **multi-layered testing approach** to ensure:

- **Reliability:** Deterministic parsing of XML fiscal documents and predictable interactions with SEFAZ services.
- **Accuracy:** Correctness in fiscal calculations and document status management.
- **Stability:** Prevention of regressions across API endpoints, background jobs, and RPA workflows.

| Testing Tier          | Scope                          | Primary Tools         | Coverage Target       |
|-----------------------|--------------------------------|----------------------|-----------------------|
| **Unit Tests**        | Isolated logic (parsers, validators) | Vitest               | > 80% coverage        |
| **Integration Tests** | API routes, database, job workflows | Vitest + Supertest   | Focus on critical paths|
| **RPA / End-to-End**  | Web scrapers for NFSe          | Playwright + Vitest   | Success & failure scenarios |

---

## Testing Stack

### Frameworks and Libraries

- **Vitest:** A fast, ESM-compatible test runner optimized for Vite-based projects, used for unit and integration tests.
- **Supertest:** Facilitates HTTP assertions to test API endpoints systematically.
- **Vitest Mocking (`vi`):** Built-in utilities for spies, mocks, and stubs to isolate dependencies.
- **PostgreSQL Database:** Accessed via Prisma or Drizzle ORM with isolated test schemas to avoid cross-test interference.
- **Queue Mocking:** Custom wrappers simulate BullMQ job execution without requiring a live Redis instance during unit tests.

---

## Test Categories

### 1. Unit Tests (Package-Level)

- **Purpose:** Verify the correctness of small, isolated components without external dependencies.
- **Locations:** Typically co-located within each package under `tests/` or alongside source files.
- **Key Packages Tested:**
  - `@fiscalzen/xml-parser`: XML document detection, schema extraction, and GZIP decompression.
  - `@fiscalzen/sefaz-client`: SOAP envelope creation, XML signing using test certificates, and response parsing.
  - `@fiscalzen/shared`: Utilities for formatting and validating fiscal identifiers (CNPJ, CPF), and access keys.

**Example: Testing XML Document Detection**

```typescript
import { describe, it, expect } from 'vitest';
import { detectDocumentType } from '../src/detector';

describe('Document Detector', () => {
  it('should identify NFe document from XML content', () => {
    const xml = '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">...</nfeProc>';
    const result = detectDocumentType(xml);
    expect(result.type).toBe('nfe');
  });
});
```

---

### 2. Integration Tests (Application-Level)

- **Purpose:** Validate interactions among API routes, service layers, and the database.
- **Location:** Primarily located in `apps/api/tests/`.
- **Test Focus Areas:**
  - API endpoint responses and validations.
  - Job workers and queue processing logic.
  - Document lifecycle and event status transitions.

**Example: API Integration Test for Manifestação Endpoint**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';

describe('POST /v1/manifestacao', () => {
  it('should create a "Ciência da Operação" event', async () => {
    const app = await buildApp();
    const res = await request(app.server)
      .post('/v1/manifestacao/ciencia')
      .send({ chave: '3523...', cnpj: '12345678000199' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

---

### 3. External Service Mocking

- **Purpose:** Simulate interactions with external SEFAZ SOAP services and municipal RPA systems without using live endpoints.
- **Approach:**
  - Use XML fixture files containing representative SEFAZ and RPA responses stored in `tests/fixtures/`.
  - Mock the `SoapClient` class to return fixture data.
  - Validate parsing and error handling, including edge cases such as SEFAZ return code 137 (no documents found).

---

## Quality Gates

Quality assurance is enforced through continuous integration by the following checks:

1. **Static Analysis**
   - ESLint for code linting (`pnpm lint`).
   - TypeScript type checking (`pnpm typecheck`).
2. **Automated Tests**
   - All tests must pass successfully across all packages before merging.
3. **Build Verification**
   - Ensure successful build and linking within the monorepo.

These activities are configured in the `.github/workflows/ci.yml` file, preventing merges with code quality or test failures.

---

## Running Tests

### Basic Commands

```bash
# Run all tests in the repository
pnpm test

# Run tests for a specific package
pnpm --filter @fiscalzen/xml-parser test

# Run tests with coverage reports
pnpm test -- --coverage
```

### Environment Variables for Integration Tests

Integration tests requiring database and Redis connections use environment variables usually set in `.env.test`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/fiscalzen_test"
REDIS_URL="redis://localhost:6379/1"
NODE_ENV="test"
```

---

## Best Practices for Developers

- **Load Fixtures:** Use provided utilities to load large XML or response fixtures from files rather than embedding them inline for readability and maintainability.
- **Isolate Tests:** Ensure database and environment state are reset between tests using hooks such as `beforeEach` and `afterEach`.
- **Control Time:** For scenarios sensitive to time (like token expiration), use Vitest’s `vi.setSystemTime()` to mock system clocks.
- **Test Edge Cases:** Include tests covering malformed XML, invalid fiscal identifiers (CNPJ/CPF), and remote service timeouts or errors to prevent regressions.

### Handling Timeouts in Longer Tests

Some tests, especially those involving RPA mechanisms or cryptographic signing, can be slow. Use Vitest’s timeout option to extend allowed time:

```typescript
describe('NFSe Scraper', () => {
  it('should login and download XML', async () => {
    // Test implementation here
  }, { timeout: 30000 }); // 30 seconds timeout
});
```

---

## Related Files and Resources

- **XML Parser Tests:** `packages/xml-parser/tests/`  
  Covers XML parsing, detection, and schema validation logic.
- **SEFAZ Client Tests:** `packages/sefaz-client/tests/`  
  Tests SOAP client behavior, XML signing, and error responses.
- **API Integration Tests:** `apps/api/tests/`  
  End-to-end API route and service behavior tests, including job processing.
- **Fixtures:** `tests/fixtures/`  
  Stores representative XML and SOAP response samples for mocking external services.

---

This testing strategy ensures that FiscalZen remains maintainable, reliable, and robust—providing confidence as fiscal compliance rules and external APIs evolve.
