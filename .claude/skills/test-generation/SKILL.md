---
name: Test Generation
description: Gera testes unitários e de integração seguindo padrões do projeto
---

# Test Generation Playbook

## When to Use
Activate this skill when writing tests or when tasked with adding test coverage to ensure that individual units of code are functioning as expected, especially focusing on comprehensive test scenarios including unit tests, integration tests, and edge cases.

## Instructions
1. **Identify the Functionality**: Determine the function or component that requires testing.
2. **Select the Test Type**:
   - Use **Unit Tests** for individual function verification.
   - Use **Integration Tests** to check interactions between modules.
3. **Define Edge Cases**: Consider special scenarios such as null values, invalid inputs, and performance under stress (e.g., concurrent calls).
4. **Use Mocks**: Implement mocks for external dependencies using tools like Jest to isolate tests effectively.
5. **Structure the Tests**:
   - Follow the **Arrange-Act-Assert (AAA)** pattern.
   - Name your tests following the convention: `[methodName]_[scenario]_[expectedResult]`.
6. **Run the Tests**: Execute the tests and verify results.
7. **Review Coverage**: Ensure that your tests cover at least:
   - Statements: 80%+
   - Branches: 75%+
   - Functions: 90%+
   - Lines: 80%+

## Examples
### Unit Test Example
```typescript
// File: packages/sefaz-client/tests/services.test.ts

describe('getAmbienteCode', () => {
    it('should return the correct code for valid input', () => {
        const input = 'validInput';
        const expectedOutput = 'expectedOutput';
        const result = getAmbienteCode(input);
        expect(result).toEqual(expectedOutput);
    });

    it('should handle null input', () => {
        const result = getAmbienteCode(null);
        expect(result).toBe('defaultCode');
    });
});
```

### Integration Test Example
```typescript
// File: apps/api/tests/sefaz-monitor.test.ts

describe('calculateNextSyncInterval', () => {
    it('should calculate the next sync interval correctly', async () => {
        const response = await someApiCall(); // Mock this method
        expect(response.nextSyncTime).toBeDefined();
    });
});
```

## Guidelines
- **Mocking Strategies**: Always mock external services like SOAP endpoints to maintain test reliability.
- **Edge Case Coverage**: Make sure to test edge cases such as empty inputs and invalid data types.
- **Organizing Tests**: Keep test files close to their corresponding implementation files to maintain locality.
- **Collaboration**: Encourage sharing of test cases among team members for consistency.
- **Refactor Tests**: Keep tests maintainable; if a test becomes complex, consider refactoring it for clarity.

By following these guidelines and using the structure outlined, you can systematically ensure that your testing code contributes to a robust and maintainable codebase.