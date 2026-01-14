// ============================================
// Jobs Module - Main Entry Point
// ============================================

// Queues
export {
  sefazMonitorQueue,
  xmlProcessorQueue,
  searchSyncQueue,
  addSefazMonitorJob,
  addXmlProcessorJob,
  addSearchSyncJob,
  getAllQueuesStatus,
  getQueueStatus,
  closeQueues,
  type SefazMonitorJobData,
  type XmlProcessorJobData,
  type SearchSyncJobData,
} from './queues.js';

// Workers
export {
  startWorkers,
  stopWorkers,
  pauseWorkers,
  resumeWorkers,
  getWorkersStatus,
  isWorkersRunning,
} from './workers.js';

// Scheduler
export {
  startScheduler,
  stopScheduler,
  runScheduler,
  triggerCompanySync,
  triggerAllCompaniesSync,
  initializeCompanyNsuControl,
} from './scheduler.js';

// Events & Logging
export {
  logger,
  getJobMetrics,
  onJobEvent,
  type WorkerHealth,
} from './events.js';

// Job Processors
export { processSefazMonitor } from './sefaz-monitor.js';
export { processXmlProcessor } from './xml-processor.js';
export { processSearchSync, reindexAllDocuments, batchIndexDocuments } from './search-sync.js';
