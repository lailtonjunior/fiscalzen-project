import { describe, it, expect } from 'vitest';
import { createApiClient, normalizeApiPath, unwrapApiData } from './api';

describe('unwrapApiData', () => {
  it('returns envelope data when payload follows API envelope', () => {
    const payload = {
      success: true,
      data: { id: 'doc-1' },
    };

    expect(unwrapApiData(payload)).toEqual({ id: 'doc-1' });
  });

  it('returns payload unchanged when response is already unwrapped', () => {
    const payload = { id: 'doc-2' };

    expect(unwrapApiData(payload)).toEqual(payload);
  });
});

describe('createApiClient', () => {
  it('configures base URL and Authorization header when token exists', () => {
    const client = createApiClient('test-token');

    expect(client.defaults.baseURL).toContain('/api/v1');
    expect(client.defaults.headers['Content-Type']).toBe('application/json');
    expect(client.defaults.headers.Authorization).toBe('Bearer test-token');
  });

  it('does not include Authorization header when token is null', () => {
    const client = createApiClient(null);

    expect(client.defaults.headers.Authorization).toBeUndefined();
  });

  it('normalizes enveloped responses through interceptor', () => {
    const client = createApiClient(null);
    const responseManager = client.interceptors.response as unknown as {
      handlers: Array<{ fulfilled?: (response: { data: unknown }) => { data: unknown } }>;
    };

    const interceptor = responseManager.handlers.find(handler => typeof handler.fulfilled === 'function')?.fulfilled;
    expect(interceptor).toBeDefined();

    const normalized = interceptor!({
      data: {
        success: true,
        data: { id: 'doc-3' },
      },
    });

    expect(normalized.data).toEqual({ id: 'doc-3' });
  });
});

describe('normalizeApiPath', () => {
  it('removes /api/v1 prefix when base URL already includes API version', () => {
    expect(normalizeApiPath('/api/v1/documents', 'http://localhost:3001/api/v1')).toBe('/documents');
  });

  it('keeps /api/v1 prefix when base URL does not include API version', () => {
    expect(normalizeApiPath('/api/v1/documents', 'http://localhost:3001')).toBe('/api/v1/documents');
  });

  it('keeps unversioned paths unchanged', () => {
    expect(normalizeApiPath('/documents', 'http://localhost:3001/api/v1')).toBe('/documents');
  });
});
