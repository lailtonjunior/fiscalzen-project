'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { BatchDownloadCreated, BatchDownloadJob, BatchDownloadRequest } from '../types';

export const downloadKeys = {
  all: ['downloads'] as const,
  batch: () => [...downloadKeys.all, 'batch'] as const,
  detail: (jobId: string) => [...downloadKeys.batch(), jobId] as const,
};

export function useBatchDownloads() {
  return useQuery({
    queryKey: downloadKeys.batch(),
    queryFn: async () => {
      const response = await api.get<BatchDownloadJob[]>('/api/v1/downloads/batch');
      return response.data ?? [];
    },
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      return jobs.some((job) => job.status === 'queued' || job.status === 'active') ? 5000 : false;
    },
  });
}

export function useBatchDownload(jobId?: string) {
  return useQuery({
    queryKey: downloadKeys.detail(jobId ?? ''),
    queryFn: async () => {
      const response = await api.get<BatchDownloadJob>(`/api/v1/downloads/batch/${jobId}`);
      return response.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });
}

export function useCreateBatchDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BatchDownloadRequest) => {
      const response = await api.post<BatchDownloadCreated>('/api/v1/downloads/batch', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: downloadKeys.batch() });
    },
  });
}

export function useAccessBatchDownload() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.get<{ url: string; expiresInSeconds: number }>(`/api/v1/downloads/batch/${jobId}/download`);
      return response.data;
    },
  });
}
