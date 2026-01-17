#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const scripts = [
  'apply-auth-dev-uuid-fix.mjs',
  'apply-dashboard-timeline-defaults.mjs',
  'apply-jobmetrics-export-fix.mjs',
  'apply-cert-encryption-env-fix.mjs',
  'apply-next-dev-cache-fix.mjs',
  'apply-web-local-env.mjs',
  'clean-web-next-cache.mjs',
  'apply-postgres-docker-fix.mjs',
];

let hasFail = false;
for (const s of scripts) {
  const p = path.join(process.cwd(), 'tools', s);
  const r = spawnSync(process.execPath, [p], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`[FAIL] ${s} (exit ${r.status})`);
    hasFail = true;
  }
}

if (hasFail) process.exit(1);
