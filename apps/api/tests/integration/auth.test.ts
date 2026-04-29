/**
 * Auth Integration Tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    createTestClient,
    cleanupDatabase,
    setupTestDatabase,
    teardownTestDatabase,
    createTestCompany
} from '../helpers/database';
import { generateTestToken, authHeaders } from '../helpers/auth';

describe('Auth Integration', () => {
    let db: ReturnType<typeof createTestClient>;
    let app: any;
    let validToken: string;

    beforeAll(async () => {
        db = await setupTestDatabase();
        const { buildApp } = await import('../../src/app');
        app = await buildApp();
    });

    beforeEach(async () => {
        await cleanupDatabase(db);
        const { tenant } = await createTestCompany(db);
        validToken = generateTestToken({ tenantId: tenant.id });
    });

    afterAll(async () => {
        await app.close();
        await cleanupDatabase(db);
        await teardownTestDatabase();
    });

    it('should reject access to protected route without token', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/companies'
        });

        expect(response.statusCode).toBe(401);
    });

    it('should allow access to protected route with valid token', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/companies',
            headers: authHeaders(validToken)
        });

        // Should be 200 now that DB is setup even if empty
        expect(response.statusCode).toBe(200);
    });

    it('should reject access with invalid token', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/companies',
            headers: {
                Authorization: 'Bearer invalid-token-string'
            }
        });

        expect(response.statusCode).toBe(401);
    });
});
