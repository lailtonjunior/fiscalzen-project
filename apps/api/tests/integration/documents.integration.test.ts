/**
 * Documents Integration Tests
 * 
 * Tests document CRUD operations against real PostgreSQL database.
 * Validates Drizzle queries, relationships, and constraints.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import {
    createTestClient,
    cleanupDatabase,
    setupTestDatabase,
    teardownTestDatabase,
    schema
} from '../helpers/database';
import {
    createTestTenant,
    createTestCompany,
    createTestDocument,
    createTestDocuments
} from './test-utils';
import {
    generateTestToken,
    authHeaders
} from '../helpers/auth';

describe('Documents API Integration', () => {
    let db: ReturnType<typeof createTestClient>;
    let app: any;
    let token: string;
    let tenantId: string;
    let companyId: string;

    beforeAll(async () => {
        db = await setupTestDatabase();
        // Dynamically import app
        const { buildApp } = await import('../../src/app');
        app = await buildApp();
    });

    beforeEach(async () => {
        await cleanupDatabase(db);

        // Setup initial data
        const tenant = await createTestTenant(db);
        const company = await createTestCompany(db, tenant.id);
        tenantId = tenant.id;
        companyId = company.id;

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

    describe('GET /api/v1/documents', () => {
        it('should list documents with filters', async () => {
            // Seed documents
            await createTestDocument(db, tenantId, companyId, { docType: 'NFE', numero: '100', valorTotal: 1000 });
            await createTestDocument(db, tenantId, companyId, { docType: 'NFE', numero: '101', valorTotal: 2000 });
            await createTestDocument(db, tenantId, companyId, { docType: 'CTE', numero: '200', valorTotal: 500 });

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/documents?companyId=${companyId}&docType=NFE`,
                headers: authHeaders(token)
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.data).toHaveLength(2);
            expect(body.data.every((d: any) => d.docType === 'NFE')).toBe(true);
        });
    });

    describe('GET /api/v1/documents/:id', () => {
        it('should return 404 for non-existent document', async () => {
            const uuid = crypto.randomUUID();
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/documents/${uuid}`,
                headers: authHeaders(token)
            });

            expect(response.statusCode).toBe(404);
        });

        it('should return document details', async () => {
            const doc = await createTestDocument(db, tenantId, companyId);

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/documents/${doc.id}`,
                headers: authHeaders(token)
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.data.id).toBe(doc.id);
        });
    });
});
