---
name: Documentation Writer
description: Create clear, comprehensive documentation
status: unfilled
generated: 2026-01-18
---

# Documentation Writer Agent Playbook

## Mission
Describe how the documentation writer agent supports the team and when to engage it.

## Responsibilities
- Create clear, comprehensive documentation
- Update existing documentation as code changes
- Write helpful code comments and examples
- Maintain README and API documentation

## Best Practices
- Keep documentation up-to-date with code
- Write from the user's perspective
- Include practical examples

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Agent handbook: [agents/README.md](./README.md)
- Agent knowledge base: [AGENTS.md](../../AGENTS.md)
- Contributor guide: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Repository Starting Points
- `apps/` — TODO: Describe the purpose of this directory.
- `docker/` — TODO: Describe the purpose of this directory.
- `mnt/` — TODO: Describe the purpose of this directory.
- `packages/` — TODO: Describe the purpose of this directory.
- `tools/` — TODO: Describe the purpose of this directory.

## Key Files
**Entry Points:**
- [`packages\xml-parser\src\index.ts`](packages\xml-parser\src\index.ts)
- [`packages\ui\src\index.ts`](packages\ui\src\index.ts)
- [`packages\shared\src\index.ts`](packages\shared\src\index.ts)
- [`packages\nfse-client\src\index.ts`](packages\nfse-client\src\index.ts)
- [`packages\sefaz-client\src\index.ts`](packages\sefaz-client\src\index.ts)
- [`packages\database\src\index.ts`](packages\database\src\index.ts)
- [`apps\api\src\index.ts`](apps\api\src\index.ts)
- [`apps\api\src\app.ts`](apps\api\src\app.ts)
- [`packages\nfse-client\src\rpa\index.ts`](packages\nfse-client\src\rpa\index.ts)
- [`packages\database\src\schema\index.ts`](packages\database\src\schema\index.ts)
- [`apps\web\lib\stores\index.ts`](apps\web\lib\stores\index.ts)
- [`apps\web\lib\hooks\index.ts`](apps\web\lib\hooks\index.ts)
- [`apps\web\components\nfse\index.ts`](apps\web\components\nfse\index.ts)
- [`apps\web\components\manifestacao\index.ts`](apps\web\components\manifestacao\index.ts)
- [`apps\web\components\layout\index.ts`](apps\web\components\layout\index.ts)
- [`apps\web\components\documents\index.ts`](apps\web\components\documents\index.ts)
- [`apps\web\components\dashboard\index.ts`](apps\web\components\dashboard\index.ts)
- [`apps\web\components\companies\index.ts`](apps\web\components\companies\index.ts)
- [`apps\api\src\jobs\index.ts`](apps\api\src\jobs\index.ts)
- [`packages\nfse-client\src\abrasf\municipios\index.ts`](packages\nfse-client\src\abrasf\municipios\index.ts)
- [`apps\api\src\modules\nfse\index.ts`](apps\api\src\modules\nfse\index.ts)
- [`apps\api\src\modules\manifestacao\index.ts`](apps\api\src\modules\manifestacao\index.ts)
- [`apps\api\src\modules\jobs\index.ts`](apps\api\src\modules\jobs\index.ts)
- [`apps\api\src\modules\events\index.ts`](apps\api\src\modules\events\index.ts)
- [`apps\api\src\modules\dashboard\index.ts`](apps\api\src\modules\dashboard\index.ts)
- [`apps\api\src\modules\documents\index.ts`](apps\api\src\modules\documents\index.ts)
- [`apps\api\src\modules\companies\index.ts`](apps\api\src\modules\companies\index.ts)
- [`apps\api\src\modules\agents\index.ts`](apps\api\src\modules\agents\index.ts)

## Architecture Context

