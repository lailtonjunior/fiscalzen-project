---
name: Feature Breakdown
description: Quebra de funcionalidades em tarefas menores e gerenciáveis
---

# Feature Breakdown

## When to Use
Use this skill when planning a new feature or breaking down requirements into manageable tasks within the FiscalZen project. The breakdown process helps clarify objectives, ensure alignment with user needs, and facilitate implementation.

## Instructions
1. **Understand the Goal**
   - Identify the problem the feature intends to solve and the target user.
   - Define what success looks like for this feature within the context of FiscalZen's functionality.

2. **Identify Components**
   - Assess necessary UI changes and determine new API endpoints required.
   - Evaluate any database changes or schema modifications in `packages/database/src/schema/`.
   - Consider any external integrations, especially with SEFAZ services.
   - Identify background jobs that may need to be scheduled or handled through tools like BullMQ.

3. **Define Tasks**
   - Each task must be:
     - **Small**: Designed to be completable within less than 4 hours.
     - **Independent**: Limited dependencies to streamline the development process.
     - **Testable**: Include clear acceptance criteria to guide testing.
     - **Valuable**: Deliver partial value upon completion.

4. **Order by Dependencies**
   - Sequence the tasks by the order in which they need to be executed. For example:
     ```
     1. Database schema changes (modify in `packages/database/src/schema/`)
     2. Implement Backend API endpoints (in `apps/api/src/modules/[feature]/service.ts`)
     3. Create Frontend components (in `apps/web/components/[feature]/`)
     4. Write Integration tests (in `apps/api/tests`)
     5. Update Documentation (in `README.md`)
     ```

## Examples
```markdown
### Task: Implement User Preferences API

**Description**: Develop an API endpoint that allows users to set and retrieve preferences.

**Acceptance Criteria**:
- [ ] API endpoint `/api/preferences` supports GET and POST methods.
- [ ] Validations for user inputs are implemented.
- [ ] Responses conform to the established API response standards.

**Technical Notes**:
- Approach: Use Fastify to create the endpoint and interact with the database.
- Files: Modify `apps/api/src/modules/users/service.ts` and `apps/api/src/modules/users/routes.ts`.
- Dependencies: Ensure the database schema is updated to include user preferences.

**Estimate**: M
```

## Guidelines
- Ensure all tasks follow the established conventions and patterns laid out in the project documentation.
- Regularly update the task board or project management tool to reflect the current status of each feature breakdown.
- Engage with peers for feedback on task definitions and priorities to enhance clarity and acceptance.
- Utilize existing documentation like `README.md` and architecture overviews to maintain alignment with project goals and standards.
- Document any changes made during implementation to enrich future breakdowns and contribute to knowledge sharing.