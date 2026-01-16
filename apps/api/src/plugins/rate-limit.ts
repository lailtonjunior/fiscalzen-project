import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { env } from "../config/env";
import { redis } from "../config/redis";

/**
 * Rate limiting must NOT silently disable itself when Redis is down.
 *
 * Strategy:
 * - If Redis is reachable at startup, use Redis-backed rate limiting (distributed).
 * - Otherwise fall back to in-memory limiter with reduced limits (still protects the API).
 *
 * This is a pragmatic safety net (not perfect in clustered deployments without Redis),
 * but it's strictly better than `skipOnError: true` which turns rate limit into a no-op.
 */
async function rateLimitPlugin(fastify: FastifyInstance) {
  let useRedis = false;

  try {
    // ioredis supports .ping(); node-redis also has it; if this throws, we fallback.
    // We don't want to block startup indefinitely: keep it bounded.
    const ping = (redis as any)?.ping?.bind(redis);
    if (typeof ping === "function") {
      await Promise.race([
        ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Redis ping timeout")), 800)),
      ]);
      useRedis = true;
    }
  } catch (err) {
    fastify.log.warn({ err }, "Redis unavailable: using in-memory rate limiting fallback");
  }

  const max = Number(env.RATE_LIMIT_MAX ?? 100);
  const windowMs = Number(env.RATE_LIMIT_WINDOW_MS ?? 60_000);

  // Conservative fallback: 20% of configured max (min 10).
  const fallbackMax = Math.max(10, Math.floor(max * 0.2));

  await fastify.register(rateLimit, {
    max: useRedis ? max : fallbackMax,
    timeWindow: windowMs,
    ...(useRedis ? { redis } : {}),
    keyGenerator: (request) => request.user?.sub ?? request.ip,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Muitas requisicoes. Tente novamente em ${Math.ceil(context.ttl / 1000)} segundos.`,
      },
    }),
    // IMPORTANT: do not skip on Redis errors; we already decide at startup.
    skipOnError: false,
  });
}

export default fp(rateLimitPlugin, { name: "rate-limit" });
