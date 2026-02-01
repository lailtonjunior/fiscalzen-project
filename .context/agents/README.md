```markdown
# Feature Developer Playbook

This playbook is for feature developers working on the FiscalZen project repository. It provides guidance on where to focus, workflows for common tasks, best practices, and code conventions within the project.

## Codebase Focus

### Key Directories and Files

- **Controllers**: Handle request routing and processing
  - `apps/api/src`
  - `apps/api/src/app.ts` - Contains `buildApp`, the application entry point.
  - `apps/api/src/utils/errors.ts` - Defines error handling conventions.

- **Services**: Encapsulate business logic
  - `apps/api/src/services` - Core service implementations.
  - `packages/sefaz-client/src/services` - External service integrations.

- **Models**: Define data structures
  - `packages/database/src/schema` - Tenant, Company, and NSU control schemas.

- **Components**: UI components and layouts
  - `apps/web/components` and related directories
  - `apps/web/components/error-boundary.tsx` - Error handling in UI components.

### Common Tasks and Workflows

1. **Adding a New Feature**

   - Identify the feature area (e.g., API, service, UI).
   - Modify or add controllers under `apps/api/src`.
   - Implement business logic in appropriate service classes.
   - Update models if data schema changes are needed.
   - Create UI components or update existing ones for web features.

2. **Modifying Existing Features**

   - Locate the existing feature using the directory structure.
   - Update business logic in the relevant service file.
   - Adjust related controllers for new API endpoints or logic changes.
   - Test components or services using the test files in the same directory.

3. **Testing Features**

   - Write or update unit tests in the `tests` directories.
   - For integration testing, focus on `apps/api/tests/integration`.
   - Use `jest` and `testing-library` conventions for consistency.

## Best Practices

- **Error Handling**: Use `ExternalServiceError` from `apps/api/src/utils/errors.ts` for consistent error management.
- **Service Design**: Follow the encapsulation pattern; each service should handle a specific domain area.
- **Modular Components**: UI components should be reusable; leverage `ErrorBoundary` and higher-order components like `withErrorBoundary`.

## Code Patterns and Conventions

- **Service Layer**: Abstracts business operations within service classes (`StorageService`, `WebhookService`).
- **Error Handling**: Centralized error management through specific error classes.
- **Data Models**: Align changes with schema definitions in `packages/database/src/schema`.

## Key Files and Their Purposes

- `apps/api/src/app.ts`: Application bootstrap and configuration.
- `apps/api/src/services`: Business logic orchestration.
- `packages/sefaz-client/src/services`: External API integrations.
- `apps/web/components`: User-facing components.
- `apps/api/src/utils/errors.ts`: Error handling strategies.

By following this playbook, feature developers can ensure their work aligns with existing patterns and maintain consistency across the codebase.
```
