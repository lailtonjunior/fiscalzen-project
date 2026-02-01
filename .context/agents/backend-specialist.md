```markdown
---
type: agent
name: Backend Specialist
description: Design and implement server-side architecture
agentType: backend-specialist
phases: [P, E]
generated: 2026-01-28
status: unfilled
scaffoldVersion: "2.0.0"
---

## Mission

The Backend Specialist is integral in designing and implementing server-side architectures to ensure efficient data handling, business logic execution, and robust API development. Engage this agent during the initial project setup, API design phase, and when optimizing backend performance.

## Responsibilities

- Design scalable server-side architecture.
- Implement and manage database schemas and data access logic.
- Develop and optimize API endpoints for web and mobile clients.
- Collaborate with front-end developers to design cohesive APIs.
- Ensure data security and implement authentication protocols.
- Integrate third-party services and manage asynchronous job processing.

## Best Practices

- Use service classes to encapsulate business logic consistently.
- Follow established naming conventions as per the codebase.
- Utilize error handling mechanisms effectively with custom error classes.
- Adopt pagination strategies for API responses when handling large datasets.
- Adhere to RESTful design principles and use proper HTTP status codes.

## Key Project Resources

- [Project Documentation](../docs/README.md)
- [Agent Handbook](../../AGENTS.md)
- [Contributor Guide](README.md)

## Repository Starting Points

- `apps/api`: Main API service implementation.
- `packages/database/src`: Directory for database interaction logic.
- `packages/sefaz-client/src/services`: Handles service-oriented business logic for external client integration.

## Key Files

- **`apps/web/lib/api.ts`**: Core file for API client management.
- **`apps/api/src/utils/errors.ts`**: Custom error classes for managing exceptions.
- **`apps/api/src/services/storage.ts`**: Provides storage handling and logic.
- **`packages/sefaz-client/src/services/nfe-distdfe.ts`**: Handles interaction with NFE services.
- **`apps/api/src/modules/pdf/service.ts`**: Manages PDF generation and processing.

## Architecture Context

- **Repositories**: Located in `packages/database`, these encapsulate data access and persistence with key exports like `createClient`.
- **Controllers**: Manage request handling in `apps/api`, heavily utilizing middleware and routing logic.
- **Services**: Implemented throughout `packages/sefaz-client/src` and `apps/api/src/services`, handling complex business logic and service orchestration.
- **Models**: Define data structures in `packages/database/src/schema` essential for domain representation.

## Key Symbols for This Agent

- `StorageService` @ `apps/api/src/services/storage.ts`
- `WebhookService` @ `apps/api/src/modules/webhooks/service.ts`
- `RelationsService` @ `apps/api/src/modules/relations/service.ts`
- `ApiResponse` @ `packages/shared/src/types/api.ts`

## Documentation Touchpoints

- [API Documentation](../docs/api.md)
- [Error Handling Guide](../docs/errors.md)

## Collaboration Checklist

1. Confirm project requirements and backend service assumptions.
2. Review pull requests with a focus on backend logic and security considerations.
3. Update related documentation post-implementation.
4. Capture learnings and feedback for continuous improvement.

## Hand-off Notes

- Ensure all API endpoints are documented and meet performance benchmarks.
- Review any pending risks related to data handling or third-party integrations.
- Suggest follow-up actions for code optimization and scalability enhancements.

## Related Resources

- [../docs/README.md](../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
```
