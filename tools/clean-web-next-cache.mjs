#!/usr/bin/env node
import { rmSync, existsSync } from 'node:fs';
import path from 'node:path';

const targets = [
  path.join(process.cwd(), 'apps', 'web', '.next'),
  path.join(process.cwd(), 'apps', 'web', '.turbo'),
  path.join(process.cwd(), '.turbo'),
];

let removed = 0;
for (const t of targets) {
  if (existsSync(t)) {
    try {
      rmSync(t, { recursive: true, force: true });
      console.log(`[RM] ${t}`);
      removed++;
    } catch (e) {
      console.warn(`[WARN] Could not remove ${t}: ${e?.message ?? e}`);
    }
  } else {
    console.log(`[SKIP] Not found: ${t}`);
  }
}

console.log(`[OK] Done. Removed ${removed} path(s).`);
      });
      console.log(`[OK] Removed: ${t}`);
      removed++;
    } catch (e) {
      console.error(`[FAIL] Could not remove: ${t}`);
      console.error(e?.message ?? e);
      process.exitCode = 1;
    }
  } else {
    console.log(`[SKIP] Not found: ${t}`);
  }
}

if (removed === 0) {
  console.log('[OK] Nothing to clean');
}
