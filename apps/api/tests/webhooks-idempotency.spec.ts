import 'reflect-metadata';
import { WebhookService } from '../src/modules/webhooks/service';

describe('WebhookService - Idempotency', () => {
    let mockDb: any;
    let mockRedis: any;

    beforeEach(() => {
        mockDb = {
            insert: vi.fn(),
            query: { webhooks: { findFirst: vi.fn(), findMany: vi.fn() } },
            update: vi.fn(),
            delete: vi.fn(),
        };

        mockRedis = {
            get: vi.fn(),
            set: vi.fn(),
        };
    });

    it('deve processar normalmente quando a Idempotency-Key é inédita', async () => {
        const service = new WebhookService(mockDb);
        (service as any).redis = mockRedis;
        const tenantId = 'tenant-123';
        const endpoint = '/api/v1/incoming/sefaz';
        const idempotencyKey = 'chave-inedita-001';
        
        mockRedis.get.mockResolvedValue(null);
        
        const processFn = vi.fn().mockResolvedValue({ status: 'sucesso', id: 1 });

        const result = await service.executeWithIdempotency({
            tenantId,
            endpoint,
            idempotencyKey,
            ttlSeconds: 3600
        }, processFn);

        expect(processFn).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ status: 'sucesso', id: 1 });
        expect(mockRedis.set).toHaveBeenCalledWith(
            `webhook:idempotency:${tenantId}:${endpoint}:${idempotencyKey}`,
            JSON.stringify({ status: 'sucesso', id: 1 }),
            'EX',
            3600
        );
    });

    it('nao deve reprocessar quando a mesma chave reaparece dentro do TTL, retornando cache', async () => {
        const service = new WebhookService(mockDb);
        (service as any).redis = mockRedis;
        const tenantId = 'tenant-123';
        const endpoint = '/api/v1/incoming/sefaz';
        const idempotencyKey = 'chave-duplicada-002';
        
        const cachedResponse = { status: 'sucesso', id: 99 };
        mockRedis.get.mockResolvedValue(JSON.stringify(cachedResponse));
        
        const processFn = vi.fn();

        const result = await service.executeWithIdempotency({
            tenantId,
            endpoint,
            idempotencyKey,
            ttlSeconds: 3600
        }, processFn);

        expect(processFn).not.toHaveBeenCalled();
        expect(result).toEqual(cachedResponse);
    });

    it('nao deve compartilhar resultado entre tenants diferentes usando a mesma chave textual', async () => {
        const service = new WebhookService(mockDb);
        (service as any).redis = mockRedis;
        const tenantA = 'tenant-A';
        const tenantB = 'tenant-B';
        const endpoint = '/api/v1/incoming/sefaz';
        const sharedKey = 'mesma-chave-em-ambos';
        
        // Tenant A has cached result
        const cachedResponseA = { status: 'sucesso', tenant: 'A' };
        
        mockRedis.get.mockImplementation(async (key: string) => {
            if (key === `webhook:idempotency:${tenantA}:${endpoint}:${sharedKey}`) {
                return JSON.stringify(cachedResponseA);
            }
            return null;
        });

        const processFnB = vi.fn().mockResolvedValue({ status: 'sucesso', tenant: 'B' });

        // Request from Tenant B should bypass cache of Tenant A
        const resultB = await service.executeWithIdempotency({
            tenantId: tenantB,
            endpoint,
            idempotencyKey: sharedKey,
            ttlSeconds: 3600
        }, processFnB);

        expect(processFnB).toHaveBeenCalledTimes(1);
        expect(resultB).toEqual({ status: 'sucesso', tenant: 'B' });
        expect(mockRedis.set).toHaveBeenCalledWith(
            `webhook:idempotency:${tenantB}:${endpoint}:${sharedKey}`,
            JSON.stringify({ status: 'sucesso', tenant: 'B' }),
            'EX',
            3600
        );
    });

    it('deve seguir processamento normal caso a Idempotency-Key não seja enviada', async () => {
        const service = new WebhookService(mockDb);
        (service as any).redis = mockRedis;
        const tenantId = 'tenant-123';
        const endpoint = '/api/v1/incoming/sefaz';
        
        const processFn = vi.fn().mockResolvedValue({ status: 'sucesso', id: 42 });

        const result = await service.executeWithIdempotency({
            tenantId,
            endpoint,
            idempotencyKey: undefined,
            ttlSeconds: 3600
        }, processFn);

        expect(processFn).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ status: 'sucesso', id: 42 });
        expect(mockRedis.get).not.toHaveBeenCalled();
        expect(mockRedis.set).not.toHaveBeenCalled();
    });
});
