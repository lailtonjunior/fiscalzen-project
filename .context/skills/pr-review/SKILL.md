# Pull Request Review Playbook

## When to Use
Activate this skill when reviewing pull requests in the FiscalZen repository to ensure code quality, completeness, and strict adherence to the project's technical and architectural standards. Use it whenever a new feature, bug fix, refactor, or any code modification is proposed through a PR, particularly within core packages like `sefaz-client`, `nfse-client`, and applications such as `apps/api` and `apps/web`. The skill helps validate functional correctness, test coverage, security practices, and documentation quality.

## Instructions
1. **Understand the PR Context**
   - Read the pull request description and linked issue(s) to understand the purpose and scope.
   - Identify the impacted areas—whether they are core service clients, API modules, RPA scrapers, parsers, or frontend components.

2. **Review Code Structure and Quality**
   - Verify adherence to the monorepo modular structure (`apps/` vs `packages/`) and layering principles outlined in `README.md` and `architecture.md`.
   - Check that business logic resides in `service.ts` files (for API modules) and that routing layers in `apps/api/src/modules/*/routes.ts` are minimal and use utility wrappers (`sendSuccess`, `sendError`).
   - Confirm consistency with TypeScript types and interfaces, especially those declared in shared type files like `packages/shared/src/types/api.ts`.
   - Ensure readability, use of descriptive naming, and appropriate comments for complex logic, particularly in key files such as `packages/sefaz-client/src/soap-client.ts` and `packages/nfse-client/src/rpa/base-scraper.ts`.

3. **Evaluate Error Handling**
   - Check that custom error classes (e.g., `SefazError`, `ApiClientError`, `AppError`) are used properly and errors are normalized according to existing patterns in `apps/api/src/utils/errors.ts`.
   - Confirm network-related and external service errors are caught and handled gracefully.
   - Ensure timeouts (`TimeoutError`) and certificate errors (`CertificadoError`) are accounted for.

4. **Validate Test Coverage**
   - Confirm new or changed code is backed by unit and integration tests in relevant test directories (`apps/api/tests`, `packages/sefaz-client/tests`).
   - Examine tests for edge cases, including error scenarios, input validation, and multi-tenant behavior.
   - Check for the use of mocks/stubs for external SEFAZ or ABRASF services.

5. **Security and Credential Management**
   - Ensure no secrets, certificates, or tokens are hardcoded. Certificate handling should align with documented A1 certificate workflows in `packages/sefaz-client/src/certificate.ts`.
   - Validate that input validation and sanitation are implemented correctly, referencing validation utilities and conventions from shared resources.

6. **Performance and Optimization Checks**
   - Identify potential inefficiencies such as redundant SOAP calls (in `sefaz-client`) or excessive Playwright browser automation in scrapers (`nfse-client`).
   - Look for opportunities to leverage existing caching mechanisms or introduce them if missing.

7. **Documentation and Code Comments**
   - Verify that new features or significant changes include updated documentation or examples, especially in README files, service-specific docs, or inline code comments.
   - Suggest adding usage examples for complex API client classes like `SefazClient` or `AbrasfClient`.

8. **Finalize and Summarize Review**
   - Compile comments and categorize them into Must Fix, Suggestions, and Praise.
   - Use the project’s markdown review template to provide a clear and constructive summary.
   - Recommend `APPROVE`, `REQUEST_CHANGES`, or `COMMENT` with clear justification.


## Examples
```markdown
## Summary
Reviewed the new SOAP client enhancements to support additional SEFAZ event types.

## What I Reviewed
- `packages/sefaz-client/src/client.ts`
- `packages/sefaz-client/src/types.ts`

## Findings
### Must Fix
- [ ] The `TimeoutError` is declared but not used in the new event handling flow.
- [ ] Missing unit tests covering failure cases in event manifesting.

### Suggestions
- Add inline comments explaining the retry logic in `sendEvent`.
- Consider logging successful event responses for better traceability.

## Verdict
REQUEST_CHANGES
```

```markdown
## Summary
Added new municipal scraper for Belo Horizonte NFSe integration.

## What I Reviewed
- `packages/nfse-client/src/abrasf/municipios/belo-horizonte.ts`
- `packages/nfse-client/src/rpa/base-scraper.ts`

## Findings
### Must Fix
- [ ] Tests are missing for the new `BeloHorizonteAdapter`. Please add coverage.
- [ ] Hardcoded timeout value in scraper should be replaced with configurable constant.

### Suggestions
- Refactor duplicate browser initialization code in `base-scraper.ts` to use `BrowserManager`.

## Verdict
REQUEST_CHANGES
```

## Guidelines
- **Be consistent with FiscalZen coding conventions:** Reference the [README.md](./README.md) and architecture guides for modularity, naming, and API response patterns.
- **Prioritize safety and robustness:** Ensure error handling and input validation adhere strictly to patterns in `apps/api/src/utils/errors.ts` and client packages.
- **Test coverage is essential:** Every PR introducing functionality must have strong automated test coverage, including edge cases and failure modes.
- **Comment constructively and respectfully:** Your comments should improve code quality without discouraging contributors.
- **Leverage existing utilities and abstractions:** Avoid reinventing patterns; use shared helpers and clients wherever possible to reduce duplication.
- **Ensure documentation updates:** Encourage keeping inline comments updated and adding usage notes, especially for complex logic or third-party integrations.
- **Validate multi-tenant considerations:** API and backend changes must respect tenant isolation and security.
- **Keep an eye on performance impact:** Highlight any potential performance issues or bottlenecks detected in the code changes.

---

This playbook is tailored to the FiscalZen monorepo and incorporates the project's layered architecture, key components, and common error and testing patterns to guide AI agents in performing thorough, contextual pull request reviews.
