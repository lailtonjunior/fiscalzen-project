/**
 * Auth Helper for Integration Tests
 */

import { fastify } from 'fastify';
import jwt from 'jsonwebtoken';

const TEST_SECRET = process.env.JWT_SECRET || 'supersecret';

interface TestUser {
    id: string;
    email: string;
    role: string;
    tenantId: string;
}

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(user: TestUser): string {
    return jwt.sign(user, TEST_SECRET, { expiresIn: '1h' });
}

/**
 * Helper to add authentication headers to request options
 */
export function authHeaders(token: string) {
    return {
        Authorization: `Bearer ${token}`
    };
}
