#!/usr/bin/env node

/**
 * FiscalZen - Postgres Docker Fix (DEV)
 *
 * Corrige falha de autenticacao (28P01) quando o role/DB foi inicializado com uma senha,
 * mas o container/compose foi atualizado depois (volume persiste e a senha do role nao muda so com env).
 *
 * O script:
 *  - Detecta container postgres
 *  - Le POSTGRES_USER/POSTGRES_DB/POSTGRES_PASSWORD de dentro do container
 *  - Ajusta DATABASE_URL em .env e apps/api/.env
 *  - Se a senha no banco estiver diferente, executa ALTER ROLE para alinhar
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', ...options });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    const out = (res.stdout || '').trim();
    const err = (res.stderr || '').trim();
    const msg = [`Command failed: ${cmd} ${args.join(' ')}`];
    if (out) msg.push(`STDOUT:\n${out}`);
    if (err) msg.push(`STDERR:\n${err}`);
    throw new Error(msg.join('\n'));
  }
  return (res.stdout || '').trim();
}

function tryRun(cmd, args, options = {}) {
  try {
    return { ok: true, out: run(cmd, args, options) };
  } catch (e) {
    return { ok: false, err: e };
  }
}

function containerExists(name) {
  const res = tryRun('docker', ['inspect', name]);
  return res.ok;
}

function detectPostgresContainer(preferred) {
  if (preferred && containerExists(preferred)) return preferred;
  const fallback = 'fiscalzen-postgres';
  if (containerExists(fallback)) return fallback;

  const ps = tryRun('docker', ['ps', '--format', '{{.Names}}\t{{.Image}}']);
  if (!ps.ok) return null;

  const lines = ps.out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const [name, image] = line.split('\t');
    if (!name || !image) continue;
    if (/\bpostgres\b/i.test(image)) return name;
  }
  return null;
}

function dockerEnv(container, key) {
  const r = tryRun('docker', ['exec', container, 'sh', '-lc', `printenv ${key} || true`]);
  if (!r.ok) return '';
  return (r.out || '').trim();
}

function mask(value) {
  if (!value) return '';
  if (value.length <= 4) return '*'.repeat(value.length);
  return value.slice(0, 2) + '*'.repeat(Math.min(12, value.length - 4)) + value.slice(-2);
}

function upsertEnvFile(filePath, key, value) {
  if (!fs.existsSync(filePath)) {
    return { file: filePath, status: 'skip', reason: 'missing' };
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  let found = false;
  const updated = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    while (updated.length > 0 && updated[updated.length - 1] === '') updated.pop();
    updated.push(`${key}=${value}`);
    updated.push('');
  }

  const next = updated.join('\n');
  if (next === raw) {
    return { file: filePath, status: 'noop', reason: 'already_set' };
  }

  fs.writeFileSync(filePath, next);
  return { file: filePath, status: 'patched', reason: found ? 'updated' : 'added' };
}

function escapeSqlString(s) {
  return String(s).replace(/'/g, "''");
}

function testDbPassword(container, user, db, password) {
  // TCP inside container (equivale ao host conectando via senha)
  const args = [
    'exec',
    '-e',
    `PGPASSWORD=${password}`,
    container,
    'psql',
    '-h',
    '127.0.0.1',
    '-p',
    '5432',
    '-U',
    user,
    '-d',
    db,
    '-c',
    'select 1;'
  ];
  const r = tryRun('docker', args);
  return r.ok;
}

function forceSetRolePassword(container, role, password) {
  const sql = `ALTER ROLE "${role}" WITH PASSWORD '${escapeSqlString(password)}';`;
  // Conexao via socket sem -h (normalmente trust dentro do container)
  const args = [
    'exec',
    container,
    'psql',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '-c',
    sql
  ];
  const r = tryRun('docker', args);
  if (r.ok) return { ok: true };

  // Fallback: tenta como o proprio role (caso postgres nao esteja acessivel)
  const args2 = [
    'exec',
    container,
    'psql',
    '-U',
    role,
    '-d',
    'postgres',
    '-c',
    sql
  ];
  const r2 = tryRun('docker', args2);
  return r2.ok ? { ok: true } : { ok: false, err: r2.err };
}

// -------------------------------
// Main
// -------------------------------

const preferredContainer = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const container = detectPostgresContainer(preferredContainer);

if (!container) {
  console.error('[FAIL] Nenhum container Postgres encontrado.');
  console.error('Dica: docker ps (verifique o nome) e rode: node tools/apply-postgres-docker-fix.mjs <NOME_DO_CONTAINER>');
  process.exit(1);
}

console.log(`[OK] Postgres container detectado: ${container}`);

const pgUser = dockerEnv(container, 'POSTGRES_USER') || 'postgres';
const pgDb = dockerEnv(container, 'POSTGRES_DB') || pgUser;
const pgPassword = dockerEnv(container, 'POSTGRES_PASSWORD');

if (!pgPassword) {
  console.log('[WARN] Nao consegui ler POSTGRES_PASSWORD de dentro do container.');
  console.log('       Vou apenas ajustar os arquivos .env (se houver) com o valor existente neles.');
}

const desiredUrl = `postgresql://${pgUser}:${encodeURIComponent(pgPassword || 'CHANGE_ME')}@localhost:5432/${pgDb}`;

const repoRoot = process.cwd();
const targets = [
  path.join(repoRoot, '.env'),
  path.join(repoRoot, 'apps', 'api', '.env'),
  path.join(repoRoot, 'apps', 'api', '.env.local'),
];

const files = targets.map((f) => upsertEnvFile(f, 'DATABASE_URL', desiredUrl));

console.log('\nSummary:');
console.log(JSON.stringify({
  container,
  POSTGRES_USER: pgUser,
  POSTGRES_DB: pgDb,
  POSTGRES_PASSWORD: pgPassword ? mask(pgPassword) : '(unknown)',
  desiredUrl: desiredUrl.replace(encodeURIComponent(pgPassword || 'CHANGE_ME'), pgPassword ? mask(pgPassword) : 'CHANGE_ME'),
  files,
}, null, 2));

if (!pgPassword) {
  console.log('\nNext steps:');
  console.log('1) Descubra a senha real e atualize DATABASE_URL. Dicas:');
  console.log(`   - docker exec ${container} sh -lc "printenv POSTGRES_PASSWORD"`);
  console.log('   - ou cheque o docker-compose/.env que sobe o Postgres');
  process.exit(0);
}

// Se o role/DB ja existiam, a senha do role pode estar diferente do POSTGRES_PASSWORD.
const okBefore = testDbPassword(container, pgUser, pgDb, pgPassword);
if (okBefore) {
  console.log('\n[OK] Senha do role confere (teste TCP dentro do container passou).');
  console.log('Next: reinicie o API: pnpm --filter @fiscalzen/api dev');
  process.exit(0);
}

console.log('\n[WARN] Teste de senha falhou. Vou tentar alinhar a senha do role com POSTGRES_PASSWORD (DEV).');
const alter = forceSetRolePassword(container, pgUser, pgPassword);
if (!alter.ok) {
  console.log('[FAIL] Nao consegui alterar a senha do role automaticamente.');
  console.log('Tente manualmente dentro do container:');
  console.log(`  docker exec -it ${container} psql -U postgres -d postgres`);
  console.log(`  ALTER ROLE "${pgUser}" WITH PASSWORD '${escapeSqlString(pgPassword)}';`);
  process.exit(1);
}

const okAfter = testDbPassword(container, pgUser, pgDb, pgPassword);
if (!okAfter) {
  console.log('[FAIL] Mesmo apos ALTER ROLE, o teste de senha ainda falhou.');
  console.log('Possiveis causas:');
  console.log('- pg_hba.conf/pg_authid com configuracao fora do padrao');
  console.log('- POSTGRES_USER/DB diferentes do esperado');
  console.log('- Porta/host diferentes (nao esta em 5432)');
  process.exit(1);
}

console.log('[OK] Senha alinhada com sucesso.');
console.log('Next: reinicie o API: pnpm --filter @fiscalzen/api dev');
