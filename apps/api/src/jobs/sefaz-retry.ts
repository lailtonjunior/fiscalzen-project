import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '@fiscalzen/shared';

// Queue for long-running SEFAZ retries (when immediate retry fails)
export const sefazRetryQueue = new Queue('sefaz-retry', {
    connection: redis,
    defaultJobOptions: {
        attempts: 10,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

interface SefazRetryJob {
    operation: 'distDFe' | 'manifestacao' | 'consulta';
    params: any;
    empresaId: string;
    certificadoId: string;
}

export async function addSefazRetryJob(
    data: SefazRetryJob,
    delay?: number
) {
    return sefazRetryQueue.add('sefaz-operation', data, {
        delay,
        jobId: `${data.operation}-${data.empresaId}-${Date.now()}`,
    });
}

// Worker to process retries
export const sefazRetryWorker = new Worker<SefazRetryJob>(
    'sefaz-retry',
    async (job) => {
        logger.info({ jobId: job.id, attempt: job.attemptsMade }, 'Processing SEFAZ retry job');

        // const { operation, params, empresaId, certificadoId } = job.data;

        // NOTE: This worker would invoke the actual logicService/SefazClient here.
        // Since we are mocking the structure for now, we just simulate processing.
        // In real implementation:
        // await sefazService.executeOperation(operation, params, ...);

        await new Promise(resolve => setTimeout(resolve, 500)); // Simulating work
        return { status: 'processed' };
    },
    {
        connection: redis,
        concurrency: 5,
    }
);

// Event handlers
sefazRetryWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'SEFAZ retry job completed successfully');
});

sefazRetryWorker.on('failed', (job, err) => {
    logger.error({
        jobId: job?.id,
        error: err.message,
        attempts: job?.attemptsMade
    }, 'SEFAZ retry job failed');

    // Alert after exhausting attempts
    if (job && job.attemptsMade >= 10) {
        logger.error({ jobId: job.id }, 'CRITICAL: SEFAZ retry exhausted max attempts');
        // Here we would send an alert to the team (Slack/Email)
    }
});
