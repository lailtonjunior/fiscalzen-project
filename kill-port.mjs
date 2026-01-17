#!/usr/bin/env node
/**
 * Kill the process listening on a given TCP port.
 * Works on Windows (netstat/taskkill) and Unix (lsof/kill).
 * Usage: node tools/kill-port.mjs 3000
 */

import { execSync } from 'node:child_process';

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
}

function isWindows() {
  return process.platform === 'win32';
}

function parsePortArg() {
  const raw = process.argv[2];
  const port = Number(raw);
  if (!raw || Number.isNaN(port) || port <= 0 || port > 65535) {
    console.error('Usage: node tools/kill-port.mjs <port>');
    process.exit(1);
  }
  return port;
}

function unique(arr) {
  return [...new Set(arr)];
}

function killOnWindows(port) {
  // netstat output example:
  // TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   11636
  const out = run(`netstat -ano | findstr LISTENING | findstr :${port}`);
  const pids = [];
  for (const line of out.split(/\r?\n/)) {
    const m = line.trim().match(/\sLISTENING\s+(\d+)\s*$/i);
    if (m) pids.push(m[1]);
  }

  const uniq = unique(pids).filter((p) => p !== '0');
  if (uniq.length === 0) {
    console.log(`[NOOP] No LISTENING process found on port ${port}`);
    return;
  }

  for (const pid of uniq) {
    try {
      run(`taskkill /PID ${pid} /F`);
      console.log(`[OK] Killed PID ${pid} on port ${port}`);
    } catch (e) {
      console.error(`[WARN] Failed to kill PID ${pid}: ${String(e?.message ?? e)}`);
    }
  }
}

function killOnUnix(port) {
  let pids = [];
  try {
    const out = run(`lsof -ti tcp:${port} -sTCP:LISTEN`);
    pids = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch {
    // lsof may not exist
  }

  if (pids.length === 0) {
    try {
      const out = run(`bash -lc "ss -lptn 'sport = :${port}' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p'"`);
      pids = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    } catch {
      // ignore
    }
  }

  const uniq = unique(pids);
  if (uniq.length === 0) {
    console.log(`[NOOP] No LISTENING process found on port ${port}`);
    return;
  }

  for (const pid of uniq) {
    try {
      run(`kill -9 ${pid}`);
      console.log(`[OK] Killed PID ${pid} on port ${port}`);
    } catch (e) {
      console.error(`[WARN] Failed to kill PID ${pid}: ${String(e?.message ?? e)}`);
    }
  }
}

const port = parsePortArg();

try {
  if (isWindows()) killOnWindows(port);
  else killOnUnix(port);
} catch (e) {
  const msg = String(e?.message ?? e);
  if (msg.includes('findstr') || msg.includes('No such file') || msg.includes('not found')) {
    console.log(`[NOOP] No LISTENING process found on port ${port}`);
    process.exit(0);
  }
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}
