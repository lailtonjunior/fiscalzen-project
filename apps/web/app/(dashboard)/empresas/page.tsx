'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Skeleton } from '@fiscalzen/ui';
import { Plus, Building2 } from 'lucide-react';
import { CompanyCard } from '@/components/companies';
import { useCompanies } from '@/lib/hooks/use-companies';
import { useTriggerSync } from '@/lib/hooks/use-jobs';

export default function EmpresasPage() {
  const { data: companies, isLoading } = useCompanies();
  const triggerSync = useTriggerSync();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = async (companyId: string) => {
    setSyncingId(companyId);
    try {
      await triggerSync.mutateAsync(companyId);
    } finally {
      setSyncingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie suas empresas e certificados
          </p>
        </div>
        <Link href="/empresas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        </Link>
      </div>

      {/* Companies Grid */}
      {companies && companies.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSync={() => handleSync(company.id)}
              syncing={syncingId === company.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Nenhuma empresa cadastrada</h2>
          <p className="mt-1 text-muted-foreground">
            Cadastre sua primeira empresa para comecar a monitorar documentos.
          </p>
          <Link href="/empresas/nova" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Empresa
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
