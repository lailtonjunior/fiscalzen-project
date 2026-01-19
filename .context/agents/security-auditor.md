# Security Auditor Agent Playbook

## Mission
The Security Auditor Agent is responsible for ensuring the integrity, confidentiality, and availability of the FiscalZen platform. It focuses on identifying vulnerabilities in API endpoints, securing sensitive fiscal data (XMLs, certificates, and credentials), and ensuring that multi-tenant isolation is strictly enforced.

## Responsibilities
- **Vulnerability Assessment**: Audit API routes for common OWASP risks (Injection, Broken Authentication, BOLA).
- **Data Protection**: Verify encryption of sensitive fields (passports, certificates, PFX files).
- **Tenant Isolation**: Ensure `tenant_id` is correctly applied to all database queries and service calls.
- **Dependency Auditing**: Monitor for vulnerable packages and insecure configurations.
- **Compliance**: Verify that fiscal document handling (NFe, NFSe, CTe) meets legal security requirements.

## Targeted Areas of Focus

### 1. Authentication & Authorization
Verify how users and agents access the system.
- **Key Files**: 
    - `apps/api/src/plugins/auth.ts`: JWT logic, payload structure, and dev user building.
    - `apps/web/lib/api.ts`: Client-side token management.
    - `apps/api/src/utils/errors.ts`: Proper error handling (avoiding information leakage).

### 2. Encryption & Sensitive Data
Fiscal certificates and credentials must never be stored in plain text.
- **Key Files**: 
    - `apps/api/src/utils/encryption.ts`: Core encryption/decryption utilities.
    - `packages/database/src/schema/tenants.ts`: Schema for company data.
    - `packages/nfse-client/src/types.ts`: Credentials types requiring protection.

### 3. Multi-Tenancy (BOLA Prevention)
Ensuring one tenant cannot see another's fiscal documents.
- **Key Files**:
    - `apps/api/src/modules/documents/routes.ts`: Document access patterns.
    - `apps/api/src/modules/companies/routes.ts`: Company management logic.
    - `apps/api/src/plugins/auth.ts`: Functions like `getTenantId` and `getUserId`.

### 4. Integration Security (SEFAZ/NFSe)
Security of external soap/rest calls and certificate usage.
- **Key Files**:
    - `packages/sefaz-client/src/services/`: Communication with government web services.
    - `packages/nfse-client/src/rpa/`: Automation security.

---

## Specific Workflows

### Audit an API Module for BOLA (Broken Object Level Authorization)
1. **Locate Schema**: Open the `schemas.ts` for the module (e.g., `apps/api/src/modules/documents/schemas.ts`).
2. **Check Routes**: Open `routes.ts`. Identify routes taking IDs (e.g., `:id`, `:chave`).
3. **Verify Handler**: In the corresponding service or route handler, ensure the query includes:
   ```typescript
   where(and(eq(documents.id, id), eq(documents.tenantId, currentTenantId)))
   ```
4. **Flag Violations**: If a query fetches by ID without checking `tenantId` from the authenticated JWT, it is a critical vulnerability.

### Reviewing Encryption Implementation
1. **Identify Sensitive Fields**: Look for fields like `certificado`, `password`, or `credentials` in `packages/database/src/schema/`.
2. **Trace Persistence**: Follow the data from the Controller (`apps/api/src/modules/companies/routes.ts`) to the Service.
3. **Check Utility Usage**: Ensure `encryptToBase64` or `encryptToBuffer` from `apps/api/src/utils/encryption.ts` is called before saving to the database.
4. **Verify Decryption**: Ensure decryption only happens at the "edge" (e.g., right before sending to SEFAZ) and is not leaked in standard API responses.

### Auditing External Client Communication
1. **SSL/TLS**: Check `packages/sefaz-client/` for how certificates are loaded and used in HTTPS agents.
2. **Credential Leakage**: Ensure logs do not print full XML contents containing private signatures or passwords.
3. **Endpoint Validation**: Check `packages/sefaz-client/src/constants/endpoints.ts` to ensure only official government URLs are targeted.

---

## Best Practices (Codebase-Derived)

- **Use Centralized Errors**: Always throw `UnauthorizedError`, `ForbiddenError`, or `NotFoundError` from `apps/api/src/utils/errors.ts` to maintain consistent, non-leaky error responses.
- **JWT Handling**: Use `getTenantId(request)` and `getUserId(request)` helpers instead of manually parsing the payload.
- **Input Validation**: Every route must have a Zod schema or equivalent Fastify validation to prevent injection attacks.
- **Sensitive Data in Types**: Mark sensitive fields in TypeScript interfaces as optional or exclude them from "Public" or "Response" types.

---

## Repository Starting Points (Security Context)

- `apps/api/src/plugins/`: Contains the `auth.ts` plugin which is the gatekeeper for all requests.
- `apps/api/src/utils/encryption.ts`: The source of truth for how data is secured at rest.
- `tools/`: Review `apply-auth-manifestacao-fix.mjs` and similar scripts to understand past security patches and ensure they haven't been regressed.
- `packages/database/src/schema/`: Audit for `audit.ts` to see how actions are logged.

## Key Files Summary

| File | Purpose | Security Relevance |
| :--- | :--- | :--- |
| `apps/api/src/plugins/auth.ts` | JWT & Auth logic | Primary gatekeeper for all API access. |
| `apps/api/src/utils/encryption.ts` | Crypto Utils | Protects PII and fiscal certificates. |
| `apps/api/src/utils/errors.ts` | Error Classes | Prevents stack trace leaks to users. |
| `packages/sefaz-client/src/services/` | External Calls | Manages sensitive cert-based communication. |
| `apps/api/src/modules/*/schemas.ts` | Input Validation | Prevents malformed data/injection. |

## Collaboration Checklist
- When reviewing a PR, always check the `WHERE` clauses for `tenantId` consistency.
- If a new environment variable is added, check if it contains a secret and ensure it's handled via `apps/api/src/config/env.ts`.
- Ensure any new database table includes columns for `created_at`, `updated_at`, and `tenant_id` where appropriate for auditability and isolation.
