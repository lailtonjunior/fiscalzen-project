---
name: Documentation
description: Skill para criação e atualização de documentação técnica
---

# Documentation Skill Playbook

## When to Use
Activate this skill when creating or updating documentation within the FiscalZen project to ensure clarity, consistency, and correctness.

## Instructions
1. Identify the documentation type needed (API, README, Architecture, Code Comments).
2. Review existing documentation for completeness and accuracy.
3. Update sections based on recent changes in code or functionality.
4. Adhere to the project's format guidelines, ensuring a clear headings hierarchy.
5. Use the provided templates for specific documentation types.
6. Include relevant examples and expected outputs where applicable.
7. For API documentation, verify endpoints against the actual codebase.
8. Submit your documentation changes for review before merging.

## Examples
### API Documentation
```typescript
/**
 * Fetches user details by user ID.
 *
 * @param userId - Unique identifier for the user.
 * @returns User details object.
 * @throws NotFoundError - When no user is found with the specified ID.
 *
 * @example
 * const userDetails = await fetchUserDetails('12345');
 */
```

### README Section
```markdown
# FiscalZen Project

**Overview:**
FiscalZen is a fiscal management platform that automates the lifecycle of electronic fiscal documents.

**Installation Steps:**
1. Clone the repository: `git clone <repository-url>`
2. Navigate into the project directory: `cd fiscalzen-project`
3. Install dependencies: `npm install`

**Quick Start:**
Run the development server: `npm run dev`
```

## Guidelines
- Use precise language to describe functionality and usage.
- Clearly explain complex algorithms or business logic in comments.
- Keep documentation aligned with the latest changes in the codebase.
- Regularly review and update outdated documentation to reflect current practices.
- Include links to related documents within the documentation for seamless navigation.

### Key Document Locations
- **API Documentation:** `apps/api/src/modules/[feature]/docs/`
- **Component Documentation:** `apps/web/components/[feature]/docs/`
- **Architecture Overview:** `docs/architecture.md`