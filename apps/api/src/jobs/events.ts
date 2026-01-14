import pino from 'pino';
import type { Worker, Job } from 'bullmq';
import { db } from '../config/database.js';
import { auditLogs } from '@fiscalzen/database/schema';
import { env } from '../config/env.js';

// ============================================
// Logger Configuration
// ============================================

export const logger = pino({
  name: 'fiscalzen-jobs',
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

// ============================================
// Job Metrics
// ============================================

interface JobMetrics {
  completed: number;
  failed: number;
  totalDuration: number;
  lastCompleted?: Date;
  lastFailed?: Date;
}

const metrics: Map<string, JobMetrics> = new Map();

function getMetrics(queueName: string): JobMetrics {
  if (!metrics.has(queueName)) {
    metrics.set(queueName, {
      completed: 0,
      failed: 0,
      totalDuration: 0,
    });
  }
  return metrics.get(queueName)!;
}

export function getJobMetrics(): Record<string, JobMetrics> {
  const result: Record<string, JobMetrics> = {};
  for (const [name, metric] of metrics) {
    result[name] = { ...metric };
  }
  return result;
}

// ============================================
// Event Handlers
// ============================================

export function setupWorkerEvents(worker: Worker) {
  const queueName = worker.name;

  worker.on('completed', async (job: Job, result: unknown) => {
    const duration = Date.now() - (job.timestamp ?? Date.now());
    const m = getMetrics(queueName);
    m.completed++;
    m.totalDuration += duration;
    m.lastCompleted = new Date();

    logger.info({
      event: 'job_completed',
      queue: queueName,
      jobId: job.id,
      jobName: job.name,
      duration,
      result: typeof result === 'object' ? result : { value: result },
    });
  });

  worker.on('failed', async (job: Job | undefined, error: Error) => {
    const m = getMetrics(queueName);
    m.failed++;
    m.lastFailed = new Date();

    logger.error({
      event: 'job_failed',
      queue: queueName,
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
      stack: error.stack,
    });

    // Record in audit log
    if (job) {
      await recordAuditLog({
        action: 'job_failed',
        resource: queueName,
        resourceId: job.id ?? 'unknown',
        details: {
          jobName: job.name,
          error: error.message,
          data: job.data,
          attemptsMade: job.attemptsMade,
        },
      });
    }
  });

  worker.on('error', (error: Error) => {
    logger.error({
      event: 'worker_error',
      queue: queueName,
      error: error.message,
      stack: error.stack,
    });
  });

  worker.on('stalled', (jobId: string) => {
    logger.warn({
      event: 'job_stalled',
      queue: queueName,
      jobId,
    });
  });

  worker.on('active', (job: Job) => {
    logger.debug({
      event: 'job_active',
      queue: queueName,
      jobId: job.id,
      jobName: job.name,
    });
  });

  worker.on('progress', (job: Job, progress: number | object) => {
    logger.debug({
      event: 'job_progress',
      queue: queueName,
      jobId: job.id,
      progress,
    });
  });
}

// ============================================
// Audit Log
// ============================================

interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId: string;
  tenantId?: string;
  userId?: string;
  details?: Record<string, unknown>;
}

async function recordAuditLog(entry: AuditLogEntry) {
  try {
    await db.insert(auditLogs).values({
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      tenantId: entry.tenantId,
      userId: entry.userId,
      details: entry.details,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error({
      event: 'audit_log_failed',
      error: error instanceof Error ? error.message : 'Unknown',
      entry,
    });
  }
}

// ============================================
// Job Events for External Monitoring
// ============================================

type JobEventHandler = (event: JobEvent) => void;

interface JobEvent {
  type: 'completed' | 'failed' | 'stalled' | 'active';
  queue: string;
  jobId?: string;
  jobName?: string;
  timestamp: Date;
  duration?: number;
  error?: string;
  data?: unknown;
}

const eventHandlers: JobEventHandler[] = [];

export function onJobEvent(handler: JobEventHandler) {
  eventHandlers.push(handler);
  return () => {
    const index = eventHandlers.indexOf(handler);
    if (index > -1) {
      eventHandlers.splice(index, 1);
    }
  };
}

function emitJobEvent(event: JobEvent) {
  for (const handler of eventHandlers) {
    try {
      handler(event);
    } catch (error) {
      logger.error({
        event: 'event_handler_error',
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }
}

// ============================================
// Health Check
// ============================================

export interface WorkerHealth {
  name: string;
  isRunning: boolean;
  isPaused: boolean;
  concurrency: number;
}

export function getWorkerHealth(worker: Worker): WorkerHealth {
  return {
    name: worker.name,
    isRunning: worker.isRunning(),
    isPaused: worker.isPaused(),
    concurrency: worker.opts.concurrency ?? 1,
  };
}
