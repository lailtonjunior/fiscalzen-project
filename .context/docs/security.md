# Security & Compliance

This document outlines the security architecture, data protection measures, and compliance standards implemented in the FiscalZen platform.

## Authentication & Authorization

### JWT Authentication

The system implements stateless authentication using JSON Web Tokens (JWT). All requests to protected resources must include a valid Bearer token.

**Configuration**:
- `JWT_SECRET`: Minimum 32-character random string (stored in Environment Variables).
- `JWT_EXPIRES_IN`: Default is `1d`.

**Token Payload**:
```typescript
interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

### Authorization Model

FiscalZen uses a strict multi-tenancy model. Authorization is enforced at several levels:

1.  **Route Level**: Middleware verifies the JWT signature and expiration.
2.  **Tenant Level**: The `tenantId` is extracted from the JWT and used as a mandatory filter in all database queries.
3.  **Ownership Level**: Operations on specific entities (e.g., updating a company or viewing a document) verify that the resource belongs to the active `tenantId`.

**Example Pattern**:
```typescript
// apps/api/src/utils/auth.ts
export async function verifyCompanyAccess(tenantId: string, companyId: string) {
  const company = await db.query.companies.findFirst({
    where: and(
      eq(companies.id, companyId),
      eq(companies.tenantId, tenantId)
    ),
  });
  if (!company) throw new ForbiddenError('Access denied to this company');
  return company;
}
```

## Secrets & Sensitive Data

### Encryption at Rest

Sensitive information, specifically **Certificado Digital A1 (PFX)**, is never stored in plain text.

1.  **Algorithm**: AES-256-GCM.
2.  **Key Management**: Uses a `CERT_ENCRYPTION_KEY` (32 bytes / 64 hex chars) defined in the environment variables.
3.  **Process**:
    *   When a certificate is uploaded, the API encrypts the buffer.
    *   The encrypted string is stored in the database in the format `iv:authTag:encryptedContent`.
    *   The certificate password is **never** stored; it must be provided by the user/agent when performing SEFAZ operations and is kept only in memory during the request.

### Sensitive Environment Variables

| Variable | Purpose | Security Note |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection | Contains credentials; must be restricted to VPC. |
| `JWT_SECRET` | Token Signing | Rotated periodically. |
| `CERT_ENCRYPTION_KEY` | PFX Encryption | Critical; loss means certificates cannot be decrypted. |
| `S3_SECRET_KEY` | XML Storage | Used for MinIO/S3 access. |

## Data Protection

### Multi-tenant Isolation

Data isolation is guaranteed at the application layer through the Drizzle ORM.

*   **Database Schema**: Almost all tables (documents, companies, audit_logs, jobs) contain a `tenant_id` column.
*   **Query Safety**: Developers must include `eq(table.tenantId, ctx.tenantId)` in all `where` clauses.
*   **Indices**: Composite indices on `(tenant_id, id)` ensure performant and secure lookups.

### Validation & Sanitization

*   **Input Validation**: Every API endpoint uses **Zod** schemas to validate structure and types, preventing injection of malformed data.
*   **SQL Injection**: Prevented by using Drizzle ORM's parameterized queries.
*   **XSS Protection**: The React frontend (Next.js) automatically escapes content. Content Security Policy (CSP) headers are enabled.

## Infrastructure Security

### SEFAZ Communication

*   **Mutual TLS (mTLS)**: Communication with SEFAZ (Secretaria da Fazenda) uses the client's A1 certificate for two-way SSL authentication.
*   **Signature**: Outgoing XML messages (Manifestação, etc.) are signed using the `sefaz-client` package with the user's private key.

### Rate Limiting

To prevent abuse and comply with external provider limits:

1.  **API Level**: Configured via `fastify-rate-limit` (default 100 requests per minute per IP).
2.  **SEFAZ Level**: The system monitors "Consumo Indevido" (Rejection 656). If SEFAZ returns a rate limit error, the `nsu_control` status is set to `rate_limited` and syncing is paused for the specific CNPJ for 60 minutes.

## Compliance

### LGPD (Brazil Data Protection Law)

*   **Access Control**: Users can only see data from their own Organization/Tenant.
*   **Audit Logging**: Critical actions (login, certificate upload, document deletion) are logged in the `audit_logs` table, recording the timestamp, user ID, IP address, and action performed.
*   **Data Portability**: Users can export their XML files at any time through the S3 storage interface or API.

### Fiscal Requirements

*   **XML Integrity**: The system stores the original XML as received from SEFAZ/City Halls to ensure legal validity.
*   **Storage Duration**: Documents are stored in S3-compatible storage designed for long-term retention (minimum 5 years as required by Brazilian law).

## Incident Response

In case of a suspected security breach:

1.  **Isolation**: The affected `tenantId` can be suspended via the database `tenants.status` field.
2.  **Credential Rotation**: Reset the `JWT_SECRET` to invalidate all active sessions.
3.  **Logs**: Analyze the `audit_logs` and Fastify application logs (stored in JSON format for easy parsing) to identify the scope of the breach.
