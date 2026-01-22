---
name: Refactoring
description: Técnicas de refatoração para melhorar estrutura e manutenibilidade do código
---

# Refactoring Specialist Agent Playbook

## When to Use
Engage this skill when the codebase requires improvements in structure and maintainability. Refactoring should be applied whenever code becomes challenging to understand, repetitive patterns emerge, or functionality needs to be optimized without altering existing behavior. Prioritize small, incremental changes to safeguard against introducing regressions.

## Instructions
1. **Identify Code Smell**: Locate sections of code that are difficult to maintain, such as duplicated logic or overly complex methods.
2. **Ensure Test Coverage**: Verify that existing tests cover the functionality being refactored. If necessary, write characterization tests first.
3. **Apply Refactoring Techniques**:
   - Extract methods and variables as appropriate.
   - Eliminate long parameter lists by encapsulating parameters in objects.
   - Replace conditionals with polymorphism when applicable.
4. **Run Tests**: Execute the relevant test suite to confirm no functionality is broken.
5. **Document Changes**: Add comments or documentation to explain the refactoring if the code's intent may not be clear.
6. **Commit Changes**: After verifying tests pass, commit with a clear message explaining what was refactored and why.
7. **Repeat as Needed**: Continue identifying and refactoring code smells until the necessary improvements are achieved.

## Examples
### Extract Method
**Before:**
```typescript
function processInvoice(invoice) {
    // Validate invoice
    if (!invoice.number) throw new Error("Missing number");
    if (invoice.amount <= 0) throw new Error("Invalid amount");
    
    // Apply tax
    const tax = 0.1 * invoice.amount;
    invoice.total = invoice.amount + tax;
}
```
**After:**
```typescript
function processInvoice(invoice) {
    validateInvoice(invoice);
    applyTax(invoice);
}

function validateInvoice(invoice) {
    if (!invoice.number) throw new Error("Missing number");
    if (invoice.amount <= 0) throw new Error("Invalid amount");
}

function applyTax(invoice) {
    const tax = 0.1 * invoice.amount;
    invoice.total = invoice.amount + tax;
}
```

### Extract Variable
**Before:**
```typescript
if (user.age >= 18 && user.country === 'US' && user.verified) {
    // allow purchase
}
```
**After:**
```typescript
const canPurchase = user.age >= 18 && user.country === 'US' && user.verified;
if (canPurchase) {
    // allow purchase
}
```

## Guidelines
- **Incremental Changes**: Refactor in small steps and avoid large, sweeping changes.
- **Test Before and After**: Always run the test suite to ensure existing functionality remains intact.
- **Avoid Premature Optimization**: Focus on clarity and maintainability before optimizing for performance.
- **Document Intentions**: If the refactor significantly alters the structure or logic, include comments to clarify the reason behind the changes.
- **Utilize Existing Utilities**: Leverage utility functions from `@fiscalzen/shared` for common tasks, reducing code duplication across modules.

## Key Files for Refactoring
- `packages\sefaz-client\src\client.ts`
- `apps\web\lib\api.ts`
- `packages\nfse-client\src\rpa\base-scraper.ts`
- `packages\xml-parser\src\types.ts`
  
Utilize these files as areas to identify repetitive patterns or long methods that require refactoring for improved clarity and maintainability in the FiscalZen project.