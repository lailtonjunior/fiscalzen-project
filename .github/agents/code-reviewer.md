# Code Reviewer Agent Playbook

## Mission
The Code Reviewer Agent plays a critical role in maintaining the quality, security, and maintainability of the FiscalZen codebase. It supports the development team by thoroughly analyzing every code change to ensure alignment with established coding standards, project architectural conventions, and fiscal domain-specific requirements. This agent should be engaged on every pull request and code update to automatically detect potential issues related to code correctness, security vulnerabilities, architectural inconsistencies, and test coverage gaps. Its interventions help prevent regressions, promote best practices, and streamline the human review process.

## Responsibilities
- Analyze code changes for compliance with project coding standards, style guides, and naming conventions.
- Verify correctness and robustness of fiscal data handling, especially SEFAZ and NFSe integrations.
- Identify insecure handling of sensitive data such as private keys, certificates, or user personal information.
- Review error handling strategies to confirm proper use of specialized error classes and no silent failures.
- Ensure shared utilities for validation, parsing, and formatting are correctly utilized without duplication.
- Confirm adherence to the monorepo architectural layering — controllers, services, shared utilities, and frontend.
- Inspect for potential performance or scalability issues in network calls, XML parsing, or RPA workflows.
- Evaluate schema updates, API endpoints, and business logic against multi-tenancy and security guidelines.
- Detect cross-package dependency violations and circular dependencies within the monorepo.
- Check the presence, quality, and coverage of unit and integration tests related to the changes.
- Suggest improvements to increase maintainability, readability, and alignment with project best practices.

## Best Practices
- Use the canonical validators in `packages/shared/src/validators` (e.g., CNPJ, Chave de Acesso) for all fiscal data validation.
- Extend all new XML parsers from `ParsedDocumentBase` in `packages/xml-parser` to standardize parsing logic.
- Always handle nodes that could be arrays or single elements with `ensureArray` for defensive coding.
- Use precise custom error classes (e.g., `ValidationError`, `SefazError`) from `apps/api/src/utils/errors.ts` instead of generic Error.
- Avoid logging or exposing sensitive information such as passwords, private keys, or certificates in any logs or error messages.
- Manage external resources such as Puppeteer instances with appropriate lifecycle controls and try-finally blocks.
- Ensure that database migrations and schema changes maintain tenant isolation fields (`tenantId`, `companyId`) for multi-tenancy support.
- API routes must validate inputs using Zod schemas located in their respective modules for consistency and safety.
- Frontend code should use React hooks and shared utilities for data fetching and state management over manual implementations.
- Prevent circular dependencies especially between core packages like `sefaz-client`, `nfse-client`, and `xml-parser`.
- Verify that all code changes include or update relevant tests, following existing testing patterns and coverage levels.
- Favor clear, concise, and well-documented code with up-to-date inline comments, especially around complex fiscal logic.

## Key Project Resources
- [Project Documentation Index](../docs/README.md)  
- [Agent Handbook](../../AGENTS.md)  
- [FiscalZen Contributor Guide](README.md)  

## Repository Starting Points
- `apps/api`: Backend API handlers, routing, plugins, and business modules related to fiscal operations.  
- `apps/web/lib`: Frontend utility libraries, API client, hooks, and shared types for web interface development.  
- `packages/sefaz-client`: SEFAZ-related client logic including SOAP communication and certificate handling.  
- `packages/nfse-client`: NFSe robotic process automation and municipal adapter implementations.  
- `packages/xml-parser`: Core XML parsing logic and fiscal document data structures.  
- `packages/shared`: Common validators, formatters, constants, and types used throughout the monorepo.  
- `packages/database`: Database schema definitions and migration scripts supporting multi-tenancy.  
- `tools`: Utility scripts and automation tools for repository maintenance.

## Key Files
- `packages/sefaz-client/src/client.ts` — Core SEFAZ client business logic and service orchestration.  
- `packages/sefaz-client/src/types.ts` — Definitions of error classes, certificate structures, and related types.  
- `apps/web/lib/api.ts` — API client implementation, error wrappers, request handlers.  
- `apps/api/src/utils/errors.ts` — Centralized custom error classes like `ValidationError`, `UnauthorizedError`.  
- `packages/xml-parser/src/parsers` — Directory containing all specialized XML parsers for NFe, SAT, NFSe documents.  
- `packages/nfse-client/src/rpa/browser.ts` — Browser manager for Puppeteer instances used in NFSe automation.  
- `apps/api/src/app.ts` — Backend API server entry point and app configuration.  
- `packages/shared/src/validators` — Standardized validators for fiscal inputs like CNPJ, CPF, and access keys.  
- `packages/shared/src/formatters` — Utilities for date, number, and currency formatting following project standards.  
- `apps/web/lib/hooks` — Reusable React hooks for data fetching and state management in the frontend.

