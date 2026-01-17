#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    const err = (res.stderr || '').trim();
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}${err ? `\n${err}` : ''}`);
  }
  return (res.stdout || '').trim();
}

function containerExists(name) {
  try {
    run('docker', ['inspect', name]);
    return true;
  } catch {
    return false;
  }
}

let container = process.argv[2] || 'fiscalzen-postgres';
if (!containerExists(container)) {
  const ps = run('docker', ['ps', '--format', '{{.Names}}\t{{.Image}}']);
  const candidates = ps
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, image] = l.split(/\t/);
      return { name, image };
    })
    .filter((x) => /postgres/i.test(x.image || ''));

  if (candidates.length > 0) container = candidates[0].name;
}

if (!containerExists(container)) {
  console.error('[FAIL] Nenhum container Postgres encontrado. Passe o nome como argumento.');
  process.exit(1);
}

function getEnv(varName) {
  try {
    return run('docker', ['exec', container, 'sh', '-lc', `printenv ${varName}`]);
  } catch {
    return '';
  }
}

const env = {
  container,
  POSTGRES_USER: getEnv('POSTGRES_USER') || '(empty)',
  POSTGRES_DB: getEnv('POSTGRES_DB') || '(empty)',
  POSTGRES_PASSWORD: getEnv('POSTGRES_PASSWORD') || '(empty)',
};

console.log(JSON.stringify(env, null, 2));
