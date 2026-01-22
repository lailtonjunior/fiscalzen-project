import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClient, ApiClientError } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClientError', () => {
    it('should create error with correct properties', () => {
        const error = new ApiClientError('Test error', 'TEST_CODE', 400);

        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error.status).toBe(400);
        expect(error.name).toBe('ApiClientError');
    });
});

describe('createApiClient', () => {
    const api = createApiClient('test-token');

    beforeEach(() => {
        mockFetch.mockReset();
    });

    describe('get()', () => {
        it('should make GET request with correct headers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: 1 } })),
                headers: new Headers(),
            });

            const result = await api.get('/api/v1/test');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/test'),
                expect.objectContaining({
                    method: 'GET',
                    credentials: 'include',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token',
                    }),
                })
            );
            expect(result.success).toBe(true);
        });

        it('should append query params correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify({ success: true })),
                headers: new Headers(),
            });

            await api.get('/api/v1/test', { page: 1, search: 'foo' });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/test?page=1&search=foo'),
                expect.any(Object)
            );
        });
    });

    describe('post()', () => {
        it('should make POST request with JSON body', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: 1 } })),
                headers: new Headers(),
            });

            const result = await api.post('/api/v1/test', { name: 'Test' });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/test'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: 'Test' }),
                })
            );
            expect(result.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle 401 Unauthorized', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: () => Promise.resolve(JSON.stringify({ success: false })),
                headers: new Headers(),
            });

            try {
                await api.get('/api/v1/protected');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(ApiClientError);
                expect((error as ApiClientError).code).toBe('UNAUTHORIZED');
                expect((error as ApiClientError).status).toBe(401);
            }
        });

        it('should handle 429 Rate Limited with Retry-After header', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: () => Promise.resolve(JSON.stringify({ success: false })),
                headers: new Headers({ 'Retry-After': '120' }),
            });

            try {
                await api.get('/api/v1/test');
            } catch (error) {
                expect(error).toBeInstanceOf(ApiClientError);
                expect((error as ApiClientError).code).toBe('RATE_LIMITED');
                expect((error as ApiClientError).message).toContain('120');
            }
        });

        it('should handle invalid JSON response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve('not json'),
                headers: new Headers(),
            });

            await expect(api.get('/api/v1/test')).rejects.toMatchObject({
                code: 'PARSE_ERROR',
            });
        });

        it('should handle network errors (fetch fails)', async () => {
            mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

            await expect(api.get('/api/v1/test')).rejects.toMatchObject({
                code: 'OFFLINE_ERROR',
                status: 0,
            });
        });

        it('should handle timeout (AbortError)', async () => {
            const abortError = new DOMException('Aborted', 'AbortError');
            mockFetch.mockRejectedValueOnce(abortError);

            await expect(api.get('/api/v1/test')).rejects.toMatchObject({
                code: 'TIMEOUT_ERROR',
                status: 408,
            });
        });

        it('should handle generic server error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: () => Promise.resolve(JSON.stringify({
                    success: false,
                    error: { code: 'SERVER_ERROR', message: 'Internal error' },
                })),
                headers: new Headers(),
            });

            await expect(api.get('/api/v1/test')).rejects.toMatchObject({
                code: 'SERVER_ERROR',
                status: 500,
                message: 'Internal error',
            });
        });
    });

    describe('HTTP Methods', () => {
        beforeEach(() => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify({ success: true })),
                headers: new Headers(),
            });
        });

        it('should support PUT', async () => {
            await api.put('/api/v1/test/1', { name: 'Updated' });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ method: 'PUT' })
            );
        });

        it('should support PATCH', async () => {
            await api.patch('/api/v1/test/1', { name: 'Patched' });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ method: 'PATCH' })
            );
        });

        it('should support DELETE', async () => {
            await api.delete('/api/v1/test/1');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });
});

describe('createApiClient without token', () => {
    const api = createApiClient(null);

    beforeEach(() => {
        mockFetch.mockReset();
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({ success: true })),
            headers: new Headers(),
        });
    });

    it('should not include Authorization header when token is null', async () => {
        await api.get('/api/v1/public');

        const callArgs = mockFetch.mock.calls[0];
        const headers = callArgs[1].headers;

        expect(headers['Authorization']).toBeUndefined();
    });
});
