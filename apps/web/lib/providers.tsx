'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode } from 'react';

/**
 * Cria uma nova instância do QueryClient com configurações otimizadas
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 segundos (sobrescreva em queries específicas)
        gcTime: 5 * 60 * 1000, // 5 minutos (antigo cacheTime)
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Não retry em erros de autenticação
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status === 401 || status === 403) return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Para SSR: criar um novo client no servidor, reutilizar no cliente
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Servidor: sempre criar novo client
    return makeQueryClient();
  }
  // Cliente: reutilizar o mesmo client
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
