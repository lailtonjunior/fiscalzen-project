#!/usr/bin/env node
/**
 * Kill the process(es) listening on a given TCP port.
 *
 * Windows: netstat -ano + taskkill
 * Unix: lsof + kill
 *
 * Usage:
 *   node tools/kill-port.mjs 3000
 */

import { execSync } from 'node:child_process';

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
}

function isWindows() {
  return process.platform === 'win32';
}

function parsePort() {
  const raw = process.argv[2];
  const port = Number(raw);
  if (!raw || !Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error('[ERROR] Usage: node tools/kill-port.mjs <port>');
    process.exit(1);
  }
  return port;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function findPidsWindows(port) {
  let out = '';
  try {
    out = run(`netstat -ano | findstr :${port}`);
  } catch {
    return [];
  }

  const pids = [];
  for (const line of out.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Example:
    // TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   11636
    const parts = trimmed.split(/\s+/);
    const last = parts[parts.length - 1];
    const pid = Number(last);
    if (Number.isInteger(pid) && pid > 0) {
      // Prefer LISTENING if present, but keep any that matches :port
      pids.push(pid);
    }
  }
  return uniq(pids);
}

function killWindows(pid) {
  try {
    run(`taskkill /PID ${pid} /F`);
    console.log(`[OK] Killed PID ${pid}`);
  } catch (e) {
    console.error(`[FAIL] Could not kill PID ${pid}`);
    const msg = (e && e.stderr) ? String(e.stderr) : String(e);
    if (msg) console.error(msg.trim());
  }
}

function findPidsUnix(port) {
  try {
    const out = run(`lsof -i TCP:${port} -sTCP:LISTEN -t`);
    return uniq(out.split(/\r?\n/).map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0));
  } catch {
    return [];
  }
}

function killUnix(pid) {
  try {
    process.kill(pid, 'SIGKILL');
    console.log(`[OK] Killed PID ${pid}`);
  } catch (e) {
    console.error(`[FAIL] Could not kill PID ${pid}: ${e?.message ?? e}`);
  }
}

const port = parsePort();
const pids = isWindows() ? findPidsWindows(port) : findPidsUnix(port);

if (pids.length === 0) {
  console.log(`[NOOP] No process is listening on port ${port}`);
  process.exit(0);
}

console.log(`[INFO] Port ${port} -> PIDs: ${pids.join(', ')}`);
for (const pid of pids) {
  if (isWindows()) killWindows(pid);
  else killUnix(pid);
}
