---
name: Bug Investigation
description: Guia para investigação sistemática de bugs e comportamentos inesperados
---

# Bug Investigation Skill Playbook

## When to Use
Use this skill when investigating bugs or unexpected behaviors within the FiscalZen project. Activation is necessary when users report issues in any fiscal document processing, SEFAZ integrations, or error management.

## Instructions
1. **Reproduce**  
   - Gather the exact steps to reproduce the issue.  
   - Identify the environment where the bug occurred (e.g., OS, version, configuration).  
   - If possible, create a minimal reproduction case that isolates the problem.

2. **Isolate**  
   - Perform a binary search through the codebase or commits to locate where the bug may have been introduced.  
   - Disable certain features to narrow down the scope of the problem.  
   - Check if the issue persists in an isolated environment or under different configurations.

3. **Understand**  
   - Thoroughly read the relevant sections of code. For instance, review `packages/sefaz-client/src/soap-client.ts` for SOAP communication issues.  
   - Check recent changes using `git log` or `git blame` to identify modifications made close to when the bug was reported.  
   - Review related tests and their coverage in `apps/api/tests`.

4. **Hypothesize**  
   - Formulate theories regarding the root cause of the bug, using insights from the code review and reproduction steps.  
   - Rank these hypotheses by likelihood and feasibility.  
   - Design tests targeted at each hypothesis, especially focusing on errors like `SefazError` in `packages/sefaz-client/src/types.ts`.

5. **Verify**  
   - Add logging or debugging information to gather more context on the bug's occurrence during reproduction.  
   - Write a test that fails under the original conditions to ensure the issue is correctly identified.  
   - Confirm that the fix effectively addresses the root cause without introducing new issues.

## Examples
### Example 1: SOAP Client Timeout Issue
```markdown
## Bug: SOAP Client Timeout Error

### Symptoms
Users report that the application fails to connect to the SEFAZ server, throwing a `TimeoutError`.

### Root Cause
The `SoapClient` was not handling network retries correctly, causing requests to fail on transient network issues.

### Fix
Updated the `SoapClient` to implement exponential backoff retries for network requests.

### Prevention
Implemented logging and monitoring around the `SoapClient` connections to detect and alert on future timeouts.
```

### Example 2: Missing Error Handling
```markdown
## Bug: Missing Error Handling in API

### Symptoms
The application crashes when the API receives an invalid document, but no explicit error message is returned to the user.

### Root Cause
No validation checks were present in `apps/web/lib/api.ts` to manage the response from `sefaz-client` effectively when invalid data is processed.

### Fix
Introduced validation that returns a `ValidationError` when bad data formats are identified.

### Prevention
Incorporated automated tests within `apps/api/tests` to cover edge cases for document submission.
```

## Guidelines
- Consistently log enough context to understand the issue during the debugging phase.
- Use binary search efficiently to identify the commit where the bug was introduced.
- Ensure to reproduce the bug in the same environment as reported.
- Always create tests that cover both the original issue and any new functionality introduced during the fix.
- Maintain thorough documentation on the investigations, findings, and solutions to enhance future debugging efforts within the FiscalZen project.