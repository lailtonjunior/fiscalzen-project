# Refactoring Specialist Agent Playbook

## 🎯 Mission
The Refactoring Specialist focuses on maintaining the long-term health of the FiscalZen codebase. Your goal is to identify code smells, reduce complexity, and standardize implementations across the monorepo while ensuring 100% functional parity.

## 🏗️ Core Architecture focus

### 1. The Monorepo Structure
- **`apps/api`**: Fastify-based backend. Focus on moving logic from `routes.ts` to `service.ts` and standardizing response patterns.
- **`apps/web`**: Next.js frontend. Focus on component extraction and hook optimization.
- **`packages/sefaz-client`**: Critical SOAP/XML logic. Focus on reducing duplication in service calls (NFe, CTe, MDFe).
- **`packages/xml-parser`**: Pure utility functions. Focus on performance and robustness of regex/extraction logic.
- **`packages/shared`**: The source of truth for types and validators (CNPJ, CPF, Chave de Acesso).

## 🛠️ Specific Workflows

### Workflow A: Standardizing API Responses
When you encounter manual response handling in `apps/api/src/modules`:
1.  **Check**: If the route uses `res.send()` directly with manual objects.
2.  **Refactor**: Import `sendSuccess`, `sendError`, or `paginate` from `apps/api/src/utils/response.ts`.
3.  **Validate**: Ensure the `SuccessResponse` or `ErrorResponse` types are used to maintain API contract consistency.

### Workflow B: Consolidating SEFAZ Services
The services in `packages/sefaz-client/src/services` (nfe, cte, mdfe) share similar patterns:
1.  **Identify**: Duplicated XML building logic (e.g., `buildDistNSURequest`).
2.  **Extract**: Move shared XML structures to a common helper or base class.
3.  **Update**: Use the `SoapClient` class standard methods instead of manual `fetch` or custom axios calls.

### Workflow C: Moving Validation to Shared
If you find CNPJ/CPF/Chave validation logic inside an app:
1.  **Locate**: Existing validators in `packages/shared/src/validators`.
2.  **Replace**: Remove local logic and import from `@fiscalzen/shared`.
3.  **Enhance**: If the local logic was better, merge it into the shared package and update all consumers.

## 📏 Codebase Best Practices

### Error Handling
- **Never** throw generic `Error`. 
- **Always** use the specific classes from `apps/api/src/utils/errors.ts`:
  - `NotFoundError` for missing records.
  - `ValidationError` for schema failures (usually handled by Zod, but manually for business logic).
  - `ExternalServiceError` for SEFAZ/NFSe connectivity issues.

### Data Access (Drizzle ORM)
- Keep schemas in `packages/database/src/schema`.
- Use the `NewTenant`, `NewCompany` types for insertions.
- Favor `formatNsu` and `incrementNsu` helpers in `nsu-control.ts` instead of manual string manipulation.

### Utility Usage
- Use the `cn` (classnames) utility for Tailwind merging:
  - Frontend: `apps/web/lib/utils.ts`
  - UI Package: `packages/ui/src/lib/utils.ts`

## 🔍 Key Files & Their Purposes

| File | Purpose | Refactoring Goal |
| :--- | :--- | :--- |
| `apps/api/src/utils/errors.ts` | Error hierarchy | Standardize error propagation |
| `packages/shared/src/validators/` | CNPJ/CPF/Chave logic | Centralize all business validation |
| `packages/sefaz-client/src/soap-client.ts` | SOAP communication | Ensure all SEFAZ calls use this |
| `packages/xml-parser/src/utils.ts` | XML extraction | Optimize for large file processing |
| `apps/web/lib/hooks/` | State management | Extract complex logic from components |

## 🧪 Verification Steps
After any refactoring:
1.  **Symbol Check**: Run `analyzeSymbols` on modified files to ensure no public exports were accidentally broken.
2.  **Type Check**: Ensure all imports in the monorepo still resolve (especially when moving items to `packages/shared`).
3.  **Logic Mirroring**: If refactoring a `Service`, ensure the method signature remains compatible with existing `Routes`.

## 🚩 Identifying Refactoring Targets
Look for these "Smells" in the project:
- **String Concentration**: Building large XML strings manually inside services (move to templates/builders).
- **Type Casting**: Frequent use of `as any` in `packages/sefaz-client` (improve interfaces in `types.ts`).
- **Duplicate Formatters**: Date/Currency formatting in `apps/web` that isn't using `packages/shared/src/formatters`.
- **Heavy Controllers**: Fastify routes with more than 10 lines of business logic (move to `service.ts`).
