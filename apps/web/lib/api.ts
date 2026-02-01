import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to set auth token (called inside React components or hooks)
export const useApiAuth = () => {
  const { getToken } = useAuth();

  // This is a naive implementation. Ideally, we would use an interceptor 
  // but interceptors inside hooks are tricky.
  // A better pattern for Client Components is to use the `api` instance 
  // passing the token manually or use a wrapper hook.

  // However, specifically for server components or standard fetch flow, 
  // integration is different.

  // Since we are using standard "Client Component" fetching in the example,
  // we will add an interceptor that tries to get the token if possible,
  // OR we rely on the component using `useQuery` to pass the token.

  // Let's implement the Interceptor pattern by exporting a setup function
  // or just relying on a singleton if we can access the token storage.
  // Clerk stores token in memory/cookie.

  // For simplicity and correctness with Clerk/Next.js:
  // We will keep `api` as a raw instance, and create a hook that returns 
  // an authenticated axios instance or just use headers in the query function.

  return async () => {
    const token = await getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return api;
  };
};

// Global interceptor for client-side requests
// NOTE: This will only work if we can access the token. 
// Clerk's `getToken` is a hook, so it can't be used directly in a global non-hook file easily 
// without passing it in.
//
// The prompt suggested:
// api.interceptors.request.use(async (config) => { ... useAuth ... }) 
// But `useAuth` throws Error if used outside a component.
//
// solution: We will use a wrapper function for queries or simply default to 
// standard axios for now and assume the user handles auth in the query function
// OR we implement the interceptor but we know it might fail if called outside context.
// 
// Let's stick to the prompt's simplicity but add a safety check or comment.
// Actually, strict following of prompt:
// The prompt's example implies direct usage. This is technicaly incorrect in Next.js 
// outside a hook, but maybe they mean for it to be defined inside a hook or class.
//
// I will implement a class/object that manages this or just the raw instance 
// and we fix it in the provider.

// Re-reading prompt:
// "apps/web/lib/api.ts ... api.interceptors.request.use ... useAuth"
// This is strictly invalid React code (hook outside component). 
// I will implement a safe version: a hook `useApiClient` that returns the configured axios instance.

export const useApiClient = () => {
  const { getToken } = useAuth();

  // Create a new instance or use a memoized one to avoid recreating
  // For now, simpler is better.
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    headers: { 'Content-Type': 'application/json' }
  });

  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

// Export singleton for non-auth requests (or if we set default headers globally)
export const apiUnauth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});
