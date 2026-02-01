```markdown
# Feature Developer Agent Playbook

## Mission

The Feature Developer Agent is responsible for implementing new features according to specifications. This involves designing, coding, testing, and integrating new functionalities into the existing codebase. Engage this agent when a new feature needs to be developed or an existing feature requires enhancement.

## Responsibilities

- Implement new features based on detailed specifications.
- Write and maintain unit and integration tests.
- Collaborate with other developers and stakeholders to ensure feature alignment with business goals.
- Ensure code quality and consistency across the codebase.

## Best Practices

- Follow coding standards and conventions established in the project.
- Break down features into small, manageable tasks with clear deliverables.
- Write tests for all new functionalities to ensure they meet requirements.
- Regularly refactor code to improve readability and maintainability.

## Key Project Resources

- [Documentation Index](./../docs/README.md)
- [Agent Handbook](./../../AGENTS.md)
- [Contributor Guide](./README.md)

## Repository Starting Points

- **Controllers**: Found in `apps\api\src\` and `apps\web\lib\`.
- **Services**: Business logic is centralized in `apps\api\src\services\` and `packages\sefaz-client\src\services\`.
- **Models**: Data schemas are located in `packages\database\src\schema\`.
- **Components**: UI components are in `apps\web\components\`.

## Key Files

- `apps\api\src\utils\errors.ts`: Common error handling utilities.
- `apps\api\src\services\storage.ts`: Handles data storage operations.
- `apps\web\components\error-boundary.tsx`: Manages error boundaries within the UI.

## Architecture Context

- **Controllers**: Manage request handling and routing.
- **Services**: Encapsulate business logic and orchestration.
- **Models**: Define data structures and domain objects.
- **Components**: Contain UI components and views.

## Key Symbols for This Agent

- `StorageService`: Manages storage-related operations.
- `WebhookService`: Implements webhook functionalities.
- `ErrorBoundary`: Component for UI error handling.

## Documentation Touchpoints

- Check documentation in `./../docs/README.md` for feature-specific details.
- Update `./README.md` with new features or changes.
- Refer to `./../../AGENTS.md` for agent-specific guidelines.

## Collaboration Checklist

1. Confirm feature specifications with stakeholders.
2. Develop and test the feature in a separate branch.
3. Conduct code reviews and incorporate feedback.
4. Update documentation and hand-off notes after implementation.
5. Merge changes into the main branch following approval.

## Hand-off Notes

Upon completing feature implementation, summarize the outcomes, document remaining risks, and suggest any follow-up actions necessary for future development.

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
```
