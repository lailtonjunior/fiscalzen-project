import 'reflect-metadata';
import { container } from 'tsyringe';
import { WebhookService } from '../src/modules/webhooks/service';
import crypto from 'crypto';

describe('WebhookService', () => {
    let service: WebhookService;
    const mockDb = {
        insert: vi.fn(),
        query: {
            webhooks: {
                findFirst: vi.fn(),
                findMany: vi.fn()
            }
        },
        update: vi.fn(),
        delete: vi.fn()
    } as any;

    beforeAll(() => {
        // Since we are not running full integration, we can test signature logic via 'deliverPayload' 
        // if we mock fetch and db.
        // For simpler unit test verifying signature generation (private method access or testing side effect)
        // I will inspect signature on the request headers in a mock fetch.
    });

    it('should generate valid HMAC signature', async () => {
        // This test requires access to private method or mocking fetch to inspect headers.
        // Let's create a subclass or use prototype access to test private method if needed,
        // or just rely on 'deliverPayload' execution with mocked fetch.

        const service = new WebhookService(mockDb);
        const secret = 'my_secret_key';
        const payload = { test: 'data' };

        // Access private method via casting
        const signature = (service as any).generateSignature(payload, secret);

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        const expected = `sha256=${hmac.digest('hex')}`;

        expect(signature).toBe(expected);
    });
});
