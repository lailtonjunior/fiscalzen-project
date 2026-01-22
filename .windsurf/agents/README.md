# Feature Developer Agent Playbook - FiscalZen

---

## 1. Focus Areas & Relevant Files

### Overview of Key Layers and Locations

| Layer         | Description                           | Primary Directories & Files                                                                                     |
|---------------|-------------------------------------|----------------------------------------------------------------------------------------------------------------|
| **Controllers** | API routing, request handlers       | `apps/api/src/modules/[feature]`, `apps/api/src/app.ts`, `apps/web/lib/api.ts`, `apps/web/lib/hooks/`          |
| **Services**   | Business logic, orchestration        | `apps/api/src/modules/[feature]/service.ts`, `packages/sefaz-client/src/services/`                              |
| **Models**     | Database schema and domain models    | `packages/database/src/schema/`                                                                                 |
| **Components** | Frontend UI components & dialogs     | `apps/web/components/[feature]/`, `packages/ui/src/components/`, `apps/web/app/(dashboard)/[feature]/`         |
| **Shared Types** | DTOs and shared interfaces          | `packages/shared/src/types/api.ts`                                                                               |
| **Tests**      | Unit and integration tests           | `apps/api/tests/`, `apps/api/test/`, `packages/sefaz-client/tests/`                                            |
| **Utilities & Errors** | Shared utilities and error handling | `apps/api/src/utils/errors.ts`, `apps/api/src/services/storage.ts`, `apps/api/src/services/search.ts`           |

---

## 2. Workflows & Development Steps

### 2.1 Database Schema Design & Migration

- Define data structures using Drizzle ORM with `pgTable` in `packages/database/src/schema/`.
- Export both the database table and actual typed interfaces for TypeScript consumption.
- Use Drizzle's `relations` API to map entity relationships where needed.
- After schema changes, run migration generation with:
  ```bash
  pnpm db:generate
  ```
- Review generated SQL scripts in `packages/database/drizzle/` before applying to ensure correctness.
- Follow snake_case naming for DB columns.

---

### 2.2 Backend API Module Development

- **Shared Types & Validation:**
  - Define or extend request and response data structures in `packages/shared/src/types/api.ts`.
  - Use Zod for runtime validation schemas in route handlers.
- **Service Logic:**
  - Implement business and orchestration logic in `apps/api/src/modules/[feature]/service.ts`.
  - Utilize Sefaz-client services wrappers found in `packages/sefaz-client/src/services/` for fiscal API interaction.
  - Use utilities for NSU handling (`formatNsu`, `incrementNsu`) and maintain raw XML for auditability.
- **Routes & Controllers:**
  - Define API endpoints and validation schemas in `apps/api/src/modules/[feature]/routes.ts`.
  - Register routes in `apps/api/src/app.ts` using Fastify’s plugin system.
- **Error Handling:**
  - Throw and handle domain-specific errors using classes like `ExternalServiceError` from `apps/api/src/utils/errors.ts`.
  - Clearly distinguish between validation errors, service errors, and external API failures.
- **Tenant and Authorization:**
  - Implement multi-tenant isolation in services.
  - Validate permissions on modifying or querying tenant-related data.

---

### 2.3 Frontend Feature Implementation

- **API Client & Hooks:**
  - Extend or create API client functions in `apps/web/lib/api.ts` corresponding to backend API routes.
  - Encapsulate data fetching and cache logic with React hooks in `apps/web/lib/hooks/`.
- **UI Components:**
  - Build reusable UI components leveraging `packages/ui/src/components/` primitives for fields (Input, Textarea), buttons, badges, and spinners.
  - For complex feature UI, develop components and dialogs in `apps/web/components/[feature]/`.
  - Follow usage examples like `nfse-config-form.tsx` for form construction and `manifestacao-modal.tsx` for modals.
- **Pages and Routing:**
  - Implement feature routes under `apps/web/app/(dashboard)/[feature]/page.tsx`.
  - Handle async data fetching with React Server Components or client hooks, showing loading states with `Spinner`.
- **Form Handling & Validation:**
  - Use `react-hook-form` combined with Zod resolvers for form validation and error feedback.
  - Show validation errors inline and block submission if invalid.
- **Styling & Accessibility:**
  - Apply Tailwind CSS utility classes.
  - Use Radix UI primitives and `lucide-react` icons for consistent accessibility and visuals.
- **State Management:**
  - Use React Query or similar for server state caching and mutations.

---

### 2.4 Testing Strategy

- **Backend:**
  - Write unit tests for service functions, mocking external calls.
  - Integration tests for routes including validation and error cases.
  - Use existing test directories (`apps/api/tests/`, `packages/sefaz-client/tests/`) as baseline.
- **Frontend:**
  - Test React components for rendering correctness and interaction flows.
  - Validate form validation behaviors and UI state transitions.
