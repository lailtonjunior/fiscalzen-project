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
// Token Management
// ============================================

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// ============================================
// Fetch Wrapper
// ============================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle authentication errors
    if (response.status === 401) {
      // Clear token and redirect to login
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiClientError('Sessao expirada', 'UNAUTHORIZED', 401);
    }

    if (!response.ok) {
      throw new ApiClientError(
        data.error?.message || 'Erro na requisicao',
        data.error?.code || 'REQUEST_ERROR',
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError(
      'Erro de conexao com o servidor',
      'NETWORK_ERROR',
      0
    );
  }
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
// API Methods
// ============================================

export const api = {
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
    return apiFetch<T>(url, { method: 'GET' });
  },

  // POST request
  post<T>(endpoint: string, body?: unknown) {
    return apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // PUT request
  put<T>(endpoint: string, body?: unknown) {
    return apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // PATCH request
  patch<T>(endpoint: string, body?: unknown) {
    return apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // DELETE request
  delete<T>(endpoint: string) {
    return apiFetch<T>(endpoint, { method: 'DELETE' });
  },

  // Upload file (multipart/form-data)
  async upload<T>(endpoint: string, formData: FormData) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
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

// ============================================
// Convenience exports
// ============================================

export default api;
