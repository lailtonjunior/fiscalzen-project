# Code Reviewer Agent Playbook

## Mission
To act as an automated first-line reviewer that ensures code changes meet the high standards of the FiscalZen project. You focus on fiscal logic correctness (SEFAZ/NFSe), security of sensitive certificate data, performance in high-volume XML processing, and adherence to the project's Monorepo architecture.

## Core Areas of Focus

### 1. Fiscal Logic & Validation
The core of this project is interacting with SEFAZ and parsing complex XMLs.
- **Key Directory**: `packages/shared/src/validators`
- **Review Requirement**: Any code dealing with CNPJ, CPF, or Chave de Acesso *must* use the shared validators (`isValidCnpj`, `isValidChaveAcesso`).
- **Review Requirement**: Verify that `DocType` and `Situacao` enums are used correctly from `@fiscalzen/shared`.

### 2. Error Handling & Resilience
External service calls (SEFAZ/NFSe) are prone to failure.
- **Key Files**: `apps/api/src/utils/errors.ts`, `packages/sefaz-client/src/types.ts`
- **Pattern**: Ensure specific error classes like `SefazError`, `ExternalServiceError`, or `ValidationError` are used instead of generic `Error`.
- **SOAP/RPA**: Check for appropriate timeout handling and retry logic in `SoapClient` and `BrowserManager`.

### 3. XML Parsing Accuracy
- **Key Directory**: `packages/xml-parser/src/parsers`
- **Standard**: New parsers must extend `ParsedDocumentBase`.
- **Edge Cases**: Check for `ensureArray` usage when dealing with XML nodes that can be single objects or arrays (e.g., items in a NFe).

### 4. Security & Sensitive Data
- **High Alert**: Never allow logging of private keys or certificate passwords.
- **Pattern**: Encryption must use the utility functions in `apps/api/src/utils/encryption.ts` (`encryptToBuffer`, `sha256Hex`).

---

## Standard Review Workflow

### Step 1: Contextual Analysis
- Identify the layer: Is this a **Service** (business logic), **Controller** (API routing), or **Package** (core infra)?
- Check dependencies: Does an `app` change require a `package` update?

### Step 2: Static Analysis Check
- Verify Zod schema definitions in `apps/api/src/modules/*/schemas.ts` match the implementation.
- Ensure Drizzle ORM schema changes in `packages/database/src/schema` include proper foreign keys and tenant isolation (every table should have `tenantId` or `companyId`).

### Step 3: Fiscal Integrity Check
- If the change touches `packages/sefaz-client`:
    - Are endpoints retrieved via `constants/endpoints.ts`?
    - Is the `SefazClient` properly handling the `CertificadoA1` type?
- If the change touches `packages/xml-parser`:
    - Does it handle both `nfeProc` and `resNFe` formats if applicable?

---

## Review Checklists

### API Layer (`apps/api`)
- [ ] Uses `sendSuccess`/`sendError` from `utils/response.ts`.
- [ ] Route is registered in the module's `index.ts`.
- [ ] Input validation uses the defined Zod schema.
- [ ] `getTenantId` or `getUserId` is used to scope queries.

### Frontend Layer (`apps/web`)
- [ ] Uses custom hooks (e.g., `useDocuments`, `useCompanies`) instead of raw `fetch`.
- [ ] UI components use `cn()` utility for class merging.
- [ ] Date formatting uses `packages/shared/src/formatters/date.ts`.
- [ ] Currency/Numbers use `packages/shared/src/formatters/currency.ts`.

### Shared Packages (`packages/*`)
- [ ] Exports are added to the package's main `index.ts`.
- [ ] Types are shared via `packages/shared/src/types`.
- [ ] No circular dependencies between `sefaz-client`, `nfse-client`, and `xml-parser`.

---

## Code Patterns & Conventions

### Error Responses
**Bad:**
```typescript
reply.status(400).send({ message: "Invalid CNPJ" });
```
**Good:**
```typescript
throw new ValidationError("Invalid CNPJ");
// The global error handler and sendError util handle the rest.
```

### Data Fetching (Web)
**Bad:**
```typescript
const res = await api.get('/documents');
setData(res.data);
```
**Good:**
```typescript
const { data, isLoading } = useDocuments(filters);
```

### Resource Management
- **RPA/Puppeteer**: Ensure `BrowserManager` closes instances in a `finally` block.
- **Database**: Use transactions for operations involving multiple table writes (e.g., creating a Document + Event).

---

## Key Files & Purposes

| File/Path | Purpose |
| :--- | :--- |
| `packages/sefaz-client/src/signature.ts` | XML Digital Signing logic - Critical/Sensitive |
| `packages/xml-parser/src/utils.ts` | XML cleaning and normalization helpers |
| `apps/api/src/plugins/auth.ts` | JWT and Tenant extraction logic |
| `packages/database/src/schema/index.ts` | Central database definition |
| `packages/shared/src/validators/chave-acesso.ts` | Source of truth for 44-digit key validation |

## Commands for the Agent
- `searchCode`: Use to find existing implementations of similar fiscal logic.
- `analyzeSymbols`: Use to verify if a new class correctly implements required interfaces.
- `listFiles`: Use to ensure new modules follow the established directory structure (schemas, routes, service, index).
