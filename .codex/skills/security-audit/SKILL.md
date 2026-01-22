---
name: Security Audit
description: Auditoria de segurança focando em OWASP Top 10 e boas práticas
---

# Security Audit

## When to Use
Activate this skill when conducting security reviews or performing security audits on the FiscalZen codebase. It is essential to ensure that software components comply with security best practices, especially concerning the OWASP Top 10 vulnerabilities, input validation, and authentication/authorization protocols.

## Instructions
1. **Gather Code Components**: Identify the files to be audited, focusing on the authorization and input handling logic.
   - Key files include:
     - `apps/api/src/plugins/auth.ts`
     - `apps/api/src/utils/errors.ts`
     - `packages/nfse-client/src/types.ts`
2. **Review Authentication Mechanisms**: Check the implementation of JWT tokens and user authentication flows.
   - Example: Verify if `generateToken` method in `auth.ts` properly generates secure tokens.
3. **Analyze for Common Vulnerabilities**:
   - Use the OWASP Top 10 checklist to methodically analyze each security aspect.
   - Assess input validation in `apps/api/src/plugins/auth.ts` for potential injection flaws.
4. **Evaluate Access Control**: Ensure that authorization checks are implemented effectively. Confirm that functions like `getUserId` and `getTenantId` have appropriate validations.
5. **Document Findings**: Record any vulnerabilities or security lapses discovered during the audit using the provided report format.

## Examples
```markdown
## Security Audit: Authentication Module

### Scope
The audit focused on the authentication module located in `apps/api/src/plugins/auth.ts`.

### Findings
| ID | Severity | Issue                                                        | Remediation                                               |
|----|----------|-------------------------------------------------------------|----------------------------------------------------------|
| S1 | Critical | JWT tokens not being invalidated on user logout             | Implement token invalidation logic in the `authPlugin`   |
| S2 | High     | Input validation missing for `getUserId`                   | Add input validation to ensure valid tenant/user IDs     |

### Recommendations
1. Ensure that JWT token invalidation is implemented correctly.
2. Conduct regular vulnerability scans on dependencies.
```

## Guidelines
- **Use Secure Password Hashing**: Always hash passwords using secure algorithms like bcrypt or argon2 when storing them.
- **Implement Multi-Factor Authentication (MFA)**: Enhance security by enabling MFA for sensitive operations, especially related to fiscal data.
- **Secure APIs with Authorization Checks**: Ensure every request has proper authorization checks to prevent unauthorized access.
- **Use HTTPS for Data in Transit**: Always encrypt data in transit using TLS to protect against eavesdropping.
- **Maintain an Updated Dependency List**: Regularly check and update dependencies to mitigate risks from known vulnerabilities. Utilize a Software Bill of Materials (SBOM) for tracking.
- **Enable Logging and Monitoring**: Ensure documented security events are logged and sensitive data is not exposed in logs. Implement alerting mechanisms to catch potential security threats early.