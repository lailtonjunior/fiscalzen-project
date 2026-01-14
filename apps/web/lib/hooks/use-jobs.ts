'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { JobsStatus, CompanySyncStatus } from '../types';

// ============================================
// Query Keys
// ============================================

export const jobsKeys = {
  all: ['jobs'] as const,
  status: () => [...jobsKeys.all, 'status'] as const,
  companySync: (companyId: string) => [...jobsKeys.all, 'company', companyId] as const,
};

// ============================================
// Hooks
// ============================================

export function useJobsStatus() {
  return useQuery({
    queryKey: jobsKeys.status(),
    queryFn: async () => {
      const response = await api.get<JobsStatus>('/api/v1/jobs/status');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useCompanySyncStatus(companyId: string) {
  return useQuery({
    queryKey: jobsKeys.companySync(companyId),
    queryFn: async () => {
      const response = await api.get<CompanySyncStatus>(`/api/v1/jobs/company/${companyId}`);
      return response.data;
    },
    enabled: !!companyId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const response = await api.post<{ message: string }>(`/api/v1/jobs/sync/${companyId}`);
      return response.data;
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.companySync(companyId) });
    },
  });
}

export function useTriggerSyncAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ message: string }>('/api/v1/jobs/sync-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.all });
    },
  });
}
