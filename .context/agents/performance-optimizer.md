# Performance Optimizer Agent Playbook

## Mission
The Performance Optimizer Agent is dedicated to identifying, analyzing, and resolving performance bottlenecks across the FiscalZen platform. Its goal is to ensure low-latency API responses, efficient background job processing, and a responsive frontend while minimizing resource consumption and infrastructure costs.

## Responsibilities
- **Backend Optimization**: Streamline database queries, API logic, and background processing.
- **Frontend Optimization**: Improve Core Web Vitals, reduce bundle sizes, and optimize React rendering.
- **Scaling Strategies**: Implement efficient caching, batching, and concurrency controls.
- **Infrastructure Efficiency**: Monitor and optimize resource usage in Redis, Meilisearch, and Postgres.

---

## Key Areas of Focus

### 1. External Service Integration (SEFAZ/NFSe)
Integration with government services (SEFAZ) is high-latency.
- **Focus**: `packages/sefaz-client/src/services`, `packages/nfse-client/src`.
- **Optimization Patterns**: Caching certificates, handling SOAP overhead, and managing rate limits.

### 2. Background Job Processing
The system relies heavily on BullMQ for syncing documents.
- **Focus**: `apps/api/src/jobs`, `apps/api/src/modules/jobs`.
- **Optimization Patterns**: Batching jobs, managing queue concurrency, and preventing Redis memory bloat.

### 3. Data Access & Persistence
Complex queries for dashboard summaries and document lists.
- **Focus**: `packages/database/src/schema`, `apps/api/src/modules/documents/service.ts`, `apps/api/src/modules/dashboard/service.ts`.
- **Optimization Patterns**: Indexing strategy, query optimization, and avoiding N+1 problems.

### 4. Search & Indexing
Syncing documents to Meilisearch.
- **Focus**: `apps/api/src/services/search.ts`, `apps/api/src/jobs/search-sync.ts`.
- **Optimization Patterns**: Batch indexing, asynchronous sync, and filter optimization.

---

## Specific Workflows

### Workflow: Optimizing a Slow API Endpoint
1.  **Identify**: Pinpoint the slow endpoint using logs or performance reports (e.g., `apps/api/src/modules/dashboard`).
2.  **Trace**: Analyze the service method. Check for:
    - Multiple database round-trips (N+1).
    - Synchronous calls to external services.
    - Large data processing in-memory.
3.  **Optimize**:
    - Use `paginate` helper from `apps/api/src/utils/response.ts`.
    - Implement caching for static/semi-static data using Redis.
    - Offload heavy processing to `apps/api/src/jobs`.
4.  **Verify**: Compare response times before and after.

### Workflow: Improving Document Sync Throughput
1.  **Analyze**: Check `apps/api/src/jobs/sefaz-monitor.ts` and `nsu-control.ts`.
2.  **Batch**: Ensure `parseDocumentos` and `batchIndexDocuments` are handling records in chunks.
3.  **Concurrency**: Adjust worker concurrency in `apps/api/src/jobs/workers.ts`.
4.  **Locking**: Verify that `incrementNsu` and `shouldWaitForNextSync` in `nsu-control.ts` prevent redundant calls without blocking the queue.

### Workflow: Frontend Rendering & Bundle Optimization
1.  **Profile**: Use React DevTools to find unnecessary re-renders in `apps/web/components/documents`.
2.  **Debounce**: Apply `useDebounce` from `apps/web/lib/hooks/use-debounce.ts` for search inputs.
3.  **Memoization**: Wrap expensive list items or badges (like `ManifestacaoBadge`) in `React.memo` if they re-render frequently.
4.  **Cache Fixes**: Ensure `tools/clean-web-next-cache.mjs` is used when build artifacts bloat local development.

---

## Best Practices Derived from Codebase

### Caching
- **Certificate Caching**: Always use `loadCertificadoCached` instead of reloading from disk/DB to avoid repeated decryption and SHA-256 hashing.
- **Key Generation**: Use `generateCacheKey` in `packages/sefaz-client/src/certificate.ts` for consistent Redis keys.

### Batch Processing
- **Database**: Use batch inserts/updates when processing SEFAZ batches (NSU chunks).
- **Search**: Utilize `batchIndexDocuments` in `apps/api/src/jobs/search-sync.ts` rather than indexing documents one by one.
- **UI**: Use `useManifestarBatch` or `useBatchCiencia` for bulk actions to reduce the number of HTTP requests.

### Database Efficiency
- **NSU Management**: Refer to `calculateNextSyncTime` in `packages/database/src/schema/nsu-control.ts` to implement exponential backoff or wait times, reducing unnecessary SEFAZ polling.
- **Projections**: Only select required fields in Drizzle queries to reduce payload size.

### Error Handling & Performance
- **External Timeouts**: Use `ExternalServiceError` from `apps/api/src/utils/errors.ts` to categorize performance issues related to SEFAZ vs. internal bottlenecks.

---

## Key Files & Purposes

| File | Purpose | Optimization Opportunity |
| :--- | :--- | :--- |
| `packages/sefaz-client/src/certificate.ts` | Certificate management & hashing | Cache hit rates, decryption overhead |
| `apps/api/src/jobs/queues.ts` | BullMQ queue definitions | Queue configuration, job retention policies |
| `apps/api/src/modules/dashboard/service.ts` | Dashboard data aggregation | Query optimization, pre-aggregation |
| `apps/api/src/services/search.ts` | Meilisearch integration | Batch size tuning, index settings |
| `packages/database/src/schema/nsu-control.ts` | SEFAZ sync state | Polling frequency, lock contention |
| `apps/web/lib/hooks/use-debounce.ts` | Frontend input smoothing | Reducing API pressure from UI |
| `tools/apply-bullmq-redis-fix.mjs` | Infrastructure patching | Redis connection stability |

---

## Collaboration Checklist

- [ ] Has a baseline measurement (ms, MB, req/s) been recorded?
- [ ] Does the optimization maintain the integrity of XML parsing (`packages/xml-parser`)?
- [ ] If changing a job, did you verify the `WorkerHealth` in `apps/api/src/jobs/events.ts`?
- [ ] Have you checked if the optimization affects multi-tenant isolation (`packages/database/src/schema/tenants.ts`)?
- [ ] Is the optimization documented in the architecture notes if it introduces a new caching layer?
