/**
 * Auth Integration Tests
 */
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/app';
import { generateTestToken, authHeaders } from '../helpers/auth';

describe('Auth Integration', () => {
    const testUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        tenantId: 'tenant-123'
    };

    it('should reject access to protected route without token', async () => {
        const app = await buildApp();

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/companies'
        });

        expect(response.statusCode).toBe(401);
    });

    it('should allow access to protected route with valid token', async () => {
        // Note: This test assumes /api/v1/companies exists and uses the auth plugin
        // We are mocking the DB response/service flow implicitly by checking 401 vs non-401
        // Ideally we would mock the service layer if we want to isolate auth logic completely in integration,
        // but for end-to-end we want to see it hit the route. 
        // Since we don't have a valid DB setup in this specific "no-setup" file, it might fail inside the route handler
        // but pass the Auth check. So we expect !401.

        const app = await buildApp();
        const token = generateTestToken(testUser);

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/companies',
            headers: authHeaders(token)
        });

        // It might return 200 (empty list) or 500 (db error) but SHOULD NOT be 401
        expect(response.statusCode).not.toBe(401);
    });

    it('should reject access with invalid token', async () => {
        const app = await buildApp();

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
