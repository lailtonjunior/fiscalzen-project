import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export interface JwtPayload {
  sub: string; // userId
  tenantId: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  iat?: number;
  exp?: number;
}

async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Decorator to authenticate requests
  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // DEV ONLY: optional auth bypass (never enable in production)
    if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_AUTH === 'true') {
      // Minimal dev user payload used by downstream code
      (request as any).user = {
        sub: 'dev-user',
        tenantId: 'dev-tenant',
        role: 'admin',
      };
      return;
    }

    try {
      await request.jwtVerify();
    } catch (err) {
      throw new UnauthorizedError('Token invalido ou expirado');
    }
  });

  // Decorator to check roles
  fastify.decorate('requireRole', function (roles: JwtPayload['role'][]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      await fastify.authenticate(request, reply);

      if (!roles.includes(request.user.role)) {
        throw new ForbiddenError('Permissao insuficiente para esta operacao');
      }
    };
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (roles: JwtPayload['role'][]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, {
  name: 'auth',
});

// Helper to generate tokens (for testing/login)
export function generateToken(fastify: FastifyInstance, payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return fastify.jwt.sign(payload);
}

// Middleware to extract tenant from authenticated user
export function getTenantId(request: FastifyRequest): string {
  if (!request.user?.tenantId) {
    throw new UnauthorizedError('Tenant nao identificado');
  }
  return request.user.tenantId;
}

export function getUserId(request: FastifyRequest): string {
  if (!request.user?.sub) {
    throw new UnauthorizedError('Usuario nao identificado');
  }
  return request.user.sub;
}
