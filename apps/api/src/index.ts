import "reflect-metadata";
import "dotenv/config";
import pino from "pino";
import { buildApp } from "./app";
import { env } from "./config/env";
import { stopTracing } from "./config/tracing";
import { checkDatabaseConnection, closeDatabaseConnection } from "./config/database";
import { checkRedisConnection, closeRedisConnection, redis } from "./config/redis";
import { checkMeilisearchConnection, setupMeilisearchIndexes } from "./config/meilisearch";
import {
  startWorkers,
  stopWorkers,
  startScheduler,
  stopScheduler,
  closeQueues,
  logger as jobLogger,
} from "./jobs/index";

const bootLogger = pino({ level: env.LOG_LEVEL ?? "info" });

async function start() {
  bootLogger.info("Starting FiscalZen API...");

  bootLogger.info("Checking database connection...");
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    bootLogger.fatal("Database connection failed");
    process.exit(1);
  }
  bootLogger.info("Database connected");

  bootLogger.info("Checking Redis connection...");
  let redisOk = false;
  try {
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }
    redisOk = await checkRedisConnection();
    if (!redisOk) {
      bootLogger.warn("Redis connection failed - some features may be limited");
    } else {
      bootLogger.info("Redis connected");
    }
  } catch (err) {
    bootLogger.warn({ err }, "Redis unavailable - continuing without it");
  }

  bootLogger.info("Checking Meilisearch connection...");
  const meilisearchOk = await checkMeilisearchConnection();
  if (!meilisearchOk) {
    bootLogger.warn("Meilisearch connection failed - search will be limited");
  } else {
    bootLogger.info("Meilisearch connected");
    const indexesOk = await setupMeilisearchIndexes();
    if (!indexesOk) {
      bootLogger.warn("Meilisearch index setup failed - search will be limited");
    }
  }

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(
      {
        host: env.HOST,
        port: env.PORT,
        env: env.NODE_ENV,
        sefaz: env.SEFAZ_AMBIENTE,
      },
      "FiscalZen API started"
    );
  } catch (err) {
    app.log.error({ err }, "Failed to start server");
    process.exit(1);
  }

  // Start job workers and scheduler only if Redis is connected
  if (redisOk) {
    try {
      app.log.info("Starting job workers...");
      await startWorkers();

      app.log.info("Starting scheduler...");
      await startScheduler();

      app.log.info("Workers and scheduler started");
    } catch (err) {
      jobLogger.error("Failed to start workers/scheduler", { error: err });
      app.log.warn("Background processing disabled (workers/scheduler failed)");
    }
  } else {
    app.log.warn("Skipping job workers (Redis not connected)");
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Shutting down gracefully...");

    try {
      stopScheduler();
    } catch {
      // Ignore scheduler stop errors during shutdown
    }

    try {
      await stopWorkers();
    } catch {
      // Ignore worker stop errors during shutdown
    }

    try {
      await closeQueues();
    } catch {
      // Ignore queue close errors during shutdown
    }

    try {
      await app.close();
    } catch {
      // Ignore app close errors during shutdown
    }

    try {
      await closeDatabaseConnection();
    } catch {
      // Ignore database close errors during shutdown
    }

    try {
      await closeRedisConnection();
    } catch {
      // Ignore redis close errors during shutdown
    }

    try {
      await stopTracing();
    } catch {
      // Ignore tracing shutdown errors
    }

    app.log.info("Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((err) => {
  bootLogger.fatal({ err }, "Unhandled bootstrap failure");
  process.exit(1);
});
