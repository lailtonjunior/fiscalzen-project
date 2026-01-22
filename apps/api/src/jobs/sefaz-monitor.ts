import type { Job } from 'bullmq';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { companies, nsuControl } from '@fiscalzen/database/schema';
import {
  consultarPorUltNSU,
  consultarCTePorUltNSU,
  consultarMDFePorUltNSU,
  type CertificadoA1,
  type DistDFeResponse,
  SEFAZ_STATUS,
} from '@fiscalzen/sefaz-client';
import { env } from '../config/env';
import { addXmlProcessorJob, addSefazMonitorJob, type SefazMonitorJobData } from './queues';
import { logger } from './events';

// ============================================
// Constants
// ============================================

const NEXT_SYNC_INTERVALS = {
  HAS_MORE_DOCS: 5 * 60 * 1000,      // 5 minutes - more docs available
  NO_MORE_DOCS: 60 * 60 * 1000,      // 1 hour - caught up
  RATE_LIMITED: 2 * 60 * 60 * 1000,  // 2 hours - SEFAZ rate limit
  ERROR: 30 * 60 * 1000,             // 30 minutes - on error
};

// SEFAZ error codes that should NOT retry
const NON_RETRYABLE_ERRORS = [
  '593', // Certificado invalido
  '594', // Certificado expirado
  '595', // Certificado revogado
];

// ============================================
// Main Job Processor
// ============================================

