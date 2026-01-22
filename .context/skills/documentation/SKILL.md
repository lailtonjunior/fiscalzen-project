# Documentation Skill Playbook

## When to Use
Activate this skill whenever documentation needs to be created or updated within the FiscalZen codebase. This includes writing new API docs, enhancing README sections, documenting frontend or backend components, crafting architecture explanations, or updating inline code comments. Use this skill to ensure all documentation is clear, accurate, and reflective of the current codebase and functionality, thus facilitating onboarding, maintenance, and future development.

## Instructions
1. Determine the type of documentation required: API specs, component guides, architecture overviews, README updates, or inline code comments.
2. Locate existing documentation related to the feature or module, such as relevant `.md` files in the `docs/` directory or documentation adjacent to source files (e.g., `apps/web/components/dashboard/charts.tsx`).
3. Review recent code changes or feature additions to identify updates needed in the documentation.
4. Adhere to FiscalZen’s documentation style:
   - Use Markdown for standalone docs and JSDoc/TSDoc style comments for code.
   - Structure Markdown files with clear headers and subheaders.
   - Use fenced code blocks with proper syntax highlighting.
5. For API documentation, cross-reference the Fastify route files (`apps/api/src/modules/*/routes.ts`) and service logic (`service.ts`) to verify endpoint details.
6. Add relevant usage examples, input/output snippets, and expected behaviors, especially in API docs and component prop typings.
7. Ensure code comments explain complex business logic related to Brazilian fiscal documents, SEFAZ communication, and integrations such as NSU handling or certificate management.
8. Link to related documentation within the repo (e.g., `[Architecture](./architecture.md)`) for contextual navigation.
9. Validate examples against current implementation to prevent drift.
10. Submit documentation updates as part of regular pull requests for peer review and integration.

## Examples
### API Documentation (from `apps/api/src/modules/invoices/routes.ts`)
```typescript
/**
 * Retrieves a fiscal document by its unique identifier.
 *
 * @param id - The UUID of the fiscal document (NFe, CTe, etc.).
 * @returns The complete fiscal document record including XML and status metadata.
 * @throws NotFoundError when the document does not exist.
 *
 * @example
 * const document = await getFiscalDocumentById('a123b456-c789-0def-1234-56789abcdef0');
 */
```

### Component Prop Types Documentation (`apps/web/components/dashboard/charts.tsx`)
```typescript
/**
 * Props for the DocsByTypeChart component.
 *
 * @property {Record<string, number>} docsCount - Document counts keyed by type.
 * @property {number} year - The year to filter documents.
 * @property {(type: string) => void} onSelectType - Callback fired when a document type is selected.
 *
 * @example
 * <DocsByTypeChart 
 *   docsCount={{ NFe: 1200, CTe: 300, MDFe: 150 }} 
 *   year={2024} 
 *   onSelectType={(type) => console.log(type)} 
 * />
 */
```

### README Section Update
```markdown
# FiscalZen Web Dashboard

The **web** application is built with Next.js 14 and provides interactive dashboards to visualize fiscal documents by type, year, and status.

## Running the Web Dashboard

1. Navigate to the web app directory:

   ```bash
   cd apps/web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

Refer to [Architecture](docs/architecture.md) for module boundaries and API integration details.
```

## Guidelines
- Always prioritize clarity and precision—use unambiguous language particularly when describing fiscal process flows and API contracts.
- Keep documentation in sync with the latest code changes; stale docs harm developer trust.
- Use project-specific terminology consistently, referencing the Glossary doc (`docs/glossary.md`) for domain terms like NSU, Manifestação, and ABRASF.
- Include working examples and thoroughly test code snippets before including them in docs.
- Structure API documentation with parameters, return types, exceptions, and usage examples for developer convenience.
- Document integration points with SEFAZ or municipal providers in detail to assist with debugging and maintenance.
- Leverage existing templates and sections in `README.md` and other docs for formatting consistency.
- Link to related documents and code files when possible to provide a rich context.
- For UI components, describe props and expected usage scenarios clearly, using TypeScript doc comments.
- Submit documentation changes in pull requests with appropriate reviewers tagged to maintain quality control.
- Regularly revisit documentation files in key directories such as:
  - `docs/architecture.md`
  - `docs/security.md`
  - `apps/api/src/modules/[feature]/docs/`
  - `apps/web/components/[feature]/docs/`
- Use Markdown linting tools if available to maintain formatting standards and readability.

---

**Key Locations for Documentation:**
- Main project README and guides: `/README.md`, `/docs/`
- API-specific docs adjacent to modules: `apps/api/src/modules/*/docs/`
- Frontend component docs: `apps/web/components/*/docs/`
- Architecture and security reference: `docs/architecture.md`, `docs/security.md`
- Domain terminology: `docs/glossary.md`
- Inline source code comments in `.ts`/`.tsx` files throughout `apps/api` and `apps/web`.
