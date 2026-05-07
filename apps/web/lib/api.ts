import axios, { AxiosInstance } from 'axios';
import { useAuth } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const API_VERSION_PREFIX = '/api/v1';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiEnvelope<T> | T;

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'data' in payload
  );
}

export function unwrapApiData<T>(payload: ApiResult<T>): T {
  if (isApiEnvelope<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

function hasVersionedBaseUrl(baseURL?: string) {
  if (!baseURL) {
    return false;
  }

  return baseURL.replace(/\/+$/, '').endsWith(API_VERSION_PREFIX);
}

export function normalizeApiPath(url: string | undefined, baseURL = API_BASE_URL) {
  if (!url || !hasVersionedBaseUrl(baseURL)) {
    return url;
  }

  if (url === API_VERSION_PREFIX) {
    return '/';
  }

  if (url.startsWith(`${API_VERSION_PREFIX}/`)) {
    return url.slice(API_VERSION_PREFIX.length);
  }

  return url;
}

function attachRequestNormalization(client: AxiosInstance): AxiosInstance {
  client.interceptors.request.use((config) => {
    config.url = normalizeApiPath(config.url, config.baseURL);
    return config;
  });
  return client;
}

function attachResponseNormalization(client: AxiosInstance): AxiosInstance {
  attachRequestNormalization(client);
  client.interceptors.response.use((response) => {
    response.data = unwrapApiData(response.data as ApiResult<unknown>);
    return response;
  });

  return client;
}

function createBaseClient(token?: string): AxiosInstance {
  return attachResponseNormalization(
    axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  );
}

export const api = createBaseClient();
export const apiRaw = attachRequestNormalization(
  axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })
);

export const useApiAuth = () => {
  const { getToken } = useAuth();

  return async () => {
    const token = await getToken();

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      apiRaw.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return api;
  };
};

export const useApiClient = () => {
  const { getToken } = useAuth();

  const client = createBaseClient();

  client.interceptors.request.use(async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return client;
};

export const apiUnauth = createBaseClient();

export function createApiClient(token: string | null) {
  return createBaseClient(token ?? undefined);
}
