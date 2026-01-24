import { EventEmitter } from 'node:events';

import pino from 'pino';
export const logger = pino({ name: 'fiscalzen-jobs' });

export type JobEventType = 'started' | 'progress' | 'completed' | 'failed';

export interface JobEvent {
  type: JobEventType;
  queue: string;
  jobId?: string;
  ts: string;
  // Optional values
  progress?: number;
  durationMs?: number;
  errorMessage?: string;
}

export interface JobMetrics {
  running: number;
  completed: number;
  failed: number;
  lastRunAt?: string;
  lastError?: string;
  byQueue: Record<string, { running: number; completed: number; failed: number }>;
}

const emitter = new EventEmitter();

const metrics: JobMetrics = {
  running: 0,
  completed: 0,
  failed: 0,
  byQueue: {},
};

function ensureQueue(queue: string) {
  if (!metrics.byQueue[queue]) {
    metrics.byQueue[queue] = { running: 0, completed: 0, failed: 0 };
  }
  return metrics.byQueue[queue];
}

function isoNow() {
  return new Date().toISOString();
}

export function getJobMetrics(): JobMetrics {
  // Cheap deep clone that works for our plain-object shape.
  return JSON.parse(JSON.stringify(metrics)) as JobMetrics;
}

export function onJobEvent(listener: (event: JobEvent) => void) {
  emitter.on('job', listener);
  return () => emitter.off('job', listener);
}

export function emitJobStarted(queue: string, jobId?: string) {
  metrics.running += 1;
  ensureQueue(queue).running += 1;
  metrics.lastRunAt = isoNow();

  emitter.emit('job', {
    type: 'started',
    queue,
    jobId,
    ts: isoNow(),
  } satisfies JobEvent);
}

export function emitJobProgress(queue: string, progress: number, jobId?: string) {
  emitter.emit('job', {
    type: 'progress',
    queue,
    jobId,
    progress,
    ts: isoNow(),
  } satisfies JobEvent);
}

export function emitJobCompleted(queue: string, durationMs?: number, jobId?: string) {
  if (metrics.running > 0) metrics.running -= 1;
  const q = ensureQueue(queue);
  if (q.running > 0) q.running -= 1;

  metrics.completed += 1;
  q.completed += 1;
  metrics.lastRunAt = isoNow();

  emitter.emit('job', {
    type: 'completed',
    queue,
    jobId,
    durationMs,
    ts: isoNow(),
  } satisfies JobEvent);
}

export function emitJobFailed(queue: string, error: unknown, jobId?: string) {
  if (metrics.running > 0) metrics.running -= 1;
  const q = ensureQueue(queue);
  if (q.running > 0) q.running -= 1;

  metrics.failed += 1;
  q.failed += 1;
  metrics.lastRunAt = isoNow();
  metrics.lastError = error instanceof Error ? error.message : String(error);

  emitter.emit('job', {
    type: 'failed',
    queue,
    jobId,
    errorMessage: metrics.lastError,
    ts: isoNow(),
  } satisfies JobEvent);
}

// Backwards-compatible named export some code may be using.
export const jobsEvents = {
  on: onJobEvent,
  getMetrics: getJobMetrics,
  emitStarted: emitJobStarted,
  emitProgress: emitJobProgress,
  emitCompleted: emitJobCompleted,
  emitFailed: emitJobFailed,
};


/* FISCALZEN_JOBS_WORKER_HEALTH_COMPAT:START */
// NOTE: This block is safe in dev/prod. It only tracks worker health in-memory.

export type WorkerHealth = {
  status: 'ok' | 'degraded' | 'down';
  workers: Record<string, {
    running: boolean;
    lastHeartbeat?: string;
    lastError?: string;
  }>;
  updatedAt: string;
};

const __workerState: Map<string, {
  running: boolean;
  lastHeartbeat?: Date;
  lastError?: unknown;
}> = new Map();

function __toIso(d?: Date) {
  return d ? d.toISOString() : undefined;
}

/**
 * Attach minimal event hooks to a BullMQ Worker (or any EventEmitter-like worker).
 * This is best-effort; if the worker does not expose these events, we still mark it as running.
 */
export function setupWorkerEvents(workerName: string, worker: any) {
  try {
    __workerState.set(workerName, { running: true, lastHeartbeat: new Date() });

    if (worker && typeof worker.on === 'function') {
      // BullMQ Worker emits: 'completed', 'failed', 'error', 'stalled', etc.
      worker.on('completed', () => {
        const s = __workerState.get(workerName) ?? { running: true };
        s.running = true;
        s.lastHeartbeat = new Date();
        __workerState.set(workerName, s);
      });
      worker.on('failed', (_job: unknown, err: unknown) => {
        const s = __workerState.get(workerName) ?? { running: true };
        s.running = true;
        s.lastHeartbeat = new Date();
        s.lastError = err;
        __workerState.set(workerName, s);
        try {
          logger?.error?.({ worker: workerName, err }, 'Worker job failed');
        } catch {
          // Ignore logging errors
        }
      });
      worker.on('error', (err: any) => {
        const s = __workerState.get(workerName) ?? { running: true };
        s.running = false;
        s.lastError = err;
        __workerState.set(workerName, s);
        try {
          logger?.error?.({ worker: workerName, err }, 'Worker error');
        } catch {
          // Ignore logging errors
        }
      });
    }
  } catch (err) {
    try {
      logger?.warn?.({ worker: workerName, err }, 'setupWorkerEvents failed');
    } catch {
      // Ignore logging errors
    }
  }
}

export function getWorkerHealth(): WorkerHealth {
  const workers: WorkerHealth['workers'] = {};

  for (const [name, state] of __workerState.entries()) {
    workers[name] = {
      running: !!state.running,
      lastHeartbeat: __toIso(state.lastHeartbeat),
      lastError: state.lastError ? String((state.lastError as any)?.message ?? state.lastError) : undefined,
    };
  }

  const all = Object.values(workers);
  const any = all.length > 0;
  const anyDown = any && all.some((w) => !w.running);
  const anyDegraded = any && all.some((w) => !!w.lastError);

  const status: WorkerHealth['status'] = !any ? 'down' : anyDown ? 'down' : anyDegraded ? 'degraded' : 'ok';

  return {
    status,
    workers,
    updatedAt: new Date().toISOString(),
  };
}

/* FISCALZEN_JOBS_WORKER_HEALTH_COMPAT:END */
