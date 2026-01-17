#!/usr/bin/env node
import { execSync } from 'node:child_process';

const portArg = process.argv[2];
const port = Number(portArg);

if (!portArg || Number.isNaN(port) || port <= 0) {
  console.error('Uso: node tools/kill-port.mjs <porta>');
  process.exit(1);
}

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
}

function isWindows() {
  return process.platform === 'win32';
}

function killPid(pid) {
  if (!pid) return false;
  const n = Number(pid);
  if (!Number.isFinite(n)) return false;

  try {
    if (isWindows()) {
      sh(`taskkill /F /PID ${n} /T`);
    } else {
      sh(`kill -9 ${n}`);
    }
    return true;
  } catch (e) {
    return false;
  }
}

function getListeningPidsWindows(port) {
  // Example line:
  // TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       11636
  const out = sh(`netstat -ano | findstr :${port} | findstr LISTENING`);
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const parts = t.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid) pids.add(pid);
  }
  return [...pids];
}

function getListeningPidsUnix(port) {
  // Prefer lsof, fallback to ss.
  try {
    const out = sh(`lsof -ti tcp:${port} -sTCP:LISTEN || true`);
    return out
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    const out = sh(`ss -lptn 'sport = :${port}' 2>/dev/null || true`);
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/pid=(\d+)/g);
      if (!m) continue;
      for (const item of m) pids.add(item.replace('pid=', ''));
    }
    return [...pids];
  }
}

let pids = [];
try {
  pids = isWindows() ? getListeningPidsWindows(port) : getListeningPidsUnix(port);
} catch (e) {
  console.error(`[FAIL] Nao foi possivel listar processos na porta ${port}.`);
  console.error(String(e?.message || e));
  process.exit(1);
}

if (!pids.length) {
  console.log(`[OK] Nenhum processo LISTENING encontrado na porta ${port}.`);
  process.exit(0);
}

let killed = 0;
for (const pid of pids) {
  const ok = killPid(pid);
  console.log(`${ok ? '[OK]' : '[WARN]'} kill PID ${pid} on :${port}`);
  if (ok) killed++;
}

if (killed === 0) {
  console.error(`[FAIL] Nao consegui encerrar processos na porta ${port}.`);
  process.exit(1);
}

console.log(`[DONE] Encerrados ${killed} processo(s) na porta ${port}.`);
