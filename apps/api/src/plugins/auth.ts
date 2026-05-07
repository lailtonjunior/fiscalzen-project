import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  iat?: number;
  exp?: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      roles: JwtPayload['role'][]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

function buildDevUser(): JwtPayload {
  // UUIDs validos para DEV (evita "invalid input syntax for type uuid")
  return {
    sub: env.DEV_USER_ID,
    tenantId: env.DEV_TENANT_ID,
    role: 'admin',
    email: env.DEV_USER_EMAIL,
  };
}

async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  fastify.decorate('authenticate', async function authenticate(
    request: FastifyRequest,
    _reply: FastifyReply
  ) {
    // DEV ONLY: bypass opcional (NUNCA habilitar em produção!)
    // Double-check: explicitamente verificamos NODE_ENV === 'development'
    if (
      env.NODE_ENV === 'development' &&
      env.DISABLE_AUTH
    ) {
      // Log warning para visibilidade (development only)
      fastify.log.warn(
        { route: request.routeOptions?.url },
        '⚠️ DISABLE_AUTH ativo: autenticação ignorada (dev only)'
      );
      (request as any).user = buildDevUser();
      return;
    }

    // Safeguard: se DISABLE_AUTH está definido em prod, logar e ignorar
    if (env.NODE_ENV === 'production' && env.DISABLE_AUTH) {
      fastify.log.error(
        '🚨 DISABLE_AUTH definido em PRODUÇÃO! Ignorando para segurança.'
      );
    }

    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Token invalido ou expirado');
    }
  });

  fastify.decorate('requireRole', function requireRole(roles: JwtPayload['role'][]) {
    return async function roleGuard(request: FastifyRequest, reply: FastifyReply) {
      await fastify.authenticate(request, reply);

      if (!roles.includes(request.user.role)) {
        throw new ForbiddenError('Permissao insuficiente para esta operacao');
      }
    };
  });
}

export default fp(authPlugin, { name: 'auth' });

// Helper (test/login)
export function generateToken(
  fastify: FastifyInstance,
  payload: Omit<JwtPayload, 'iat' | 'exp'>
): string {
  return fastify.jwt.sign(payload as any);
}

export function getTenantId(request: FastifyRequest): string {
  const tenantId = request.user?.tenantId;
  if (!tenantId) throw new UnauthorizedError('Tenant nao identificado');
  return tenantId;
}

export function getUserId(request: FastifyRequest): string {
  const sub = request.user?.sub;
  if (!sub) throw new UnauthorizedError('Usuario nao identificado');
  return sub;
}
