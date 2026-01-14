'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { DashboardSummary, IntegrityStatus, TimelineData } from '../types';

// ============================================
// Query Keys
// ============================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (companyId?: string) => [...dashboardKeys.all, 'summary', companyId] as const,
  integrity: (companyId?: string) => [...dashboardKeys.all, 'integrity', companyId] as const,
  timeline: (companyId?: string, days?: number) => [...dashboardKeys.all, 'timeline', companyId, days] as const,
  gaps: (companyId?: string) => [...dashboardKeys.all, 'gaps', companyId] as const,
};

// ============================================
// Hooks
// ============================================

export function useDashboardSummary(companyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.summary(companyId),
    queryFn: async () => {
      const response = await api.get<DashboardSummary>('/api/v1/dashboard/summary', {
        companyId,
      });
      return response.data;
    },
  });
}

export function useIntegrityStatus(companyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.integrity(companyId),
    queryFn: async () => {
      const response = await api.get<IntegrityStatus>('/api/v1/dashboard/integrity', {
        companyId,
      });
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useTimeline(companyId?: string, days: number = 30) {
  return useQuery({
    queryKey: dashboardKeys.timeline(companyId, days),
    queryFn: async () => {
      const response = await api.get<TimelineData[]>('/api/v1/dashboard/timeline', {
        companyId,
        days,
      });
      return response.data ?? [];
    },
  });
}

export function useIntegrityGaps(companyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.gaps(companyId),
    queryFn: async () => {
      const response = await api.get<IntegrityStatus>('/api/v1/dashboard/gaps', {
        companyId,
      });
      return response.data?.gaps ?? [];
    },
  });
}
