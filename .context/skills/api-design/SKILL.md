# API Design

## When to Use
Activate this skill when designing new RESTful APIs or reviewing and extending existing API endpoints within the FiscalZen platform. This ensures that APIs are consistent, maintainable, scalable, and aligned with the platform's conventions for handling Brazilian fiscal documents. Use this skill especially when defining new resources, integrating with external SEFAZ services, or updating API versions to support evolving fiscal regulations.

## Instructions
1. **Identify and Define Resources**  
   - Map domain entities such as `documents`, `companies`, `dashboard`, and `search` into RESTful resources. Use plural nouns for endpoint paths, e.g., `/companies`, `/documents`.  
   - Reference service files like `apps/api/src/modules/companies/service.ts` to understand resource boundaries.

2. **Use Proper HTTP Methods for CRUD Operations**  
   - `GET` to retrieve resources or collections (`/companies`, `/documents/{id}`)  
   - `POST` to create new resources (e.g., `/documents`)  
   - `PUT` or `PATCH` to update resources partially or fully (`/companies/{id}`)  
   - `DELETE` to remove resources (`/companies/{id}`)  

3. **Implement API Versioning**  
   - Prefix all routes with versioning, e.g., `/v1/companies`, to ensure backward compatibility. FiscalZen currently uses versioned routes (`/v1/...`) to manage evolution safely.  

4. **Standardize Response Structure Using Utility Types**  
   - Return API responses wrapped in a consistent envelope with keys like `data`, `meta`, and `errors`.  
   - Use shared response types from `packages/shared/src/types/api.ts` such as `ApiResponse<T>` and pagination support via `PaginatedResponse<T>`.  

5. **Handle Errors Uniformly**  
   - Leverage error classes and handlers from `apps/api/src/utils/errors.ts` (e.g., `NotFoundError`, `ValidationError`, `UnauthorizedError`).  
   - Structure error responses using `ErrorResponse` utilities from `apps/api/src/utils/response.ts` for consistent client experience.  
   - Emit appropriate HTTP status codes matching the error class (e.g., 404 for `NotFoundError`, 401 for `UnauthorizedError`).

6. **Implement Pagination for Large Collections**  
   - Use `PaginationParams` and `PaginationMeta` from `apps/api/src/utils/response.ts` to paginate responses for list endpoints like `/documents` or `/companies`.  
   - Include metadata such as `page`, `limit`, and `total` in response `meta` fields.

7. **Secure Routes Using Existing Plugins**  
   - Integrate authentication and authorization via the JWT plugin (`apps/api/src/plugins/auth.ts`).  
   - Apply rate limiting by using the middleware in `apps/api/src/plugins/rate-limit.ts` to prevent abuse.

8. **Document API Endpoints Clearly**  
   - Add inline documentation in route handlers (e.g., `apps/api/src/modules/companies/routes.ts`) referencing fiscal domain concepts.  
   - Include example requests and responses as in API client usage (`apps/web/lib/api.ts`).  

9. **Review API Design Against the Checklist**  
   - Confirm resource naming is clear and consistent.  
   - Validate use of HTTP methods and status codes.  
   - Check error handling consistency.  
   - Confirm versioning strategy is followed.  
   - Ensure secure access controls are applied.  

## Examples
```typescript
// Example: GET /v1/companies with pagination
// Endpoint handler in apps/api/src/modules/companies/routes.ts
import { sendSuccess, paginate } from '../../utils/response';
import { listCompanies } from './service';

async function getCompanies(request, reply) {
  const { page = 1, limit = 20 } = request.query;
  const { data, total } = await listCompanies({ page, limit });

  return sendSuccess(reply, {
    data,
    meta: paginate({ page, limit, total }),
  });
}
```

```json
// Example API Response for GET /v1/companies
{
  "data": [
    {
      "id": "123",
      "name": "FiscalZen Ltd.",
      "cnpj": "00.000.000/0001-00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  },
  "errors": []
}
```

```typescript
// Example: Error Handling
import { NotFoundError } from '../../utils/errors';
import { sendError } from '../../utils/response';

async function getCompany(request, reply) {
  const { id } = request.params;
  const company = await findCompanyById(id);

  if (!company) {
    return sendError(reply, new NotFoundError(`Company with id=${id} not found`));
  }

  return sendSuccess(reply, { data: company });
}
```

## Guidelines
- **Follow the FiscalZen Plural Resource Naming Convention**: Always use plural nouns in URLs to represent resource collections (e.g., `/companies`, `/documents`).

- **Consistently Apply HTTP Status Codes and Error Classes**: Use the defined error classes (`NotFoundError`, `UnauthorizedError`, `ValidationError`, etc.) for error handling and map these to appropriate HTTP status codes.

- **Use Shared Types and Utilities for API Responses**: Utilize `ApiResponse`, `PaginatedResponse`, `sendSuccess`, and `sendError` from the shared packages and `apps/api` utils for consistent response formatting.

- **Always Version Your APIs**: Prefix all endpoints with `/v1/` to allow smooth transition to new API versions without breaking existing clients.

- **Implement Pagination on List Endpoints**: Do not return unpaginated datasets in endpoints returning lists, especially for resources like fiscal documents which can be very large.

- **Enforce Authentication and Rate Limiting**: Protect endpoints with existing auth plugins (`plugins/auth.ts`) and apply rate limiting from `plugins/rate-limit.ts` to safeguard the platform.

- **Document Endpoints Within the Code and in API Documentation**: Maintain inline comments in route files and update the FiscalZen API documentation with examples reflecting current fiscal concepts and response formats.

- **Ensure Backward Compatibility**: When modifying API behavior or response format, create new versions and avoid breaking changes in existing versions to prevent client disruption.

- **Handle Errors Gracefully and Informatively**: Return detailed but secure error messages with codes and human-readable descriptions, enabling frontend to interpret and display useful feedback.

- **Leverage Middleware for Cross-Cutting Concerns**: Use Fastify plugins for CORS (`plugins/cors.ts`), rate limiting, and authentication consistently across all API modules.

By following these project-tailored guidelines and leveraging existing FiscalZen utilities and conventions, API design remains robust, consistent, and aligned with the platform’s domain-driven approach to fiscal document management.
