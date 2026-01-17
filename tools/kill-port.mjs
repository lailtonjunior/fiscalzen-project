#!/usr/bin/env node
import { execSync } from 'node:child_process';

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

function isWindows() {
  return process.platform === 'win32';
}

const port = Number(process.argv[2]);
if (!port || Number.isNaN(port)) {
  console.error('Usage: node tools/kill-port.mjs <port>');
  process.exit(1);
}

try {
  if (isWindows()) {
    // netstat output: TCP    0.0.0.0:3000 ... LISTENING  11636
    const out = run(`cmd /c "netstat -ano | findstr LISTENING | findstr :${port}"`);
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.trim().match(/\sLISTENING\s+(\d+)\s*$/i);
      if (m) pids.add(m[1]);
    }

    if (pids.size === 0) {
      console.log(`[OK] No LISTENING process found on :${port}`);
      process.exit(0);
    }

    for (const pid of pids) {
      try {
        run(`cmd /c "taskkill /PID ${pid} /F"`);
        console.log(`[KILLED] :${port} pid=${pid}`);
      } catch (e) {
        console.warn(`[WARN] Could not kill pid=${pid} (port ${port}). Try running terminal as Admin.`);
      }
    }
  } else {
    // mac/linux
    const out = run(`bash -lc "lsof -ti tcp:${port} || true"`);
    const pids = out.split(/\s+/).filter(Boolean);
    if (pids.length === 0) {
      console.log(`[OK] No LISTENING process found on :${port}`);
      process.exit(0);
    }
    for (const pid of pids) {
      try {
        run(`bash -lc "kill -9 ${pid}"`);
        console.log(`[KILLED] :${port} pid=${pid}`);
      } catch {
        console.warn(`[WARN] Could not kill pid=${pid}`);
      }
    }
  }
} catch (err) {
  console.error(`[FAIL] kill-port.mjs failed:`, err?.message || err);
  process.exit(1);
}
  if (isWindows()) {
    // netstat output example:
    // TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   11636
    const cmd = `cmd /c "netstat -ano | findstr LISTENING | findstr :${port}"`;
    const out = run(cmd).trim();
    if (!out) {
      console.log(`[OK] No LISTENING process found on port ${port}`);
      process.exit(0);
    }

    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }

    if (pids.size === 0) {
      console.log(`[OK] No killable PID found on port ${port} (maybe system/closed sockets)`);
      process.exit(0);
    }

    for (const pid of pids) {
      try {
        execSync(`cmd /c "taskkill /PID ${pid} /F"`, { stdio: 'inherit' });
      } catch {
        // ignore
      }
    }

    console.log(`[OK] Killed PIDs on port ${port}: ${Array.from(pids).join(', ')}`);
    process.exit(0);
  }

  // POSIX fallback
  let pids = '';
  try {
    pids = run(`lsof -ti :${port} || true`).trim();
  } catch {
    // lsof may not exist
  }
  if (!pids) {
    try {
      pids = run(`fuser -n tcp ${port} 2>/dev/null || true`).trim();
    } catch {
      // ignore
    }
  }
  if (!pids) {
    console.log(`[OK] No process found on port ${port}`);
    process.exit(0);
  }
  const unique = Array.from(new Set(pids.split(/\s+/).filter(Boolean)));
  for (const pid of unique) {
    try { execSync(`kill -9 ${pid}`); } catch {}
  }
  console.log(`[OK] Killed PIDs on port ${port}: ${unique.join(', ')}`);
} catch (e) {
  console.error(`[FAIL] Could not kill port ${port}:`, e?.message ?? e);
  process.exit(1);
}
      for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }

    if (pids.size === 0) {
      console.log(`[OK] No PID parsed for port ${port}`);
      process.exit(0);
    }

    for (const pid of pids) {
      console.log(`[KILL] taskkill /PID ${pid} /F`);
      try {
        execSync(`cmd /c "taskkill /PID ${pid} /F"`, { stdio: 'inherit' });
      } catch (e) {
        // ignore per-pid failures
      }
    }

    console.log(`[DONE] Killed ${pids.size} process(es) on port ${port}`);
    process.exit(0);
  }

  // Unix-like
  const out = run(`bash -lc "lsof -ti tcp:${port} || true"`).trim();
  if (!out) {
    console.log(`[OK] No process found on port ${port}`);
    process.exit(0);
  }
  const pids = Array.from(new Set(out.split(/\s+/))).filter(Boolean);
  for (const pid of pids) {
    console.log(`[KILL] kill -9 ${pid}`);
    execSync(`bash -lc "kill -9 ${pid} || true"`, { stdio: 'inherit' });
  }
  console.log(`[DONE] Killed ${pids.length} process(es) on port ${port}`);
} catch (err) {
  console.error(`[FAIL] Could not kill port ${port}`);
  console.error(String(err));
  process.exit(1);
}
      try {
        run(`cmd /c "taskkill /PID ${pid} /F"`);
      } catch (e) {
        console.warn(`[WARN] Failed to kill PID ${pid}. It may have already exited.`);
      }
    }

    console.log(`[OK] Cleared port ${port}`);
    process.exit(0);
  }

  // macOS/Linux
  let out = '';
  try {
    out = run(`lsof -ti tcp:${port} || true`).trim();
  } catch {
    out = '';
  }
  if (!out) {
    console.log(`[OK] No process found on port ${port}`);
    process.exit(0);
  }

  const pids = new Set(out.split(/\r?\n/).filter(Boolean));
  for (const pid of pids) {
    console.log(`[KILL] kill -9 ${pid}`);
    try {
      run(`kill -9 ${pid}`);
    } catch (e) {
      console.warn(`[WARN] Failed to kill PID ${pid}. It may have already exited.`);
    }
  }
  console.log(`[OK] Cleared port ${port}`);
} catch (err) {
  console.error(`[FAIL] ${err?.message || err}`);
  process.exit(1);
}
  if (!out) {
    console.log(`[OK] No process found on port ${port}`);
    process.exit(0);
  }
  const pids = [...new Set(out.split(/\s+/).filter(Boolean))];
  for (const pid of pids) {
    console.log(`[KILL] kill -9 ${pid}`);
    try {
      run(`kill -9 ${pid}`);
    } catch (e) {
      console.warn(`[WARN] Failed to kill PID ${pid}`);
    }
  }
  console.log(`[OK] Cleared port ${port}`);
} catch (err) {
  console.error(`[FAIL] kill-port failed: ${err?.message ?? err}`);
  process.exit(1);
}
  console.log(`[OK] Cleared port ${port}`);
} catch (err) {
  console.error(`[ERROR] kill-port failed for port ${port}`);
  console.error(err?.message ?? err);
  process.exit(1);
}
