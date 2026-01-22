---
name: Code Review
description: Skill para revisão de código focando em qualidade, segurança e performance
---

# Code Review

## When to Use
Engage this skill when evaluating code changes in the FiscalZen project to ensure adherence to quality standards and best practices. This includes analyzing pull requests, proposed changes, and overall code quality to uphold maintainability, performance, security, and style consistency across the codebase.

## Instructions
1. **Review the Code Context**: Familiarize yourself with the related files and their structure, especially focus on key files like `packages/sefaz-client/src/client.ts`, `apps/web/lib/api.ts`, etc.
2. **Analyze for Readability**: Check for clear naming conventions and appropriate comments throughout the code. Ensure consistent formatting is applied.
3. **Evaluate Maintainability**: Determine if the code adheres to the Single Responsibility Principle and check for low coupling and high cohesion.
4. **Check for Correctness**: Look for potential logic errors, off-by-one errors, and ensure proper null or undefined handling.
5. **Assess Performance**: Review algorithm complexity and look for opportunities for caching or unnecessary computations.
6. **Audit for Security**: Verify input validation, output encoding, and authentication and authorization checks throughout the code.
7. **Document Findings**: Use the output format below to capture issues, observations, and recommendations.
8. **Provide Feedback**: Share the documentation with the development team for discussion and improvements.

## Examples
```markdown
## File: packages/nfse-client/src/rpa/base-scraper.ts

### Issues Found
| Line | Severity | Issue                          | Suggestion                          |
|------|----------|--------------------------------|-------------------------------------|
| 37   | High     | Potential race condition       | Implement proper synchronization     |
| 82   | Medium   | Inefficient loop over arrays   | Use `forEach` or `map` for clarity |

### Positive Observations
- Clear separation of concerns in the scraper structure.
- Good use of async/await for handling asynchronous calls.

### Refactoring Opportunities
- Extract method for `fetchData` into smaller functions for better readability and reusability.
- Consider using template literals for URL construction instead of string concatenation.
```

## Guidelines
- Maintain a respectful and constructive tone in reviews.
- Focus on the code rather than the coder; frame critique in terms of code quality.
- Prioritize high-severity issues first, followed by medium and low severity.
- Provide positive feedback along with constructive criticism to promote improvement.
- Leverage existing documentation (e.g., `README.md`, `architecture.md`) to ensure alignment with project guidelines.