# Feature Developer Agent Playbook

## Mission
The Feature Developer Agent is responsible for the end-to-end implementation of new functionality. This includes database schema migrations, API endpoint creation, business logic orchestration in services, and UI development using React/Next.js.

## Repository Architecture Overview

### 1. Monorepo Structure
- **`apps/api`**: Fastify-based backend. Uses a modular structure under `src/modules`.
- **`apps/web`**: Next.js frontend (App Router). Uses Tailwind CSS and Radix UI.
- **`packages/database`**: Source of truth for the schema. Uses Drizzle ORM.
- **`packages/shared`**: Universal types, Zod validators, and formatters (CNPJ, dates, currency).
- **`packages/sefaz-client`**: Specialized package for SOAP communication with SEFAZ services (NFe, CTe, MDFe).
- **`packages/xml-parser`**: Logic for converting raw XML tax documents into structured JSON.
- **`packages/ui`**: Shared UI component library (Shadcn-based).

### 2. Core Technologies
- **Backend**: Fastify, Drizzle ORM, Zod (validation), BullMQ (background jobs).
- **Frontend**: Next.js, TanStack Query (React Query), Lucide React, Tailwind CSS.
- **Search**: Meilisearch for document indexing.

---

## Workflow: Implementing a New Feature

### Phase 1: Data Modeling & Persistence
1.  **Define Schema**: Modify or add files in `packages/database/src/schema/`.
    - Use `pgTable` for definitions.
    - Export both the table and inferred types (e.g., `NewCompany`, `Company`).
2.  **Export Schema**: Ensure new tables are exported in `packages/database/src/schema/index.ts`.

### Phase 2: Backend Development (API)
1.  **Define Zod Schemas**: Create validation schemas in `apps/api/src/modules/<feature>/schemas.ts`.
2.  **Implement Service**: Create business logic in `apps/api/src/modules/<feature>/service.ts`.
    - Use dependency injection or direct imports for the database client.
    - Use custom error classes from `apps/api/src/utils/errors.ts` (e.g., `NotFoundError`, `ValidationError`).
3.  **Define Routes**: Create routes in `apps/api/src/modules/<feature>/routes.ts`.
    - Use `fastify.withTypeProvider<ZodTypeProvider>()` for type-safe routing.
    - Implement authentication using the `auth` plugin.
4.  **Register Module**: Ensure the module is registered in `apps/api/src/app.ts`.

### Phase 3: Frontend Development (Web)
1.  **Define API Types**: If not already in `packages/shared`, add response types to `apps/web/lib/types.ts`.
2.  **Create Hooks**: Implement TanStack Query hooks in `apps/web/lib/hooks/use-<feature>.ts`.
    - Use the pre-configured `api` client from `apps/web/lib/api.ts`.
3.  **Develop Components**: Build UI components in `apps/web/components/<feature>/`.
    - Use components from `@fiscalzen/ui`.
    - Follow the pattern of separating "Smart" (data-fetching) and "Dumb" (presentational) components.
4.  **Implement Pages**: Create the route in `apps/web/app/(dashboard)/<feature>/page.tsx`.

---

## Coding Standards & Best Practices

### Backend Standards
- **Validation**: Every request must be validated using Zod.
- **Responses**: Use the `sendSuccess` and `sendError` utilities from `apps/api/src/utils/response.ts`.
- **Job Processing**: Long-running tasks (like XML parsing or SEFAZ syncing) must be offloaded to BullMQ via `apps/api/src/jobs/`.
- **Encryption**: Sensitive data (like certificates) must be handled using utilities in `apps/api/src/utils/encryption.ts`.

### Frontend Standards
- **Forms**: Use `react-hook-form` with Zod resolvers.
- **Formatting**: Always use shared formatters for consistency:
    - `packages/shared/src/formatters/currency.ts`
    - `packages/shared/src/formatters/date.ts`
    - `packages/shared/src/validators/cnpj.ts`
- **State**: Use TanStack Query for server state. Use local `useState` or Zustand for complex UI state.

### Testing Strategy
- **Unit Tests**: Place in `__tests__` directories or `.spec.ts` files adjacent to the source.
- **SEFAZ Mocking**: When testing services that interact with SEFAZ, use the mock patterns found in `packages/sefaz-client/tests`.

---

## Key Files & Entry Points

| Purpose | File Path |
| :--- | :--- |
| **Database Schema** | `packages/database/src/schema/` |
| **Shared Validators** | `packages/shared/src/validators/` |
| **API Error Classes** | `apps/api/src/utils/errors.ts` |
| **SEFAZ Client Logic** | `packages/sefaz-client/src/services/` |
| **UI Primitive Library** | `packages/ui/src/components/` |
| **Web API Client** | `apps/web/lib/api.ts` |
| **Background Workers** | `apps/api/src/jobs/workers.ts` |

---

## Domain Knowledge Context
- **NSU (Número Seqüencial Único)**: Critical for document syncing. Refer to `packages/database/src/schema/nsu-control.ts` for logic on how the system tracks the last document fetched from SEFAZ.
- **Manifestação**: The process of confirming or denying knowledge of a document. High-level logic resides in `apps/api/src/modules/manifestacao/`.
- **DocTypes**: The system distinguishes between NFe (55), CTe (57), MDFe (58), and NFSe. Always check the `DocType` enum in `packages/shared/src/types/documents.ts`.

## Hand-off Checklist
- [ ] Schema changes migrated and exported.
- [ ] API routes validated with Zod and type-safe.
- [ ] Frontend hooks handle loading and error states.
- [ ] UI components are responsive and use the design system.
- [ ] Formatters from `packages/shared` are used for all domain data.
- [ ] Sensitive operations are logged or wrapped in appropriate error handling.
