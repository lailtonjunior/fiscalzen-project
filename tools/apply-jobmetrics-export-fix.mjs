#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'apps', 'api', 'src', 'jobs', 'events.ts');
if (!fs.existsSync(file)) {
  console.log('[SKIP] apps/api/src/jobs/events.ts nao encontrado');
  process.exit(0);
}

let txt = fs.readFileSync(file, 'utf8');
const orig = txt;

// Se JobMetrics existir sem export, promove a export
txt = txt.replace(/\binterface\s+JobMetrics\b/g, 'export interface JobMetrics');
txt = txt.replace(/\btype\s+JobMetrics\b/g, 'export type JobMetrics');

if (txt === orig) {
  console.log('[NOOP] jobs/events.ts (nada para alterar ou JobMetrics ja exportado)');
  process.exit(0);
}

fs.writeFileSync(file, txt, 'utf8');
console.log('[OK] jobs/events.ts: JobMetrics exportado (ou promovido)');
