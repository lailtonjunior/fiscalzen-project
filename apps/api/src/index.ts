import 'dotenv/config';
import { buildApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection, closeDatabaseConnection } from './config/database';
import { checkRedisConnection, closeRedisConnection, redis } from './config/redis';
import { checkMeilisearchConnection, setupMeilisearchIndexes } from './config/meilisearch';
import {
  startWorkers,
  stopWorkers,
  startScheduler,
  stopScheduler,
  closeQueues,
  logger as jobLogger,
} from './jobs/index';

async function start() {
  console.log('Starting FiscalZen API...');

  // Check connections
  console.log('Checking database connection...');
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    console.error('Database connection failed');
    process.exit(1);
  }
  console.log('Database connected');

  console.log('Checking Redis connection...');
  await redis.connect();
  const redisOk = await checkRedisConnection();
  if (!redisOk) {
    console.warn('Redis connection failed - some features may be limited');
  } else {
    console.log('Redis connected');
  }

  console.log('Checking Meilisearch connection...');
  const meilisearchOk = await checkMeilisearchConnection();
  if (!meilisearchOk) {
    console.warn('Meilisearch connection failed - search will be limited');
  } else {
    console.log('Meilisearch connected');
    await setupMeilisearchIndexes();
  }

  // Build and start app
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`FiscalZen API running on http://${env.HOST}:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`SEFAZ Ambiente: ${env.SEFAZ_AMBIENTE}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Start job workers and scheduler (only if Redis is connected)
  if (redisOk) {
    try {
      console.log('Starting job workers...');
      await startWorkers();
      console.log('Job workers started');

      console.log('Starting scheduler...');
      await startScheduler();
      console.log('Scheduler started');
    } catch (err) {
      jobLogger.error('Failed to start workers/scheduler', { error: err });
      console.warn('Job workers failed to start - background processing disabled');
    }
  } else {
    console.warn('Skipping job workers (Redis not connected)');
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);

    // Stop scheduler first (prevents new jobs)
    console.log('Stopping scheduler...');
    stopScheduler();

    // Stop workers (wait for current jobs to complete)
    console.log('Stopping workers...');
    await stopWorkers();

    // Close queues
    console.log('Closing queues...');
    await closeQueues();

    // Close app
    await app.close();

    // Close connections
    await closeDatabaseConnection();
    await closeRedisConnection();

    console.log('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
