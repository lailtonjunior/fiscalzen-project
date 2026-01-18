'use client';

import { FileText, Truck, DollarSign } from 'lucide-react';
import {
  StatsCard,
  IntegritySemaphore,
  TimelineChart,
  DocsByTypeChart,
  RecentDocuments,
  PendingAlerts,
} from '@/components/dashboard';
import {
  useDashboardSummary,
  useIntegrityStatus,
  useTimeline,
} from '@/lib/hooks/use-dashboard';
import { usePendingManifestations } from '@/lib/hooks/use-manifestacao';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const { data: integrity, isLoading: loadingIntegrity } = useIntegrityStatus();
  const { data: timeline, isLoading: loadingTimeline } = useTimeline();
  const { data: pendingManifestations, isLoading: loadingPending } = usePendingManifestations();

  const loading = loadingSummary;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visao geral dos seus documentos fiscais
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Documentos"
          value={summary?.totalDocuments ?? 0}
          description="Neste mes"
          icon={FileText}
          color="text-blue-600"
          bgColor="bg-blue-100"
          loading={loading}
        />
        <StatsCard
          title="NF-e"
          value={summary?.totalByType.NFE ?? 0}
          description="Notas fiscais"
          icon={FileText}
          color="text-green-600"
          bgColor="bg-green-100"
          loading={loading}
        />
        <StatsCard
          title="CT-e"
          value={summary?.totalByType.CTE ?? 0}
          description="Conhecimentos de transporte"
          icon={Truck}
          color="text-blue-600"
          bgColor="bg-blue-100"
          loading={loading}
        />
        <StatsCard
          title="Valor Total"
          value={summary ? formatCurrency(summary.totalValue) : 'R$ 0'}
          description="Neste mes"
          icon={DollarSign}
          color="text-purple-600"
          bgColor="bg-purple-100"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TimelineChart data={timeline} loading={loadingTimeline} />
        </div>
        <DocsByTypeChart data={summary?.totalByType} loading={loading} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Integrity + Pending */}
        <div className="space-y-4">
          <IntegritySemaphore status={integrity} loading={loadingIntegrity} />
          <PendingAlerts
            pendingItems={pendingManifestations}
            loading={loadingPending}
          />
        </div>

        {/* Recent Documents */}
        <RecentDocuments
          documents={summary?.recentDocuments}
          loading={loading}
        />
      </div>
    </div>
  );
}
