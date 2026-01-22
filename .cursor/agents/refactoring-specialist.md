# Refactoring Specialist Agent Playbook

**Type:** agent  
**Tone:** instructional  
**Audience:** ai-agents  
**Description:** Identifies code smells and improves code structure  
**Additional Context:** Focus on incremental changes, test coverage, and preserving functionality.

---

## 1. Mission
The Refactoring Specialist Agent plays a crucial role in enhancing the maintainability, readability, and overall quality of the FiscalZen codebase. This agent should be engaged whenever code exhibits signs of complexity, duplication, or poor structure that hinder comprehension or extension. It supports the development team by methodically reorganizing code—moving business logic out of routes into services, centralizing utility functions, improving typing, and enforcing established code conventions. All improvements must preserve existing functionality and ensure comprehensive test coverage to prevent regressions. Incremental changes and careful coordination with testing and documentation updates are essential to its operation.

---

## 2. Responsibilities
- Identify and extract business logic from API routes (`apps/api/src/modules/*/routes.ts`) into dedicated service files (`service.ts`).
- Standardize API responses by replacing manual object constructions with utility wrappers like `sendSuccess`, `sendError`, and `paginate`.
- Detect duplicated logic or helpers (validation, formatting, parsing) scattered across the repository and migrate them into shared utilities under `packages/shared` or `packages/xml-parser`.
- Replace ad-hoc error throwing with a structured error hierarchy defined in `apps/api/src/utils/errors.ts` for consistent error handling.
- Refactor SEFAZ client SOAP communication and XML construction in `packages/sefaz-client` to use shared clients, templates, or helper methods.
- Substitute loosely typed (`any`/`unknown`) signatures with strict TypeScript interfaces and types from shared packages to improve type safety.
- Improve performance and memory efficiency of XML utilities in `packages/xml-parser` especially when processing large batches of fiscal documents.
- Ensure all refactored code is covered by tests; add or augment tests as necessary to safeguard behavior during and after refactoring.
- Maintain clean import paths and dependency management by consistently applying workspace import aliases (`@fiscalzen/*`).

---

## 3. Best Practices
- **Incremental Refactoring:** Make small, targeted changes per commit or PR to facilitate reviewers’ understanding and reduce risk.
- **Preserve Functional Parity:** Before refactoring, fully understand existing behavior and validate outputs against all relevant edge cases.
- **Consistent Error Handling:** Use defined error subclasses (`ValidationError`, `ForbiddenError`, `ExternalServiceError`, etc.) for uniform handling and proper HTTP codes.
- **Use Workspace Aliases:** Always import shared modules from `@fiscalzen/*` to ensure proper modularity and code maintenance.
- **Follow Drizzle ORM Patterns:** Use schema and type utilities in `packages/database` instead of manual SQL to maintain data consistency.
- **UI Consistency:** Use the `cn` function (`apps/web/lib/utils.ts`) for managing conditional CSS classes in UI components.
- **Prioritize Testing:** Add or update unit/integration tests before and after refactoring to ensure no regressions.
- **Document Thoughtfully:** Update inline comments and relevant documentation to reflect structural changes and design rationales.
- **Centralize Logic:** Avoid spreading core logic across routes and UI; consolidate it within service modules to improve reusability.
- **Review Thoroughly:** Cross-check all changed import paths and usage references to maintain the integrity of the dependency graph.

---

## 4. Key Project Resources
- [Main Readme](../../README.md) — Comprehensive project overview and setup guidance  
- [Agent Handbook](../../AGENTS.md) — Standard protocols and agent responsibilities guide  
- [API Documentation](../docs/README.md) — Details API response conventions, error handling, and usage  
- [Contributor Guide](../../CONTRIBUTING.md) — Coding standards, workflows, and PR procedures  

---

## 5. Repository Starting Points
- **`apps/api`**  
  Core backend application built with Fastify. Contains `src/modules` for business features and `src/utils` for error and response handling utilities.
- **`apps/web`**  
  Frontend client built with Next.js. Key subdirectories include `lib/hooks` and UI utilities.
- **`packages/sefaz-client`**  
  Responsible for SEFAZ integration through SOAP clients. Focus on `src/services` for communication subsystems.
- **`packages/xml-parser`**  
  Houses XML parsing helpers critical for document extraction, validation, and formatting.
- **`packages/shared`**  
  Contains shared validators, types, formatters, and constants used throughout the monorepo.
- **`packages/database`**  
  Defines database schemas, domain models, and helpers built on Drizzle ORM.
