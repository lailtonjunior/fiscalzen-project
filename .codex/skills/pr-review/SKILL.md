---
name: Pull Request Review
description: Guia para revisão de pull requests com foco em qualidade e segurança
---

# Pull Request Review Playbook

## When to Use
Use this skill when reviewing a pull request for the FiscalZen project, focusing on assessing quality, completeness, and adherence to code standards. Activate this skill whenever a new feature, modification, or bug fix is introduced through a pull request.

## Instructions
1. **Understand the Context**
   - Read the pull request description to grasp the purpose and rationale.
   - Check for related issues or tickets in the project management tool.

2. **Review Code Quality**
   - Ensure code follows project conventions set forth in the [README.md](./README.md).
   - Look for unnecessary complexity; refactor if necessary to maintain simplicity.
   - Verify adherence to the DRY principle (Don't Repeat Yourself).
   - Examine the error handling strategy for appropriateness and completeness.

3. **Check Testing**
   - Ensure that new functionality is adequately covered by tests.
   - Evaluate whether edge cases are handled in tests and confirm no flaky tests are introduced.

4. **Assess Security**
   - Look for any hardcoded secrets and ensure they are properly managed.
   - Confirm that input validation is present.
   - Check for potential SQL injection risks in database queries.
   - Verify that authentication and authorization mechanisms are correctly implemented.

5. **Evaluate Performance**
   - Identify any N+1 query issues and suggest refactoring.
   - Recommend appropriate caching strategies where necessary.
   - Check for memory leaks that could impact application performance.

6. **Document Your Review**
   - Use the specified review format to summarize your findings and provide structured feedback.

## Examples
```markdown
## Summary
This pull request introduces a new module for signing XML documents that integrates with the SEFAZ service. 

## What I Reviewed
- `packages/sefaz-client/src/signature.ts`
- `packages/xml-parser/src/parsers/sat.ts`

## Findings
### Must Fix
- [ ] The error handling in `signature.ts` does not cover network errors adequately.
- [ ] Missing unit tests for edge cases in signing process.

### Suggestions
- Consider adding logging for successful operations to assist with debugging in production.
- Nice to have: Include example usage in documentation for clarity.

## Verdict
REQUEST_CHANGES
```

## Guidelines
- **Be thorough:** Always refer to the [FiscalZen Developer Documentation](./README.md) for coding standards, practices, and architecture overviews.
- **Collaborate Kindly:** Leave constructive feedback to help improve the code, fostering a collaborative environment.
- **Follow Up:** Revisit the pull request after fixes and ensure all comments have been addressed.
- **Stay Objective:** Focus on code quality and standards rather than personal preferences; support your critique with rationale based on best practices.
- **Use Tools:** Leverage existing code analysis tools to catch issues such as code complexity, unused variables, or lack of coverage.