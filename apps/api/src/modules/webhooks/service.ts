import { injectable, inject } from 'tsyringe';
import { eq, and, sql, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { webhooks, webhookLogs } from '@fiscalzen/database/schema';
import { DATABASE_TOKEN } from '../../providers/database';
import { Queue } from 'bullmq';
import { env } from '../../config/env';
import crypto from 'crypto';

type Database = NodePgDatabase<typeof schema>;

export interface CreateWebhookDto {
    name: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    retryPolicy?: {
        maxAttempts: number;
        backoffMs: number;
    };
}

export interface PaginationParams {
    page: number;
    limit: number;
}

@injectable()
export class WebhookService {
    private webhookQueue: Queue;

    constructor(
        @inject(DATABASE_TOKEN) private db: Database
    ) {
        this.webhookQueue = new Queue('webhook-delivery', {
            connection: {
                url: env.REDIS_URL,
            } as any
        });
    }

    async create(tenantId: string, data: CreateWebhookDto) {
        // Basic URL validation
        try {
            new URL(data.url);
        } catch {
            throw new Error('URL inválida');
        }

        const secret = crypto.randomBytes(32).toString('hex');

        const [webhook] = await this.db.insert(webhooks).values({
            tenantId,
            name: data.name,
            url: data.url,
            secret,
            events: data.events,
            headers: data.headers,
            retryPolicy: data.retryPolicy
        }).returning();

        return webhook;
    }

    async update(id: string, tenantId: string, data: Partial<CreateWebhookDto>) {
        if (data.url) {
            try {
                new URL(data.url);
            } catch {
                throw new Error('URL inválida');
            }
        }

        const [webhook] = await this.db
            .update(webhooks)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(and(eq(webhooks.id, id), eq(webhooks.tenantId, tenantId)))
            .returning();

        return webhook;
    }

    async delete(id: string, tenantId: string) {
        await this.db
            .delete(webhooks)
            .where(and(eq(webhooks.id, id), eq(webhooks.tenantId, tenantId)));
    }

    async get(id: string, tenantId: string) {
        const webhook = await this.db.query.webhooks.findFirst({
            where: and(eq(webhooks.id, id), eq(webhooks.tenantId, tenantId))
        });
        return webhook;
    }

    async list(tenantId: string) {
        return this.db.query.webhooks.findMany({
            where: eq(webhooks.tenantId, tenantId),
            orderBy: desc(webhooks.createdAt)
        });
    }

    async dispatch(tenantId: string, event: string, payload: any): Promise<void> {
        // Find active webhooks that subscribe to this event
        // Using simple array check for now since Drizzle JSON operators can be tricky across drivers
        // For optimal perf, use raw SQL or proper PG operators: events @> jsonb_build_array(event)

        // Fetch all active webhooks for tenant and filter in app logic for simplicity/compatibility
        // giving we stored events as jsonb array.

        const activeWebhooks = await this.db.query.webhooks.findMany({
            where: and(
                eq(webhooks.tenantId, tenantId),
                eq(webhooks.isActive, true)
            )
        });

        for (const webhook of activeWebhooks) {
            const eventsList = webhook.events as string[];
            if (eventsList.includes(event) || eventsList.includes('*')) {
                await this.webhookQueue.add('deliver', {
                    webhookId: webhook.id,
                    event,
                    payload,
                    attempt: 1
                }, {
                    attempts: (webhook.retryPolicy as any)?.maxAttempts || 3,
                    backoff: {
                        type: 'exponential',
                        delay: (webhook.retryPolicy as any)?.backoffMs || 5000
                    }
                });
            }
        }
    }

    async regenerateSecret(webhookId: string, tenantId: string) {
        const secret = crypto.randomBytes(32).toString('hex');
        await this.db.update(webhooks)
            .set({ secret })
            .where(and(eq(webhooks.id, webhookId), eq(webhooks.tenantId, tenantId)));
        return secret;
    }

    async getLogs(webhookId: string, tenantId: string, pagination: PaginationParams) {
        // Check ownership
        const webhook = await this.get(webhookId, tenantId);
        if (!webhook) throw new Error('Webhook not found');

        const logs = await this.db
            .select()
            .from(webhookLogs)
            .where(eq(webhookLogs.webhookId, webhookId))
            .orderBy(desc(webhookLogs.executedAt))
            .limit(pagination.limit)
            .offset((pagination.page - 1) * pagination.limit);

        return logs;
    }

    async test(webhookId: string, tenantId: string) {
        const webhook = await this.get(webhookId, tenantId);
        if (!webhook) throw new Error('Webhook not found');

        const testPayload = {
            test: true,
            message: 'FiscalZen Webhook Test',
            timestamp: new Date().toISOString()
        };

        // Directly queue a job for immediate delivery (or call logic directly if we want sync response)
        // For test, syncing is often better UX, but reusing worker is safer.
        // Let's manually trigger delivery logic here to return result to UI.

        return this.deliverPayload(webhook, 'test', testPayload, 1);
    }

    // Called by Worker primarily
    async deliverPayload(webhook: any, event: string, payload: any, attempt: number) {
        const startTime = Date.now();
        const fullPayload = {
            event,
            timestamp: new Date().toISOString(),
            data: payload
        };

        const signature = this.generateSignature(fullPayload, webhook.secret);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Webhook-Event': event,
                'X-Webhook-Signature': signature,
                'X-Webhook-Timestamp': fullPayload.timestamp,
                'User-Agent': 'FiscalZen-Webhook/1.0',
                ...(webhook.headers as Record<string, string>)
            };

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(fullPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const durationMs = Date.now() - startTime;
            let responseBody;
            try {
                responseBody = await response.json();
            } catch {
                responseBody = { text: 'Response not JSON' };
            }

            const success = response.ok;

            await this.logDelivery(webhook.id, event, fullPayload, {
                success,
                statusCode: response.status,
                response: responseBody,
                attempt,
                durationMs,
                errorMessage: success ? undefined : `HTTP ${response.status}`
            });

            if (!success) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }

            return { success: true, statusCode: response.status };

        } catch (error: any) {
            const durationMs = Date.now() - startTime;

            await this.logDelivery(webhook.id, event, fullPayload, {
                success: false,
                statusCode: 0,
                errorMessage: error.message,
                attempt,
                durationMs
            });

            throw error;
        }
    }

    verifySignature(payload: any, signature: string, secret: string): boolean {
        const expectedSignature = this.generateSignature(payload, secret);
        
        const signatureBuffer = Buffer.from(signature, 'utf8');
        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

        if (signatureBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    }

    private generateSignature(payload: any, secret: string): string {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return `sha256=${hmac.digest('hex')}`;
    }

    private async logDelivery(webhookId: string, event: string, payload: any, result: any) {
        await this.db.insert(webhookLogs).values({
            webhookId,
            event,
            payload,
            response: result.response,
            statusCode: result.statusCode,
            attempt: result.attempt,
            success: result.success,
            errorMessage: result.errorMessage,
            durationMs: result.durationMs,
            executedAt: new Date()
        });
    }
}
