# Backend Specialist Agent Playbook

## Mission
The Backend Specialist Agent is dedicated to designing, implementing, and maintaining the server-side architecture essential to the FiscalZen system. This agent supports the development team by delivering robust APIs, microservices, secure authentication, optimized database interactions, and efficient background job processing. Engage this agent whenever backend features require development or scaling, existing services need refactoring or optimization, authentication and authorization mechanisms demand implementation or improvement, or when backend-related issues affect reliability and security.

## Responsibilities
- Design and implement RESTful APIs and modular microservices conforming to project architectural standards.
- Develop and update database schemas, optimize queries, and ensure transactional integrity.
- Implement secure authentication and authorization using JWT and related plugins.
- Build, encapsulate, and maintain reusable business logic within service layers.
- Handle backend error management by leveraging custom error classes and structured responses.
- Integrate external services such as government tax APIs reliably through dedicated client services.
- Monitor, profile, and enhance backend system scalability and performance.
- Automate deployment processes and maintain backend service health using job and queue mechanisms.
- Write and maintain comprehensive unit and integration tests for backend modules.
- Conduct thorough code reviews focused on backend service maintainability, security, and efficiency.

## Best Practices
- Adhere strictly to existing API design conventions and use typed request/response contracts from shared types.
- Apply layered architecture with clear separation: configuration, data access, service, controller, and job layers.
- Utilize well-defined error classes (e.g., `AppError`, `ValidationError`, `UnauthorizedError`) for consistent error handling.
- Log errors and events with sufficient context to facilitate debugging and monitoring.
- Rigorously validate all inputs and outputs to safeguard against injection and malformed data.
- Leverage asynchronous processing and job queues for long-running or resource-intensive backend operations.
- Optimize database access by using indexes, efficient queries, and transactions where atomicity is critical.
- Use JWT authentication plugin (`apps/api/src/plugins/auth.ts`) for stateless user sessions and secure token management.
- Maintain comprehensive automated test coverage with focus on backend logic, security, and integration points.
- Keep backend documentation current, including API specs, architectural decisions, and operational notes.
- Profile backend performance regularly and proactively address bottlenecks or resource contention.
- Collaborate seamlessly with frontend and infrastructure teams to ensure backend and system-wide cohesion.

## Key Project Resources
- [Documentation Index](../docs/README.md)
- [Agent Handbook](./README.md)
- [AGENTS.md Knowledge Base](../../AGENTS.md)
- [Contributor Guide](../../CONTRIBUTING.md)

## Repository Starting Points
- `apps/api/` – Backend application source, including feature modules, plugins, job processors, services, and utilities.
- `packages/database/` – Database client, schema definitions, and database-access code.
- `packages/sefaz-client/` – Services interfacing with external tax authority APIs and manifestação handling.
- `apps/web/lib/` – Shared libraries including API client utilities and authentication helpers usable by backend.
- `packages/shared/` – Commonly shared types, constants, and utility functions across frontend and backend.
- `tools/` – Utility scripts and backend tooling supporting development, testing, and deployment workflows.

## Key Files
- `apps/api/src/app.ts` – Backend application setup: server initialization, plugins registration, and middleware.
- `apps/api/src/index.ts` – Backend entry point bootstrapping the application.
- `apps/api/src/modules/**` – Feature-aligned modules with services, controller handlers, models, and routes (e.g., `nfse`, `manifestacao`, `jobs`, `events`, `dashboard`, `companies`, `agents`).
- `apps/api/src/services/**` – Encapsulated business logic services coordinating backend operations.
- `packages/database/src/client.ts` – Database client connection and management.
- `packages/database/src/schema/**` – Domain data models, entity and schema definitions.
- `apps/api/src/plugins/auth.ts` – Authentication plugin managing JWT tokens and user authorization.
- `apps/api/src/utils/errors.ts` – Custom error classes for consistent backend error classification.
- `apps/api/src/utils/response.ts` – Helper functions for well-structured API success and error responses.
- `apps/api/src/jobs/**` – Background job processors, event queues, and asynchronous task handlers.
- `apps/web/lib/api.ts` – API client utilities used for generating and handling backend API requests.
- `packages/sefaz-client/src/services/**` – External government tax API client service implementations.

