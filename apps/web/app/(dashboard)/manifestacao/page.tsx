'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fiscalzen/ui';
import { AlertTriangle, Clock, History } from 'lucide-react';
import {
  usePendingCount,
  usePendingManifestations,
  useAwaitingFinal,
} from '@/lib/hooks/use-manifestacao';
import { useCompanies } from '@/lib/hooks/use-companies';
import {
  PendingCienciaTable,
  AwaitingFinalTable,
  ManifestacaoHistoryTable,
} from '@/components/manifestacao';

export default function ManifestacaoPage() {
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();

  const { data: counts, isLoading: countsLoading } = usePendingCount();
  const { data: pendingItems } = usePendingManifestations(selectedCompany);
  const { data: awaitingItems } = useAwaitingFinal(selectedCompany);
  const { data: companies } = useCompanies();

  const pendingCount = pendingItems?.length ?? 0;
  const awaitingCount = awaitingItems?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manifestacao</h1>
          <p className="text-muted-foreground">
            Gerencie as manifestacoes do destinatario para seus documentos fiscais
          </p>
        </div>

        {/* Company Filter */}
        {companies && companies.length > 1 && (
          <Select
            value={selectedCompany ?? 'all'}
            onValueChange={(value) =>
              setSelectedCompany(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Todas as empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.razaoSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pendentes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendentes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pendentes
            {countsLoading ? (
              <Skeleton className="h-5 w-8" />
            ) : (
              pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {pendingCount}
                </Badge>
              )
            )}
          </TabsTrigger>
          <TabsTrigger value="aguardando" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Aguardando Final
            {countsLoading ? (
              <Skeleton className="h-5 w-8" />
            ) : (
              awaitingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {awaitingCount}
                </Badge>
              )
            )}
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <PendingCienciaTable companyId={selectedCompany} />
        </TabsContent>

        <TabsContent value="aguardando">
          <AwaitingFinalTable companyId={selectedCompany} />
        </TabsContent>

        <TabsContent value="historico">
          <ManifestacaoHistoryTable companyId={selectedCompany} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
