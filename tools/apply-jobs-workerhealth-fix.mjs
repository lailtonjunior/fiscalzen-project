#!/usr/bin/env node
/**
 * FiscalZen - Jobs events exports fix
 *
 * Ensures apps/api/src/jobs/events.ts exports:
 * - logger
 * - setupWorkerEvents
 * - getWorkerHealth
 * - WorkerHealth type
 *
 * This unblocks imports like:
 *   import { setupWorkerEvents, logger, getWorkerHealth, type WorkerHealth } from './events';
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rel = 'apps/api/src/jobs/events.ts';
const file = path.join(root, rel);

function exitFail(msg) {
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(file)) {
  exitFail(`Arquivo nao encontrado: ${rel}`);
}

let src = fs.readFileSync(file, 'utf8');

const hasGetWorkerHealth = /export\s+function\s+getWorkerHealth\s*\(/.test(src);
const hasWorkerHealthType = /export\s+type\s+WorkerHealth\b/.test(src) || /export\s+interface\s+WorkerHealth\b/.test(src);

// We only append a compat block if any piece is missing.
if (hasGetWorkerHealth && hasWorkerHealthType) {
  console.log(`[NOOP] ${rel} (getWorkerHealth/WorkerHealth ja existem)`);
  process.exit(0);
}

// Avoid duplicating compat blocks
const markerStart = '/* FISCALZEN_JOBS_WORKER_HEALTH_COMPAT:START */';
const markerEnd = '/* FISCALZEN_JOBS_WORKER_HEALTH_COMPAT:END */';
const hasMarker = src.includes(markerStart) && src.includes(markerEnd);

if (hasMarker) {
  // Replace existing block to ensure it is complete
  const re = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`, 'm');
  src = src.replace(re, '');
}

const block = `\n\n${markerStart}\n// NOTE: This block is safe in dev/prod. It only tracks worker health in-memory.\n\nexport type WorkerHealth = {\n  status: 'ok' | 'degraded' | 'down';\n  workers: Record<string, {\n    running: boolean;\n    lastHeartbeat?: string;\n    lastError?: string;\n  }>;\n  updatedAt: string;\n};\n\nconst __workerState: Map<string, {\n  running: boolean;\n  lastHeartbeat?: Date;\n  lastError?: unknown;\n}> = new Map();\n\nfunction __toIso(d?: Date) {\n  return d ? d.toISOString() : undefined;\n}\n\n/**\n * Attach minimal event hooks to a BullMQ Worker (or any EventEmitter-like worker).\n * This is best-effort; if the worker does not expose these events, we still mark it as running.\n */\nexport function setupWorkerEvents(workerName: string, worker: any) {\n  try {\n    __workerState.set(workerName, { running: true, lastHeartbeat: new Date() });\n\n    if (worker && typeof worker.on === 'function') {\n      // BullMQ Worker emits: 'completed', 'failed', 'error', 'stalled', etc.\n      worker.on('completed', () => {\n        const s = __workerState.get(workerName) ?? { running: true };\n        s.running = true;\n        s.lastHeartbeat = new Date();\n        __workerState.set(workerName, s);\n      });\n      worker.on('failed', (job: any, err: any) => {\n        const s = __workerState.get(workerName) ?? { running: true };\n        s.running = true;\n        s.lastHeartbeat = new Date();\n        s.lastError = err;\n        __workerState.set(workerName, s);\n        try {\n          logger?.error?.({ worker: workerName, err }, 'Worker job failed');\n        } catch {}\n      });\n      worker.on('error', (err: any) => {\n        const s = __workerState.get(workerName) ?? { running: true };\n        s.running = false;\n        s.lastError = err;\n        __workerState.set(workerName, s);\n        try {\n          logger?.error?.({ worker: workerName, err }, 'Worker error');\n        } catch {}\n      });\n    }\n  } catch (err) {\n    try {\n      logger?.warn?.({ worker: workerName, err }, 'setupWorkerEvents failed');\n    } catch {}\n  }\n}\n\nexport function getWorkerHealth(): WorkerHealth {\n  const workers: WorkerHealth['workers'] = {};\n\n  for (const [name, state] of __workerState.entries()) {\n    workers[name] = {\n      running: !!state.running,\n      lastHeartbeat: __toIso(state.lastHeartbeat),\n      lastError: state.lastError ? String((state.lastError as any)?.message ?? state.lastError) : undefined,\n    };\n  }\n\n  const all = Object.values(workers);
  const any = all.length > 0;
  const anyDown = any && all.some((w) => !w.running);
  const anyDegraded = any && all.some((w) => !!w.lastError);
\n  const status: WorkerHealth['status'] = !any ? 'down' : anyDown ? 'down' : anyDegraded ? 'degraded' : 'ok';\n\n  return {\n    status,\n    workers,\n    updatedAt: new Date().toISOString(),\n  };\n}\n\n${markerEnd}\n`;

// Ensure file ends with newline
if (!src.endsWith('\n')) src += '\n';

src += block;
fs.writeFileSync(file, src, 'utf8');

console.log(`[OK] ${rel} (WorkerHealth/getWorkerHealth compat adicionados)`);
console.log('Next: reinicie o API: pnpm --filter @fiscalzen/api dev');
