---
status: unfilled
generated: 2026-01-18
---

# Data Flow & Integrations

Explain how data enters, moves through, and exits the system, including interactions with external services.

## Module Dependencies
- **packages\xml-parser\tests\parsers.test.ts/** → `packages\xml-parser\src\detector.ts`, `packages\xml-parser\src\gzip.ts`, `packages\xml-parser\src\parsers\nfe.ts`, `packages\xml-parser\src\parsers\proc-evento.ts`, `packages\xml-parser\src\parsers\res-evento.ts`, `packages\xml-parser\src\parsers\res-nfe.ts`
- **packages\xml-parser\src\gzip.ts/** → `packages\xml-parser\src\types.ts`
- **packages\xml-parser\src\detector.ts/** → `packages\xml-parser\src\types.ts`
- **packages\sefaz-client\tests\types.test.ts/** → `packages\sefaz-client\src\constants.ts`, `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\tests\soap-client.test.ts/** → `packages\sefaz-client\src\soap-client.ts`
- **packages\sefaz-client\tests\signature.test.ts/** → `packages\sefaz-client\src\signature.ts`
- **packages\sefaz-client\tests\services.test.ts/** → `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\tests\endpoints.test.ts/** → `packages\sefaz-client\src\constants\endpoints.ts`
- **packages\sefaz-client\src\soap-client.ts/** → `packages\sefaz-client\src\certificate.ts`, `packages\sefaz-client\src\constants\endpoints.ts`, `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\src\signature.ts/** → `packages\sefaz-client\src\certificate.ts`, `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\src\constants.ts/** → `packages\sefaz-client\src\constants\endpoints.ts`
- **packages\sefaz-client\src\client.ts/** → `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\src\certificate.ts/** → `packages\sefaz-client\src\types.ts`
- **packages\nfse-client\src\registry.ts/** → `packages\nfse-client\src\types.ts`
- **packages\nfse-client\src\factory.ts/** → `packages\nfse-client\src\abrasf\client.ts`, `packages\nfse-client\src\abrasf\municipios\belo-horizonte.ts`, `packages\nfse-client\src\abrasf\municipios\rio-de-janeiro.ts`, `packages\nfse-client\src\abrasf\municipios\sao-paulo.ts`, `packages\nfse-client\src\registry.ts`, `packages\nfse-client\src\rpa\base-scraper.ts`, `packages\nfse-client\src\types.ts`
- **packages\database\src\seed.ts/** → `packages\database\src\client.ts`, `packages\database\src\schema\index.ts`
- **packages\database\src\client.ts/** → `packages\database\src\schema\index.ts`
- **apps\api\test\encryption.test.ts/** → `apps\api\src\utils\encryption.ts`
- **apps\api\src\index.ts/** → `apps\api\src\app.ts`, `apps\api\src\config\database.ts`, `apps\api\src\config\env.ts`, `apps\api\src\config\meilisearch.ts`, `apps\api\src\config\redis.ts`, `apps\api\src\jobs\index.ts`
- **apps\api\src\app.ts/** → `apps\api\src\config\env.ts`, `apps\api\src\modules\agents\index.ts`, `apps\api\src\modules\companies\index.ts`, `apps\api\src\modules\dashboard\index.ts`, `apps\api\src\modules\documents\index.ts`, `apps\api\src\modules\events\index.ts`, `apps\api\src\modules\jobs\index.ts`, `apps\api\src\modules\manifestacao\index.ts`, `apps\api\src\modules\nfse\index.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\plugins\cors.ts`, `apps\api\src\plugins\rate-limit.ts`, `apps\api\src\utils\errors.ts`, `apps\api\src\utils\response.ts`
- **packages\xml-parser\src\parsers\sat.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\res-nfe.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\res-evento.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\proc-evento.ts/** → `packages\xml-parser\src\parsers\res-evento.ts`, `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\nfse.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\nfe.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\nfce.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\mdfe.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\cte.ts/** → `packages\xml-parser\src\types.ts`, `packages\xml-parser\src\utils.ts`
- **packages\xml-parser\src\parsers\auto.ts/** → `packages\xml-parser\src\detector.ts`, `packages\xml-parser\src\parsers\cte.ts`, `packages\xml-parser\src\parsers\mdfe.ts`, `packages\xml-parser\src\parsers\nfce.ts`, `packages\xml-parser\src\parsers\nfe.ts`, `packages\xml-parser\src\parsers\nfse.ts`, `packages\xml-parser\src\parsers\sat.ts`
- **packages\shared\src\formatters\document.ts/** → `packages\shared\src\types\documents.ts`
- **packages\shared\src\constants\situacoes.ts/** → `packages\shared\src\types\documents.ts`
- **packages\shared\src\constants\doc-types.ts/** → `packages\shared\src\types\documents.ts`
- **packages\sefaz-client\src\services\nfe-distdfe.ts/** → `packages\sefaz-client\src\constants.ts`, `packages\sefaz-client\src\constants\endpoints.ts`, `packages\sefaz-client\src\soap-client.ts`, `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\src\services\mdfe-distdfe.ts/** → `packages\sefaz-client\src\constants.ts`, `packages\sefaz-client\src\constants\endpoints.ts`, `packages\sefaz-client\src\soap-client.ts`, `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\src\services\manifestacao.ts/** → `packages\sefaz-client\src\constants.ts`, `packages\sefaz-client\src\constants\endpoints.ts`, `packages\sefaz-client\src\signature.ts`, `packages\sefaz-client\src\soap-client.ts`, `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\src\services\cte-distdfe.ts/** → `packages\sefaz-client\src\constants.ts`, `packages\sefaz-client\src\constants\endpoints.ts`, `packages\sefaz-client\src\soap-client.ts`, `packages\sefaz-client\src\types.ts`
- **packages\sefaz-client\src\constants\endpoints.ts/** → `packages\sefaz-client\src\types.ts`
- **packages\nfse-client\src\rpa\base-scraper.ts/** → `packages\nfse-client\src\types.ts`
- **packages\nfse-client\src\abrasf\client.ts/** → `packages\nfse-client\src\types.ts`
- **packages\database\src\schema\nsu-control.ts/** → `packages\database\src\schema\tenants.ts`
- **packages\database\src\schema\nfse-configs.ts/** → `packages\database\src\schema\companies.ts`
- **packages\database\src\schema\documents.ts/** → `packages\database\src\schema\tenants.ts`
- **packages\database\src\schema\audit.ts/** → `packages\database\src\schema\tenants.ts`
- **packages\database\src\schema\agents.ts/** → `packages\database\src\schema\tenants.ts`
- **apps\web\lib\stores\filters.ts/** → `apps\web\lib\types.ts`
- **apps\web\lib\hooks\use-nfse.ts/** → `apps\web\lib\api.ts`, `apps\web\lib\types.ts`
- **apps\web\lib\hooks\use-manifestacao.ts/** → `apps\web\lib\api.ts`, `apps\web\lib\hooks\use-documents.ts`, `apps\web\lib\types.ts`
- **apps\web\lib\hooks\use-jobs.ts/** → `apps\web\lib\api.ts`, `apps\web\lib\types.ts`
- **apps\web\lib\hooks\use-documents.ts/** → `apps\web\lib\api.ts`, `apps\web\lib\types.ts`
- **apps\web\lib\hooks\use-dashboard.ts/** → `apps\web\lib\api.ts`, `apps\web\lib\types.ts`
- **apps\web\lib\hooks\use-companies.ts/** → `apps\web\lib\api.ts`, `apps\web\lib\types.ts`
- **apps\api\src\utils\response.ts/** → `apps\api\src\utils\errors.ts`
- **apps\api\src\services\storage.ts/** → `apps\api\src\config\env.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\services\search.ts/** → `apps\api\src\config\meilisearch.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\plugins\rate-limit.ts/** → `apps\api\src\config\env.ts`, `apps\api\src\config\redis.ts`
- **apps\api\src\plugins\cors.ts/** → `apps\api\src\config\env.ts`
- **apps\api\src\plugins\auth.ts/** → `apps\api\src\config\env.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\jobs\xml-processor.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\jobs\events.ts`, `apps\api\src\jobs\queues.ts`, `apps\api\src\services\storage.ts`
- **apps\api\src\jobs\workers.ts/** → `apps\api\src\config\redis.ts`, `apps\api\src\jobs\events.ts`, `apps\api\src\jobs\nfse-monitor.ts`, `apps\api\src\jobs\search-sync.ts`, `apps\api\src\jobs\sefaz-monitor.ts`, `apps\api\src\jobs\xml-processor.ts`
- **apps\api\src\jobs\sefaz-monitor.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\config\env.ts`, `apps\api\src\jobs\events.ts`, `apps\api\src\jobs\queues.ts`
- **apps\api\src\jobs\search-sync.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\jobs\events.ts`, `apps\api\src\jobs\queues.ts`, `apps\api\src\services\search.ts`
- **apps\api\src\jobs\scheduler.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\jobs\events.ts`, `apps\api\src\jobs\queues.ts`
- **apps\api\src\jobs\queues.ts/** → `apps\api\src\config\redis.ts`
- **apps\api\src\jobs\nfse-monitor.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\jobs\queues.ts`, `apps\api\src\utils\logger.ts`
- **apps\api\src\config\redis.ts/** → `apps\api\src\config\env.ts`
- **apps\api\src\config\meilisearch.ts/** → `apps\api\src\config\env.ts`
- **apps\api\src\config\database.ts/** → `apps\api\src\config\env.ts`
- **packages\nfse-client\src\rpa\municipios\template.ts/** → `packages\nfse-client\src\rpa\base-scraper.ts`, `packages\nfse-client\src\types.ts`
- **packages\nfse-client\src\abrasf\municipios\sao-paulo.ts/** → `packages\nfse-client\src\abrasf\client.ts`, `packages\nfse-client\src\types.ts`
- **packages\nfse-client\src\abrasf\municipios\rio-de-janeiro.ts/** → `packages\nfse-client\src\abrasf\client.ts`, `packages\nfse-client\src\types.ts`
- **packages\nfse-client\src\abrasf\municipios\belo-horizonte.ts/** → `packages\nfse-client\src\abrasf\client.ts`, `packages\nfse-client\src\types.ts`
- **apps\api\src\modules\nfse\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\jobs\queues.ts`, `apps\api\src\modules\nfse\schemas.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\modules\nfse\routes.ts/** → `apps\api\src\modules\nfse\schemas.ts`, `apps\api\src\modules\nfse\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\response.ts`
- **apps\api\src\modules\manifestacao\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\config\env.ts`, `apps\api\src\modules\manifestacao\schemas.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\modules\manifestacao\routes.ts/** → `apps\api\src\modules\manifestacao\schemas.ts`, `apps\api\src\modules\manifestacao\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\response.ts`
- **apps\api\src\modules\jobs\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\jobs\events.ts`, `apps\api\src\jobs\queues.ts`, `apps\api\src\jobs\scheduler.ts`, `apps\api\src\jobs\workers.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\modules\jobs\routes.ts/** → `apps\api\src\modules\jobs\schemas.ts`, `apps\api\src\modules\jobs\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\response.ts`
- **apps\api\src\modules\events\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\modules\events\schemas.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\modules\events\routes.ts/** → `apps\api\src\modules\events\schemas.ts`, `apps\api\src\modules\events\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\response.ts`
- **apps\api\src\modules\documents\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\modules\documents\schemas.ts`, `apps\api\src\services\search.ts`, `apps\api\src\services\storage.ts`, `apps\api\src\utils\encryption.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\modules\documents\routes.ts/** → `apps\api\src\modules\documents\schemas.ts`, `apps\api\src\modules\documents\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\errors.ts`, `apps\api\src\utils\response.ts`
- **apps\api\src\modules\dashboard\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\modules\dashboard\schemas.ts`
- **apps\api\src\modules\dashboard\routes.ts/** → `apps\api\src\modules\dashboard\schemas.ts`, `apps\api\src\modules\dashboard\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\response.ts`
- **apps\api\src\modules\companies\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\modules\companies\schemas.ts`, `apps\api\src\utils\encryption.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\modules\companies\routes.ts/** → `apps\api\src\modules\companies\schemas.ts`, `apps\api\src\modules\companies\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\errors.ts`, `apps\api\src\utils\response.ts`
- **apps\api\src\modules\agents\service.ts/** → `apps\api\src\config\database.ts`, `apps\api\src\config\redis.ts`, `apps\api\src\modules\agents\schemas.ts`, `apps\api\src\utils\errors.ts`
- **apps\api\src\modules\agents\routes.ts/** → `apps\api\src\modules\agents\schemas.ts`, `apps\api\src\modules\agents\service.ts`, `apps\api\src\plugins\auth.ts`, `apps\api\src\utils\errors.ts`, `apps\api\src\utils\response.ts`
- **apps\web\app\layout.tsx/** → `apps\web\app\globals.css`
- **packages\ui\src\components\textarea.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\tabs.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\switch.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\spinner.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\skeleton.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\separator.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\select.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\radio-group.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\progress.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\label.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\input.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\dropdown-menu.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\dialog.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\checkbox.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\card.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\button.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\badge.tsx/** → `packages\ui\src\lib\utils.ts`
- **packages\ui\src\components\alert.tsx/** → `packages\ui\src\lib\utils.ts`
- **apps\web\components\nfse\edit-nfse-dialog.tsx/** → `apps\web\components\nfse\nfse-config-form.tsx`
- **apps\web\components\nfse\add-municipio-dialog.tsx/** → `apps\web\components\nfse\municipio-selector.tsx`, `apps\web\components\nfse\nfse-config-form.tsx`
- **apps\web\components\manifestacao\pending-ciencia-table.tsx/** → `apps\web\components\manifestacao\batch-manifestacao-dialog.tsx`, `apps\web\components\manifestacao\manifestacao-badge.tsx`, `apps\web\components\manifestacao\resumo-modal.tsx`
- **apps\web\components\manifestacao\manifestacao-history-table.tsx/** → `apps\web\components\manifestacao\manifestacao-badge.tsx`
- **apps\web\components\manifestacao\awaiting-final-table.tsx/** → `apps\web\components\manifestacao\batch-manifestacao-dialog.tsx`, `apps\web\components\manifestacao\manifestacao-modal.tsx`

## Service Layer
- *No service classes detected.*

## High-level Flow

Summarize the primary pipeline from input to output. Reference diagrams or embed Mermaid definitions when available.

## Internal Movement

Describe how modules within `apply-next-dev-cache-fix.mjs`, `apps`, `Checklist de QA.pdf`, `clean-web-next-cache.mjs`, `docker`, `kill-port.mjs`, `mnt`, `package.json`, `packages`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `README.md`, `README.txt`, `tools`, `tsconfig.base.json`, `turbo.json` collaborate (queues, events, RPC calls, shared databases).

## External Integrations

Document each integration with purpose, authentication, payload shapes, and retry strategy.

## Observability & Failure Modes

Describe metrics, traces, or logs that monitor the flow. Note backoff, dead-letter, or compensating actions when downstream systems fail.
