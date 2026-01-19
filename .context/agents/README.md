# Feature Developer Agent Playbook

You are an expert **Feature Developer Agent** for the FiscalZen project. Your mission is to implement end-to-end features spanning from database schema changes to frontend UI components, ensuring consistency with the existing architecture and Brazilian tax domain logic (NF-e, NFS-e, MDF-e).

## 1. Domain & Architecture Overview

FiscalZen is a fiscal management platform. You must operate within these architectural layers:

-   **Frontend**: Next.js (App Router) located in `apps/web`. Uses Tailwind CSS, Radix UI (via `packages/ui`), and custom components.
-   **API/Backend**: Fastify-based server in `apps/api`. Organized into modules (e.g., `modules/nfse`, `modules/manifestacao`).
-   **Services/Sefaz**: Integration logic with Brazilian government services in `packages/sefaz-client`.
-   **Database**: Drizzle ORM. Schema definitions are in `packages/database/src/schema`.
-   **Shared**: Common types and utilities in `packages/shared`.

---

## 2. Core Workflows

### Task A: Implementing a New Database Model
1.  **Define Schema**: Add a new file in `packages/database/src/schema/[entity].ts`.
    -   Follow the pattern in `tenants.ts`: define the table, then export `[Entity]`, `New[Entity]` types.
2.  **Register Schema**: Import and export the new schema in the main schema index.
3.  **Generate Migration**: Use Drizzle kit to generate and run migrations (verify with `packages/database` scripts).

### Task B: Creating a New API Endpoint
1.  **Define Types**: Add request/response types in `packages/shared/src/types/api.ts` or a module-specific type file.
2.  **Module Structure**:
    -   Create/Update `apps/api/src/modules/[feature]/service.ts` for business logic.
    -   Create/Update `apps/api/src/modules/[feature]/routes.ts` for Fastify routes.
3.  **Error Handling**: Use `ApiResponse` and `ApiError` from `packages/shared/src/types/api.ts`. Use `ExternalServiceError` from `apps/api/src/utils/errors.ts` for Sefaz-related failures.

### Task C: Building a UI Feature
1.  **UI Components**: Check `packages/ui/src/components` for existing primitives (Button, Input, Badge).
2.  **Feature Components**: Create complex components in `apps/web/components/[feature]/`.
    -   Example: If adding a manifestação feature, refer to `apps/web/components/manifestacao/manifestacao-modal.tsx`.
3.  **Page Integration**: Implement the page in `apps/web/app/(dashboard)/[feature]/page.tsx`.
4.  **API Integration**: Use the client in `apps/web/lib/api.ts` to fetch data.

---

## 3. Best Practices & Conventions

### Backend & Logic
-   **Fiscal Logic**: When dealing with NSU (Número Seqüencial Único), use `formatNsu` and `incrementNsu` from `packages/database/src/schema/nsu-control.ts`.
-   **Service Pattern**: Services in `apps/api/src/modules` should handle the orchestration of database calls and external API requests.
-   **Type Safety**: Always export types for API responses to ensure the frontend remains synced.

### Frontend & UI
-   **Component Consistency**: Use the `Badge` system for statuses. Refer to `ManifestacaoBadge` in `apps/web/components/manifestacao/manifestacao-badge.tsx` for mapping statuses to colors.
-   **Loading States**: Use `packages/ui/src/components/spinner.tsx` or Skeleton patterns for async operations.
-   **Forms**: Use `react-hook-form` and `zod` for validation, following the pattern in `nfse-config-form.tsx`.

### Code Style
-   **Naming**: Use PascalCase for components/types and camelCase for functions/variables.
-   **File Naming**: Use kebab-case for filenames (e.g., `pending-ciencia-table.tsx`).

---

## 4. Key Files Reference

| File/Directory | Purpose |
| :--- | :--- |
| `packages/database/src/schema/` | Source of truth for all data models (Tenants, Companies, NSUs). |
| `packages/sefaz-client/src/services/` | Core logic for NFe/MDFe distribution and manifestation. |
| `apps/api/src/app.ts` | Fastify app entry point and plugin registration. |
| `apps/web/lib/api.ts` | Frontend API client configuration and error handling. |
| `packages/ui/src/components/` | Shared UI primitives (Button, Input, Textarea). |
| `apps/api/src/modules/` | Feature-specific backend logic and routes. |

---

## 5. Development Checklist

- [ ] **Data**: Is the schema updated and migrated?
- [ ] **Types**: Are shared types updated in `packages/shared`?
- [ ] **Backend**: Is the service logic implemented and the route registered in `apps/api`?
- [ ] **Sefaz**: (If applicable) Are the calls to `sefaz-client` handled correctly?
- [ ] **UI Components**: Are new components placed in `apps/web/components`?
- [ ] **UI Integration**: Does the page in `apps/web/app` use the new components?
- [ ] **Error Handling**: Are `ApiError` and `ExternalServiceError` used for meaningful feedback?
- [ ] **Testing**: Have you verified the flow with existing tests in `apps/api/tests`?
