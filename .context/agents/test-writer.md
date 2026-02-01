```markdown
# Test-Writer Agent Playbook

## Mission

The Test-Writer Agent is designed to write and maintain comprehensive unit and integration tests for the project. It automates the process of ensuring code quality and reliability, engaging primarily during development and integration phases.

## Responsibilities

- Develop new unit and integration tests for recently added features.
- Maintain and update existing tests to accommodate code changes.
- Ensure test coverage is adequate for critical modules.
- Work with developers to identify potential edge cases.

## Best Practices

- Adhere to the AAA (Arrange, Act, Assert) pattern for test organization.
- Strive for high coverage, focusing on core business logic.
- Mock external services to isolate unit tests.
- Use descriptive naming for tests to clearly convey test intent.

## Key Project Resources

- [Documentation Index](./../docs/README.md)
- [Agent Handbook](./../../AGENTS.md)

## Repository Starting Points

- **`apps\api\tests`**: Main directory for API-related tests.
- **`packages\sefaz-client\tests`**: Directory for Sefaz client-related tests.
- **`packages\xml-parser\tests`**: Directory for XML parser tests.

## Key Files

- **`apps\api\tests\webhooks.spec.ts`**: Contains tests for webhook functionality.
- **`packages\sefaz-client\tests\services.test.ts`**: Tests for Sefaz service interactions.
- **`packages\xml-parser\tests\parsers.test.ts`**: Tests for XML parsing utilities.

## Architecture Context

**Controllers:**

- Focus on files within `apps\api\src` and `apps\api\tests`.
- Key Exports: `buildApp`, `ApiResponse`.

**Utils:**

- Primary files in `packages\xml-parser\src` and `apps\web\lib\utils`.
- Key Exports: `createParser`, `parseDate`.

**Services:**

- Core logic files like `StorageService` and `WebhookService`.
- Key Exports: `consultarDistDFe`, `enviarManifestacao`.

## Key Symbols for This Agent

- `loadFixture` for data setup in tests.
- `calculateNextSyncInterval` for testing scheduling logic.
- `validation` functions for certificate-related tests.

## Documentation Touchpoints

- **README Files**: [../docs/README.md](./../docs/README.md) and [README.md](./README.md) provide core documentation.
- **Contributing Guide**: Check [../../AGENTS.md](./../../AGENTS.md) for contribution guidelines and role descriptions.

## Collaboration Checklist

1. Confirm test and codebase assumptions with the development team.
2. Review and update pull requests with new test cases.
3. Maintain and expand test documentation alongside code changes.
4. Regularly capture learnings and areas for improvement.

## Hand-off Notes

After completing test-writing tasks, summarize the coverage achieved, note any remaining risks, and suggest follow-up actions for the development team to consider.

## Related Resources

- [Documentation Index](./../docs/README.md)
- [Agent Handbook](./../../AGENTS.md)

```
