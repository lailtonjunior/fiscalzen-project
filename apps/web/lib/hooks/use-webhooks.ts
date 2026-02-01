'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

// ============================================
// Types
// ============================================

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt: string | null;
  successCount: number;
  failureCount: number;
}

export type WebhookEvent =
  | 'document.created'
  | 'document.updated'
  | 'document.manifestado'
  | 'certificate.expiring'
  | 'certificate.expired'
  | 'sync.completed'
  | 'sync.failed';

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  success: boolean;
  createdAt: string;
  duration: number | null;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: WebhookEvent[];
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  active?: boolean;
}

// ============================================
// Query Keys
// ============================================

export const webhookKeys = {
  all: ['webhooks'] as const,
  list: () => [...webhookKeys.all, 'list'] as const,
  detail: (id: string) => [...webhookKeys.all, 'detail', id] as const,
  logs: (id: string) => [...webhookKeys.all, 'logs', id] as const,
};

// ============================================
// Hooks
// ============================================

export function useWebhooks() {
  const { getApiClient, isLoaded } = useApiClient();

  return useQuery({
    queryKey: webhookKeys.list(),
    queryFn: async () => {
      const api = await getApiClient();
      const response = await api.get<Webhook[]>('/webhooks');
      return response.data;
    },
    enabled: isLoaded,
  });
}

export function useWebhook(id: string) {
  const { getApiClient, isLoaded } = useApiClient();

  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: async () => {
      const api = await getApiClient();
      const response = await api.get<Webhook>(`/webhooks/${id}`);
      return response.data;
    },
    enabled: isLoaded && !!id,
  });
}

export function useWebhookLogs(webhookId: string) {
  const { getApiClient, isLoaded } = useApiClient();

  return useQuery({
    queryKey: webhookKeys.logs(webhookId),
    queryFn: async () => {
      const api = await getApiClient();
      const response = await api.get<WebhookLog[]>(`/webhooks/${webhookId}/logs`);
      return response.data;
    },
    enabled: isLoaded && !!webhookId,
  });
}

export function useCreateWebhook() {
  const { getApiClient } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWebhookInput) => {
      const api = await getApiClient();
      const response = await api.post<Webhook>('/webhooks', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}

export function useUpdateWebhook() {
  const { getApiClient } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateWebhookInput & { id: string }) => {
      const api = await getApiClient();
      const response = await api.patch<Webhook>(`/webhooks/${id}`, input);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(id) });
    },
  });
}

export function useDeleteWebhook() {
  const { getApiClient } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const api = await getApiClient();
      await api.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}

export function useTestWebhook() {
  const { getApiClient } = useApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const api = await getApiClient();
      const response = await api.post<{ success: boolean; statusCode: number }>(
        `/webhooks/${id}/test`
      );
      return response.data;
    },
  });
}

export function useRegenerateWebhookSecret() {
  const { getApiClient } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const api = await getApiClient();
      const response = await api.post<{ secret: string }>(
        `/webhooks/${id}/regenerate-secret`
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(id) });
    },
  });
}

// ============================================
// Event Labels
// ============================================

export const webhookEventLabels: Record<WebhookEvent, string> = {
  'document.created': 'Documento criado',
  'document.updated': 'Documento atualizado',
  'document.manifestado': 'Documento manifestado',
  'certificate.expiring': 'Certificado expirando',
  'certificate.expired': 'Certificado expirado',
  'sync.completed': 'Sincronizacao concluida',
  'sync.failed': 'Sincronizacao falhou',
};
