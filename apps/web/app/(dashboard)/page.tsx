'use client';

import { useQuery } from '@tanstack/react-query';
import { api, useApiClient } from '@/lib/api';
import {
    Users,
    FileText,
    FileCheck,
    AlertCircle,
    Building2,
    Shield,
    Activity
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { TimelineChart, DocsByTypeChart } from '@/components/dashboard/charts';
import { RecentDocuments } from '@/components/dashboard/recent-documents';

export default function DashboardPage() {
    const apiClient = useApiClient();

    const { data: metrics, isLoading } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            // Use useApiClient if available, or fallback to global api
            // Note: apiClient is a hook result, so it's an instance.
            const response = await apiClient.get('/dashboard/metrics');
            return response.data;
        },
    });

    // Mocking data structure if API response differs, or assuming API matches
    // Based on the prompt structure:
    // metrics: { documentsToday, pendingDocuments, totalCompanies, activeCertificates, documentsByPeriod, recentActivities }

    const cards = [
        {
            title: 'Emissão Hoje',
            value: metrics?.documentsToday || 0,
            icon: FileText,
            description: 'Documentos emitidos nas últimas 24h',
            bgColor: 'bg-blue-100',
            color: 'text-blue-600',
        },
        {
            title: 'Pendências',
            value: metrics?.pendingDocuments || 0,
            icon: AlertCircle,
            description: 'Documentos aguardando ação',
            bgColor: 'bg-orange-100',
            color: 'text-orange-600',
            variant: 'warning'
        },
        {
            title: 'Empresas Ativas',
            value: metrics?.totalCompanies || 0,
            icon: Building2,
            description: 'Total de CNPJs monitorados',
            bgColor: 'bg-green-100',
            color: 'text-green-600',
        },
        {
            title: 'Certificados',
            value: metrics?.activeCertificates || 0,
            icon: Shield,
            description: metrics?.expiringCertificates > 0
                ? `${metrics.expiringCertificates} expirando em breve`
                : 'Todos operacionais',
            bgColor: metrics?.expiringCertificates > 0 ? 'bg-red-100' : 'bg-purple-100',
            color: metrics?.expiringCertificates > 0 ? 'text-red-600' : 'text-purple-600',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, index) => (
                    <StatsCard
                        key={index}
                        {...card}
                        loading={isLoading}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TimelineChart
                    data={metrics?.documentsByPeriod}
                    loading={isLoading}
                />
                <RecentDocuments
                    documents={metrics?.recentActivities} // Assuming API returns 'recentActivities' as generic docs list
                    loading={isLoading}
                />
            </div>

            {/* Optional: Add Pie Chart row if space allows */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <DocsByTypeChart data={metrics?.documentsByType} loading={isLoading} />
                </div>
            </div>
        </div>
    );
}