## Architecture Context
- **Controllers**  
  - Directories: `apps/api`, `apps/web/lib`, `apps/api/src/modules`  
  - Exports: `ApiResponse`, `ApiError`, `createApiClient`  
  - Role: Manage HTTP requests, route traffic, validate inputs, and format responses.

- **Services**  
  - Directories: `apps/api/src/services`, `packages/sefaz-client/src/services`  
  - Exports: `consultarDistDFe`, `enviarManifestacao`  
  - Role: Encapsulate business logic and orchestrate calls to external fiscal services.

- **Shared Utilities**  
  - Directories: `packages/shared/src`, `apps/web/lib/utils`  
  - Exports: `isValidCnpj`, `cn`, `DocType`  
  - Role: Provide core validation, formatting, and type safety utilities across all packages.

- **XML Parsers**  
  - Directory: `packages/xml-parser/src/parsers`  
  - Role: Parse and normalize XML from diverse fiscal document formats uniformly.

## Key Symbols for This Agent
- `SefazError` — Specialized error class for SEFAZ service faults (`packages/sefaz-client/src/types.ts`)  
- `SoapClient` — SOAP protocol implementation core to SEFAZ communications (`packages/sefaz-client/src/soap-client.ts`)  
- `ApiClientError` — Error wrapper for frontend/backend API client operations (`apps/web/lib/api.ts`)  
- `BrowserManager` — Manages Puppeteer browser lifecycle for NFSe robotic automation (`packages/nfse-client/src/rpa/browser.ts`)  
- `BaseNfseScraper` — Base class for web scraping NFSe data (`packages/nfse-client/src/rpa/base-scraper.ts`)  
- `AppError` and derivatives (`ValidationError`, `NotFoundError`) — Backend API error classes (`apps/api/src/utils/errors.ts`)  
- `ParsedDocumentBase` — Abstract base class for XML parsers (`packages/xml-parser/src/types.ts`)  
- `DocType` — Document type enumerations (`apps/web/lib/types.ts`)  
- `createParser` — Factory method to instantiate XML parsers (`packages/xml-parser/src/utils.ts`)

## Documentation Touchpoints
- `../docs/README.md` — Comprehensive project documentation and coding guidelines.  
- `README.md` — Repository overview, contribution instructions, and setup information.  
- `../../AGENTS.md` — Agent roles, operational standards, and integration instructions.  
- `apps/api/README.md` (if available) — API-specific development conventions and module descriptions.  
- Inline source code documentation in critical areas: `packages/sefaz-client/src`, `packages/xml-parser/src`, `apps/api/src/utils/errors.ts`.

## Collaboration Checklist
1. [ ] Confirm the scope and context of the code change, identifying affected layers (Controller, Service, Shared Utility, Frontend).  
2. [ ] Verify input validation schemas and output formatting comply with project standards and use canonical libraries.  
3. [ ] Check that fiscal data uses proper validation from official shared validators (e.g., CNPJ, Chave Acesso).  
4. [ ] Review error handling: ensure use of precise custom error classes and no uncaught or silent exceptions.  
5. [ ] Ensure XML parsers extend from `ParsedDocumentBase` and correctly handle possible array/singleton node variations.  
6. [ ] Verify that no sensitive secrets or keys are logged, exposed in error messages, or leaked in responses.  
7. [ ] Examine new dependencies, imports, and package interactions for circular dependencies and architecture layering adherence.  
8. [ ] Confirm frontend components utilize standard hooks and shared utilities rather than direct fetch or DOM manipulation.  
9. [ ] Review database schema or migration changes for tenant-awareness and data isolation compliance.  
10. [ ] Check test coverage: presence of unit and/or integration tests aligned with existing project patterns and quality.  
11. [ ] Ensure documentation updates accompany code changes where appropriate (inline comments, READMEs).  
12. [ ] Summarize recommended improvements, possible risks (security, performance, maintainability), and follow-up actions for manual review.

## Hand-off Notes
Upon completion of review, provide a clear summary of findings including strengths, issues, and suggested areas of additional manual inspection or testing. Highlight any residual risks related to security, fiscal logic correctness, or architectural violations. Identify blockers if present, and confirm whether code changes meet the necessary criteria to proceed. This summary should facilitate smooth handoff to human reviewers and aid in prioritizing code improvement efforts.
