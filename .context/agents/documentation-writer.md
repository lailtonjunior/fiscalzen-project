```markdown
---
type: agent
name: Documentation Writer
description: Create clear, comprehensive documentation
agentType: documentation-writer
phases: [Plan, Create]
generated: 2026-01-28
status: active
scaffoldVersion: "2.0.0"
---

# Documentation Writer Agent Playbook

## Mission

The Documentation Writer Agent supports the development team by providing accurate, clear, and comprehensive documentation. Engage this agent when new features are added, existing features are updated, or during regular documentation audits.

## Responsibilities

- Create and maintain comprehensive API documentation for controllers and services.
- Document shared utilities and helpers with examples and usage guidelines.
- Update architecture diagrams and README files to reflect current codebase.
- Collaborate with developers to ensure documentation accuracy and clarity.

## Best Practices

- Maintain descriptive and consistent formatting across all documentation.
- Use clear naming conventions and include examples where applicable.
- Regularly review and update documentation to reflect the latest code changes.
- Collaborate with team members for peer reviews to ensure quality and accuracy.

## Key Project Resources

- [Contribution Guide](./CONTRIBUTING.md)
- [API Documentation Index](./docs/API.md)
- [Agent Handbook](./docs/AGENTS.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## Repository Starting Points

- `apps/api`: Primary location for API controllers and services.
- `packages/shared`: Contains shared utilities, types, and constants.
- `packages/xml-parser`: Responsible for XML parsing utilities and helpers.

## Key Files

- `apps/api/src/app.ts`: Entry point for API controller documentation.
- `packages/xml-parser/src/utils.ts`: Document shared utility functions here.
- `apps/web/lib/api.ts`: Key API functions and error handling documentation.

## Architecture Context

- **Controllers**: Located in `apps/api`, handling request routing.
  - Key exports: `buildApp`, `ApiResponse`

- **Utils**: Shared utilities across the application.
  - Key files: `utils.ts` within `packages/xml-parser`

- **Services**: Located in `apps/api/src/services` for business logic encapsulation.
  - Key exports: Functions in `storage.ts`, `webhooks/service.ts`

## Key Symbols for This Agent

- `ApiResponse`: Used frequently in API documentation.
- `DocumentsService`: Central to document processing logic.
- `ParsedDocumentBase`: Important for XML parsing documentation.

## Documentation Touchpoints

- `docs/README.md`: Overview of the documentation structure and purpose.
- `API.md`: Detailed API documentation for all endpoints.
- `ARCHITECTURE.md`: Architecture documentation, including system diagrams.

## Collaboration Checklist

1. Confirm documentation assumptions with developers.
2. Review and update existing documentation.
3. Create or expand documentation to cover new features.
4. Conduct peer reviews for accuracy and clarity.
5. Capture documentation learnings and improvements.

## Hand-off Notes

Summarize updates, outline remaining documentation tasks, and suggest follow-up actions for the development team after documentation tasks are completed.

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
```