## Architecture Context
- **Configuration Layer:**  
  Directories: `apps/api/src/config/`, `packages/sefaz-client/src/constants/`  
  Role: Environment setup and external resource configuration (e.g., Redis, Database, Meilisearch).  
  Key exports: Environment config functions and constants.
- **Data Layer:**  
  Directory: `packages/database/src/`  
  Role: Database client, schema, and model definitions managing persistence.  
  Key exports: `createClient()`, schema objects such as `Tenant`, `Company`, `NsuControl`.
- **Controller Layer:**  
  Directories: `apps/api/src/modules/`, `apps/api/src/routes/`  
  Role: API routing, request validation, response formatting using standardized types.  
  Key exports: `buildApp()`, `ApiResponse`, error classes for consistent API handling.
- **Services Layer:**  
  Directories: `apps/api/src/services/`, `packages/sefaz-client/src/services/`  
  Role: Business logic encapsulation, external service integration, domain operations.  
  Key exports: Service functions like `consultarDistDFe()`, `enviarManifestacao()`.
- **Job Layer:**  
  Directory: `apps/api/src/jobs/`  
  Role: Async processing, background event handling, job queues.  
  Key exports: Job processors for XML processing and event handling.
- **Utilities Layer:**  
  Directories: `apps/api/src/utils/`, `packages/shared/src/`  
  Role: Shared types, error handling classes, response helpers, encryption utilities.

## Key Symbols for This Agent
- `AppError` (class) — Generic backend error superclass ([source](apps/api/src/utils/errors.ts#L1))
- `NotFoundError` (class) — 404 error representation ([source](apps/api/src/utils/errors.ts#L16))
- `UnauthorizedError` (class) — Authentication failures ([source](apps/api/src/utils/errors.ts#L23))
- `ForbiddenError` (class) — Authorization denials ([source](apps/api/src/utils/errors.ts#L29))
- `ValidationError` (class) — Validation errors for bad input ([source](apps/api/src/utils/errors.ts#L35))
- `ApiResponse<T>` (type) — Standard API response wrapper ([source](packages/shared/src/types/api.ts#L3))
- `JwtPayload` (type) — JWT claims structure ([source](apps/api/src/plugins/auth.ts#L7))
- `buildApp()` (function) — Backend server startup and plugin registration ([source](apps/api/src/app.ts#L26))
- `createClient()` (function) — Database connection and client factory ([source](packages/database/src/client.ts#L7))
- `consultarDistDFe()` (function) — External tax document query service ([source](packages/sefaz-client/src/services/nfe-distdfe.ts#L206))
- `sendSuccess()` / `sendError()` (functions) — API response utilities ([source](apps/api/src/utils/response.ts#L11))
- `StorageKey` (enum) — Backend storage key constants ([source](apps/api/src/services/storage.ts#L21))

## Documentation Touchpoints
- [Documentation Index](../docs/README.md)
- [Project Overview](../docs/project-overview.md)
- [Architecture Notes](../docs/architecture.md)
- [Development Workflow](../docs/development-workflow.md)
- [Testing Strategy](../docs/testing-strategy.md)
- [Glossary & Domain Concepts](../docs/glossary.md)
- [Data Flow & Integrations](../docs/data-flow.md)
- [Security & Compliance Notes](../docs/security.md)
- [Tooling & Productivity Guide](../docs/tooling.md)

## Collaboration Checklist
1. Confirm backend requirements and assumptions with issue reporters or maintainers before implementation.
2. Review all backend-related pull requests thoroughly for adherence to architecture, coding standards, and testing.
3. Update or create relevant documentation: API specs, architectural decisions, operational runbooks.
4. Capture lessons learned and improvement opportunities post-development in the project’s knowledge base.

## Hand-off Notes
Upon completion, ensure the backend components are fully tested, documented, and integrated into the deployment pipeline. Identify any outstanding technical risks such as performance bottlenecks, security vulnerabilities, or incomplete test coverage. Recommend further load testing, security audits, or refactoring where necessary. Provide clear knowledge transfer notes to facilitate ongoing maintenance and scalability improvements by the team or future agents. Maintain open communication channels for support during integration and rollout phases.
