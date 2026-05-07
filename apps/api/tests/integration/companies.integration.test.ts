/**
 * Companies Integration Tests
 * 
 * Tests company CRUD operations against real PostgreSQL database.
 * Validates Drizzle queries, relationships, and business logic.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, and } from 'drizzle-orm';
import {
    createTestClient,
    cleanupDatabase,
    setupTestDatabase,
    teardownTestDatabase,
    schema
} from '../helpers/database';
import {
    createTestCompany,
} from '../helpers/database'; // Moved createTestCompany to database.ts in previous step
import {
    generateTestToken,
    authHeaders
} from '../helpers/auth';

describe('Companies API Integration', () => {
    let db: ReturnType<typeof createTestClient>;
    let app: any;
    let token: string;
    let tenantId: string;
    let userId: string;

    beforeAll(async () => {
        db = await setupTestDatabase();
        // Assume buildApp is available from src/app
        // Importing dynamically to ensure setup runs first
        const { buildApp } = await import('../../src/app');
        app = await buildApp();
    });

    beforeEach(async () => {
        await cleanupDatabase(db);

        // Setup initial data
        const { tenant } = await createTestCompany(db);
        tenantId = tenant.id;

        // Create auth token
        token = generateTestToken({
            tenantId: tenant.id,
            role: 'admin'
        });
    });

    afterAll(async () => {
        await app.close();
        await cleanupDatabase(db);
        await teardownTestDatabase();
    });

    describe('POST /api/v1/companies', () => {
        it('should create a company with valid data', async () => {
            const payload = {
                cnpj: '98765432000188',
                razaoSocial: 'New Company LTDA',
                nomeFantasia: 'New Co',
                uf: 'SP'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/companies',
                headers: authHeaders(token),
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.data).toHaveProperty('id');
            expect(body.data.cnpj).toBe(payload.cnpj);
        });

        it('should reject invalid CNPJ', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/companies',
                headers: authHeaders(token),
                payload: {
                    cnpj: '123', // Invalid
                    razaoSocial: 'Test'
                }
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /api/v1/companies', () => {
        it('should list companies', async () => {
            // Create query params
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/companies?page=1&limit=10',
                headers: authHeaders(token)
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.data).toBeInstanceOf(Array);
        });
    });
});
