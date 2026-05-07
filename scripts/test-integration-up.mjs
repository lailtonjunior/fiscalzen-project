import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import net from 'node:net';

const rootDir = resolve(process.cwd());
const DEFAULT_DATABASE_URL =
  'postgresql://fiscalzen_test:fiscalzen_test@localhost:55434/fiscalzen_test';
const DEFAULT_REDIS_URL = 'redis://localhost:56380';
const TEST_SERVICES = [
  {
    name: 'fiscalzen-postgres-test',
    label: 'Test PostgreSQL',
    health: 'healthy',
  },
  {
    name: 'fiscalzen-redis-test',
    label: 'Test Redis',
    health: 'healthy',
  },
];

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function waitForCheck(port, host = '127.0.0.1', timeoutMs = 300) {
  return new Promise((resolvePromise) => {
    const socket = new net.Socket();

    const finish = (inUse) => {
      socket.destroy();
      resolvePromise(inUse);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

function runCommand(command, args) {
  return spawnSync(command, args, {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
}

function inspectContainer(name) {
  const result = runCommand('docker', [
    'inspect',
    '--format',
    '{{.State.Running}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}',
    name,
  ]);

  if (result.status !== 0) {
    return {
      exists: false,
      running: false,
      health: 'missing',
    };
  }

  const [runningState = 'false', health = 'unknown'] = result.stdout.trim().split('|');

  return {
    exists: true,
    running: runningState === 'true',
    health,
  };
}

async function resolveServiceStatus(services) {
  const statuses = [];

  for (const service of services) {
    const portInUse = await waitForCheck(service.port);
    const container = inspectContainer(service.name);
    const isReady = portInUse && container.running && container.health === service.health;

    statuses.push({
      ...service,
      portInUse,
      ...container,
      isReady,
    });
  }

  return statuses;
}

function assertNoExternalPortConflicts(statuses) {
  for (const status of statuses) {
    if (status.portInUse && !status.isReady) {
      throw new Error(
        [
          `${status.label} port ${status.port} is already in use by an unexpected service or an unhealthy test container.`,
          `Expected container: ${status.name}.`,
          'Stop the conflicting local service or fix the stale test container before running pnpm test:integration:up.',
        ].join(' ')
      );
    }
  }
}

async function main() {
  loadDotEnvFile(resolve(rootDir, '.env.test'));

  const databaseUrl = new URL(
    process.env.DATABASE_URL_TEST ||
      process.env.TEST_DATABASE_URL ||
      DEFAULT_DATABASE_URL
  );
  const redisUrl = new URL(process.env.REDIS_URL || DEFAULT_REDIS_URL);
  const services = [
    {
      ...TEST_SERVICES[0],
      port: Number(databaseUrl.port),
    },
    {
      ...TEST_SERVICES[1],
      port: Number(redisUrl.port),
    },
  ];

  const initialStatuses = await resolveServiceStatus(services);
  const allReady = initialStatuses.every((status) => status.isReady);

  if (allReady) {
    console.log('Integration test stack is already running and healthy.');
    process.exit(0);
  }

  assertNoExternalPortConflicts(initialStatuses);

  const result = spawnSync(
    'docker',
    ['compose', '-f', 'docker/docker-compose.test.yml', 'up', '-d', '--wait'],
    {
      cwd: rootDir,
      stdio: 'inherit',
    }
  );

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  const finalStatuses = await resolveServiceStatus(services);
  assertNoExternalPortConflicts(finalStatuses);

  if (!finalStatuses.every((status) => status.isReady)) {
    const notReady = finalStatuses
      .filter((status) => !status.isReady)
      .map((status) => `${status.label} (${status.name})`)
      .join(', ');

    throw new Error(`Integration test stack did not become healthy: ${notReady}.`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
