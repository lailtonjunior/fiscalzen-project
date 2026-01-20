'use client';

import { useAuth } from '@clerk/nextjs';
import { useMemo, useCallback } from 'react';
import { createApiClient } from '../api';

// Tipo de retorno do API client
type ApiClient = ReturnType<typeof createApiClient>;

// Interface para o retorno do hook
interface UseApiClientReturn {
    getApiClient: () => Promise<ApiClient>;
    publicApiClient: ApiClient;
    getToken: () => Promise<string | null>;
    isLoaded: boolean;
    isSignedIn: boolean | undefined;
    userId: string | null | undefined;
}

/**
 * Hook para usar o API client com autenticação Clerk.
 * Obtém o token automaticamente do Clerk e cria um cliente API configurado.
 * 
 * @example
 * function MyComponent() {
 *   const { getApiClient, isLoaded, isSignedIn } = useApiClient();
 *   
 *   useEffect(() => {
 *     if (!isLoaded || !isSignedIn) return;
 *     
 *     const fetchData = async () => {
 *       const client = await getApiClient();
 *       const response = await client.get('/api/v1/documents');
 *     };
 *     
 *     fetchData();
 *   }, [isLoaded, isSignedIn, getApiClient]);
 * }
 */
export function useApiClient(): UseApiClientReturn {
    const { getToken, isLoaded, isSignedIn, userId } = useAuth();

    /**
     * Obtém um cliente API com token válido.
     * Deve ser chamado dentro de funções async quando fizer requisições.
     */
    const getApiClient = useCallback(async (): Promise<ApiClient> => {
        const token = await getToken();
        return createApiClient(token);
    }, [getToken]);

    /**
     * Cliente API sem token (para rotas públicas).
     * Use getApiClient() para rotas autenticadas.
     */
    const publicApiClient = useMemo(() => createApiClient(null), []);

    return {
        getApiClient,
        publicApiClient,
        getToken,
        isLoaded,
        isSignedIn,
        userId,
    };
}

