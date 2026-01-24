
# FiscalZen - Desenvolvimento Completo v2.0

## 1. Overview & Goals

The primary objective of **FiscalZen v2.0** is to transition the backend from a "Rapid Prototype" to an "Enterprise Scalable" architecture. This involves resolving critical performance bottlenecks (P-series), refactoring monolithic services into testable components, and fully implementing core infrastructure features like Full-Text Search and Caching.

### Key Objectives
- **Stability**: Resolve blocking I/O and CPU operations.
- **Scalability**: Parallelize job scheduling and enable worker-based processing.
- **Features**: Complete the integration of Meilisearch and Redis.
- **Maintainability**: Adopt Dependency Injection and SRP.

### Scope
- **Refactoring**: `scheduler.ts`, `xml-processor.ts`.
- **Performance**: Scheduler Parallelism, Worker Threads for XML/Crypto.
- **Features**: Meilisearch Indexing, Dashboard Caching.

---

## 2. Phases

### Phase 1: Architecture & Technical Debt (Refactoring)
**Objective**: Eliminate critical concurrency bottlenecks and improve code maintainability.

- **Step 1.1: Refactor Scheduler (Fix P6)**
    - **Owner**: `backend-specialist`
    - **Action**: Replace sequential `for...of` loops with `Promise.all` (limited concurrency) or BullMQ repeatable jobs.
    - **Deliverable**: `jobs/scheduler.ts` using parallel dispatch.
- **Step 1.2: Decompose XML Processor (Fix SRP)**
    - **Owner**: `architect-specialist`
    - **Action**: Split `processFullDocument` into `DocumentService`, `StorageService`, and `SearchService` interactions.
    - **Deliverable**: Modular `xml-processor.ts` and new service classes.
- **Commit Checkpoint**: `refactor: scheduler parallelism and xml processor decomposition`

### Phase 2: Core Features (Search & Cache)
**Objective**: Enable fast data retrieval and offload the primary database.

- **Step 2.1: Implement Meilisearch (Fix P2)**
    - **Owner**: `feature-developer`
    - **Action**: detailed implementation of `searchService`. Replace SQL `ILKE` queries in `Companies` and `Documents` modules.
    - **Deliverable**: Functional full-text search.
- **Step 2.2: Dashboard Caching (Fix P7)**
    - **Owner**: `performance-optimizer`
    - **Action**: Implement Redis caching for `getSummary` and `getTimeline` with 5-minute TTL.
    - **Deliverable**: Reduced DB load on dashboard refresh.
- **Commit Checkpoint**: `feat: meilisearch integration and dashboard caching`

### Phase 3: Performance & Scalability (CPU Offload)
**Objective**: Move blocking operations off the main event loop.

- **Step 3.1: Worker Threads for CPU Tasks (Fix P3/P4)**
    - **Owner**: `backend-specialist`
    - **Action**: Move `parseNFe` (XML) and `encryptToBuffer` (Crypto) to Node.js Worker Threads.
    - **Deliverable**: Non-blocking API for uploads and processing.
- **Commit Checkpoint**: `perf: worker threads for cpu intensive tasks`

---

## 3. Agent Lineup

- **Architect Specialist**: Design the modular structure for XML processing and Dependency Injection patterns.
- **Backend Specialist**: Implement the scheduling refactor and Worker Threads.
- **Feature Developer**: Integrate Meilisearch and Redis.
- **Performance Optimizer**: Validate cache effectiveness and load test the new scheduler.

## 4. Documentation Touchpoints

- **`AGENTS.md`**: Update architecture diagrams.
- **`system_status_report.md`**: Update module status from 'Partial' to 'Total'.

## 5. Success Criteria

- **Throughput**: Scheduler dispatches 1000 jobs in < 5 seconds (vs ~50s currently).
- **Latency**: Dashboard APIs respond in < 100ms (P95) via Cache.
- **Responsiveness**: API event loop remains unblocked during XML uploads.
- **Search**: Company search returns results in < 50ms using Meilisearch.
