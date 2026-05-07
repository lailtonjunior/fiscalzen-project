import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

export interface Alerta {
    id: string;
    tenantId: string;
    companyId: string;
    documentId: string;
    type: string;
    priority: 'ALTA' | 'MEDIA' | 'BAIXA';
    title: string;
    message: string;
    data: Record<string, unknown> | null;
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
    const { getApiClient, isSignedIn } = useApiClient();
    const [alerts, setAlerts] = useState<Alerta[]>([]);
    const [summary, setSummary] = useState<AlertaSummary>({ total: 0, naoLidos: 0, altaPrioridade: 0 });
    const [loading, setLoading] = useState(false);

    const fetchAlerts = useCallback(async (filters: Record<string, unknown> = {}) => {
        if (!isSignedIn) return;
        try {
            setLoading(true);
            const apiClient = await getApiClient();
            const res = await apiClient.get<Alerta[]>('/api/v1/alerts', { params: filters });
            if (res.data) {
                setAlerts(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch alerts', error);
        } finally {
            setLoading(false);
        }
    }, [getApiClient, isSignedIn]);

    const fetchSummary = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            const apiClient = await getApiClient();
            const res = await apiClient.get<AlertaSummary>('/api/v1/alerts/summary');
            if (res.data) {
                setSummary(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch alerts summary', error);
        }
    }, [getApiClient, isSignedIn]);

    const markAsRead = useCallback(async (id: string) => {
        if (!isSignedIn) return;
        try {
            const apiClient = await getApiClient();
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
    }, [getApiClient, isSignedIn]);

    const markAllAsRead = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            const apiClient = await getApiClient();
            await apiClient.patch('/api/v1/alerts/read-all');
            fetchAlerts();
            fetchSummary();
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    }, [getApiClient, isSignedIn, fetchAlerts, fetchSummary]);

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
