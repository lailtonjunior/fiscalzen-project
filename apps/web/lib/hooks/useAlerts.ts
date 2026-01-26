import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../api';

export interface Alerta {
    id: string;
    tenantId: string;
    companyId: string;
    documentId: string;
    type: string;
    priority: 'ALTA' | 'MEDIA' | 'BAIXA';
    title: string;
    message: string;
    data: any;
    lido: boolean;
    lidoEm: string | null;
    createdAt: string;
}

export interface AlertaSummary {
    total: number;
    naoLidos: number;
    altaPrioridade: number;
}

export function useAlerts() {
    const { apiClient } = useApiClient();
    const [alerts, setAlerts] = useState<Alerta[]>([]);
    const [summary, setSummary] = useState<AlertaSummary>({ total: 0, naoLidos: 0, altaPrioridade: 0 });
    const [loading, setLoading] = useState(false);

    const fetchAlerts = useCallback(async (filters: any = {}) => {
        if (!apiClient) return;
        try {
            setLoading(true);
            const res = await apiClient.get<Alerta[]>('/api/v1/alerts', filters);
            if (res.success && res.data) {
                setAlerts(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch alerts', error);
        } finally {
            setLoading(false);
        }
    }, [apiClient]);

    const fetchSummary = useCallback(async () => {
        if (!apiClient) return;
        try {
            const res = await apiClient.get<AlertaSummary>('/api/v1/alerts/summary');
            if (res.success && res.data) {
                setSummary(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch alerts summary', error);
        }
    }, [apiClient]);

    const markAsRead = useCallback(async (id: string) => {
        if (!apiClient) return;
        try {
            await apiClient.patch(`/api/v1/alerts/${id}/read`);
            // Update local state optimistic
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, lido: true } : a));
            setSummary(prev => ({
                ...prev,
                naoLidos: Math.max(0, prev.naoLidos - 1)
            }));
        } catch (error) {
            console.error('Failed to mark alert as read', error);
        }
    }, [apiClient]);

    const markAllAsRead = useCallback(async () => {
        if (!apiClient) return;
        try {
            await apiClient.patch('/api/v1/alerts/read-all');
            fetchAlerts();
            fetchSummary();
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    }, [apiClient, fetchAlerts, fetchSummary]);

    return {
        alerts,
        summary,
        loading,
        fetchAlerts,
        fetchSummary,
        markAsRead,
        markAllAsRead
    };
}
