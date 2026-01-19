# Test Writer Agent Playbook

## Mission
To ensure the reliability, accuracy, and stability of the FiscalZen platform by implementing a robust testing strategy that covers fiscal logic, API integrations (SEFAZ/NFSe), and UI components.

## Responsibilities
- **Unit Testing**: Validate individual functions, especially XML parsers and fiscal validators.
- **Integration Testing**: Verify interactions between the API, Database, and external SOAP services.
- **Fixture Management**: Maintain realistic XML and JSON fixtures for Brazilian fiscal documents (NFe, CTe, MDFe, NFSe).
- **Regression Testing**: Ensure new features or fixes don't break existing SEFAZ monitor logic or data persistence.

## Core Testing Areas

### 1. Fiscal XML Parsing (`packages/xml-parser`)
This is the most critical area. Any error here leads to incorrect tax calculations or document storage.
- **Focus**: `packages/xml-parser/src/parsers/`
- **Key Files**: `packages/xml-parser/tests/parsers.test.ts`
- **Task**: Test every new document version or tag addition using `loadFixture`.

### 2. SEFAZ SOAP Communications (`packages/sefaz-client`)
Handles the complex communication with Brazilian government web services.
- **Focus**: `packages/sefaz-client/src/services/`
- **Key Files**: `packages/sefaz-client/tests/soap-client.test.ts`
- **Task**: Mock SOAP responses for different states (UF) and environments (Homologação/Produção).

### 3. API Business Logic (`apps/api`)
Focuses on the orchestration of jobs, document workflows, and tenant isolation.
- **Focus**: `apps/api/src/modules/`, `apps/api/src/jobs/`
- **Key Files**: `apps/api/tests/sefaz-monitor.test.ts`
- **Task**: Test the `scheduler`, `queues`, and `manifestacao` logic.

### 4. UI Components & Hooks (`apps/web`)
Ensures the dashboard and document viewers function correctly.
- **Focus**: `apps/web/lib/hooks/`, `apps/web/components/`
- **Task**: Test data fetching hooks (`useDocuments`, `useManifestar`) and form validations.

---

## Workflows & Steps

### Creating a New Unit Test
1. **Identify Target**: Locate the function in `packages/shared` or `packages/xml-parser`.
2. **Check Patterns**: Open an existing `.test.ts` file in the same package to match the Vitest/Jest configuration.
3. **Setup Fixtures**: If testing XML, add a sample file to `packages/xml-parser/tests/fixtures/`.
4. **Implement**:
   - Use `describe` blocks for the function name.
   - Use `it` or `test` for specific behaviors (e.g., "should parse ICMS values correctly").
   - Use `expect(...).toMatchObject(...)` for large objects.

### Testing a New API Route
1. **Setup Fastify Test Instance**: Use `buildApp()` from `apps/api/src/app.ts`.
2. **Mock Authentication**: Use the `setAuthToken` helper or mock the `preHandler` hook.
3. **Database State**: Use `packages/database/src/client.ts` to seed temporary data if needed.
4. **Assertions**: Verify both the HTTP status code and the `ApiResponse` structure.

---

## Codebase Patterns & Best Practices

### 1. Fixture-Driven Development
The codebase heavily relies on `loadFixture`.
- **Pattern**: 
  ```typescript
  const xml = loadFixture('nfe/v4.00/document.xml');
  const result = parseNFe(xml);
  expect(result.chave).toBe('...');
  ```
- **Rule**: Never hardcode long XML strings inside test files.

### 2. Mocking External Services (SEFAZ)
Do not hit real SEFAZ endpoints.
- **Pattern**: Use `vi.mock` or `msw` to intercept SOAP requests.
- **Key Symbol**: `consultarDistDFe` is a primary target for mocking.

### 3. Handling BigInt and Decimals
Fiscal values use `parseDecimal`.
- **Rule**: When asserting currency or tax values, ensure you are comparing types correctly (usually strings or specific Decimal objects to avoid floating-point issues).

### 4. Tenant Isolation
- **Rule**: Every API test must verify that `tenantId` is respected. Ensure one company's documents are never visible to another during integration tests.

---

## Key Project Resources

### Repository Structure
- `apps/api/`: Fastify-based backend. Contains integration tests in `tests/`.
- `apps/web/`: Next.js frontend. Uses Tailwind and Radix UI.
- `packages/xml-parser/`: Core logic for turning SEFAZ XML into JSON. High test priority.
- `packages/sefaz-client/`: SOAP clients for NFe, CTe, MDFe.
- `packages/database/`: Drizzle ORM schema and migrations.
- `packages/shared/`: Validations (CPF/CNPJ), formatters, and shared types.

### Essential Entry Points for Testing
- **API Entry**: `apps/api/src/app.ts` (Use `buildApp` for tests)
- **Shared Validators**: `packages/shared/src/validators/index.ts`
- **Schema Definitions**: `packages/database/src/schema/index.ts`

### Testing Tooling
- **Test Runner**: Vitest (preferred) or Jest.
- **Mocks**: `vi` for functions/modules.
- **Database**: PostgreSQL (Docker-based for local testing).

---

## Collaboration & Hand-off

### Before Finishing a Task:
1. Run all tests in the affected package: `npm test` or `pnpm test`.
2. Check coverage: Ensure new logic has at least 80% coverage.
3. **Summary**: Provide a list of:
   - New test files created.
   - Edge cases covered (e.g., "Handles empty XML tags", "Unauthorized access returns 401").
   - Any manual steps required (e.g., "Requires a new environment variable for the test DB").
