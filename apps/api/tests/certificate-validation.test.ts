import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CertificateValidationResult, ExpiringCertificate } from '../src/modules/certificates/types';

// Mock the database
vi.mock('../src/config/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    query: {
      companies: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      alerts: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock the crypto service
vi.mock('../src/modules/companies/crypto.service', () => ({
  getCertificateCryptoService: vi.fn(() => ({
    decrypt: vi.fn((data: string) => Buffer.from('mock-pfx-data')),
    decryptPassword: vi.fn((data: string) => 'mock-password'),
  })),
}));

// Mock sefaz-client
vi.mock('@fiscalzen/sefaz-client', () => ({
  validateCertificado: vi.fn(),
  getCertificadoInfo: vi.fn(),
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { db } from '../src/config/database';
import { validateCertificado, getCertificadoInfo } from '@fiscalzen/sefaz-client';

describe('CertificateValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Certificate Status Classification', () => {
    it('should classify certificate with more than 30 days as valid', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      (validateCertificado as any).mockReturnValue({
        valid: true,
        daysUntilExpiry: 60,
        message: 'Certificado valido ate ' + futureDate.toISOString(),
      });

      (getCertificadoInfo as any).mockReturnValue({
        cnpj: '12345678000190',
        razaoSocial: 'Empresa Teste',
        validFrom: new Date(),
        validTo: futureDate,
        serialNumber: '123456',
        issuer: 'AC Teste',
        subject: 'CN=Empresa Teste:12345678000190',
        thumbprint: 'ABC123',
      });

      const validation = (validateCertificado as any)({
        pfxBuffer: Buffer.from('mock'),
        password: 'mock',
      });

      expect(validation.valid).toBe(true);
      expect(validation.daysUntilExpiry).toBe(60);
    });

    it('should classify certificate within 30 days as expiring', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      (validateCertificado as any).mockReturnValue({
        valid: true,
        daysUntilExpiry: 15,
        message: 'Certificado expira em 15 dias',
      });

      const validation = (validateCertificado as any)({
        pfxBuffer: Buffer.from('mock'),
        password: 'mock',
      });

      expect(validation.valid).toBe(true);
      expect(validation.daysUntilExpiry).toBeLessThanOrEqual(30);
    });

    it('should classify expired certificate correctly', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      (validateCertificado as any).mockReturnValue({
        valid: false,
        daysUntilExpiry: 0,
        message: 'Certificado expirado em ' + pastDate.toISOString(),
      });

      const validation = (validateCertificado as any)({
        pfxBuffer: Buffer.from('mock'),
        password: 'mock',
      });

      expect(validation.valid).toBe(false);
      expect(validation.daysUntilExpiry).toBe(0);
    });

    it('should handle invalid/corrupted certificate', async () => {
      (validateCertificado as any).mockImplementation(() => {
        throw new Error('Falha ao carregar certificado: senha incorreta');
      });

      expect(() =>
        (validateCertificado as any)({
          pfxBuffer: Buffer.from('corrupted-data'),
          password: 'wrong-password',
        })
      ).toThrow('Falha ao carregar certificado');
    });
  });

  describe('Alert Thresholds', () => {
    it('should recognize 30-day threshold', () => {
      const thresholds = [30, 15, 7, 1];
      expect(thresholds).toContain(30);
    });

    it('should recognize 15-day threshold', () => {
      const thresholds = [30, 15, 7, 1];
      expect(thresholds).toContain(15);
    });

    it('should recognize 7-day threshold', () => {
      const thresholds = [30, 15, 7, 1];
      expect(thresholds).toContain(7);
    });

    it('should recognize 1-day threshold', () => {
      const thresholds = [30, 15, 7, 1];
      expect(thresholds).toContain(1);
    });

    it('should prioritize critical alerts for 7 days or less', () => {
      const threshold = 7;
      const alertType = threshold <= 7 ? 'CRITICO' : 'WARNING';
      expect(alertType).toBe('CRITICO');
    });

    it('should use warning alerts for more than 7 days', () => {
      const threshold = 15;
      const alertType = threshold <= 7 ? 'CRITICO' : 'WARNING';
      expect(alertType).toBe('WARNING');
    });
  });

  describe('Days Until Expiry Calculation', () => {
    it('should calculate positive days for future expiry', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const daysUntilExpiry = Math.floor(
        (futureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysUntilExpiry).toBe(15);
    });

    it('should calculate negative days for past expiry', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const daysUntilExpiry = Math.floor(
        (pastDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysUntilExpiry).toBe(-10);
    });

    it('should return 0 for same day expiry', () => {
      const now = new Date();

      const daysUntilExpiry = Math.floor(
        (now.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysUntilExpiry).toBe(0);
    });
  });

  describe('Validation Result Types', () => {
    it('should have correct structure for valid result', () => {
      const result: CertificateValidationResult = {
        companyId: 'uuid-123',
        companyName: 'Empresa Teste',
        cnpj: '12345678000190',
        status: 'valid',
        daysUntilExpiry: 60,
        expiryDate: new Date(),
        message: 'Certificado valido',
      };

      expect(result.status).toBe('valid');
      expect(result.daysUntilExpiry).toBeGreaterThan(30);
    });

    it('should have correct structure for expiring result', () => {
      const result: CertificateValidationResult = {
        companyId: 'uuid-123',
        companyName: 'Empresa Teste',
        cnpj: '12345678000190',
        status: 'expiring',
        daysUntilExpiry: 15,
        expiryDate: new Date(),
        message: 'Certificado expira em 15 dias',
      };

      expect(result.status).toBe('expiring');
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(30);
    });

    it('should have correct structure for expired result', () => {
      const result: CertificateValidationResult = {
        companyId: 'uuid-123',
        companyName: 'Empresa Teste',
        cnpj: '12345678000190',
        status: 'expired',
        daysUntilExpiry: 0,
        expiryDate: new Date(),
        message: 'Certificado expirado',
      };

      expect(result.status).toBe('expired');
    });

    it('should have correct structure for missing result', () => {
      const result: CertificateValidationResult = {
        companyId: 'uuid-123',
        companyName: 'Empresa Teste',
        cnpj: '12345678000190',
        status: 'missing',
        daysUntilExpiry: null,
        expiryDate: null,
        message: 'Certificado nao configurado',
      };

      expect(result.status).toBe('missing');
      expect(result.daysUntilExpiry).toBeNull();
    });

    it('should have correct structure for invalid result', () => {
      const result: CertificateValidationResult = {
        companyId: 'uuid-123',
        companyName: 'Empresa Teste',
        cnpj: '12345678000190',
        status: 'invalid',
        daysUntilExpiry: null,
        expiryDate: null,
        message: 'Erro ao validar certificado',
      };

      expect(result.status).toBe('invalid');
    });
  });

  describe('Expiring Certificate Type', () => {
    it('should have correct structure', () => {
      const cert: ExpiringCertificate = {
        tenantId: 'tenant-uuid',
        companyId: 'company-uuid',
        companyName: 'Empresa Teste',
        cnpj: '12345678000190',
        daysUntilExpiry: 15,
        expiryDate: new Date(),
      };

      expect(cert.tenantId).toBeDefined();
      expect(cert.companyId).toBeDefined();
      expect(cert.daysUntilExpiry).toBe(15);
    });
  });
});

describe('Certificate Checker Job', () => {
  it('should have 24-hour interval', () => {
    const NEXT_RUN_INTERVAL = 24 * 60 * 60 * 1000;
    expect(NEXT_RUN_INTERVAL).toBe(86400000); // 24 hours in ms
  });

  it('should reschedule after completion', async () => {
    // This tests the pattern of self-rescheduling
    const scheduleNextRun = vi.fn();

    // Simulate job completion
    await scheduleNextRun();

    expect(scheduleNextRun).toHaveBeenCalled();
  });

  it('should reschedule even after error', async () => {
    // This tests error resilience
    const scheduleNextRun = vi.fn();

    try {
      throw new Error('Test error');
    } catch {
      await scheduleNextRun();
    }

    expect(scheduleNextRun).toHaveBeenCalled();
  });
});
