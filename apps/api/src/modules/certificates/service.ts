import { eq, and, lte, gte, isNotNull, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { companies, alerts } from '@fiscalzen/database/schema';
import { getCertificateCryptoService } from '../companies/crypto.service';
import { validateCertificado, getCertificadoInfo } from '@fiscalzen/sefaz-client';
import { logger } from '../../utils/logger';
import type {
  CertificateValidationResult,
  ExpiringCertificate,
  AlertThreshold,
  AlertCreationResult,
} from './types';

// ============================================
// Constants
// ============================================

const ALERT_THRESHOLDS: AlertThreshold[] = [30, 15, 7, 1];

// ============================================
// Certificate Validation Service
// ============================================

export class CertificateValidationService {
  private cryptoService = getCertificateCryptoService();

  /**
   * Obtem certificados que expiram em ate X dias
   */
  async getExpiringCertificates(maxDays: number = 30): Promise<ExpiringCertificate[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

    const results = await db
      .select({
        tenantId: (companies as any).tenantId,
        companyId: (companies as any).id,
        companyName: (companies as any).razaoSocial,
        cnpj: (companies as any).cnpj,
        expiryDate: (companies as any).certificateExpiry,
      })
      .from(companies as any)
      .where(
        and(
          eq((companies as any).active, true),
          isNotNull((companies as any).certificateExpiry),
          lte((companies as any).certificateExpiry, futureDate),
          gte((companies as any).certificateExpiry, now)
        )
      );

    return results.map((r) => ({
      tenantId: r.tenantId,
      companyId: r.companyId,
      companyName: r.companyName,
      cnpj: r.cnpj,
      expiryDate: r.expiryDate!,
      daysUntilExpiry: Math.floor(
        (r.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }

  /**
   * Obtem certificados expirados
   */
  async getExpiredCertificates(): Promise<ExpiringCertificate[]> {
    const now = new Date();

    const results = await db
      .select({
        tenantId: (companies as any).tenantId,
        companyId: (companies as any).id,
        companyName: (companies as any).razaoSocial,
        cnpj: (companies as any).cnpj,
        expiryDate: (companies as any).certificateExpiry,
      })
      .from(companies as any)
      .where(
        and(
          eq((companies as any).active, true),
          isNotNull((companies as any).certificateExpiry),
          lte((companies as any).certificateExpiry, now)
        )
      );

    return results.map((r) => ({
      tenantId: r.tenantId,
      companyId: r.companyId,
      companyName: r.companyName,
      cnpj: r.cnpj,
      expiryDate: r.expiryDate!,
      daysUntilExpiry: Math.floor(
        (r.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }

  /**
   * Cria alertas de expiracao para certificados proximos do vencimento
   * Usa thresholds: 30, 15, 7, 1 dias
   */
  async createExpiryAlerts(): Promise<AlertCreationResult> {
    let created = 0;
    let skipped = 0;

    for (const threshold of ALERT_THRESHOLDS) {
      const expiring = await this.getExpiringCertificates(threshold);

      for (const cert of expiring) {
        // Pular se dias restantes nao correspondem ao threshold
        // (ex: se threshold=15 e faltam 20 dias, pular)
        if (cert.daysUntilExpiry > threshold) {
          continue;
        }

        // Verificar se ja existe alerta para este threshold e empresa
        const existing = await (db.query as any).alerts.findFirst({
          where: and(
            eq((alerts as any).companyId, cert.companyId),
            eq((alerts as any).type, threshold <= 7 ? 'CRITICO' : 'WARNING'),
            sql`${(alerts as any).data}->>'threshold' = ${threshold.toString()}`
          ),
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Criar alerta
        await db.insert(alerts as any).values({
          tenantId: cert.tenantId,
          companyId: cert.companyId,
          type: threshold <= 7 ? 'CRITICO' : 'WARNING',
          priority: threshold <= 7 ? 'ALTA' : 'MEDIA',
          title: `Certificado expira em ${cert.daysUntilExpiry} dias`,
          message:
            `O certificado digital A1 da empresa ${cert.companyName} (${cert.cnpj}) ` +
            `expira em ${cert.expiryDate.toLocaleDateString('pt-BR')}. ` +
            `Renove o certificado para evitar interrupcao nos servicos.`,
          data: {
            threshold,
            daysUntilExpiry: cert.daysUntilExpiry,
            expiryDate: cert.expiryDate.toISOString(),
            cnpj: cert.cnpj,
          },
        });

        created++;

        logger.info('Certificate expiry alert created', {
          companyId: cert.companyId,
          companyName: cert.companyName,
          daysUntilExpiry: cert.daysUntilExpiry,
          threshold,
        });
      }
    }

    // Criar alertas para certificados ja expirados
    const expired = await this.getExpiredCertificates();

    for (const cert of expired) {
      const existing = await (db.query as any).alerts.findFirst({
        where: and(
          eq((alerts as any).companyId, cert.companyId),
          eq((alerts as any).type, 'CRITICO'),
          sql`${(alerts as any).data}->>'expired' = 'true'`
        ),
      });

      if (existing) {
        skipped++;
        continue;
      }

      await db.insert(alerts as any).values({
        tenantId: cert.tenantId,
        companyId: cert.companyId,
        type: 'CRITICO',
        priority: 'ALTA',
        title: 'Certificado expirado',
        message:
          `O certificado digital A1 da empresa ${cert.companyName} (${cert.cnpj}) ` +
          `expirou em ${cert.expiryDate.toLocaleDateString('pt-BR')}. ` +
          `A sincronizacao com SEFAZ esta interrompida. Renove o certificado imediatamente.`,
        data: {
          expired: true,
          daysUntilExpiry: cert.daysUntilExpiry,
          expiryDate: cert.expiryDate.toISOString(),
          cnpj: cert.cnpj,
        },
      });

      created++;

      logger.warn('Expired certificate alert created', {
        companyId: cert.companyId,
        companyName: cert.companyName,
        expiredDaysAgo: Math.abs(cert.daysUntilExpiry),
      });
    }

    return { created, skipped };
  }

  /**
   * Valida o certificado de uma empresa especifica
   * Decripta e verifica o certificado armazenado
   */
  async validateCompanyCertificate(companyId: string): Promise<CertificateValidationResult> {
    const company = await (db.query as any).companies.findFirst({
      where: eq((companies as any).id, companyId),
    });

    if (!company) {
      return {
        companyId,
        companyName: 'Desconhecida',
        cnpj: '',
        status: 'missing',
        daysUntilExpiry: null,
        expiryDate: null,
        message: 'Empresa nao encontrada',
      };
    }

    if (!company.certificate || !company.certificatePassword) {
      return {
        companyId,
        companyName: company.razaoSocial,
        cnpj: company.cnpj,
        status: 'missing',
        daysUntilExpiry: null,
        expiryDate: null,
        message: 'Certificado nao configurado',
      };
    }

    try {
      const decrypted = this.cryptoService.decrypt(company.certificate);
      const password = this.cryptoService.decryptPassword(company.certificatePassword);

      const validation = validateCertificado({
        pfxBuffer: decrypted,
        password,
      });

      const info = getCertificadoInfo({
        pfxBuffer: decrypted,
        password,
      });

      let status: CertificateValidationResult['status'];
      if (!validation.valid) {
        status = validation.daysUntilExpiry <= 0 ? 'expired' : 'invalid';
      } else if (validation.daysUntilExpiry <= 30) {
        status = 'expiring';
      } else {
        status = 'valid';
      }

      return {
        companyId,
        companyName: company.razaoSocial,
        cnpj: company.cnpj,
        status,
        daysUntilExpiry: validation.daysUntilExpiry,
        expiryDate: info.validTo,
        message: validation.message,
      };
    } catch (error) {
      logger.error('Certificate validation failed', {
        companyId,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      return {
        companyId,
        companyName: company.razaoSocial,
        cnpj: company.cnpj,
        status: 'invalid',
        daysUntilExpiry: null,
        expiryDate: null,
        message: error instanceof Error ? error.message : 'Erro ao validar certificado',
      };
    }
  }

  /**
   * Valida todos os certificados de um tenant
   */
  async validateAllCertificates(tenantId: string): Promise<CertificateValidationResult[]> {
    const companiesData = await (db.query as any).companies.findMany({
      where: and(eq((companies as any).tenantId, tenantId), eq((companies as any).active, true)),
    });

    const results: CertificateValidationResult[] = [];

    for (const company of companiesData) {
      const result = await this.validateCompanyCertificate(company.id);
      results.push(result);
    }

    return results;
  }
}

// ============================================
// Singleton Instance
// ============================================

let _instance: CertificateValidationService | null = null;

export function getCertificateValidationService(): CertificateValidationService {
  if (!_instance) {
    _instance = new CertificateValidationService();
  }
  return _instance;
}

export const certificateValidation = getCertificateValidationService();
