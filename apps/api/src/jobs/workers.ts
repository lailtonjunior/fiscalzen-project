import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { processSefazMonitor } from './sefaz-monitor';
import { processXmlProcessor } from './xml-processor';
import { processSearchSync } from './search-sync';
import { processNfseMonitor } from './nfse-monitor';
import { processCertificateChecker } from './certificate-checker';
import { setupWorkerEvents, logger, getWorkerHealth, type WorkerHealth } from './events';

// ============================================
// Worker Instances
// ============================================

let sefazMonitorWorker: Worker | null = null;
let xmlProcessorWorker: Worker | null = null;
let searchSyncWorker: Worker | null = null;
let nfseMonitorWorker: Worker | null = null;
let certificateCheckerWorker: Worker | null = null;

// ============================================
// Worker Configuration
// ============================================

const WORKER_CONFIG = {
  sefazMonitor: {
    name: 'sefaz-monitor',
    concurrency: 2, // Low concurrency to respect SEFAZ rate limits
  },
  xmlProcessor: {
    name: 'xml-processor',
    concurrency: 5, // Can process multiple XMLs in parallel
  },
  searchSync: {
    name: 'search-sync',
    concurrency: 10, // Meilisearch can handle high throughput
  },
  nfseMonitor: {
    name: 'nfse-monitor',
    concurrency: 2, // Low concurrency for RPA and API calls
  },
  certificateChecker: {
    name: 'certificate-checker',
    concurrency: 1, // Single worker, runs once per day
  },
};

// ============================================
// Start Workers
// ============================================

export async function startWorkers() {
  logger.info('Starting job workers...');

  // SEFAZ Monitor Worker
  sefazMonitorWorker = new Worker(
    WORKER_CONFIG.sefazMonitor.name,
    processSefazMonitor,
    {
      connection: redis,
      concurrency: WORKER_CONFIG.sefazMonitor.concurrency,
      limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute per worker
      },
    }
  );
  setupWorkerEvents(WORKER_CONFIG.sefazMonitor.name, sefazMonitorWorker);
  logger.info(`Started ${WORKER_CONFIG.sefazMonitor.name} worker`);

  // XML Processor Worker
  xmlProcessorWorker = new Worker(
    WORKER_CONFIG.xmlProcessor.name,
    processXmlProcessor,
    {
      connection: redis,
      concurrency: WORKER_CONFIG.xmlProcessor.concurrency,
    }
  );
  setupWorkerEvents(WORKER_CONFIG.xmlProcessor.name, xmlProcessorWorker);
  logger.info(`Started ${WORKER_CONFIG.xmlProcessor.name} worker`);

  // Search Sync Worker
  searchSyncWorker = new Worker(
    WORKER_CONFIG.searchSync.name,
    processSearchSync,
    {
      connection: redis,
      concurrency: WORKER_CONFIG.searchSync.concurrency,
    }
  );
  setupWorkerEvents(WORKER_CONFIG.searchSync.name, searchSyncWorker);
  logger.info(`Started ${WORKER_CONFIG.searchSync.name} worker`);

  // NFSe Monitor Worker
  nfseMonitorWorker = new Worker(
    WORKER_CONFIG.nfseMonitor.name,
    processNfseMonitor,
    {
      connection: redis,
      concurrency: WORKER_CONFIG.nfseMonitor.concurrency,
      limiter: {
        max: 5,
        duration: 60000, // Max 5 jobs per minute for RPA
      },
    }
  );
  setupWorkerEvents(WORKER_CONFIG.nfseMonitor.name, nfseMonitorWorker);
  logger.info(`Started ${WORKER_CONFIG.nfseMonitor.name} worker`);

  // Certificate Checker Worker
  certificateCheckerWorker = new Worker(
    WORKER_CONFIG.certificateChecker.name,
    processCertificateChecker,
    {
      connection: redis,
      concurrency: WORKER_CONFIG.certificateChecker.concurrency,
    }
  );
  setupWorkerEvents(WORKER_CONFIG.certificateChecker.name, certificateCheckerWorker);
  logger.info(`Started ${WORKER_CONFIG.certificateChecker.name} worker`);

  logger.info('All job workers started');
}

// ============================================
// Stop Workers
// ============================================

export async function stopWorkers() {
  logger.info('Stopping job workers...');

  const workers = [sefazMonitorWorker, xmlProcessorWorker, searchSyncWorker, nfseMonitorWorker, certificateCheckerWorker];

  await Promise.all(
    workers.map(async (worker) => {
      if (worker) {
        await worker.close();
        logger.info(`Stopped ${worker.name} worker`);
      }
    })
  );

  sefazMonitorWorker = null;
  xmlProcessorWorker = null;
  searchSyncWorker = null;
  nfseMonitorWorker = null;
  certificateCheckerWorker = null;

  logger.info('All job workers stopped');
}

// ============================================
// Pause/Resume Workers
// ============================================

export async function pauseWorkers() {
  logger.info('Pausing job workers...');

  const workers = [sefazMonitorWorker, xmlProcessorWorker, searchSyncWorker, nfseMonitorWorker, certificateCheckerWorker];

  await Promise.all(
    workers.map(async (worker) => {
      if (worker) {
        await worker.pause();
        logger.info(`Paused ${worker.name} worker`);
      }
    })
  );
}

export async function resumeWorkers() {
  logger.info('Resuming job workers...');

  const workers = [sefazMonitorWorker, xmlProcessorWorker, searchSyncWorker, nfseMonitorWorker, certificateCheckerWorker];

  await Promise.all(
    workers.map(async (worker) => {
      if (worker) {
        worker.resume();
        logger.info(`Resumed ${worker.name} worker`);
      }
    })
  );
}

// ============================================
// Worker Status
// ============================================

export function getWorkersStatus(): WorkerHealth {
  // Use the centralized getWorkerHealth from events.ts
  return getWorkerHealth();
}

export function isWorkersRunning(): boolean {
  return !!(sefazMonitorWorker && xmlProcessorWorker && searchSyncWorker && nfseMonitorWorker && certificateCheckerWorker);
}
