import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../config/redis';

// ============================================
// Queue Configuration
// ============================================

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 60000, // 1 minute initial delay
  },
  removeOnComplete: 100,
  removeOnFail: 1000,
};

// ============================================
// Queue Definitions
// ============================================

export const sefazMonitorQueue = new Queue('sefaz-monitor', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
  },
});

export const xmlProcessorQueue = new Queue('xml-processor', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
  },
});

export const searchSyncQueue = new Queue('search-sync', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
  },
});

export const nfseMonitorQueue = new Queue('nfse-monitor', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
  },
});

// ============================================
// Queue Events for monitoring
// ============================================

export const sefazMonitorEvents = new QueueEvents('sefaz-monitor', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
});

export const xmlProcessorEvents = new QueueEvents('xml-processor', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
});

export const searchSyncEvents = new QueueEvents('search-sync', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
});

export const nfseMonitorEvents = new QueueEvents('nfse-monitor', {
  connection: { ...(redis as any).options, maxRetriesPerRequest: null },
});

// ============================================
// Job Types
// ============================================

export interface SefazMonitorJobData {
  companyId: string;
  tenantId: string;
  docType: 'NFE' | 'CTE' | 'MDFE';
}

export interface XmlProcessorJobData {
  companyId: string;
  tenantId: string;
  nsu: string;
  schema: string;
  xmlContent: string;
  docType: 'NFE' | 'CTE' | 'MDFE';
  isResumo: boolean;
  isEvento: boolean;
}

export interface SearchSyncJobData {
  documentId: string;
  tenantId: string;
  action: 'index' | 'update' | 'delete';
}

export interface NfseMonitorJobData {
  companyId: string;
  tenantId: string;
  codigoMunicipio: string;
  tipo: 'abrasf' | 'rpa';
}

// ============================================
// Queue Helpers
// ============================================

export async function addSefazMonitorJob(data: SefazMonitorJobData, delay?: number) {
  const jobId = `sefaz-${data.companyId}-${data.docType}`;

  return sefazMonitorQueue.add('monitor', data, {
    jobId,
    delay,
    // Prevent duplicate jobs
    removeOnComplete: true,
  });
}

export async function addXmlProcessorJob(data: XmlProcessorJobData) {
  const jobId = `xml-${data.companyId}-${data.nsu}`;

  return xmlProcessorQueue.add('process', data, {
    jobId,
  });
}

export async function addSearchSyncJob(data: SearchSyncJobData) {
  const jobId = `search-${data.documentId}-${data.action}`;

  return searchSyncQueue.add('sync', data, {
    jobId,
  });
}

export async function addNfseMonitorJob(data: NfseMonitorJobData, delay?: number) {
  const jobId = `nfse-${data.companyId}-${data.codigoMunicipio}`;

  return nfseMonitorQueue.add('monitor', data, {
    jobId,
    delay,
    removeOnComplete: true,
  });
}

// ============================================
// Queue Status
// ============================================

export async function getQueueStatus(queue: Queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    name: queue.name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
}

export async function getAllQueuesStatus() {
  return Promise.all([
    getQueueStatus(sefazMonitorQueue),
    getQueueStatus(xmlProcessorQueue),
    getQueueStatus(searchSyncQueue),
    getQueueStatus(nfseMonitorQueue),
  ]);
}

// ============================================
// Cleanup
// ============================================

export async function closeQueues() {
  await Promise.all([
    sefazMonitorQueue.close(),
    xmlProcessorQueue.close(),
    searchSyncQueue.close(),
    nfseMonitorQueue.close(),
    sefazMonitorEvents.close(),
    xmlProcessorEvents.close(),
    searchSyncEvents.close(),
    nfseMonitorEvents.close(),
  ]);
}
