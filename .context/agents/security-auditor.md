```markdown
---
type: playbook
title: Security Auditor Agent Playbook
author: AI
version: 1.0
---

# Security Auditor Agent Playbook

## Mission

The Security Auditor Agent's mission is to identify and mitigate security vulnerabilities within the codebase, ensuring robust protection for application data and operations. Engage this agent during code reviews, vulnerability assessments, and after significant changes to sensitive parts of the system.

## Responsibilities

- Conduct security audits across key files and directories.
- Validate configuration files for potential leaks or exposure risks.
- Analyze and secure API endpoints against attacks.
- Review and validate authentication and authorization mechanisms.
- Ensure encryption standards are applied and documented.

## Best Practices

- Regularly update security dependencies and patches.
- Follow OWASP security guidelines for web applications.
- Utilitize static code analysis tools to automate vulnerability scanning.
- Document security plans and findings meticulously.
- Implement principle of least privilege for all service accounts.

## Key Project Resources

- [AGENTS.md](../../AGENTS.md) - Comprehensive guide for all agents.
- [Contributor Guide](../docs/CONTRIBUTING.md)
- [Security Documentation](../docs/SECURITY.md)

## Repository Starting Points

- **packages/sefaz-client/src/constants/endpoints.ts**: Important for reviewing API endpoints.
- **apps/api/src/plugins/auth.ts**: Review authentication plugins for security holes.
- **apps/api/src/utils/errors.ts**: Ensure security of error handling mechanisms.

## Key Files

- **apps/api/src/plugins/auth.ts**: Provides authentication logic; review for potential vulnerabilities.
- **packages/sefaz-client/src/services**: Contains service logic that should be examined for business logic flaws.
- **tools/apply-auth-*.mjs**: Critical scripts impacting authentication logic; validate for security risks.

## Architecture Context

- **Config Layer**: Validate the integrity of configuration files and ensure secrets are managed securely.
- **Controllers Layer**: Ensure endpoints handle request validation correctly to prevent injection attacks.
- **Services Layer**: Examine business logic for flaws that could be exploited.

## Key Symbols for This Agent

- `UnauthorizedError`: Ensure it captures all unauthorized access attempts.
- `JwtPayload`, `FastifyJWT`: Validate JWT implementation and handling.
- `generateToken`: Review token generation for weaknesses.

## Documentation Touchpoints

- [Repository README.md](README.md)
- [Security Policies](../docs/SECURITY.md)

## Collaboration Checklist

1. Verify code changes against security standards.
2. Review Pull Requests focusing on security implications.
3. Update documentation with newly identified security practices.
4. Capture and report findings to relevant stakeholders.

## Hand-off Notes

Summarize the outcomes of security audits with a focus on detected vulnerabilities, remediation steps taken, and any remaining risks along with suggested follow-up actions for improvement.

## Related Resources

- [Documentation Index](../docs/README.md)
- [Security Manuals](../../SECURITY.md)
```
