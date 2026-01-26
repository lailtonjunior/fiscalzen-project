import { Worker } from 'bullmq';
import { WebhookService } from '../modules/webhooks/service';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import { db } from '../config/database';
import { webhooks } from '@fiscalzen/database/schema';
import { eq } from 'drizzle-orm';

interface WebhookJobData {
    webhookId: string;
    event: string;
    payload: any;
    attempt: number;
}

export const webhookWorker = new Worker<WebhookJobData>(
    'webhook-delivery',
    async (job) => {
        const { webhookId, event, payload, attempt } = job.data;

        // Resolve service via container manually or instantiate
        // Better to get clean instance or use static db ref if possible to avoid complex DI in worker scope
        // For now, construct manually or use simple DI

        // Manual lookup to be safe in worker context
        const webhook = await db.query.webhooks.findFirst({
            where: eq(webhooks.id, webhookId)
        });

        if (!webhook) {
            logger.warn(`Webhook ${webhookId} not found, aborting delivery`);
            return;
        }

        // We can reuse the logic in service if we can instantiate it, 
        // OR duplicate the delivery logic here to keep worker pure. 
        // Let's try to reuse service logic by creating a temporary instance 
        // since it only needs DB.

        const service = new WebhookService(db as any);

        await service.deliverPayload(webhook, event, payload, attempt);
    },
    {
        connection: redis,
        concurrency: 10,
        limiter: {
            max: 100,
            duration: 1000 // Rate limit 100/s globally per worker
        }
    }
);

webhookWorker.on('failed', (job, err) => {
    logger.error(`Webhook delivery failed for job ${job?.id}: ${err.message}`);
});