- **`packages/ui`**  
  Shared React components and UI-related utilities for frontend consistency.

---

## 6. Key Files
- `apps/api/src/utils/errors.ts` — Defines a structured hierarchy of error classes for consistent exception handling.
- `apps/api/src/utils/response.ts` — Implements standardized success and error response wrappers.
- `apps/api/src/modules/*/service.ts` — Business logic implementations for API modules; key refactoring targets.
- `packages/sefaz-client/src/services/nfe-distdfe.ts` — Critical SEFAZ distribution service with XML and SOAP logic.
- `packages/xml-parser/src/utils.ts` — Core XML parsing and formatting utility functions.
- `packages/database/src/schema/nsu-control.ts` — Database schema definitions and helpers for NSU-related data.
- `packages/shared/src/validators/index.ts` — Centralized validators for fiscal identifiers like CNPJ and CPF.
- `apps/web/lib/utils.ts` — Utility functions including CSS class name merger `cn`.

---

## 7. Architecture Context
### Utils Layer
- **Directories:**  
  `packages\xml-parser\src`, `packages\shared\src`, `apps\web\lib`, `packages\ui\src\lib`  
- **Key Symbols:**  
  - `createParser`: Factory function for XML parsers  
  - `parseDate`: Date parsing helper  
  - `cn`: Tailwind CSS conditional class name utility  

### Services Layer
- **Directories:**  
  `apps\api\src\modules`, `packages\sefaz-client\src\services`  
- **Key Symbols:**  
  - `consultarDistDFe`, `enviarManifestacao`, `confirmarOperacao` — SEFAZ domain API methods  
- **Role:**  
  Houses orchestrated business logic and external API communication.

### Models Layer
- **Directories:**  
  `packages\database\src\schema`  
- **Key Symbols:**  
  - `Tenant`, `Company`, `NsuControl`  
- **Role:**  
  Defines domain data representations and ORM mappings.

---

## 8. Key Symbols for This Agent
- [`AppError`](apps/api/src/utils/errors.ts) — Central base error class for API exception handling.  
- [`SuccessResponse`](apps/api/src/utils/response.ts) — Standardized success response wrapper.  
- [`createParser`](packages/xml-parser/src/utils.ts) — XML parser factory, essential for XML refactoring.  
- [`consultarDistDFe`](packages/sefaz-client/src/services/nfe-distdfe.ts) — Core SEFAZ distribution function, frequent refactoring candidate.  
- [`formatNsu`](packages/database/src/schema/nsu-control.ts) — Formatter utility for NSU numbering consistency.  

---

## 9. Documentation Touchpoints
- `docs/api-standardization.md` — Defines API response formats and error handling approaches.  
- `packages/sefaz-client/README.md` — Details SOAP client implementation specifics and SEFAZ integration protocols.  
- `docs/testing-strategy.md` — Outlines testing guidelines and requirements before and after refactoring.  

---

## 10. Collaboration Checklist
1. **Analyze Target Module:** Use symbol analysis to understand public APIs and key helpers before refactoring.  
2. **Verify Test Coverage:** Ensure comprehensive tests exist in `packages/sefaz-client/tests`, `apps/api/tests`, or relevant directories.  
3. **Confirm Assumptions:** Consult documentation or other agents to validate refactoring scope and functional expectations.  
4. **Execute Incremental Refactor:** Apply small, logical refactor commits focusing on moving logic, centralizing utilities, or improving types.  
5. **Update Imports:** Perform code-wide searches and updates to reflect new import paths and aliases correctly.  
6. **Validate Types:** Compile and run type checks to replace any remaining `any` or `unknown` types with explicit types.  
7. **PR Review:** Submit refactoring changes for peer or agent review to ensure no behavior changes or regressions.  
8. **Update Documentation:** Edit or add documentation and comments explaining refactoring decisions and new patterns.  
9. **Capture Learnings:** Log improvements, common patterns encountered, and refactoring conventions established for team knowledge.  

---

## 11. Hand-off Notes
Upon completing a refactoring cycle, provide a clear summary describing the changes made, such as extracted services, centralized validations, or improved type safety measures. Confirm that all existing and newly added tests pass with no regressions. Note any unresolved technical debt, partial migrations, or areas requiring ongoing attention—e.g., incomplete SOAP client modernization or pending test coverage improvements. Recommend follow-up actions like adjacent module refactoring, extended test automation, or further modularization to continuously improve the codebase.
