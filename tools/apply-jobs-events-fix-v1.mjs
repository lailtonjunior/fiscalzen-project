#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const rel = 'apps/api/src/jobs/events.ts';
const filePath = path.join(repoRoot, rel);

function log(msg) {
  process.stdout.write(String(msg) + '\n');
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function safeRead(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function safeWrite(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

// Minimal, stable jobs/events implementation.
// Keeps runtime small and ensures types are exported at top-level.
const newContent = `import { EventEmitter } from 'node:events';

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
`;

const current = safeRead(filePath);
if (current == null) {
  log(`[FAIL] Arquivo nao encontrado: ${rel}`);
  process.exit(1);
}

// Backup
const backupDir = path.join(repoRoot, 'tools', '_backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `events.ts.${nowStamp()}.bak`);
fs.writeFileSync(backupPath, current, 'utf8');
log(`[OK] Backup criado: ${path.relative(repoRoot, backupPath)}`);

// Write replacement
safeWrite(filePath, newContent);
log(`[OK] Reescrito: ${rel}`);

log('\nNext steps:');
log('1) Reinicie o API: pnpm --filter @fiscalzen/api dev');
log('2) Teste health: node tools/check-api-health.mjs');
