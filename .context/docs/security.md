# FiscalZen Security Documentation

This document outlines the comprehensive security architecture, data protection strategies, and compliance measures applied within the FiscalZen platform. It is intended to guide developers in maintaining robust security practices when working with sensitive fiscal data and the FiscalZen codebase.

---

## Authentication & Authorization

### JWT Authentication

FiscalZen uses stateless authentication with JSON Web Tokens (JWT). Access to protected API endpoints requires a valid Bearer token in the `Authorization` HTTP header.

- **Configuration:**
  - `JWT_SECRET`: A securely stored, high-entropy string (minimum 32 characters) held in environment variables, used for signing tokens.
  - `JWT_EXPIRES_IN`: Token validity duration, typically set to `1d` (one day).

- **JWT Payload Structure:**
  ```typescript
  interface JwtPayload {
    userId: string;
    tenantId: string;
    email: string;
    iat: number;  // Issued at timestamp (Unix time)
    exp: number;  // Expiration timestamp (Unix time)
  }
  ```

### Authorization Model

FiscalZen enforces multi-tenancy and resource ownership through a layered authorization approach:

1. **Route Level:**
   - Middleware checks JWT signature validity and expiration.
   - Required claims such as `tenantId` must be present.

2. **Tenant Level:**
   - The `tenantId` extracted from JWT scopes all database queries, isolating each tenant’s data.

3. **Ownership Level:**
   - Actions on entities (e.g., updating companies or accessing documents) validate that the entity belongs to the user's tenant, preventing unauthorized access.

**Example Authorization Check:**
```typescript
// apps/api/src/utils/auth.ts
export async function verifyCompanyAccess(tenantId: string, companyId: string) {
  const company = await db.query.companies.findFirst({
    where: and(
      eq(companies.id, companyId),
      eq(companies.tenantId, tenantId)
    ),
  });

  if (!company) {
    throw new ForbiddenError('Access denied: Company does not belong to this tenant');
  }
  return company;
}
```

---

## Secrets & Sensitive Data Handling

### Encryption At Rest

Digital certificates (Certificado Digital A1 in PFX format) are encrypted before storage:

- **Algorithm:** AES-256-GCM, providing confidentiality and integrity.
- **Key Management:** Encryption key stored securely in environment variable `CERT_ENCRYPTION_KEY` (32 bytes / 64 hex characters).
- **Storage Format:** Encrypted buffers are saved as colon-separated strings containing the IV, authentication tag, and ciphertext: `iv:authTag:encryptedContent`.
- **Certificate Password:** Never stored in the database; provided transiently during interactions with SEFAZ and discarded immediately afterward.

### Sensitive Environment Variables

| Variable              | Purpose                       | Security Considerations                        |
|-----------------------|-------------------------------|-----------------------------------------------|
| `DATABASE_URL`         | Connection string for PostgreSQL | Contains DB credentials; restrict network access |
| `JWT_SECRET`           | Key for signing JWT tokens     | High-entropy, rotate regularly to revoke tokens |
| `CERT_ENCRYPTION_KEY`  | Key to encrypt/decrypt certificates | Critical for certificate decryption; backup securely |
| `S3_SECRET_KEY`        | Credentials for S3 XML storage | Access must be tightly controlled             |

---

## Data Protection & Integrity

### Multi-tenant Data Isolation

- Data tables include a `tenant_id` column to segregate tenant data.
- All database queries enforce tenant scoping with conditions filtering by `tenant_id`.
- Composite indexes on `(tenant_id, id)` enable efficient, secure tenant-specific lookups.

### Input Validation & Sanitization

- API payloads are validated using **Zod schemas** (`apps/api/src/modules/*/schemas.ts`), ensuring data correctness and preventing malformed requests.
- The use of **Drizzle ORM** guarantees all SQL queries are parameterized to mitigate SQL injection risks.
- **Next.js** frontend applies default escaping and uses Content Security Policy headers to protect against Cross-Site Scripting (XSS).

---

## Infrastructure Security

### SEFAZ Communication Protocol

- **Mutual TLS (mTLS):** FiscalZen uses two-way SSL authentication with user-provided A1 certificates when communicating with SEFAZ endpoints, managed by `SefazClient` in `packages/sefaz-client`.
- **XML Digital Signing:** All outgoing requests and events are cryptographically signed using utilities in `packages/sefaz-client/src/signature.ts` to guarantee authenticity and integrity.

### Rate Limiting

- API requests are rate-limited via the `fastify-rate-limit` plugin to prevent abuse.
- SEFAZ “Consumo Indevido” (Rejection 656) responses cause the system to pause synchronization for affected CNPJs by marking `nsu_control` as `rate_limited`.
- Synchronization resumes after 60 minutes based on `calculateNextSyncTime`.

---

## Compliance Standards

### LGPD (Brazilian Data Protection Law)

- **Strict Access Controls:** Tenants can only access their data enforced through tenant-scoped queries and checks.
- **Audit Logging:** All critical actions (login, certificate upload, document deletion) are recorded in the `audit_logs` table, including metadata such as timestamps, user IDs, and IP addresses.
- **Data Portability:** Users maintain ownership and can export XML documents through APIs or direct access to S3 storage.

### Fiscal Document Retention

- XML documents are stored in original byte stream form, preserving legal digital signatures and document validity.
- Retention policies on S3-compatible storage keep data for at least 5 years in compliance with Brazilian fiscal regulations.

---

## Incident Response Procedure

In the event of a security incident, FiscalZen provides the following measures:

1. **Tenant Suspension:** Set `tenants.status` to `suspended` in the database to immediately block tenant access.
2. **Session Invalidation:** Rotate `JWT_SECRET` to revoke all active tokens and force user reauthentication.
3. **Forensics:** Use `audit_logs` and Fastify JSON logs to trace and analyze the breach scope and entry vectors.

---

## Recommendations for Developers

- Secure all sensitive environment variables with restricted access.
- Monitor API usage and NSU synchronization states regularly for anomalies.
- Verify strict tenant-scoped authorization when developing new features.
- Always encrypt sensitive data both in transit (TLS) and at rest.
- Ensure audit trails cover any new operations affecting sensitive fiscal or user data.

---

## Related Files & Modules

- **Authentication Utilities:** [`apps/api/src/utils/auth.ts`](apps/api/src/utils/auth.ts)
- **Certificate Encryption & Handling:** [`packages/sefaz-client/src/certificate.ts`](packages/sefaz-client/src/certificate.ts)
- **XML Signing Utilities:** [`packages/sefaz-client/src/signature.ts`](packages/sefaz-client/src/signature.ts)
- **SEFAZ Client Implementation:** [`packages/sefaz-client/src/client.ts`](packages/sefaz-client/src/client.ts)
- **Rate Limiting Setup:** Configured in API server with `fastify-rate-limit`
- **API Request Validation:** Located in [`apps/api/src/modules/*/schemas.ts`](apps/api/src/modules/)
- **Audit Logging Schema:** [`packages/database/src/schema/audit.ts`](packages/database/src/schema/audit.ts)

---

By following the security protocols and using the provided utilities and schemas, developers can help keep FiscalZen a secure, compliant platform for managing fiscal documents and sensitive tenant data.
