# Bug Investigation Skill Playbook

## When to Use
Activate this skill when investigating defects, failures, or unexpected behaviors reported in the FiscalZen platform. This includes issues related to fiscal document processing, communication with SEFAZ and municipal service providers (through `sefaz-client` and `nfse-client` packages), data parsing errors in `xml-parser`, API request failures, and UI inconsistencies in the web frontend. Bug investigation is critical when user reports, automated tests, or monitoring alerts reveal problems that impair the correct handling of electronic fiscal documents like NFe, NFSe, or NFSe events.

## Instructions
1. **Reproduce the Issue**  
   - Collect detailed reproduction steps from bug reports or logs.  
   - Confirm the environment where the issue occurs (e.g., API version in `apps/api`, frontend build in `apps/web`, backend Node.js version, or OS details).  
   - Attempt to replicate the problem locally or in a similarly configured test environment to isolate behavior.

2. **Identify the Scope and Affected Components**  
   - Map the reported bug to the relevant module or package:  
     - SEFAZ integrations → `packages/sefaz-client` (pay attention to files like `soap-client.ts`, `client.ts`)  
     - Municipal NFSe providers → `packages/nfse-client` (inspect RPA scrapers and adapter files)  
     - XML parsing issues → `packages/xml-parser` (notably `parsers/nfse.ts`, `types.ts`)  
     - API-related issues → `apps/api/src/utils/errors.ts`, `apps/web/lib/api.ts`  
   - Check related error types such as `SefazError`, `TimeoutError`, `ApiClientError`, or domain errors (`ValidationError`, `NotFoundError`).

3. **Analyze Recent Changes and Logs**  
   - Use `git log`, `git blame`, and diff tools on suspect files near the bug report date to catch possible regressions or faulty fixes.  
   - Review runtime logs (in `apps/web/lib/logger.ts` or backend logs) to extract error context and stack traces.  
   - Examine coverage and test results in `apps/api/tests` or package-specific test folders to see if edge cases were missed.

4. **Formulate Hypotheses and Investigate Root Causes**  
   - Propose potential causes based on observations, e.g., network timeout handling in `SoapClient`, authorization errors from `apps/api/src/utils/errors.ts`, or malformed XML input in `xml-parser`.  
   - Validate these by inspecting code logic, adding targeted debug logs, or temporarily modifying code to isolate behavior.  
   - Use breakpoints or runtime debug tools when necessary.

5. **Verify and Validate the Fix**  
   - After identifying and implementing the fix, reproduce the original bug to confirm it no longer occurs.  
   - Write new or extend existing automated tests to cover the specific scenario, ensuring no regression (e.g., add tests in `apps/api/tests` or `packages/sefaz-client/tests`).  
   - Run full test suite and validation tools consistent with FiscalZen practices.  
   - Confirm monitored endpoints or workflows behave correctly in staging before deployment.

6. **Document the Investigation**  
   - Record the bug symptoms, root cause, fix details, and prevention steps in the project’s issue tracker or internal documentation.  
   - Reference any related errors or modules (e.g., `SefazError` in `packages/sefaz-client/src/types.ts`, `BrowserManager` in `nfse-client`) to aid future debugging.


## Examples

### Example 1: Investigating a `TimeoutError` in SEFAZ SOAP Client
```markdown
## Bug: API requests to SEFAZ intermittently fail with TimeoutError

### Step 1: Reproduce
- Confirmed failures occur during NF-e document distribution in the test environment.
- Steps replicated using local instance calling `SefazClient.distribute()`.

### Step 2: Analyze
- Checked `packages/sefaz-client/src/soap-client.ts`: timeout settings are low and no retry on network glitches.
- Logs from `apps/web/lib/logger.ts` showed network latency spikes causing occasional timeouts.

### Step 3: Hypothesis
- Network instability requires exponential backoff retry logic in `SoapClient`.

### Step 4: Fix
- Added retry with backoff in `SoapClient.request()`.
- Increased timeout threshold slightly.

### Step 5: Verify
- Re-ran repro steps; no timeout errors encountered after the fix.
- Added unit tests simulating timeout retries in `packages/sefaz-client/tests`.

### Step 6: Document
- Updated issue tracker with root cause and remediation steps.
```

### Example 2: Handling Missing Validation Causing API Crash
```markdown
## Bug: API crashes on submission of invalid NFSe XML data

### Step 1: Reproduce
- User submits malformed NFSe XML through the frontend form in `apps/web`.
- Backend API returns 500 error and crashes.

### Step 2: Scope
- Investigation points to `apps/web/lib/api.ts` where response handling from NFSe client lacks validation.
- Related types in `packages/nfse-client/src/types.ts` expected validation but was missing.

### Step 3: Hypothesis
- Missing input validation for NFSe document schema in the API layer leads to unhandled exceptions.

### Step 4: Fix
- Implemented validation with `ValidationError` when schema mismatch occurs.
- Added error catching in API client and frontend to display user-friendly messages.

### Step 5: Verify
- Tests added in `apps/api/tests` and manual frontend submission pass or return appropriate errors with no crashes.

### Step 6: Document
- Documented error handling pattern for NFSe submissions in developer docs.
```

## Guidelines
- Always reproduce bugs in an environment matching the user's setup as closely as possible to avoid environment-specific false leads.  
- Use the modular monorepo understanding to narrow down files before diving deep (e.g., if bug involves municipal services, focus on `nfse-client` adapters and scrapers).  
- Leverage existing error classes like `SefazError`, `ApiClientError`, and `ValidationError` to standardize error detection and handling.  
- Use thorough logging with correlation IDs when possible, as implemented in `apps/web/lib/logger.ts` and backend logs, to trace complex workflows.  
- Create or extend automated tests replicating the bug scenario to prevent regressions, placing them in their respective app or package test folders.  
- Document every bug investigation fully, referencing code files and error types, to build a knowledge-base for the team and AI agents to learn from.  
- Rely on stable utilities within `shared` packages for validation, certificate loading (`certificate.ts` in `sefaz-client`), and XML parsing to avoid inconsistent fixes.  
- Use version control tools (`git blame`, `git log`) extensively to relate regressions to code changes, especially in critical modules like `soap-client.ts` or `abrasf/client.ts`.

This structured bug investigation approach enables precise, efficient, and reproducible root cause analysis and fixes in the FiscalZen complex fiscal document ecosystem.
