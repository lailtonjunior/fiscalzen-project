import type { Job } from 'bullmq';
import { getCertificateValidationService } from '../modules/certificates';
import { logger } from './events';
import { addCertificateCheckerJob } from './queues';
import type { CertificateCheckerJobData } from '../modules/certificates';

// ============================================
// Constants
// ============================================

// Intervalo para proxima execucao: 24 horas
const NEXT_RUN_INTERVAL = 24 * 60 * 60 * 1000;

// ============================================
// Certificate Checker Job Processor
// ============================================

export async function processCertificateChecker(job: Job<CertificateCheckerJobData>) {
  logger.info('Starting certificate checker job', { jobId: job.id });

  try {
    const validationService = getCertificateValidationService();

    // Criar alertas de expiracao
    const result = await validationService.createExpiryAlerts();

    logger.info('Certificate checker completed', {
      jobId: job.id,
      alertsCreated: result.created,
      alertsSkipped: result.skipped,
    });

    // Agendar proxima execucao
    await scheduleNextRun();

    return {
      success: true,
      alertsCreated: result.created,
      alertsSkipped: result.skipped,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Certificate checker failed', { jobId: job.id, error: message });

    // Reagendar mesmo em caso de erro
    await scheduleNextRun();

    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

async function scheduleNextRun() {
  try {
    await addCertificateCheckerJob({ scheduledRun: true }, NEXT_RUN_INTERVAL);
    logger.info('Next certificate check scheduled', {
      nextRun: new Date(Date.now() + NEXT_RUN_INTERVAL).toISOString(),
    });
  } catch (error) {
    logger.error('Failed to schedule next certificate check', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

/**
 * Inicializa o certificate checker
 * Chamado no startup da aplicacao
 */
export async function startCertificateChecker() {
  logger.info('Initializing certificate checker');

  try {
    // Agendar primeira execucao imediatamente
    await addCertificateCheckerJob({ scheduledRun: true }, 0);
    logger.info('Certificate checker initialized');
  } catch (error) {
    logger.error('Failed to initialize certificate checker', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}
