# Code Review

## When to Use
Activate this skill when reviewing code changes in the FiscalZen monorepo, including pull requests, branch merges, or proposed commits. Use it to ensure new or updated code aligns with FiscalZen’s quality standards around maintainability, performance, security, and style consistency. This is essential when reviewing modifications to core client packages (`sefaz-client`, `nfse-client`), API layers (`apps/api`, `apps/web`), and parsing utilities (`xml-parser`). Effective application of this skill helps maintain the integrity of integrations with SEFAZ government services, municipal providers, and internal data flows.

## Instructions
1. **Review the Context and Scope**: Identify the purpose of the changes and which part of the FiscalZen system they affect. Reference key files related to the change, such as:
   - SOAP and client integrations: `packages/sefaz-client/src/client.ts`, `packages/nfse-client/src/abrasf/client.ts`
   - API logic: `apps/api/src/modules/*`, `apps/web/lib/api.ts`
   - XML parsing: `packages/xml-parser/src/parsers/*.ts`
2. **Check Code Style and Consistency**: 
   - Ensure adherence to TypeScript usage patterns prevalent in FiscalZen (strict types, use of interfaces and types).
   - Confirm consistent formatting: indentation, spacing, line length, and import order aligned with existing files.
   - Verify descriptive and consistent naming conventions matching project terminology (e.g., `SefazClient`, `AbrasfClient`).
3. **Assess Maintainability and Design**:
   - Confirm separation of concerns (e.g., business logic in `service.ts`, API routing in `routes.ts`).
   - Validate that code follows SRP (Single Responsibility Principle) and avoids unnecessary coupling.
   - Look for modularity and reuse opportunities, especially across similar components like the NFSe municipal adapters (`sao-paulo.ts`, `rio-de-janeiro.ts`).
4. **Evaluate Performance Impact**:
   - Analyze algorithmic efficiency, especially in XML parsing logic (`xml-parser`).
   - Identify potential caching opportunities, e.g., certificate loading in `packages/sefaz-client/src/certificate.ts`.
   - Look out for excessive synchronous calls or repeated expensive computations.
5. **Audit Security Practices**:
   - Verify input validation and output encoding to prevent injection or data corruption.
   - Confirm proper handling of sensitive data such as digital certificates (`packages/sefaz-client/src/signature.ts`) and authentication tokens.
   - Review error handling patterns in API (`apps/api/src/utils/errors.ts`) to avoid information leakage.
6. **Verify Testing and Documentation**:
   - Check for added or updated unit, integration, or end-to-end tests corresponding to the change.
   - Cross-reference with ongoing project documentation and style conventions.
7. **Provide Clear, Actionable Feedback**:
   - Document issues found with line references, severity, and suggestions.
   - Highlight positive aspects and adherence to best practices.
   - Recommend refactoring opportunities to improve readability or performance.
8. **Conclude and Communicate**:
   - Summarize the review findings in the code review comment or merge request.
   - Maintain a constructive and respectful tone that focuses on improving code quality.
   - Encourage clarification or further discussion where design decisions are unclear.

## Examples
```markdown
## File: packages/nfse-client/src/rpa/base-scraper.ts

### Issues Found
| Line | Severity | Issue                       | Suggestion                              |
|-------|----------|-----------------------------|---------------------------------------|
| 37    | High     | Potential race condition due to shared state access | Implement mutex locking or state isolation mechanisms |
| 82    | Medium   | Inefficient loop over large arrays using `for`  | Replace with `forEach` or `map` for better readability and potential optimizations |

### Positive Observations
- Clear modularization of scraping logic separating browser management and data extraction.
- Effective use of async/await patterns improving asynchronous control flow.

### Refactoring Opportunities
- Extract `fetchData` into smaller, testable helper functions to improve readability.
- Use template literals for URL construction to enhance clarity and avoid string concatenation.
```

```markdown
## File: apps/web/lib/api.ts

### Issues Found
| Line | Severity | Issue                          | Suggestion                                   |
|-------|----------|--------------------------------|----------------------------------------------|
| 45    | Medium   | Missing error mapping for external service failures | Extend `ApiClientError` handling with explicit subclasses for reliability |

### Positive Observations
- Consistent use of TypeScript generics for API response typing.
- Well-structured error handling using custom error classes, improving debuggability.

### Refactoring Opportunities
- Consider centralizing API request retry logic to enhance robustness.
```

## Guidelines
- **Be Respectful and Constructive:** Frame feedback to improve the code, not to criticize the author personally.
- **Prioritize Issues by Severity:** Address critical security and correctness issues first before style or minor optimization points.
- **Balance Criticism with Praise:** Highlight where the code follows project best practices or demonstrates innovative solutions.
- **Reference Project Documentation:** Align suggestions with FiscalZen’s architecture and coding standards as documented in `README.md`, `architecture.md`, and module READMEs.
- **Encourage Test Coverage:** Promote the addition of tests for all new features or bug fixes leveraging existing test folders like `packages/sefaz-client/tests`.
- **Use Clear, Concise Language:** Ensure that the feedback is easy to understand and actionable by developers.
- **Leverage Existing Patterns:** When recommending code practices, refer to existing well-structured code in packages such as `sefaz-client` or `nfse-client`.
- **Security First:** Always consider data privacy, certificate management, and authorization when reviewing code in FiscalZen, especially in packages handling government integrations.

---

This skill playbook ensures AI agents can perform thorough and effective code reviews tailored to the complexities and specific architecture of the FiscalZen platform, thereby supporting continuous code quality improvement.
