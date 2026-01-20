// ============================================
// API Client Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================
// Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ============================================
// Error Class
// ============================================

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

// ============================================
// Constants
// ============================================

const DEFAULT_TIMEOUT = 30000; // 30 segundos
const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';

// ============================================
// Fetch Wrapper (Base Function)
// ============================================

interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
}

async function apiFetchWithToken<T>(
  endpoint: string,
  token: string | null,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Setup abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    // Parse response with validation
    let data: ApiResponse<T>;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : { success: false };
    } catch {
      throw new ApiClientError(
        'Resposta inválida do servidor',
        'PARSE_ERROR',
        response.status
      );
    }

    // Handle authentication errors
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = SIGN_IN_URL;
      }
      throw new ApiClientError('Sessão expirada', 'UNAUTHORIZED', 401);
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new ApiClientError(
        `Muitas requisições. Tente novamente em ${retryAfter} segundos.`,
        'RATE_LIMITED',
        429
      );
    }

    if (!response.ok) {
      throw new ApiClientError(
        data.error?.message || 'Erro na requisição',
        data.error?.code || 'REQUEST_ERROR',
        response.status
      );
    }

    return data;
  } catch (error) {
    // Re-throw our own errors
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Timeout error (AbortController)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError(
        'Requisição excedeu o tempo limite',
        'TIMEOUT_ERROR',
        408
      );
    }

    // Offline / Network error
    if (error instanceof TypeError) {
      // TypeError with 'fetch' or 'Failed to fetch' indicates network issues
      if (
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      ) {
        throw new ApiClientError(
          'Sem conexão com a internet',
          'OFFLINE_ERROR',
          0
        );
      }
    }

    // Generic network error
    throw new ApiClientError(
      'Erro de conexão com o servidor',
      'NETWORK_ERROR',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// API Factory (for use with Clerk token)
// ============================================

/**
 * Creates an API client instance with the provided auth token.
 * Use this with Clerk's getToken() function.
 * 
 * @example
 * // In a Client Component:
 * const { getToken } = useAuth();
 * const token = await getToken();
 * const apiClient = createApiClient(token);
 * const response = await apiClient.get('/api/v1/documents');
 * 
 * @example
 * // In a Server Component or Route Handler:
 * const { getToken } = auth();
 * const token = await getToken();
 * const apiClient = createApiClient(token);
 */
export function createApiClient(token: string | null) {
  return {
    // GET request
    get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      const query = searchParams.toString();
      const url = query ? `${endpoint}?${query}` : endpoint;
      return apiFetchWithToken<T>(url, token, { method: 'GET' });
    },

    // POST request
    post<T>(endpoint: string, body?: unknown) {
      return apiFetchWithToken<T>(endpoint, token, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    // PUT request
    put<T>(endpoint: string, body?: unknown) {
      return apiFetchWithToken<T>(endpoint, token, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    // PATCH request
    patch<T>(endpoint: string, body?: unknown) {
      return apiFetchWithToken<T>(endpoint, token, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    // DELETE request
    delete<T>(endpoint: string) {
      return apiFetchWithToken<T>(endpoint, token, { method: 'DELETE' });
    },

    // Upload file (multipart/form-data)
    async upload<T>(endpoint: string, formData: FormData) {
      const url = `${API_BASE_URL}${endpoint}`;

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiClientError(
          data.error?.message || 'Erro no upload',
          data.error?.code || 'UPLOAD_ERROR',
          response.status
        );
      }

      return data as ApiResponse<T>;
    },
  };
}

// ============================================
// React Hook for API Client
// ============================================

/**
 * Custom hook to use the API client with Clerk authentication.
 * Must be used in a Client Component within ClerkProvider.
 * 
 * @example
 * 'use client';
 * import { useApiClient } from '@/lib/api';
 * 
 * function MyComponent() {
 *   const { apiClient, isLoaded, isSignedIn } = useApiClient();
 *   
 *   const fetchData = async () => {
 *     if (!apiClient) return;
 *     const response = await apiClient.get('/api/v1/documents');
 *     // ...
 *   };
 * }
 */
export { useApiClient } from './hooks/useApiClient';

// ============================================
// Default export for backwards compatibility
// ============================================

// For server-side usage or when token is managed externally
export const api = createApiClient(null);

export default api;
