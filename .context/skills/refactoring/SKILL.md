# Refactoring Skill Playbook

## When to Use

Activate this refactoring skill whenever the FiscalZen codebase exhibits signs of complexity, duplication, or diminishing clarity that hinders maintainability. Such situations include large methods or classes, scattered validation or parsing logic, business rules embedded in API routes, or inconsistent use of utility functions. Refactoring is essential to improve code readability, facilitate feature extensions, and reduce bugs, all while preserving the existing functional behavior. Always prefer small, incremental refactoring steps to minimize regression risks and to keep the codebase healthy over time.

## Instructions

1. **Identify Refactoring Targets**  
   Search for code smells such as duplicated logic (e.g., validation, error handling), overly long functions or classes (e.g., `sefaz-client/src/client.ts`, `nfse-client/src/rpa/base-scraper.ts`), or misplaced concerns (like business logic inside API route handlers in `apps/api/src/modules`).

2. **Ensure Adequate Test Coverage**  
   Confirm relevant unit and integration tests exist (e.g., tests in `packages/sefaz-client/tests` or `apps/api/tests`). If coverage is missing, write characterization tests before changing behavior.

3. **Plan Incremental Changes**  
   Break refactoring into small, manageable commits focused on a single concern (e.g., extract method, simplify conditional, centralize validation).

4. **Apply Refactoring Patterns**  
   - Extract reusable functions or methods from large blocks (e.g., extract XML parsing helpers from `xml-parser/src/parsers/nfse.ts`).  
   - Replace lengthy or complex parameter lists with parameter objects to improve clarity (common in client constructors / SOAP calls).  
   - Move business logic out of route handlers (e.g., from `apps/api/src/modules/[feature]/routes.ts`) into dedicated service files (`service.ts`).  
   - Use polymorphism or strategy patterns to replace complex conditionals (especially in municipality-specific adapters in `nfse-client/src/abrasf/municipios`).  
   - Consolidate repeated utility code into shared modules, preferably inside `@fiscalzen/shared`.

5. **Run All Tests Frequently**  
   Use the existing test suites to verify no functionality is broken after each incremental change. Look especially at API, SOAP client, and document parsing tests.

6. **Document Non-obvious Changes**  
   Add comments or update readme sections if the refactoring changes code structure or logic flow significantly, ensuring future developers understand the intent.

7. **Commit and Push with Clear Messages**  
   Use descriptive commit messages explaining what was refactored and why, e.g., "Extracted invoice validation into reusable function in sefaz-client" or "Moved business logic from API route into service layer for NFSe".

8. **Iterate as Needed**  
   Continue identifying additional refactoring opportunities gradually, prioritizing areas with frequent changes or complexity.

## Examples

### Example 1: Extract Method from `packages/sefaz-client/src/client.ts`

**Before:**
```typescript
async function sendDocument(doc) {
  if (!doc.id) throw new SefazError("Document missing id");
  if (!doc.content) throw new SefazError("Document missing content");

  // Sign document
  const signed = signDocument(doc.content);

  // Send signed document via SOAP
  const response = await soapClient.send(signed);
  return response;
}
```

**After:**
```typescript
async function sendDocument(doc) {
  validateDocument(doc);
  const signedContent = signDocument(doc.content);
  return await sendSignedDocument(signedContent);
}

function validateDocument(doc) {
  if (!doc.id) throw new SefazError("Document missing id");
  if (!doc.content) throw new SefazError("Document missing content");
}

async function sendSignedDocument(content) {
  return await soapClient.send(content);
}
```

---

### Example 2: Replace Conditionals with Polymorphism in `nfse-client/src/abrasf/municipios/`

**Before:**
```typescript
function calculateTaxes(city, amount) {
  if (city === 'sao-paulo') return amount * 0.05;
  if (city === 'rio-de-janeiro') return amount * 0.06;
  if (city === 'belo-horizonte') return amount * 0.055;
  // other cities...
}
```