- **Test Conventions:**
  - Follow suite naming consistent with feature modules.
  - Mock external dependencies and slow API calls.

---

## 3. Best Practices and Conventions

### Naming & Code Style

- Files: **kebab-case** (e.g., `nfe-distdfe.ts`).
- React Components, Types, Props: **PascalCase** (e.g., `ManifestacaoModal`, `NfseConfigFormProps`).
- Variables & functions: **camelCase**.
- Database columns: **snake_case**.

### Type Safety & Validation

- Use explicit TypeScript types everywhere.
- Centralize shared types/interfaces in `packages/shared/src/types/api.ts`.
- Use Zod schemas for runtime validation of API requests.
- Validate all incoming data thoroughly.

### Error Handling

- Prefer custom errors like `ExternalServiceError` for external API issues.
- Provide meaningful error messages and codes.
- Differentiate validation errors from unexpected exceptions.
- Catch and log errors gracefully, avoid leaking sensitive information.

### Fiscal Domain Specifics

- Always keep raw XML data persisted for fiscal document authenticity.
- Handle NSU (Notification Sequence Units) using helpers: `formatNsu` and `incrementNsu`.
- Account for Sefaz API rate limits (~20 requests/hour) with appropriate retry or backoff logic.
- Detect and manage gaps in fiscal data syncing.

### Frontend UX

- Use badges with defined semantic colors to represent fiscal statuses like `AUTORIZADA`, `CANCELADA`.
- Use modal dialogs for user confirmations and to present important process feedback.
- Follow existing component patterns and reuse shared UI parts.
- Display loading with `Spinner` component; handle error states cleanly.

### Forms

- Use `react-hook-form` with Zod schema resolvers for sync validation.
- Inline error messages should clearly point to the problematic fields.
- Prevent form submission on validation failure.

### Icons and Visual Elements

- Use consistent icons from `lucide-react`.
- Follow color and spacing conventions as demonstrated in UI components.

---

## 4. Key Files & Their Responsibilities

| File / Directory                                  | Purpose                                                                |
|-------------------------------------------------|------------------------------------------------------------------------|
| `apps/api/src/app.ts`                            | Fastify server setup and route registration.                           |
| `apps/api/src/modules/[feature]/service.ts`     | Business logic and domain orchestration for feature.                   |
| `apps/api/src/modules/[feature]/routes.ts`      | API route handlers and request validation for feature endpoints.      |
| `packages/database/src/schema/`                  | Drizzle ORM schema definitions for database models.                    |
| `packages/sefaz-client/src/services/`            | Fiscal-specific API clients and service integrations.                  |
| `packages/shared/src/types/api.ts`                | Shared TypeScript types and Zod validations across backend and frontend.|
| `apps/web/lib/api.ts`                            | Frontend API client wrappers for communication with backend.          |
| `apps/web/lib/hooks/`                            | React hooks for data fetching and mutations related to API endpoints.  |
| `apps/web/components/[feature]/`                 | Feature-specific React components and UI dialogs.                      |
| `packages/ui/src/components/`                     | Shared UI primitives like buttons, inputs, badges, spinners.           |
| `apps/api/src/utils/errors.ts`                    | Custom error classes including `ExternalServiceError`.                 |
| `apps/api/src/services/storage.ts`                | Utilities for storage and state management on backend.                 |
| `apps/api/src/services/search.ts`                 | Search functionality and filters implementation.                       |

---

## 5. Developer Checklist

- [ ] **Database**
  - Schema defined/updated using Drizzle ORM.
  - Migration generated and reviewed.
- [ ] **API Implementation**
  - Business logic fully implemented in service layer.
  - API routes created with Zod validation.
  - Routes registered correctly.
- [ ] **Error Handling**
  - External API failures wrapped with `ExternalServiceError`.
  - Validation errors separated and correctly reported.
- [ ] **Frontend Integration**
  - API calls implemented in `apps/web/lib/api.ts`.
  - Hooks created/extended for API data.
  - UI components built or reused from `packages/ui`.
  - Pages/routes created under dashboard.
- [ ] **Forms & UX**
  - Forms with `react-hook-form` + Zod validation.
  - Loading and error states handled.
  - Accessibility and visual consistency ensured.
- [ ] **Testing**
  - Unit & integration tests for backend and frontend.
  - Mock external services in tests.
- [ ] **Fiscal Domain Rules**
  - NSU correctly handled and incremented.
  - Raw XML stored.
  - API rate limits observed with retries.
- [ ] **Code Quality**
  - Naming and conventions followed.
  - Types explicit and consistent.
  - PRs reviewed for style, functionality, and testing.
- [ ] **CI Checks**
  - All type checking, linting, and tests pass in CI.

---

This playbook enables the Feature Developer Agent to confidently navigate and contribute to the FiscalZen project, ensuring high quality, domain-specific compliance, and consistent user experience across backend and frontend layers.
