import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryAuditLogger,
  withAudit,
  ConsoleSecurityLogger,
  type AuditContext,
} from '../src/audit';

describe('InMemoryAuditLogger', () => {
  let logger: InMemoryAuditLogger;

  beforeEach(() => {
    logger = new InMemoryAuditLogger();
  });

  describe('log', () => {
    it('should log an entry', async () => {
      await logger.log({
        action: 'VIEW',
        status: 'success',
        context: {
          tenantId: 'tenant-1',
          companyId: 'company-1',
          userId: 'user-1',
        },
      });

      const logs = logger.getAll();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('VIEW');
    });

    it('should add timestamp to metadata', async () => {
      await logger.log({
        action: 'DOWNLOAD',
        status: 'success',
        context: {
          tenantId: 'tenant-1',
          companyId: 'company-1',
        },
      });

      const logs = logger.getAll();
      expect(logs[0].metadata?.timestamp).toBeDefined();
    });

    it('should preserve existing metadata', async () => {
      await logger.log({
        action: 'UPLOAD',
        status: 'success',
        context: {
          tenantId: 'tenant-1',
          companyId: 'company-1',
        },
        metadata: {
          fileSize: 1024,
        },
      });

      const logs = logger.getAll();
      expect(logs[0].metadata?.fileSize).toBe(1024);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await logger.log({
        action: 'VIEW',
        status: 'success',
        context: { tenantId: 't1', companyId: 'c1', userId: 'u1' },
      });
      await logger.log({
        action: 'DOWNLOAD',
        status: 'failure',
        context: { tenantId: 't1', companyId: 'c2', userId: 'u1' },
      });
      await logger.log({
        action: 'VIEW',
        status: 'success',
        context: { tenantId: 't2', companyId: 'c3', userId: 'u2' },
      });
    });

    it('should filter by tenantId', async () => {
      const results = await logger.query({ tenantId: 't1' });
      expect(results).toHaveLength(2);
    });

    it('should filter by companyId', async () => {
      const results = await logger.query({ companyId: 'c1' });
      expect(results).toHaveLength(1);
    });

    it('should filter by userId', async () => {
      const results = await logger.query({ userId: 'u1' });
      expect(results).toHaveLength(2);
    });

    it('should filter by action', async () => {
      const results = await logger.query({ action: 'VIEW' });
      expect(results).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const results = await logger.query({ status: 'failure' });
      expect(results).toHaveLength(1);
    });

    it('should apply limit', async () => {
      const results = await logger.query({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('should apply offset', async () => {
      const results = await logger.query({ offset: 1, limit: 10 });
      expect(results).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all logs', async () => {
      await logger.log({
        action: 'VIEW',
        status: 'success',
        context: { tenantId: 't1', companyId: 'c1' },
      });

      logger.clear();

      expect(logger.getAll()).toHaveLength(0);
    });
  });
});

describe('withAudit', () => {
  let logger: InMemoryAuditLogger;
  const context: AuditContext = {
    tenantId: 'tenant-1',
    companyId: 'company-1',
    userId: 'user-1',
  };

  beforeEach(() => {
    logger = new InMemoryAuditLogger();
  });

  it('should log success on successful function call', async () => {
    const fn = async (data: string) => `processed: ${data}`;

    const auditedFn = withAudit(fn, {
      action: 'VIEW',
      logger,
      getContext: () => context,
    });

    const result = await auditedFn('test');

    expect(result).toBe('processed: test');

    const logs = logger.getAll();
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('success');
    expect(logs[0].action).toBe('VIEW');
  });

  it('should log failure on function error', async () => {
    const fn = async () => {
      throw new Error('Test error');
    };

    const auditedFn = withAudit(fn, {
      action: 'DOWNLOAD',
      logger,
      getContext: () => context,
    });

    await expect(auditedFn()).rejects.toThrow('Test error');

    const logs = logger.getAll();
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('failure');
    expect(logs[0].errorMessage).toBe('Test error');
  });

  it('should include metadata when provided', async () => {
    const fn = async (id: string) => id;

    const auditedFn = withAudit(fn, {
      action: 'USE_FOR_SIGNING',
      logger,
      getContext: () => context,
      getMetadata: (id) => ({ certificateId: id }),
    });

    await auditedFn('cert-123');

    const logs = logger.getAll();
    expect(logs[0].metadata?.certificateId).toBe('cert-123');
  });
});

describe('ConsoleSecurityLogger', () => {
  it('should log to console', async () => {
    const logger = new ConsoleSecurityLogger();

    // Just verify it doesn't throw
    await expect(
      logger.log({
        eventType: 'AUTH_FAILURE',
        severity: 'WARNING',
        description: 'Test security event',
      })
    ).resolves.not.toThrow();
  });
});
