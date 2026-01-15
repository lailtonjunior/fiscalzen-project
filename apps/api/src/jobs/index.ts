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
} from './queues';

// Workers
export {
  startWorkers,
  stopWorkers,
  pauseWorkers,
  resumeWorkers,
  getWorkersStatus,
  isWorkersRunning,
} from './workers';

// Scheduler
export {
  startScheduler,
  stopScheduler,
  runScheduler,
  triggerCompanySync,
  triggerAllCompaniesSync,
  initializeCompanyNsuControl,
} from './scheduler';

// Events & Logging
export {
  logger,
  getJobMetrics,
  onJobEvent,
  type WorkerHealth,
} from './events';

// Job Processors
export { processSefazMonitor } from './sefaz-monitor';
export { processXmlProcessor } from './xml-processor';
export { processSearchSync, reindexAllDocuments, batchIndexDocuments } from './search-sync';
