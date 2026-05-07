import 'reflect-metadata';
import { afterAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app';

describe('API schema compilation', () => {
  let app: FastifyInstance | undefined;
  const originalEnableSwagger = process.env.ENABLE_SWAGGER;

  afterAll(async () => {
    await app?.close();
    process.env.ENABLE_SWAGGER = originalEnableSwagger;
  });

  it('compiles active Fastify route schemas and starts with Swagger registration enabled', async () => {
    process.env.ENABLE_SWAGGER = 'true';
    app = await buildApp();

    await app.ready();

    expect(app.hasRoute({ method: 'GET', url: '/health' })).toBe(true);
    expect(app.hasRoute({ method: 'GET', url: '/documentation' })).toBe(true);
  });
});
