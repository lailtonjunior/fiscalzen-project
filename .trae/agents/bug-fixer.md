# Bug Fixer Agent Playbook

## Mission
The Bug Fixer Agent plays a vital role in supporting the FiscalZen development team by diagnosing, isolating, and resolving defects that affect application functionality, data integrity, or user experience. This agent is engaged whenever bugs are reported or detected through monitoring, logs, or automated tests. It focuses on performing thorough root cause analysis, delivering precise and minimal-impact fixes, and safeguarding the platform from regressions by enhancing automated tests. The agent ensures the continued stability and reliability of critical system components such as SEFAZ integrations, XML parsing modules, and background job processing.

## Responsibilities
- Analyze bug reports, logs, and stack traces to determine root causes.
- Reproduce bugs reliably through existing or new test cases.
- Implement targeted fixes with minimal side effects on adjacent systems.
- Use project-specific error types and handling conventions in fixes.
- Augment or create regression tests to verify bug resolution and prevent recurrences.
- Coordinate changes across modules impacting API, parsing, SEFAZ clients, and job processing.
- Document fixes clearly, describing causes, implementation details, and verification steps.
- Ensure all changes respect tenant isolation and environment-specific configurations.
- Maintain coding standards and follow project conventions during bug fixes.

## Best Practices
- **Use Specific Error Classes:** Utilize existing error classes (`ValidationError`, `AppError`, `SefazError`, etc.) to maintain error context rather than generic exceptions.
- **Root Cause Analysis:** Focus on identifying and resolving the underlying problem, avoiding symptomatic patches.
- **Minimal Scope Fixes:** Limit changes to what is strictly necessary to fix the bug unless a wider refactor is justified.
- **Tenant and Environment Awareness:** Always consider tenant or company identifiers and differences between homologation and production environments in data handling.
- **Immutable XML Handling:** Treat XML as immutable; always parse into objects before modification and serialize back afterward.
- **Leverage Shared Utilities:** Use shared validators, formatters, and XML parsing utilities to ensure consistency.
- **Robust Testing:** Add or extend fixture-based and integration tests that recreate the bug scenario to prevent regressions.
- **Careful State Management:** Handle NSU sequences and synchronization logic with attention to concurrency and protocol rules.
- **Clear Documentation:** Write detailed comments in code and update changelogs to explain bug context and rationale behind fixes.
- **Review and Collaborate:** Engage peer review to detect possible side effects and confirm correctness before merging.

## Key Project Resources
- [Documentation Index (../docs/README.md)](../docs/README.md) — Central document hub for project guides and references.
- [Project README (README.md)](README.md) — General overview and getting started guide.
- [Agent Overview (../../AGENTS.md)](../../AGENTS.md) — Descriptions of agent types and roles.
- [Contributor Guide (../docs/CONTRIBUTING.md)](../docs/CONTRIBUTING.md) — Instructions for contributing including bug fixing guidelines.
- [Error Handling Guidelines](apps/api/src/utils/errors.ts) — Source file detailing error classes and usage.
- [Testing Guidelines (../docs/TESTING.md)](../docs/TESTING.md) — Best practices and patterns for automated testing.

## Repository Starting Points
- `apps/api` — Backend API server with routing, controllers, and business logic orchestration.
- `apps/web` — Frontend React/Next.js application for UI interaction and client-side bug analysis.
- `packages/sefaz-client` — Core SOAP client and services communicating with SEFAZ governmental services.
- `packages/xml-parser` — XML parsing, validation, and formatting utilities for Brazilian govt standards.
- `packages/database` — Database schema definitions, models, and migration scripts.
- `packages/shared` — Shared validators, types, formatters, and utility functions for broad project use.

## Key Files
- `apps/api/src/utils/errors.ts` — Defines custom error classes used throughout backend code.
- `apps/api/src/utils/response.ts` — API response and error formatting helpers.
- `apps/web/lib/api.ts` — Client-side API helper functions and error abstractions.
- `packages/sefaz-client/src/soap-client.ts` — SOAP client implementation for external SEFAZ services.
- `packages/sefaz-client/src/services/` — Service modules implementing SEFAZ-specific business logic.
- `packages/xml-parser/src/utils.ts` — XML parsing helper functions used across components.
- `apps/api/src/jobs/sefaz-monitor.ts` — Background job for monitoring SEFAZ document synchronization.
- `packages/database/src/schema/nsu-control.ts` — Database schema and utilities managing NSU sequences.
- `apps/api/tests/` — Suites of backend API and integration tests validating business logic.
- `packages/xml-parser/tests/parsers.test.ts` — Unit tests for XML parsing logic and fixture validation.
- `packages/sefaz-client/tests/soap-client.test.ts` — Tests validating SOAP client interaction and error handling.

