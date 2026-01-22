# Test Generation

## When to Use
Use this skill whenever you need to create or expand tests for the FiscalZen platform’s code components, especially to ensure robustness, correctness, and maintainability of individual units and integrated modules. This applies when implementing new features, fixing bugs, refactoring existing logic, or improving overall test coverage for critical fiscal management modules like XML parsers, SOAP clients, document services, and API endpoints. Generating tests proactively prevents regressions and validates complex fiscal domain logic interacting with SEFAZ government services and municipal integrations.

## Instructions
1. **Identify the target code** to be tested, such as functions, service methods, parsers, or API route handlers. Reference corresponding implementation files in `packages/sefaz-client/src/services`, `packages/xml-parser/src`, or `apps/api/src/modules/`.
2. **Determine the test type**:
   - Write **unit tests** for isolated logic (e.g., utility functions like `getAmbienteCode` or `escapeXml`).
   - Write **integration tests** for API flows or multi-module interactions (e.g., SEFAZ background jobs in `apps/api/tests/sefaz-monitor.test.ts`).
3. **Gather or create test fixtures** using helpers like `loadFixture` seen in `packages/xml-parser/tests/parsers.test.ts` and `packages/sefaz-client/tests/soap-client.test.ts` to simulate realistic XML inputs or SOAP responses.
4. **Define edge cases and boundary conditions**, including:
   - Null or undefined inputs
   - Invalid XML or malformed SOAP requests
   - Service responses with error codes or unexpected fields
   - Time-based or concurrency scenarios (e.g., testing interval calculations)
5. **Use mocking libraries** (Jest mocks/spies) to isolate external dependencies, such as SOAP endpoints or file reads, enabling deterministic tests and avoiding network calls.
6. **Structure test files** consistently within the existing test folders under each package or app, preserving naming conventions like `*.test.ts`. Align test names with the pattern `[methodName]_[scenario]_[expectedResult]` for clarity.
7. **Follow the Arrange-Act-Assert pattern** inside each test case:
   - Arrange setup context, inputs, and mocks
   - Act by calling the function or service method under test
   - Assert expected outputs, side effects, or thrown errors
8. **Run tests locally** using the configured test runner (Jest) via project scripts (e.g., `pnpm test`, or `pnpm test:watch`).
9. **Review code coverage** and ensure it meets or exceeds project thresholds:
   - Statements ≥ 80%
   - Branches ≥ 75%
   - Functions ≥ 90%
   - Lines ≥ 80%
10. **Document any complex behaviors** or assumptions in comment blocks inside the test files to aid team comprehension and future maintenance.

## Examples
### Unit Test Example
```typescript
// File: packages/sefaz-client/tests/services.test.ts
import { getAmbienteCode } from '../../src/services/environment';

describe('getAmbienteCode', () => {
  it('should return the correct environment code for production string', () => {
    const input = 'production';
    const expected = '1';
    const result = getAmbienteCode(input);
    expect(result).toBe(expected);
  });

  it('should return the default code for null input', () => {
    const result = getAmbienteCode(null);
    expect(result).toBe('2'); // Assuming '2' is default (development)
  });

  it('should handle unknown values gracefully', () => {
    const result = getAmbienteCode('unknown_value');
    expect(result).toBe('2');
  });
});
```

### Integration Test Example
```typescript
// File: apps/api/tests/sefaz-monitor.test.ts
import { calculateNextSyncInterval } from '../../src/modules/sefaz-monitor/service';

describe('calculateNextSyncInterval', () => {
  it('should compute the next sync interval based on last sync time and backoff strategy', () => {
    const lastSync = new Date(Date.now() - 1000 * 60 * 10); // 10 minutes ago
    const interval = calculateNextSyncInterval(lastSync);
    expect(interval).toBeGreaterThan(0);
    expect(interval).toBeLessThanOrEqual(1000 * 60 * 30); // Less than or equal to 30 minutes
  });

  it('should handle null lastSync by returning default interval', () => {
    const interval = calculateNextSyncInterval(null);
    expect(interval).toEqual(1000 * 60 * 15); // Default 15 minutes
  });
});
```

### Using Test Fixture with Mocking
```typescript
// File: packages/xml-parser/tests/parsers.test.ts
import { loadFixture } from './helpers';

describe('XML Parser', () => {
  it('should parse valid NF-e XML fixture into JSON accurately', async () => {
    const xmlContent = await loadFixture('nfe-sample.xml');
    const parsed = parseXmlToJson(xmlContent);
    expect(parsed).toHaveProperty('NFe');
    expect(parsed.NFe.infNFe).toHaveProperty('ide');
  });

  it('should throw an error on malformed XML input', async () => {
    const malformedXml = '<NFe><infNFe></NFe>'; // missing closing tag for infNFe
    expect(() => parseXmlToJson(malformedXml)).toThrow('Invalid XML format');
  });
});
```

## Guidelines
- **Mock External Services Consistently:** Use Jest mocks to simulate SOAP client calls and avoid flaky networked tests. For example, in `packages/sefaz-client/tests/soap-client.test.ts`, mock SOAP responses to cover success and error scenarios.
- **Leverage Existing Helpers and Fixtures:** Use functions like `loadFixture` to reuse XML and SOAP request samples ensuring tests are realistic and data-driven.
- **Maintain Test Proximity:** Place test files alongside their modules in the monorepo to keep code and tests tightly coupled, facilitating easier maintenance and discoverability.
- **Name Tests Clearly:** Follow the `[methodName]_[scenario]_[expectedResult]` or descriptive phrasing for test case names to ensure intent is explicit in reports and logs.
- **Cover Edge Cases Thoroughly:** Pay special attention to Brazilian fiscal domain peculiarities such as different SEFAZ environments, certificate handling, and manifestação event types.
- **Test Both Success and Failure Paths:** Validate not only that code works as expected, but also that it fails gracefully and provides helpful error messages.
- **Regularly Review Coverage Reports:** Use coverage tools integrated with Jest to identify untested branches or statements and address them.
- **Keep Tests Fast and Isolated:** Avoid heavy setup or external dependencies that slow tests down or create intermittent failures.
- **Collaborate and Share Test Knowledge:** Use common test utilities and share fixtures across packages when possible to standardize test approaches.
- **Refactor Tests When Needed:** Simplify complex test logic by extracting reusable setups or mocks to keep tests clean and maintainable.

By adhering to this tailored playbook, AI agents and developers working on FiscalZen can deliver robust, clear, and maintainable test suites that ensure the quality and reliability of Brazil’s complex fiscal management platform.
