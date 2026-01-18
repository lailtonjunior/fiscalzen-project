import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';

// Simple mock for testing without full app dependencies
describe('FiscalZen API - Unit Tests', () => {
  describe('Error Utils', () => {
    it('should create AppError with correct properties', async () => {
      const { AppError } = await import('../src/utils/errors');

      const error = new AppError('Test error', 'TEST_ERROR', 400, { field: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
    });

    it('should have default status code 400 when not specified', async () => {
      const { AppError } = await import('../src/utils/errors');

      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.statusCode).toBe(400); // Default is 400 per the implementation
    });

    it('should create NotFoundError with resource name in code', async () => {
      const { NotFoundError } = await import('../src/utils/errors');

      const error = new NotFoundError('Document');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('DOCUMENT_NOT_FOUND'); // Resource name is uppercased + _NOT_FOUND
    });

    it('should create UnauthorizedError', async () => {
      const { UnauthorizedError } = await import('../src/utils/errors');

      const error = new UnauthorizedError('Not authorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create ValidationError', async () => {
      const { ValidationError } = await import('../src/utils/errors');

      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create ForbiddenError', async () => {
      const { ForbiddenError } = await import('../src/utils/errors');

      const error = new ForbiddenError('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create ConflictError', async () => {
      const { ConflictError } = await import('../src/utils/errors');

      const error = new ConflictError('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('Response Utils', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = Fastify();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('should format success response correctly', async () => {
      const { sendSuccess } = await import('../src/utils/response');

      app.get('/test', async (request, reply) => {
        return sendSuccess(reply, { id: 1, name: 'test' });
      });

      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: 1, name: 'test' });
    });

    it('should format error response correctly', async () => {
      const { sendError } = await import('../src/utils/response');
      const { AppError } = await import('../src/utils/errors');

      app.get('/error', async (request, reply) => {
        return sendError(reply, new AppError('Test error', 'TEST_ERROR', 400));
      });

      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/error',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TEST_ERROR');
      expect(body.error.message).toBe('Test error');
    });
  });
});

describe('Validation Schemas', () => {
  describe('Company Schemas', () => {
    it('should validate company creation schema', async () => {
      const { createCompanySchema } = await import('../src/modules/companies/schemas');

      const validData = {
        cnpj: '12345678000199',
        razaoSocial: 'Test Company',
        nomeFantasia: 'Test',
        uf: 'SP',
      };

      const result = createCompanySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid CNPJ', async () => {
      const { createCompanySchema } = await import('../src/modules/companies/schemas');

      const invalidData = {
        cnpj: '123', // Too short
        razaoSocial: 'Test Company',
        uf: 'SP',
      };

      const result = createCompanySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const { createCompanySchema } = await import('../src/modules/companies/schemas');

      const invalidData = {
        cnpj: '12345678000199',
        // Missing razaoSocial and uf
      };

      const result = createCompanySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Document Schemas', () => {
    it('should validate document query schema', async () => {
      const { listDocumentsQuerySchema } = await import('../src/modules/documents/schemas');

      const validQuery = {
        page: '1',
        limit: '10',
        docType: 'NFE',
      };

      const result = listDocumentsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should accept optional filters', async () => {
      const { listDocumentsQuerySchema } = await import('../src/modules/documents/schemas');

      const validQuery = {
        page: '1',
        limit: '20',
        docType: 'CTE',
        situacao: 'autorizada',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = listDocumentsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });
  });

  describe('Manifestacao Schemas', () => {
    it('should validate ciencia schema', async () => {
      const { cienciaSchema } = await import('../src/modules/manifestacao/schemas');

      const validData = {
        chNFe: '35240112345678000199550010000001231234567890',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = cienciaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid chave length', async () => {
      const { cienciaSchema } = await import('../src/modules/manifestacao/schemas');

      const invalidData = {
        chNFe: '123456', // Too short
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = cienciaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject naoRealizada without justificativa', async () => {
      const { naoRealizadaSchema } = await import('../src/modules/manifestacao/schemas');

      const invalidData = {
        chNFe: '35240112345678000199550010000001231234567890',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing justificativa
      };

      const result = naoRealizadaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate naoRealizada with justificativa', async () => {
      const { naoRealizadaSchema } = await import('../src/modules/manifestacao/schemas');

      const validData = {
        chNFe: '35240112345678000199550010000001231234567890',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        justificativa: 'Operacao nao foi realizada por motivo X',
      };

      const result = naoRealizadaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Environment Configuration', () => {
  it('should have required environment variables defined', () => {
    // These should be set in setup.ts
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.CERT_ENCRYPTION_KEY).toBeDefined();
  });

  it('should have test-specific values', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.LOG_LEVEL).toBe('error');
  });
});