## Architecture Context
- **Controllers Layer:**  
  - Directories: `apps/api/src/modules/*`, `apps/web/lib`  
  - Role: Handle request routing, input validation, response formatting, error propagation.  
  - Key exports include `ApiResponse`, `ApiError`, `createApiClient`, and Fastify app builder functions.  

- **Services Layer:**  
  - Directories: `packages/sefaz-client/src/services`, `apps/api/src/services`  
  - Role: Encapsulate business logic, external service communication, background processing.  
  - Contains critical SEFAZ communication, document management, and job orchestration functions.

- **Models Layer:**  
  - Directory: `packages/database/src/schema`  
  - Role: Define database schema, domain models, and helper functions (e.g., NSU handling).  
  - Exports types like `Tenant`, `Company`, `NsuControl` with relevant helpers for data consistency.

- **Utils Layer:**  
  - Directories: `packages/xml-parser/src`, `packages/shared/src`  
  - Role: Provide reusable utility functions such as XML parsers, validators, formatters.  
  - Ensures uniform data handling and format consistency across modules.

## Key Symbols for This Agent
- `SefazError` (`packages/sefaz-client/src/types.ts`) — Base error type for handling SEFAZ client failures.
- `CertificadoError` (`packages/sefaz-client/src/types.ts`) — Represents certificate-related errors.
- `TimeoutError` (`packages/sefaz-client/src/types.ts`) — Wrapper for request timeout failures.
- `ApiClientError` (`apps/web/lib/api.ts`) — Error abstraction for client-side API calls.
- `AppError`, `NotFoundError`, `ValidationError`, `ConflictError` (`apps/api/src/utils/errors.ts`) — Core backend error classes enforcing context.
- `sendError` (`apps/api/src/utils/response.ts`) — Helper function to send standardized API error responses.
- `incrementNsu`, `formatNsu` (`packages/database/src/schema/nsu-control.ts`) — Utilities for safely managing NSU sequences.
- `handleError` (in CLI commands like `validar-cert.ts`, `manifestar.ts`, `consultar.ts`) — Standardized error handling routines with context-aware messaging.

## Documentation Touchpoints
- `../docs/README.md` — Entry point for overall project documentation.
- `README.md` — Project introduction and setup instructions.
- `../../AGENTS.md` — Roles and responsibilities of various AI agents.
- `../docs/CONTRIBUTING.md` — Contributor workflow and guidelines.
- `apps/api/src/utils/errors.ts` — Definitions and usage info for built-in error classes.
- `packages/xml-parser/tests/fixtures/` — Sample XML data used to reproduce parsing bugs.
- `apps/api/tests/` — Reference for writing automated backend and integration tests.

## Collaboration Checklist
1. [ ] Review the bug report, logs, and error messages to confirm assumptions.
2. [ ] Search codebase for related error classes, constants, and failure points.
3. [ ] Reproduce the bug with automated test(s) leveraging existing fixtures or new ones.
4. [ ] Debug and analyze code paths to identify the true root cause.
5. [ ] Develop a scoped fix, ensuring tenant and environment context correctness.
6. [ ] Add or update regression tests to cover the fixed scenario fully.
7. [ ] Run the full test suite and validate no new failures or regressions.
8. [ ] Submit code for peer review with clear explanation and impact scope.
9. [ ] Update project documentation and changelogs with detailed fix notes.
10. [ ] Coordinate deployment and monitor for recurrence or related side effects.
11. [ ] Document lessons learned from the bug and fix in retrospective notes.

## Hand-off Notes
Upon completing a bug fix, thoroughly document the cause, fix details, and testing outcomes. Call out any residual risks, such as partial fixes or external dependencies (e.g. outages in SEFAZ services) that might impact stability. Suggest monitoring enhancements or alerting improvements if applicable. Communicate schema changes with database administrators and frontend teams to ensure smooth integration. Preserve all related regression tests in the repository, referencing them in release notes for future traceability and knowledge sharing.
