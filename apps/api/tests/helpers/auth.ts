/**
 * Auth Helper for Integration Tests
 */

import jwt from 'jsonwebtoken';

const TEST_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long';

interface TokenPayload {
    sub: string;
    email: string;
    role?: string;
    tenantId?: string;
    [key: string]: any;
}

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(payload: Partial<TokenPayload> = {}): string {
    const defaultPayload = {
        sub: payload.sub || crypto.randomUUID(),
        email: 'test@fiscalzen.com.br',
        role: 'admin',
        tenantId: crypto.randomUUID(),
        ...payload
    };

    return jwt.sign(defaultPayload, TEST_SECRET, { expiresIn: '1h' });
}

/**
 * Helper to add authentication headers to request options
 */
export function authHeaders(token: string) {
    return {
        Authorization: `Bearer ${token}`
    };
}
