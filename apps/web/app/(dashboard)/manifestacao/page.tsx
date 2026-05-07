'use client';

import { useMemo, useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@fiscalzen/ui';
import { Activity, Clock3, FileCheck2, History } from 'lucide-react';
import { PendingCienciaTable, AwaitingFinalTable, ManifestacaoHistoryTable } from '@/components/manifestacao';
import { useCompanies } from '@/lib/hooks/use-companies';
import { useAwaitingFinal, usePendingCount, usePendingManifestations } from '@/lib/hooks/use-manifestacao';

export default function ManifestacaoPage() {
  const [companyId, setCompanyId] = useState('');
  const { data: companies = [] } = useCompanies();
  const { data: counts, isLoading: isCountsLoading } = usePendingCount(companyId || undefined);
  const { data: pendingItems = [], isLoading: isPendingLoading } = usePendingManifestations(companyId || undefined);
  const { data: awaitingFinal = [], isLoading: isAwaitingLoading } = useAwaitingFinal(companyId || undefined);

  const urgentPending = useMemo(
    () => pendingItems.filter((item) => item.daysPending > 7).length,
    [pendingItems]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manifestacao do Destinatario</h1>
          <p className="text-sm text-muted-foreground">
            Operacao fiscal para ciencia, confirmacao, desconhecimento e operacao nao realizada.
          </p>
        </div>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
        >
          <option value="">Todas as empresas</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.razaoSocial}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Total pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{isCountsLoading ? '-' : counts?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileCheck2 className="h-4 w-4" />
              Pendentes de ciencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{isPendingLoading ? '-' : pendingItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock3 className="h-4 w-4" />
              Aguardando final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{isAwaitingLoading ? '-' : awaitingFinal.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" />
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold">{urgentPending}</p>
              {urgentPending > 0 && <Badge variant="destructive">Acao recomendada</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <PendingCienciaTable companyId={companyId || undefined} />
      <AwaitingFinalTable companyId={companyId || undefined} />
      <ManifestacaoHistoryTable companyId={companyId || undefined} />
    </div>
  );
}