export async function processSefazMonitor(job: Job<SefazMonitorJobData>) {
  const { companyId, tenantId, docType } = job.data;

  logger.info(`Starting SEFAZ monitor job`, {
    jobId: job.id,
    companyId,
    docType,
  });

  try {
    // 1. Get company with certificate
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!company) {
      logger.error(`Company not found`, { companyId });
      return { success: false, error: 'Company not found' };
    }

    // TODO: Certificate fields need to be added to companies schema
    // For now, check if certificate info is in settings/metadata
    const settings = company.settings as Record<string, unknown> | null;
    const certificate = settings?.certificate as Buffer | string | undefined;
    const certificatePassword = settings?.certificatePassword as string | undefined;
    const certificateExpiry = settings?.certificateExpiry as Date | string | undefined;

    if (!certificate || !certificatePassword) {
      logger.error(`Company has no certificate configured`, { companyId });
      await updateNsuControlError(companyId, docType, 'Certificado nao configurado');
      return { success: false, error: 'No certificate' };
    }

    const expiryDate = certificateExpiry ? new Date(certificateExpiry) : null;
    if (expiryDate && expiryDate < new Date()) {
      logger.error(`Certificate expired`, { companyId });
      await updateNsuControlError(companyId, docType, 'Certificado expirado');
      return { success: false, error: 'Certificate expired' };
    }

    // 2. Get NSU control
    const nsuEntry = await db.query.nsuControl.findFirst({
      where: and(eq(nsuControl.companyId, companyId), eq(nsuControl.docType, docType)),
    });

    if (!nsuEntry) {
      logger.error(`NSU control entry not found`, { companyId, docType });
      return { success: false, error: 'NSU control not found' };
    }

    // 3. Update status to syncing
    await db
      .update(nsuControl)
      .set({ syncStatus: 'syncing', updatedAt: new Date() })
      .where(and(eq(nsuControl.companyId, companyId), eq(nsuControl.docType, docType)));

    // 4. Call SEFAZ DistDFe
    const certificado: CertificadoA1 = {
      pfxBuffer: typeof certificate === 'string' ? Buffer.from(certificate, 'base64') : certificate,
      password: certificatePassword,
    };

    const ambiente = env.SEFAZ_AMBIENTE;
    let response: DistDFeResponse;

    try {
      response = await callDistDFe(docType, ambiente, company.cnpj, nsuEntry.lastNsu, certificado);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`SEFAZ call failed`, { companyId, docType, error: message });

      await updateNsuControlError(companyId, docType, message);
      await scheduleNextJob(job.data, NEXT_SYNC_INTERVALS.ERROR);

      throw error;
    }

    // 5. Process response
    logger.info(`SEFAZ response received`, {
      companyId,
      docType,
      cStat: response.cStat,
      documentCount: response.documentos.length,
      ultNSU: response.ultNSU,
      maxNSU: response.maxNSU,
    });

    // Check for rate limiting
    if (response.cStat === SEFAZ_STATUS.CONSUMO_INDEVIDO) {
      logger.warn(`SEFAZ rate limit hit`, { companyId, docType });

      await db
        .update(nsuControl)
        .set({
          syncStatus: 'rate_limited',
          lastError: 'Consumo indevido - aguardando intervalo',
          nextSync: new Date(Date.now() + NEXT_SYNC_INTERVALS.RATE_LIMITED),
          updatedAt: new Date(),
        })
        .where(and(eq(nsuControl.companyId, companyId), eq(nsuControl.docType, docType)));

      await scheduleNextJob(job.data, NEXT_SYNC_INTERVALS.RATE_LIMITED);

      return { success: true, rateLimited: true };
    }

    // Check for non-retryable errors
    if (NON_RETRYABLE_ERRORS.includes(response.cStat)) {
      logger.error(`Non-retryable SEFAZ error`, {
        companyId,
        docType,
        cStat: response.cStat,
        xMotivo: response.xMotivo,
      });

      await updateNsuControlError(companyId, docType, response.xMotivo);

      return { success: false, error: response.xMotivo };
    }

    // 6. Process documents
    let processedCount = 0;

    for (const doc of response.documentos) {
      try {
        await addXmlProcessorJob({
          companyId,
          tenantId,
          nsu: doc.nsu,
          schema: doc.schema,
          xmlContent: doc.xml,
          docType,
          isResumo: doc.isResumo ?? false,
          isEvento: doc.isEvento ?? false,
        });

        processedCount++;
      } catch (error) {
        logger.error(`Failed to queue XML processor job`, {
          companyId,
          nsu: doc.nsu,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    // 7. Update NSU control
    const hasMoreDocs = response.ultNSU !== response.maxNSU;
    const nextSyncInterval = hasMoreDocs
      ? NEXT_SYNC_INTERVALS.HAS_MORE_DOCS
      : NEXT_SYNC_INTERVALS.NO_MORE_DOCS;

    await db
      .update(nsuControl)
      .set({
        lastNsu: response.ultNSU,
        maxNsu: response.maxNSU,
        lastSync: new Date(),
        nextSync: new Date(Date.now() + nextSyncInterval),
        syncStatus: 'idle',
        errorCount: 0,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(and(eq(nsuControl.companyId, companyId), eq(nsuControl.docType, docType)));

    // 8. Schedule next job
    await scheduleNextJob(job.data, nextSyncInterval);

    logger.info(`SEFAZ monitor job completed`, {
      jobId: job.id,
      companyId,
      docType,
      processedCount,
      hasMoreDocs,
      nextSync: new Date(Date.now() + nextSyncInterval).toISOString(),
    });

    return {
      success: true,
      processedCount,
      ultNSU: response.ultNSU,
      maxNSU: response.maxNSU,
      hasMoreDocs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`SEFAZ monitor job failed`, {
      jobId: job.id,
      companyId,
      docType,
      error: message,
    });

    // Increment error count using sql
    await db
      .update(nsuControl)
      .set({
        syncStatus: 'error',
        lastError: message,
        updatedAt: new Date(),
      })
      .where(and(eq(nsuControl.companyId, companyId), eq(nsuControl.docType, docType as 'NFE' | 'CTE' | 'MDFE')));

    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

async function callDistDFe(
  docType: 'NFE' | 'CTE' | 'MDFE',
  ambiente: 'producao' | 'homologacao',
  cnpj: string,
  ultNSU: string,
  certificado: CertificadoA1
): Promise<DistDFeResponse> {
  switch (docType) {
    case 'NFE':
      return consultarPorUltNSU(ambiente, cnpj, ultNSU, certificado);
    case 'CTE':
      return consultarCTePorUltNSU(ambiente, cnpj, ultNSU, certificado);
    case 'MDFE':
      return consultarMDFePorUltNSU(ambiente, cnpj, ultNSU, certificado);
    default:
      throw new Error(`Unsupported doc type: ${docType}`);
  }
}

async function updateNsuControlError(companyId: string, docType: string, error: string) {
  await db
    .update(nsuControl)
    .set({
      syncStatus: 'error',
      lastError: error,
      updatedAt: new Date(),
    })
    .where(and(eq(nsuControl.companyId, companyId), eq(nsuControl.docType, docType as 'NFE' | 'CTE' | 'MDFE')));
}

async function scheduleNextJob(data: SefazMonitorJobData, delay: number) {
  try {
    await addSefazMonitorJob(data, delay);
  } catch (error) {
    logger.error(`Failed to schedule next SEFAZ monitor job`, {
      companyId: data.companyId,
      docType: data.docType,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}
