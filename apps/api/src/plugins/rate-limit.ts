import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';

async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    redis,
    keyGenerator: (request) => {
      // Use user ID if authenticated, otherwise IP
      const userId = request.user?.sub;
      const ip = request.ip;
      return userId ?? ip;
    },
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Muitas requisicoes. Tente novamente em ${Math.ceil(context.ttl / 1000)} segundos.`,
      },
    }),
    skipOnError: true, // Don't fail if Redis is unavailable
  });
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});
