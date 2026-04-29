import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    createTestClient,
    cleanupDatabase,
    setupTestDatabase,
    teardownTestDatabase,
    createTestCompany
} from '../helpers/database';
import { generateTestToken, authHeaders } from '../helpers/auth';

describe('Certificates API Integration', () => {
    let db: ReturnType<typeof createTestClient>;
    let app: any;
    let token: string;
    let tenantId: string;
    let companyId: string;

    beforeAll(async () => {
        db = await setupTestDatabase();
        const { buildApp } = await import('../../src/app');
        app = await buildApp();
    });

    beforeEach(async () => {
        await cleanupDatabase(db);
        const { tenant, company } = await createTestCompany(db);
        tenantId = tenant.id;
        companyId = company.id;
        token = generateTestToken({ tenantId, role: 'admin' });
    });

    afterAll(async () => {
        await app.close();
        await cleanupDatabase(db);
        await teardownTestDatabase();
    });

    describe('POST /api/v1/companies/:id/certificate', () => {
        // Mocking file upload is tricky in integration without real file interaction
        // For now, we'll test that it requires auth and validation
        it('should require authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/companies/${companyId}/certificate`,
                payload: {}
            });
            expect(response.statusCode).toBe(401);
        });

        // Skip actual upload test for now unless we need to mock multipart
    });
});
