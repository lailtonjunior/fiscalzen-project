# Bug Fixer Agent Playbook

## Mission
To provide rapid, reliable, and regression-proof resolutions to issues across the FiscalZen monorepo. The bug-fixer specializes in navigating the complexities of Brazilian SEFAZ integrations, XML parsing, and distributed job processing.

## Core Responsibilities
- **Log & Error Analysis**: Deciphering `SefazError`, `SoapClient` failures, and API stack traces.
- **Root Cause Identification**: Distinguishing between external service outages (SEFAZ), parsing errors, or internal logic flaws.
- **Regression Testing**: Creating automated tests to ensure bugs never return.
- **Targeted Patching**: Implementing fixes that respect the multi-tenant architecture and encryption requirements.

---

## 🛠 Targeted File Areas

### 1. SEFAZ Integration & SOAP Issues
When dealing with connection timeouts or "Rejeição" errors:
- **Service Logic**: `packages\sefaz-client\src\services\` (NFe, CTe, MDFe distribution).
- **Client Config**: `packages\sefaz-client\src\soap-client.ts` and `constants\endpoints.ts`.
- **Error Types**: `packages\sefaz-client\src\types.ts` (Check `SefazError`, `CertificadoError`).

### 2. XML Parsing & Data Extraction
When data appears incorrectly in the UI or database:
- **Parsers**: `packages\xml-parser\src\parsers\`
- **Utilities**: `packages\xml-parser\src\utils.ts` (Date/Decimal parsing).
- **Test Fixtures**: `packages\xml-parser\tests\fixtures\` (Essential for reproduction).

### 3. Background Jobs & Sync Logic
When documents are missing or NSU sync is stuck:
- **Monitor Jobs**: `apps\api\src\jobs\sefaz-monitor.ts` and `nfse-monitor.ts`.
- **Queue Management**: `apps\api\src\jobs\queues.ts`.
- **NSU Control**: `packages\database\src\schema\nsu-control.ts` (Logic for `calculateNextSyncTime`).

### 4. API & Validation
When requests return 4xx/5xx errors:
- **Error Helpers**: `apps\api\src\utils\errors.ts`.
- **Shared Validators**: `packages\shared\src\validators\` (CNPJ, CPF, Chave de Acesso).
- **Response Handling**: `apps\api\src\utils\response.ts`.

---

## 🔄 Bug-Fixing Workflow

### Phase 1: Triage & reproduction
1.  **Identify the Layer**: Determine if the bug is in the Client (Web), API, or a Package.
2.  **Locate the Error Class**: Search the codebase for the specific error message to find where it's thrown (e.g., search for `ExternalServiceError`).
3.  **Create a Reproduction Case**:
    - For **XML errors**: Add the problematic XML to `packages\xml-parser\tests\fixtures` and create a test in `parsers.test.ts`.
    - For **API errors**: Use `apps\api\tests` to simulate the failing request.
    - For **SEFAZ errors**: Mock the SOAP response in `packages\sefaz-client\tests\soap-client.test.ts`.

### Phase 2: Analysis
- **Check Encryption**: If data is corrupted, verify `apps\api\src\utils\encryption.ts` usage (especially for certificates).
- **Verify Schema**: Check `packages\database\src\schema\` for missing fields or incorrect types.
- **Validate NSU Sequence**: If sync is failing, check the `nsu_control` table via the `NsuControl` model logic.

### Phase 3: Implementation
1.  **Apply the Fix**: Ensure you use the existing error classes (e.g., `throw new NotFoundError(...)`).
2.  **Maintain Shared Logic**: If the fix involves formatting or validation, apply it in `packages/shared` or `packages/xml-parser`.
3.  **Update Types**: If the database schema changes, ensure `packages\shared\src\types` are synchronized.

---

## 📏 Best Practices & Conventions

### Error Handling
- **Do not use generic `Error`**: Always use specific classes like `SefazError`, `ValidationError`, or `UnauthorizedError`.
- **Context is King**: When throwing errors in jobs, include the `companyId` and `documentChave` in the log context.

### XML Handling
- **Immutability**: Never modify the raw XML string. Use the parser to get an object, modify the object, and re-serialize if necessary.
- **Null Safety**: Use `ensureArray` from `xml-parser/utils.ts` when dealing with XML nodes that might contain one or multiple items.

### Database Interaction
- **Tenant Isolation**: Always include `tenantId` in queries to prevent data leakage between customers.
- **NSU Handling**: Use `incrementNsu` and `formatNsu` from `nsu-control.ts` to maintain consistency with SEFAZ standards (15-digit padding).

---

## 🗂 Key Directory Purposes

- `apps/api`: Fastify-based backend. Handles routing and business orchestration.
- `apps/web`: Next.js frontend. Focus here for UI bugs or hook issues.
- `packages/sefaz-client`: Low-level SOAP communication with government servers.
- `packages/xml-parser`: Logic for converting complex Brazilian XMLs into JS objects.
- `packages/database`: Drizzle schema definitions and database client setup.
- `packages/shared`: The "Source of Truth" for validation logic (CNPJ/CPF) and TypeScript interfaces.

---

## 🧪 Testing Checkpoints

- [ ] Does `npm test` pass in the affected package?
- [ ] If an API change was made, was the `PaginatedResponse` type updated?
- [ ] If a SEFAZ endpoint changed, was it updated in `packages\sefaz-client\src\constants\endpoints.ts`?
- [ ] Does the fix handle "Ambiente de Homologação" vs "Produção" correctly?
- [ ] Is the fix covered by a fixture-based test in `packages\xml-parser\tests`?
