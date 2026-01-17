#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'apps', 'api', 'src', 'modules', 'dashboard', 'service.ts');
if (!fs.existsSync(file)) {
  console.log('[SKIP] dashboard service.ts nao encontrado');
  process.exit(0);
}

let txt = fs.readFileSync(file, 'utf8');
const orig = txt;

// Inseri fallback groupBy = 'day' dentro de getTimeline
if (txt.includes('async getTimeline(') && txt.includes('}[query.groupBy]')) {
  txt = txt.replace(/\}\[query\.groupBy\]\s*;\s*/m, 
    "}[groupBy] as const;\n\n    const safeDateFormat = dateFormat ?? 'YYYY-MM-DD';\n"
  );

  // Inject groupBy const near function start
  txt = txt.replace(
    /(async\s+getTimeline\([^\)]*\)\s*\{\s*)/m,
    "$1    const groupBy = (query as any).groupBy ?? 'day';\n"
  );

  // Replace query.groupBy usages in mapping
  txt = txt.replace(/\}\[query\.groupBy\]/g, '}[groupBy]');
  // Use safeDateFormat in sql.raw usage
  txt = txt.replace(/sql\.raw\(dateFormat\)/g, 'sql.raw(safeDateFormat)');
}

if (txt !== orig) {
  fs.writeFileSync(file, txt);
  console.log('[OK] Patched dashboard getTimeline defaults (groupBy/day)');
} else {
  console.log('[NOOP] Nenhuma alteracao aplicada (padrao nao encontrado ou ja corrigido)');
}
