# Feature Breakdown

## When to Use
Activate this skill when you need to break down a new feature request or enhancement in the FiscalZen platform into clear, actionable implementation tasks. This process is essential during the planning phase to transform high-level requirements into well-defined subtasks, align with the existing architecture, and prepare for efficient development, testing, and deployment. Use it whenever a feature impacts multiple layers such as backend APIs, frontend components, database schemas, or integrations with external SEFAZ services.

---

## Instructions
1. **Analyze the Feature Scope**
   - Review the feature request or specification to fully understand the objective and expected outcomes.
   - Identify which modules or services the feature impacts — backend (`apps/api`), frontend (`apps/web`), database (`packages/database`), and integrations (`packages/sefaz-client`, `packages/nfse-client`).

2. **Decompose into Domains**
   - Split the feature into logical domains such as:  
     - API endpoints and business logic (`apps/api/src/modules/[feature]/service.ts`)  
     - React UI components and dialogs (`apps/web/components/[feature]/`)  
     - Database schema changes (`packages/database/src/schema/`)  
     - Background job processing with BullMQ  
     - Integration points with SEFAZ or NFSe clients

3. **Define Small, Clear Tasks**
   - Ensure each task:  
     - Is completable within ~4 hours  
     - Has clearly defined acceptance criteria referencing existing patterns  
     - Is testable with unit/integration test requirements included  
     - Adds incremental value and can be delivered independently where possible

4. **Specify Dependencies and Sequencing**
   - Order tasks based on dependencies, ensuring database schemas or domain models are defined before API and frontend implementation.
   - Sample execution order:  
     ```
     1. Database schema adjustment (e.g., `packages/database/src/schema/xyz.ts`)  
     2. Backend API service methods, util functions, and routes (e.g., `apps/api/src/modules/xyz/service.ts`)  
     3. Frontend components and UI dialogs (e.g., `apps/web/components/xyz/`)  
     4. Unit and integration testing (`apps/api/tests` and `apps/web/tests`)  
     5. Documentation updates (e.g., `README.md` or internal docs)  
     ```

5. **Estimate Tasks**
   - Provide rough size estimates (S/M/L) based on complexity and effort.
   - Include notes about potential blockers such as external API changes or infrastructure updates.

6. **Review & Refine**
   - Validate the task breakdown with stakeholders or engineering peers.
   - Adjust scope or priorities to fit release planning and sprint goals.

---

## Examples
```markdown
### Task: Add NFSe Configurable Municipio Selector

**Description**: Implement a UI component to allow users to select municipalities dynamically when configuring NFSe.

**Acceptance Criteria**:
- Component `MunicipioSelector` located at `apps/web/components/nfse/municipio-selector.tsx`.
- The selector fetches municipio list from API and handles loading states using the `Spinner` component (`packages/ui/src/components/spinner.tsx`).
- Supports multi-select and input validation as per UI spec.
- Integrated into the existing `NfseConfigForm` (`apps/web/components/nfse/nfse-config-form.tsx`).
- Unit tests are created in `apps/web/tests/components/nfse/municipio-selector.test.tsx`.

**Technical Notes**:
- Follow existing component props and state management patterns (see `Textarea` and `Button` components in `packages/ui`).
- Backend support endpoint to be developed if missing (`apps/api/src/modules/nfse/service.ts`).

**Estimate**: S

---

### Task: Enhance Search Filters for Document Dashboard

**Description**: Extend backend search filters to support date range and document status in the Dashboard API.

**Acceptance Criteria**:
- Modify `SearchFilters` interface (`apps/api/src/services/search.ts`) to include new attributes.
- Update document search service logic in `apps/api/src/modules/dashboard/service.ts`.
- Add corresponding API route handlers.
- Implement integration tests verifying new filter behavior.
- Update frontend dashboard filter UI if necessary.

**Estimate**: M
```

---

## Guidelines
- Always anchor task definitions to existing code structure conventions, e.g., service files for business logic, separate UI components for presentation, and shared types from `packages/shared`.
- Leverage existing components and utilities in the `packages/ui` folder to ensure UI consistency and reduce development time.
- Reference and update existing types/interfaces (e.g., `SearchFilters`, `ButtonProps`, `NfseConfigFormProps`) to maintain type safety and app coherence.
- Use the BullMQ background queue in `apps/api` for any asynchronous or long-running feature subtasks, explicitly noting this in feature breakdowns.
- Break complex features into smaller, testable pieces to enable parallel development and easier bug isolation.
- Ensure tasks adhere to the FiscalZen project’s tech stack conventions: TypeScript, Fastify for backend, Next.js and React for frontend, Drizzle ORM for DB schemas.
- Include documentation updates as a mandatory task for all features to promote knowledge sharing and maintain system transparency.
- Regularly sync with product managers and QA to clarify acceptance criteria and technical constraints.
- Capture any required environment, configuration, or integration changes that affect deployment or runtime behavior.
- When working with SEFAZ or NFSe government services, validate SOAP client behavior and error handling patterns before integrating new features.

---

This structured feature breakdown approach will help align feature delivery with FiscalZen’s modular architecture, accelerate development cycles, and ensure quality and maintainability across the platform.
