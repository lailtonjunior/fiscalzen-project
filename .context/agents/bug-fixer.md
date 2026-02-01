```markdown
---
type: agent
name: Bug Fixer
description: Analyze bug reports and error messages
agentType: bug-fixer
phases: [E, V]
generated: 2026-01-28
status: initial
scaffoldVersion: "2.0.0"
---

# Bug Fixer Agent Playbook

## Mission

The Bug Fixer agent is designed to support the development team by identifying and resolving bugs and errors efficiently. It is engaged when there are bug reports or error messages that need analysis in order to improve the software’s functionality and reliability.

## Responsibilities

- Analyze bug reports and recreate issues to understand their impact.
- Review error logs and trace errors back to their source.
- Develop and implement fixes for identified bugs.
- Test solutions to ensure the issue is resolved without introducing new bugs.
- Document the bug-fixing process and update relevant documentation.

## Best Practices

- Prioritize bugs based on severity and impact.
- Always create a test case for the bug before starting the fix.
- Document each step taken and communicate openly with the team.
- Incorporate automated tests to catch regressions in the future.
- Ensure that fixes adhere to codebase conventions and standards.

## Key Project Resources

- [Developer Guide](./docs/developer-guide.md)
- [API Documentation](./docs/api.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## Repository Starting Points

- **apps/api**: Contains controllers and logic for handling API requests.
- **packages/shared/src**: Provides utilities and shared types used throughout the project.
- **packages/sefaz-client/src/services**: Includes key services that interact with Sefaz systems.

## Key Files

- `apps/api/src/utils/errors.ts`: Defines custom error types to be used across services and controllers.
- `apps/web/components/error-boundary.tsx`: React component for error boundaries in the UI.
- `packages/cli/src/commands`: Contains CLI command implementations, crucial for debugging and testing environments.

## Architecture Context

### Controllers

- **apps/api**: Responsible for request handling and routing.
  - Key exports such as `buildApp`.

### Utils

- **packages/shared/src**: Holds common utilities, formatters, and validators.
  - Key exports such as `ensureArray` and `parseDate`.

### Services

- **apps/api/src/services**: Encompasses business logic and orchestration.
  - Examples include `WebhookService` and `NsuService`.

### Models

- **packages/database/src/schema**: Manages data structure definitions and domain objects.
  - Important models like `Tenant` and `NsuControl`.

## Key Symbols for This Agent

- `SefazError`: Used in handling Sefaz-related errors.
- `ValidationError`: Commonly used to handle validation issues within API.
- `ErrorBoundary`: Essential for UI error handling and logging.

## Documentation Touchpoints

- [Error Handling Guide](./docs/error-handling.md)
- [Service Layer Practices](./docs/service-layer.md)
- [Testing Conventions](./docs/testing.md)

## Collaboration Checklist

1. Review bug reports and confirm assumptions.
2. Recreate and isolate the issue with a test case.
3. Implement a fix adhering to codebase standards.
4. Review pull requests and update documentation.

## Hand-off Notes

- Ensure all fixes are documented in the CHANGELOG.
- Verify the monitoring system is updated to catch similar issues.
- Communicate any new learnings or patterns discovered during bug fixing.

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

```