### Config
Configuration and constants
- **Directories**: `packages\xml-parser`, `packages\sefaz-client`, `apps\web`, `packages\sefaz-client\src`, `packages\sefaz-client\src\constants`
- **Symbols**: 7 total
- **Key exports**: [`getNFeDistDFeEndpoint`](packages\sefaz-client\src\constants\endpoints.ts#L145), [`getNFeEventoEndpoint`](packages\sefaz-client\src\constants\endpoints.ts#L149), [`getCTeDistDFeEndpoint`](packages\sefaz-client\src\constants\endpoints.ts#L153), [`getMDFeDistDFeEndpoint`](packages\sefaz-client\src\constants\endpoints.ts#L157), [`getAmbienteCode`](packages\sefaz-client\src\constants\endpoints.ts#L161), [`getUfCode`](packages\sefaz-client\src\constants\endpoints.ts#L165), [`getUfFromCode`](packages\sefaz-client\src\constants\endpoints.ts#L169)

### Repositories
Data access and persistence
- **Directories**: `packages\database`, `packages\database\src`, `apps\web\components\documents`, `mnt\data\fiscalzen_local_dev_fixes_v2`
- **Symbols**: 18 total
- **Key exports**: [`createClient`](packages\database\src\client.ts#L7)

### Controllers
Request handling and routing
- **Directories**: `apps\api`, `apps\web\lib`, `apps\api\tests`, `apps\api\test`, `apps\api\src`, `packages\shared\src\types`, `apps\api\src\utils`, `apps\api\src\plugins`, `apps\api\src\jobs`, `apps\api\src\config`, `apps\api\src\modules\nfse`, `apps\api\src\modules\manifestacao`, `apps\api\src\modules\jobs`, `apps\api\src\modules\events`, `apps\api\src\modules\dashboard`, `apps\api\src\modules\documents`, `apps\api\src\modules\companies`, `apps\api\src\modules\agents`, `tools`
- **Symbols**: 171 total
- **Key exports**: [`ApiResponse`](apps\web\lib\api.ts#L11), [`ApiError`](apps\web\lib\api.ts#L27), [`setAuthToken`](apps\web\lib\api.ts#L39), [`getAuthToken`](apps\web\lib\api.ts#L43), [`ApiClientError`](apps\web\lib\api.ts#L110), [`buildApp`](apps\api\src\app.ts#L26), [`ApiResponse`](packages\shared\src\types\api.ts#L3), [`ApiError`](packages\shared\src\types\api.ts#L9), [`PaginatedResponse`](packages\shared\src\types\api.ts#L15), [`PaginationParams`](packages\shared\src\types\api.ts#L30), [`DocumentFilters`](packages\shared\src\types\api.ts#L43), [`SortParams`](packages\shared\src\types\api.ts#L50), [`PaginationMeta`](apps\api\src\utils\response.ts#L4), [`SuccessResponse`](apps\api\src\utils\response.ts#L11), [`ErrorResponse`](apps\api\src\utils\response.ts#L17), [`ApiResponse`](apps\api\src\utils\response.ts#L26), [`sendSuccess`](apps\api\src\utils\response.ts#L28), [`sendError`](apps\api\src\utils\response.ts#L46), [`sendCreated`](apps\api\src\utils\response.ts#L77), [`sendNoContent`](apps\api\src\utils\response.ts#L81), [`paginate`](apps\api\src\utils\response.ts#L85), [`PaginationParams`](apps\api\src\utils\response.ts#L102), [`getPaginationParams`](apps\api\src\utils\response.ts#L108), [`AppError`](apps\api\src\utils\errors.ts#L1), [`NotFoundError`](apps\api\src\utils\errors.ts#L16), [`UnauthorizedError`](apps\api\src\utils\errors.ts#L23), [`ForbiddenError`](apps\api\src\utils\errors.ts#L29), [`ValidationError`](apps\api\src\utils\errors.ts#L35), [`ConflictError`](apps\api\src\utils\errors.ts#L41), [`RateLimitError`](apps\api\src\utils\errors.ts#L47), [`ExternalServiceError`](apps\api\src\utils\errors.ts#L53), [`encryptToBuffer`](apps\api\src\utils\encryption.ts#L36), [`decryptFromBuffer`](apps\api\src\utils\encryption.ts#L47), [`encryptToBase64`](apps\api\src\utils\encryption.ts#L63), [`decryptFromBase64`](apps\api\src\utils\encryption.ts#L67), [`sha256Hex`](apps\api\src\utils\encryption.ts#L71), [`JwtPayload`](apps\api\src\plugins\auth.ts#L7), [`generateToken`](apps\api\src\plugins\auth.ts#L88), [`getTenantId`](apps\api\src\plugins\auth.ts#L95), [`getUserId`](apps\api\src\plugins\auth.ts#L101), [`processXmlProcessor`](apps\api\src\jobs\xml-processor.ts#L22), [`startWorkers`](apps\api\src\jobs\workers.ts#L45), [`stopWorkers`](apps\api\src\jobs\workers.ts#L111), [`pauseWorkers`](apps\api\src\jobs\workers.ts#L137), [`resumeWorkers`](apps\api\src\jobs\workers.ts#L152), [`getWorkersStatus`](apps\api\src\jobs\workers.ts#L171), [`isWorkersRunning`](apps\api\src\jobs\workers.ts#L192), [`processSefazMonitor`](apps\api\src\jobs\sefaz-monitor.ts#L39), [`processSearchSync`](apps\api\src\jobs\search-sync.ts#L13), [`batchIndexDocuments`](apps\api\src\jobs\search-sync.ts#L111), [`reindexAllDocuments`](apps\api\src\jobs\search-sync.ts#L162), [`runScheduler`](apps\api\src\jobs\scheduler.ts#L25), [`startScheduler`](apps\api\src\jobs\scheduler.ts#L109), [`stopScheduler`](apps\api\src\jobs\scheduler.ts#L124), [`triggerCompanySync`](apps\api\src\jobs\scheduler.ts#L136), [`triggerAllCompaniesSync`](apps\api\src\jobs\scheduler.ts#L168), [`initializeCompanyNsuControl`](apps\api\src\jobs\scheduler.ts#L225), [`SefazMonitorJobData`](apps\api\src\jobs\queues.ts#L78), [`XmlProcessorJobData`](apps\api\src\jobs\queues.ts#L84), [`SearchSyncJobData`](apps\api\src\jobs\queues.ts#L95), [`NfseMonitorJobData`](apps\api\src\jobs\queues.ts#L101), [`addSefazMonitorJob`](apps\api\src\jobs\queues.ts#L112), [`addXmlProcessorJob`](apps\api\src\jobs\queues.ts#L123), [`addSearchSyncJob`](apps\api\src\jobs\queues.ts#L131), [`addNfseMonitorJob`](apps\api\src\jobs\queues.ts#L139), [`getQueueStatus`](apps\api\src\jobs\queues.ts#L153), [`getAllQueuesStatus`](apps\api\src\jobs\queues.ts#L173), [`closeQueues`](apps\api\src\jobs\queues.ts#L186), [`processNfseMonitor`](apps\api\src\jobs\nfse-monitor.ts#L16), [`JobEventType`](apps\api\src\jobs\events.ts#L6), [`JobEvent`](apps\api\src\jobs\events.ts#L8), [`JobMetrics`](apps\api\src\jobs\events.ts#L19), [`getJobMetrics`](apps\api\src\jobs\events.ts#L48), [`onJobEvent`](apps\api\src\jobs\events.ts#L53), [`emitJobStarted`](apps\api\src\jobs\events.ts#L58), [`emitJobProgress`](apps\api\src\jobs\events.ts#L71), [`emitJobCompleted`](apps\api\src\jobs\events.ts#L81), [`emitJobFailed`](apps\api\src\jobs\events.ts#L99), [`WorkerHealth`](apps\api\src\jobs\events.ts#L132), [`setupWorkerEvents`](apps\api\src\jobs\events.ts#L156), [`getWorkerHealth`](apps\api\src\jobs\events.ts#L195), [`checkRedisConnection`](apps\api\src\config\redis.ts#L21), [`closeRedisConnection`](apps\api\src\config\redis.ts#L31), [`checkMeilisearchConnection`](apps\api\src\config\meilisearch.ts#L13), [`setupMeilisearchIndexes`](apps\api\src\config\meilisearch.ts#L23), [`Env`](apps\api\src\config\env.ts#L74), [`Database`](apps\api\src\config\database.ts#L17), [`checkDatabaseConnection`](apps\api\src\config\database.ts#L19), [`closeDatabaseConnection`](apps\api\src\config\database.ts#L31), [`CompanyIdParams`](apps\api\src\modules\nfse\schemas.ts#L41), [`MunicipioCodigoParams`](apps\api\src\modules\nfse\schemas.ts#L42), [`CreateNfseConfigInput`](apps\api\src\modules\nfse\schemas.ts#L43), [`UpdateNfseConfigInput`](apps\api\src\modules\nfse\schemas.ts#L44), [`ToggleNfseConfigInput`](apps\api\src\modules\nfse\schemas.ts#L45), [`nfseRoutes`](apps\api\src\modules\nfse\routes.ts#L18), [`companyNfseRoutes`](apps\api\src\modules\nfse\routes.ts#L41), [`CienciaInput`](apps\api\src\modules\manifestacao\schemas.ts#L27), [`ConfirmacaoInput`](apps\api\src\modules\manifestacao\schemas.ts#L28), [`DesconhecimentoInput`](apps\api\src\modules\manifestacao\schemas.ts#L29), [`NaoRealizadaInput`](apps\api\src\modules\manifestacao\schemas.ts#L30), [`PendentesQuery`](apps\api\src\modules\manifestacao\schemas.ts#L31), [`manifestacaoRoutes`](apps\api\src\modules\manifestacao\routes.ts#L18), [`CompanyIdParams`](apps\api\src\modules\jobs\schemas.ts#L15), [`SyncRequestInput`](apps\api\src\modules\jobs\schemas.ts#L16), [`JobIdParams`](apps\api\src\modules\jobs\schemas.ts#L17), [`jobsRoutes`](apps\api\src\modules\jobs\routes.ts#L12), [`DocumentIdParams`](apps\api\src\modules\events\schemas.ts#L12), [`ListEventsQuery`](apps\api\src\modules\events\schemas.ts#L13), [`eventsRoutes`](apps\api\src\modules\events\routes.ts#L12), [`TimelineQuery`](apps\api\src\modules\dashboard\schemas.ts#L28), [`GapsQuery`](apps\api\src\modules\dashboard\schemas.ts#L29), [`SummaryQuery`](apps\api\src\modules\dashboard\schemas.ts#L30), [`RecentQuery`](apps\api\src\modules\dashboard\schemas.ts#L31), [`dashboardRoutes`](apps\api\src\modules\dashboard\routes.ts#L16), [`ListDocumentsQuery`](apps\api\src\modules\documents\schemas.ts#L46), [`DocumentIdParams`](apps\api\src\modules\documents\schemas.ts#L47), [`SearchDocumentsQuery`](apps\api\src\modules\documents\schemas.ts#L48), [`UploadXmlInput`](apps\api\src\modules\documents\schemas.ts#L49), [`DocumentByChaveParams`](apps\api\src\modules\documents\schemas.ts#L50), [`documentsRoutes`](apps\api\src\modules\documents\routes.ts#L18), [`CreateCompanyInput`](apps\api\src\modules\companies\schemas.ts#L42), [`UpdateCompanyInput`](apps\api\src\modules\companies\schemas.ts#L43), [`CompanyIdParams`](apps\api\src\modules\companies\schemas.ts#L44), [`UploadCertificateInput`](apps\api\src\modules\companies\schemas.ts#L45), [`ListCompaniesQuery`](apps\api\src\modules\companies\schemas.ts#L46), [`companiesRoutes`](apps\api\src\modules\companies\routes.ts#L18), [`RegisterAgentInput`](apps\api\src\modules\agents\schemas.ts#L29), [`AgentIdParams`](apps\api\src\modules\agents\schemas.ts#L30), [`ListAgentsQuery`](apps\api\src\modules\agents\schemas.ts#L31), [`AgentHeartbeatInput`](apps\api\src\modules\agents\schemas.ts#L32), [`agentsRoutes`](apps\api\src\modules\agents\routes.ts#L17)

### Utils
Shared utilities and helpers
- **Directories**: `packages\xml-parser\src`, `packages\shared\src`, `apps\web\lib`, `packages\ui\src\lib`, `packages\shared\src\validators`, `packages\shared\src\types`, `packages\shared\src\formatters`, `packages\shared\src\constants`, `apps\web\lib\stores`, `apps\web\lib\hooks`
- **Symbols**: 139 total
- **Key exports**: [`createParser`](packages\xml-parser\src\utils.ts#L34), [`parseDate`](packages\xml-parser\src\utils.ts#L38), [`parseDecimal`](packages\xml-parser\src\utils.ts#L56), [`ensureArray`](packages\xml-parser\src\utils.ts#L62), [`extractCnpjCpf`](packages\xml-parser\src\utils.ts#L67), [`buildSearchContent`](packages\xml-parser\src\utils.ts#L72), [`cn`](apps\web\lib\utils.ts#L4), [`DocType`](apps\web\lib\types.ts#L5), [`Situacao`](apps\web\lib\types.ts#L6), [`ManifestacaoTipo`](apps\web\lib\types.ts#L7), [`Document`](apps\web\lib\types.ts#L13), [`DocumentEvent`](apps\web\lib\types.ts#L39), [`DocumentWithEvents`](apps\web\lib\types.ts#L54), [`Company`](apps\web\lib\types.ts#L62), [`CompanyWithStats`](apps\web\lib\types.ts#L81), [`NsuControl`](apps\web\lib\types.ts#L86), [`DashboardSummary`](apps\web\lib\types.ts#L102), [`IntegrityStatus`](apps\web\lib\types.ts#L120), [`IntegrityGap`](apps\web\lib\types.ts#L127), [`TimelineData`](apps\web\lib\types.ts#L136), [`QueueStatus`](apps\web\lib\types.ts#L148), [`WorkerStatus`](apps\web\lib\types.ts#L158), [`JobsStatus`](apps\web\lib\types.ts#L165), [`CompanySyncStatus`](apps\web\lib\types.ts#L170), [`ManifestacaoStatus`](apps\web\lib\types.ts#L180), [`ManifestacaoRequest`](apps\web\lib\types.ts#L188), [`PendingManifestation`](apps\web\lib\types.ts#L194), [`PendingCiencia`](apps\web\lib\types.ts#L199), [`AwaitingFinal`](apps\web\lib\types.ts#L213), [`ManifestacaoHistoryItem`](apps\web\lib\types.ts#L220), [`DocumentFilters`](apps\web\lib\types.ts#L231), [`CompanyFormData`](apps\web\lib\types.ts#L246), [`CertificateUploadData`](apps\web\lib\types.ts#L258), [`NfseTipo`](apps\web\lib\types.ts#L268), [`NfseSyncStatus`](apps\web\lib\types.ts#L269), [`MunicipioInfo`](apps\web\lib\types.ts#L271), [`NfseConfig`](apps\web\lib\types.ts#L282), [`NfseConfigFormData`](apps\web\lib\types.ts#L300), [`NfseTestResult`](apps\web\lib\types.ts#L307), [`cn`](packages\ui\src\lib\utils.ts#L4), [`isValidCpf`](packages\shared\src\validators\cpf.ts#L6), [`formatCpf`](packages\shared\src\validators\cpf.ts#L48), [`cleanCpf`](packages\shared\src\validators\cpf.ts#L61), [`isValidCpfCnpj`](packages\shared\src\validators\cpf.ts#L68), [`isValidCnpj`](packages\shared\src\validators\cnpj.ts#L6), [`formatCnpj`](packages\shared\src\validators\cnpj.ts#L50), [`cleanCnpj`](packages\shared\src\validators\cnpj.ts#L66), [`isValidChaveAcesso`](packages\shared\src\validators\chave-acesso.ts#L6), [`ChaveAcessoInfo`](packages\shared\src\validators\chave-acesso.ts#L43), [`parseChaveAcesso`](packages\shared\src\validators\chave-acesso.ts#L60), [`formatChaveAcesso`](packages\shared\src\validators\chave-acesso.ts#L85), [`getDocTypeFromChave`](packages\shared\src\validators\chave-acesso.ts#L96), [`DocType`](packages\shared\src\types\documents.ts#L4), [`DocumentStatus`](packages\shared\src\types\documents.ts#L7), [`Document`](packages\shared\src\types\documents.ts#L35), [`DocumentEvent`](packages\shared\src\types\documents.ts#L50), [`CreateDocument`](packages\shared\src\types\documents.ts#L59), [`Company`](packages\shared\src\types\companies.ts#L19), [`CreateCompany`](packages\shared\src\types\companies.ts#L31), [`UpdateCompany`](packages\shared\src\types\companies.ts#L35), [`Tenant`](packages\shared\src\types\companies.ts#L48), [`formatDocumentNumber`](packages\shared\src\formatters\document.ts#L9), [`formatSerie`](packages\shared\src\formatters\document.ts#L19), [`getDocTypeLabel`](packages\shared\src\formatters\document.ts#L27), [`getStatusLabel`](packages\shared\src\formatters\document.ts#L42), [`getStatusColor`](packages\shared\src\formatters\document.ts#L55), [`getDocTypeColor`](packages\shared\src\formatters\document.ts#L68), [`formatDocumentRef`](packages\shared\src\formatters\document.ts#L83), [`formatDate`](packages\shared\src\formatters\date.ts#L6), [`formatDateTime`](packages\shared\src\formatters\date.ts#L25), [`formatDateTimeFull`](packages\shared\src\formatters\date.ts#L46), [`formatRelativeTime`](packages\shared\src\formatters\date.ts#L68), [`parseDate`](packages\shared\src\formatters\date.ts#L95), [`startOfToday`](packages\shared\src\formatters\date.ts#L108), [`startOfMonth`](packages\shared\src\formatters\date.ts#L116), [`startOfYear`](packages\shared\src\formatters\date.ts#L124), [`formatCurrency`](packages\shared\src\formatters\currency.ts#L6), [`formatNumber`](packages\shared\src\formatters\currency.ts#L29), [`parseCurrency`](packages\shared\src\formatters\currency.ts#L54), [`formatCompact`](packages\shared\src\formatters\currency.ts#L70), [`SituacaoInfo`](packages\shared\src\constants\situacoes.ts#L3), [`getSituacaoInfo`](packages\shared\src\constants\situacoes.ts#L42), [`getAllSituacoes`](packages\shared\src\constants\situacoes.ts#L46), [`getSituacaoOptions`](packages\shared\src\constants\situacoes.ts#L50), [`Estado`](packages\shared\src\constants\estados.ts#L1), [`getEstadoBySigla`](packages\shared\src\constants\estados.ts#L54), [`getEstadoByCodigo`](packages\shared\src\constants\estados.ts#L58), [`getUfOptions`](packages\shared\src\constants\estados.ts#L62), [`DocTypeInfo`](packages\shared\src\constants\doc-types.ts#L3), [`getDocTypeInfo`](packages\shared\src\constants\doc-types.ts#L56), [`getDocTypeByModelo`](packages\shared\src\constants\doc-types.ts#L60), [`getAllDocTypes`](packages\shared\src\constants\doc-types.ts#L69), [`getDocTypeOptions`](packages\shared\src\constants\doc-types.ts#L73), [`useNfseConfigs`](apps\web\lib\hooks\use-nfse.ts#L24), [`useNfseConfig`](apps\web\lib\hooks\use-nfse.ts#L35), [`useMunicipios`](apps\web\lib\hooks\use-nfse.ts#L48), [`useMunicipio`](apps\web\lib\hooks\use-nfse.ts#L59), [`useCreateNfseConfig`](apps\web\lib\hooks\use-nfse.ts#L74), [`useUpdateNfseConfig`](apps\web\lib\hooks\use-nfse.ts#L99), [`useDeleteNfseConfig`](apps\web\lib\hooks\use-nfse.ts#L126), [`useToggleNfseConfig`](apps\web\lib\hooks\use-nfse.ts#L147), [`useTestNfseConnection`](apps\web\lib\hooks\use-nfse.ts#L174), [`useTriggerNfseSync`](apps\web\lib\hooks\use-nfse.ts#L191), [`usePendingManifestations`](apps\web\lib\hooks\use-manifestacao.ts#L33), [`usePendingCiencia`](apps\web\lib\hooks\use-manifestacao.ts#L46), [`useAwaitingFinal`](apps\web\lib\hooks\use-manifestacao.ts#L59), [`useManifestacaoHistory`](apps\web\lib\hooks\use-manifestacao.ts#L72), [`usePendingCount`](apps\web\lib\hooks\use-manifestacao.ts#L87), [`useManifestar`](apps\web\lib\hooks\use-manifestacao.ts#L106), [`useDarCiencia`](apps\web\lib\hooks\use-manifestacao.ts#L132), [`useManifestarBatch`](apps\web\lib\hooks\use-manifestacao.ts#L149), [`useBatchCiencia`](apps\web\lib\hooks\use-manifestacao.ts#L176), [`getManifestacaoStatusLabel`](apps\web\lib\hooks\use-manifestacao.ts#L229), [`getManifestacaoStatusColor`](apps\web\lib\hooks\use-manifestacao.ts#L233), [`useJobsStatus`](apps\web\lib\hooks\use-jobs.ts#L21), [`useCompanySyncStatus`](apps\web\lib\hooks\use-jobs.ts#L32), [`useTriggerSync`](apps\web\lib\hooks\use-jobs.ts#L44), [`useTriggerSyncAll`](apps\web\lib\hooks\use-jobs.ts#L58), [`useDocuments`](apps\web\lib\hooks\use-documents.ts#L24), [`useDocument`](apps\web\lib\hooks\use-documents.ts#L43), [`useDocumentSearch`](apps\web\lib\hooks\use-documents.ts#L54), [`useDownloadXml`](apps\web\lib\hooks\use-documents.ts#L67), [`useUploadDocuments`](apps\web\lib\hooks\use-documents.ts#L79), [`useDebounce`](apps\web\lib\hooks\use-debounce.ts#L5), [`useDashboardSummary`](apps\web\lib\hooks\use-dashboard.ts#L23), [`useIntegrityStatus`](apps\web\lib\hooks\use-dashboard.ts#L35), [`useTimeline`](apps\web\lib\hooks\use-dashboard.ts#L48), [`useIntegrityGaps`](apps\web\lib\hooks\use-dashboard.ts#L61), [`useCompanies`](apps\web\lib\hooks\use-companies.ts#L24), [`useCompany`](apps\web\lib\hooks\use-companies.ts#L34), [`useCompanyNsuControl`](apps\web\lib\hooks\use-companies.ts#L45), [`useCreateCompany`](apps\web\lib\hooks\use-companies.ts#L56), [`useUpdateCompany`](apps\web\lib\hooks\use-companies.ts#L70), [`useDeleteCompany`](apps\web\lib\hooks\use-companies.ts#L85), [`useUploadCertificate`](apps\web\lib\hooks\use-companies.ts#L98), [`Providers`](apps\web\lib\providers.tsx#L7)

### Services
Business logic and orchestration
- **Directories**: `packages\sefaz-client\tests`, `packages\sefaz-client\src\services`, `apps\api\src\services`, `apps\api\src\modules\nfse`, `apps\api\src\modules\manifestacao`, `apps\api\src\modules\jobs`, `apps\api\src\modules\events`, `apps\api\src\modules\dashboard`, `apps\api\src\modules\documents`, `apps\api\src\modules\companies`, `apps\api\src\modules\agents`
- **Symbols**: 64 total
- **Key exports**: [`consultarDistDFe`](packages\sefaz-client\src\services\nfe-distdfe.ts#L206), [`consultarPorUltNSU`](packages\sefaz-client\src\services\nfe-distdfe.ts#L249), [`consultarPorNSU`](packages\sefaz-client\src\services\nfe-distdfe.ts#L268), [`consultarPorChave`](packages\sefaz-client\src\services\nfe-distdfe.ts#L287), [`consultarMDFeDistDFe`](packages\sefaz-client\src\services\mdfe-distdfe.ts#L198), [`consultarMDFePorUltNSU`](packages\sefaz-client\src\services\mdfe-distdfe.ts#L232), [`consultarMDFePorNSU`](packages\sefaz-client\src\services\mdfe-distdfe.ts#L251), [`consultarMDFePorChave`](packages\sefaz-client\src\services\mdfe-distdfe.ts#L270), [`enviarManifestacao`](packages\sefaz-client\src\services\manifestacao.ts#L180), [`confirmarOperacao`](packages\sefaz-client\src\services\manifestacao.ts#L224), [`registrarCiencia`](packages\sefaz-client\src\services\manifestacao.ts#L244), [`desconhecerOperacao`](packages\sefaz-client\src\services\manifestacao.ts#L263), [`operacaoNaoRealizada`](packages\sefaz-client\src\services\manifestacao.ts#L282), [`consultarCTeDistDFe`](packages\sefaz-client\src\services\cte-distdfe.ts#L198), [`consultarCTePorUltNSU`](packages\sefaz-client\src\services\cte-distdfe.ts#L232), [`consultarCTePorNSU`](packages\sefaz-client\src\services\cte-distdfe.ts#L251), [`consultarCTePorChave`](packages\sefaz-client\src\services\cte-distdfe.ts#L270), [`StorageKey`](apps\api\src\services\storage.ts#L21), [`DocumentSearchRecord`](apps\api\src\services\search.ts#L4), [`SearchFilters`](apps\api\src\services\search.ts#L25), [`SearchResult`](apps\api\src\services\search.ts#L37), [`DocumentSummary`](apps\api\src\modules\dashboard\service.ts#L6), [`IntegrityStatus`](apps\api\src\modules\dashboard\service.ts#L15), [`TimelinePoint`](apps\api\src\modules\dashboard\service.ts#L26), [`Gap`](apps\api\src\modules\dashboard\service.ts#L36), [`CompanyWithNsu`](apps\api\src\modules\companies\service.ts#L10)

### Models
Data structures and domain objects
- **Directories**: `packages\database\src\schema`
- **Symbols**: 27 total
- **Key exports**: [`Tenant`](packages\database\src\schema\tenants.ts#L42), [`NewTenant`](packages\database\src\schema\tenants.ts#L43), [`Company`](packages\database\src\schema\tenants.ts#L44), [`NewCompany`](packages\database\src\schema\tenants.ts#L45), [`NsuDocType`](packages\database\src\schema\nsu-control.ts#L28), [`NsuSyncStatus`](packages\database\src\schema\nsu-control.ts#L31), [`NsuControl`](packages\database\src\schema\nsu-control.ts#L85), [`NewNsuControl`](packages\database\src\schema\nsu-control.ts#L86), [`formatNsu`](packages\database\src\schema\nsu-control.ts#L95), [`incrementNsu`](packages\database\src\schema\nsu-control.ts#L103), [`shouldWaitForNextSync`](packages\database\src\schema\nsu-control.ts#L112), [`calculateNextSyncTime`](packages\database\src\schema\nsu-control.ts#L123), [`NfseConfig`](packages\database\src\schema\nfse-configs.ts#L64), [`NewNfseConfig`](packages\database\src\schema\nfse-configs.ts#L65), [`DocType`](packages\database\src\schema\documents.ts#L17), [`Situacao`](packages\database\src\schema\documents.ts#L20), [`Document`](packages\database\src\schema\documents.ts#L120), [`NewDocument`](packages\database\src\schema\documents.ts#L121), [`DocumentEvent`](packages\database\src\schema\documents.ts#L122), [`NewDocumentEvent`](packages\database\src\schema\documents.ts#L123), [`MonitorJob`](packages\database\src\schema\audit.ts#L69), [`NewMonitorJob`](packages\database\src\schema\audit.ts#L70), [`AuditLog`](packages\database\src\schema\audit.ts#L71), [`NewAuditLog`](packages\database\src\schema\audit.ts#L72), [`AgentStatus`](packages\database\src\schema\agents.ts#L6), [`Agent`](packages\database\src\schema\agents.ts#L39), [`NewAgent`](packages\database\src\schema\agents.ts#L40)

### Components
UI components and views
- **Directories**: `apps\web\components\nfse`, `apps\web\components\manifestacao`, `apps\web\components\layout`, `apps\web\components\documents`, `apps\web\components\dashboard`, `apps\web\components\companies`, `apps\web\app`, `packages\ui\src\components`, `apps\web\app\(dashboard)\upload`, `apps\web\app\(dashboard)\manifestacao`, `apps\web\app\(dashboard)\empresas`, `apps\web\app\(dashboard)\documentos`, `apps\web\app\(dashboard)\dashboard`, `apps\web\app\(dashboard)\empresas\[id]`, `apps\web\app\(dashboard)\empresas\nova`, `apps\web\app\(dashboard)\documentos\[id]`, `apps\web\app\(dashboard)\empresas\[id]\nfse`
- **Symbols**: 70 total
- **Key exports**: [`Home`](apps\web\app\page.tsx#L3), [`TextareaProps`](packages\ui\src\components\textarea.tsx#L5), [`InputProps`](packages\ui\src\components\input.tsx#L4), [`ButtonProps`](packages\ui\src\components\button.tsx#L32), [`BadgeProps`](packages\ui\src\components\badge.tsx#L25), [`Header`](apps\web\components\layout\header.tsx#L19), [`ManifestacaoBadge`](apps\web\components\manifestacao\manifestacao-badge.tsx#L48), [`ManifestacaoTipoBadge`](apps\web\components\manifestacao\manifestacao-badge.tsx#L82), [`UrgencyBadge`](apps\web\components\manifestacao\manifestacao-badge.tsx#L97), [`NovaEmpresaPage`](apps\web\app\(dashboard)\empresas\nova\page.tsx#L11)
## Key Symbols for This Agent
- [`SefazError`](packages\sefaz-client\src\types.ts#L194) (class)
- [`CertificadoError`](packages\sefaz-client\src\types.ts#L206) (class)
- [`TimeoutError`](packages\sefaz-client\src\types.ts#L213) (class)
- [`SoapClient`](packages\sefaz-client\src\soap-client.ts#L28) (class)
- [`SefazClient`](packages\sefaz-client\src\client.ts#L4) (class)
- [`ApiClientError`](apps\web\lib\api.ts#L110) (class)
- [`BrowserManager`](packages\nfse-client\src\rpa\browser.ts#L7) (class)
- [`AbrasfClient`](packages\nfse-client\src\abrasf\client.ts#L27) (class)
- [`AppError`](apps\api\src\utils\errors.ts#L1) (class)
- [`NotFoundError`](apps\api\src\utils\errors.ts#L16) (class)
- [`UnauthorizedError`](apps\api\src\utils\errors.ts#L23) (class)
- [`ForbiddenError`](apps\api\src\utils\errors.ts#L29) (class)
- [`ValidationError`](apps\api\src\utils\errors.ts#L35) (class)
- [`ConflictError`](apps\api\src\utils\errors.ts#L41) (class)
- [`RateLimitError`](apps\api\src\utils\errors.ts#L47) (class)

## Documentation Touchpoints
- [Documentation Index](../docs/README.md)
- [Project Overview](../docs/project-overview.md)
- [Architecture Notes](../docs/architecture.md)
- [Development Workflow](../docs/development-workflow.md)
- [Testing Strategy](../docs/testing-strategy.md)
- [Glossary & Domain Concepts](../docs/glossary.md)
- [Data Flow & Integrations](../docs/data-flow.md)
- [Security & Compliance Notes](../docs/security.md)
- [Tooling & Productivity Guide](../docs/tooling.md)

## Collaboration Checklist

1. Confirm assumptions with issue reporters or maintainers.
2. Review open pull requests affecting this area.
3. Update the relevant doc section listed above.
4. Capture learnings back in [docs/README.md](../docs/README.md).

## Hand-off Notes

Summarize outcomes, remaining risks, and suggested follow-up actions after the agent completes its work.
