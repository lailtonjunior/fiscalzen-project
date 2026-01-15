import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database';
import { companies, nsuControl } from '@fiscalzen/database/schema';
import { NotFoundError } from '../../utils/errors';
import {
  getAllQueuesStatus,
  sefazMonitorQueue,
  xmlProcessorQueue,
  searchSyncQueue,
} from '../../jobs/queues';
import { getWorkersStatus, isWorkersRunning } from '../../jobs/workers';
import { getJobMetrics } from '../../jobs/events';
import { triggerCompanySync, triggerAllCompaniesSync } from '../../jobs/scheduler';

export const jobsService = {
  async getStatus() {
    const [queuesStatus, workersStatus, metrics] = await Promise.all([
      getAllQueuesStatus(),
      getWorkersStatus(),
      getJobMetrics(),
    ]);

    return {
      healthy: isWorkersRunning(),
      queues: queuesStatus,
      workers: workersStatus,
      metrics,
      timestamp: new Date().toISOString(),
    };
  },

  async getCompanyJobs(tenantId: string, companyId: string) {
    // Verify company
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!company) {
      throw new NotFoundError('Empresa', companyId);
    }

    // Get NSU status
    const nsuEntries = await db
      .select()
      .from(nsuControl)
      .where(eq(nsuControl.companyId, companyId));

    // Get pending jobs for this company
    const [sefazJobs, xmlJobs] = await Promise.all([
      sefazMonitorQueue.getJobs(['waiting', 'active', 'delayed']),
      xmlProcessorQueue.getJobs(['waiting', 'active', 'delayed']),
    ]);

    const companyJobs = {
      sefazMonitor: sefazJobs.filter((j) => j.data?.companyId === companyId),
      xmlProcessor: xmlJobs.filter((j) => j.data?.companyId === companyId),
    };

    return {
      company: {
        id: company.id,
        razaoSocial: company.razaoSocial,
        cnpj: company.cnpj,
      },
      nsuStatus: nsuEntries.map((entry) => ({
        docType: entry.docType,
        lastNsu: entry.lastNsu,
        maxNsu: entry.maxNsu,
        lastSync: entry.lastSync,
        nextSync: entry.nextSync,
        syncStatus: entry.syncStatus,
        errorCount: entry.errorCount,
        lastError: entry.lastError,
      })),
      pendingJobs: {
        sefazMonitor: companyJobs.sefazMonitor.length,
        xmlProcessor: companyJobs.xmlProcessor.length,
      },
      jobs: companyJobs.sefazMonitor.slice(0, 10).map((j) => ({
        id: j.id,
        name: j.name,
        state: j.getState(),
        data: j.data,
        timestamp: j.timestamp,
        processedOn: j.processedOn,
        finishedOn: j.finishedOn,
        attemptsMade: j.attemptsMade,
      })),
    };
  },

  async triggerSync(
    tenantId: string,
    companyId: string,
    docTypes?: Array<'NFE' | 'CTE' | 'MDFE'>
  ) {
    // Verify company
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!company) {
      throw new NotFoundError('Empresa', companyId);
    }

    if (!company.certificate) {
      throw new Error('Empresa nao possui certificado configurado');
    }

    const results = await triggerCompanySync(tenantId, companyId, docTypes);

    return {
      companyId,
      companyName: company.razaoSocial,
      results,
      triggeredAt: new Date().toISOString(),
    };
  },

  async triggerAllSync(tenantId: string) {
    const results = await triggerAllCompaniesSync(tenantId);

    return {
      tenantId,
      companies: results,
      totalScheduled: results.reduce((sum, r) => sum + r.scheduled, 0),
      triggeredAt: new Date().toISOString(),
    };
  },

  async getQueueDetails(queueName: string) {
    let queue;

    switch (queueName) {
      case 'sefaz-monitor':
        queue = sefazMonitorQueue;
        break;
      case 'xml-processor':
        queue = xmlProcessorQueue;
        break;
      case 'search-sync':
        queue = searchSyncQueue;
        break;
      default:
        throw new NotFoundError('Fila', queueName);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(0, 10),
      queue.getActive(0, 10),
      queue.getCompleted(0, 10),
      queue.getFailed(0, 10),
      queue.getDelayed(0, 10),
    ]);

    return {
      name: queueName,
      counts: {
        waiting: await queue.getWaitingCount(),
        active: await queue.getActiveCount(),
        completed: await queue.getCompletedCount(),
        failed: await queue.getFailedCount(),
        delayed: await queue.getDelayedCount(),
      },
      jobs: {
        waiting: waiting.map(formatJob),
        active: active.map(formatJob),
        completed: completed.slice(0, 5).map(formatJob),
        failed: failed.slice(0, 5).map(formatJob),
        delayed: delayed.map(formatJob),
      },
    };
  },

  async retryFailedJobs(queueName: string) {
    let queue;

    switch (queueName) {
      case 'sefaz-monitor':
        queue = sefazMonitorQueue;
        break;
      case 'xml-processor':
        queue = xmlProcessorQueue;
        break;
      case 'search-sync':
        queue = searchSyncQueue;
        break;
      default:
        throw new NotFoundError('Fila', queueName);
    }

    const failed = await queue.getFailed();
    let retried = 0;

    for (const job of failed) {
      await job.retry();
      retried++;
    }

    return { queueName, retried };
  },

  async cleanQueue(queueName: string, status: 'completed' | 'failed') {
    let queue;

    switch (queueName) {
      case 'sefaz-monitor':
        queue = sefazMonitorQueue;
        break;
      case 'xml-processor':
        queue = xmlProcessorQueue;
        break;
      case 'search-sync':
        queue = searchSyncQueue;
        break;
      default:
        throw new NotFoundError('Fila', queueName);
    }

    const grace = 1000; // 1 second grace period
    const limit = 1000; // Max jobs to clean

    await queue.clean(grace, limit, status);

    return { queueName, status, cleaned: true };
  },
};

function formatJob(job: { id?: string; name: string; data: unknown; timestamp?: number; attemptsMade: number; failedReason?: string }) {
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    timestamp: job.timestamp ? new Date(job.timestamp).toISOString() : null,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
  };
}