**After:**
```typescript
abstract class TaxCalculator {
  abstract calculate(amount: number): number;
}

class SaoPauloCalculator extends TaxCalculator {
  calculate(amount: number) { return amount * 0.05; }
}

class RioDeJaneiroCalculator extends TaxCalculator {
  calculate(amount: number) { return amount * 0.06; }
}

class BeloHorizonteCalculator extends TaxCalculator {
  calculate(amount: number) { return amount * 0.055; }
}

function getTaxCalculator(city: string): TaxCalculator {
  switch(city) {
    case 'sao-paulo': return new SaoPauloCalculator();
    case 'rio-de-janeiro': return new RioDeJaneiroCalculator();
    case 'belo-horizonte': return new BeloHorizonteCalculator();
    default: throw new Error('Unsupported city');
  }
}

// Usage:
const calc = getTaxCalculator(city);
const tax = calc.calculate(amount);
```

---

### Example 3: Encapsulating Parameter Objects in `apps/web/lib/api.ts`

**Before:**
```typescript
async function fetchInvoices(userId: string, startDate: string, endDate: string, status: string) {
  // API call logic
}
```

**After:**
```typescript
interface InvoiceQueryParams {
  userId: string;
  startDate: string;
  endDate: string;
  status?: string;
}

async function fetchInvoices(params: InvoiceQueryParams) {
  // API call logic using params
}
```

## Guidelines

- **Incremental Changes Only:** Large refactors increase risk of regressions — prefer small, isolated commits.
- **Strongly Leverage Tests:** Ensure unit, integration, and API tests pass before and after refactoring. Write missing tests if necessary.
- **Preserve Behavior:** Never change business logic or API behavior unless explicitly intended. Refactor only structure and style.
- **Centralize Shared Logic:** Extract duplicated validation, error handling, or formatting into utilities under `@fiscalzen/shared` or relevant packages.
- **Reduce Cognitive Load:** Break large, complex functions into smaller, descriptive units with clear names.
- **Use Domain Namespaces:** Match refactored methods and classes to FiscalZen domain concepts (e.g., `SefazClient`, `AbrasfClient`, `TemplateScraper`) for cohesion.
- **Update Documentation:** Add or update comments for complex refactorings to aid future maintainers.
- **Follow Project Patterns:** Conform to existing FiscalZen architecture, such as separating route handlers (`routes.ts`) from service logic (`service.ts`) in `apps/api`.
- **Avoid Premature Optimization:** Focus primarily on clarity and maintainability rather than micro-optimizations or performance tweaks during refactoring.
- **Respect TypeScript Types:** Maintain or improve type safety; update or simplify type declarations as part of refactor.
- **Coordinate with Other Agents:** Engage the Test Writer Agent to cover new or moved functionality if test gaps appear.

---

## Key Files for Refactoring Exploration

- `packages/sefaz-client/src/client.ts` — Central SOAP client wrapper; often has large methods suitable for method extraction and encapsulating client logic.
- `apps/web/lib/api.ts` — API request utilities; good for standardizing parameter objects and error handling.
- `packages/nfse-client/src/rpa/base-scraper.ts` — Base scraper logic for municipal services; often benefits from simplifying conditionals and extracting utility methods.
- `packages/xml-parser/src/types.ts` — Type definitions for XML parsing; refactoring types cohesively may improve maintainability across parsers.
- `apps/api/src/modules/*/routes.ts` and corresponding `service.ts` — Shift business logic into service layer for cleaner routes.
- `packages/nfse-client/src/abrasf/municipios/*.ts` — Refactor municipality-specific logic to use polymorphism or adapters with clear responsibilities.

---

By following this playbook, AI agents can systematically enhance the FiscalZen codebase’s structure and maintainability while preserving behavior and test stability. Small, deliberate refactoring increments combined with thorough testing and domain-focused organization will keep the platform robust and developer-friendly.
