---
name: API Design
description: Skill para design e revisão de APIs RESTful seguindo boas práticas
---

# API Design

## When to Use
Engage this skill when designing new APIs or reviewing existing API designs in the FiscalZen project. This is essential for ensuring that APIs adhere to best practices, thus promoting maintainability and scalability.

## Instructions
1. **Define Resources**:
   - Identify the main entities your API will handle (e.g., users, documents).
   - Ensure to use plural nouns for resource names (e.g., `/users`, `/documents`).

2. **Specify HTTP Methods**:
   - Use the appropriate HTTP methods for each endpoint:
     - `GET` for retrieving data (e.g., `/users`),
     - `POST` for creating new records (e.g., `/users`),
     - `PUT` or `PATCH` for updating existing records (e.g., `/users/{id}`),
     - `DELETE` for removing records (e.g., `/users/{id}`).

3. **Implement Status Codes**:
   - Standardize your API responses with relevant HTTP status codes:
     - 200 for successful requests,
     - 201 for successful creation,
     - 400 for bad requests,
     - 401 for unauthorized access,
     - etc.

4. **Design the Response Format**:
   - Structure your API responses to include data, metadata, and errors:
   ```json
   {
     "data": { },
     "meta": {
       "page": 1,
       "total": 100
     },
     "errors": []
   }
   ```

5. **Version Your API**:
   - Include versioning in your URLs (e.g., `/v1/users`) or via headers (e.g., `Accept: application/vnd.api+json; version=1`).

6. **Review Against the Checklist**:
   - Confirm resources are clearly defined,
   - Consistent naming conventions are used,
   - Proper HTTP methods are applied,
   - Standardized error responses,
   - Pagination is implemented where necessary,
   - Authentication and rate limiting are specified.

## Examples
```json
// Example API Request
GET /v1/users

// Example API Response
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  ],
  "meta": {
    "page": 1,
    "total": 1
  },
  "errors": []
}
```

## Guidelines
- Use **Error Handlers** from `apps/api/src/utils/errors.ts` for standardized error management. Examples include:
  - `NotFoundError`
  - `UnauthorizedError`
  
- Ensure **response pagination** using utility functions in `apps/api/src/utils/response.ts` such as `sendSuccess` and pagination parameters.

- Document each API endpoint clearly, referencing the **FiscalZen documentation** for context on fiscal processes. Include examples in the codebase for relevant operations.

- Leverage middleware for applying security best practices, such as rate limiting, as defined in `apps/api/src/plugins/rate-limit.ts`.

- Always ensure backward compatibility for existing API versions when introducing changes.