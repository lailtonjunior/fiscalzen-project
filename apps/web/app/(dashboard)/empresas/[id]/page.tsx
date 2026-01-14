'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton, Badge } from '@fiscalzen/ui';
import { ArrowLeft, Building2, RefreshCw, Trash2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CompanyForm, CertificateUpload } from '@/components/companies';
import {
  useCompany,
  useUpdateCompany,
  useDeleteCompany,
  useCompanyNsuControl,
} from '@/lib/hooks/use-companies';
import { useTriggerSync } from '@/lib/hooks/use-jobs';
import type { CompanyFormData } from '@/lib/types';
import { format } from 'date-fns';

interface EmpresaPageProps {
  params: Promise<{ id: string }>;
}

export default function EmpresaPage({ params }: EmpresaPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: company, isLoading, refetch } = useCompany(resolvedParams.id);
  const { data: nsuControls } = useCompanyNsuControl(resolvedParams.id);
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const triggerSync = useTriggerSync();

  const handleUpdate = async (data: CompanyFormData) => {
    try {
      await updateCompany.mutateAsync({ id: resolvedParams.id, data });
    } catch (error) {
      console.error('Failed to update company:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      await deleteCompany.mutateAsync(resolvedParams.id);
      router.push('/empresas');
    } catch (error) {
      console.error('Failed to delete company:', error);
    }
  };

  const handleSync = async () => {
    try {
      await triggerSync.mutateAsync(resolvedParams.id);
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Empresa nao encontrada</h2>
        <Button className="mt-4" onClick={() => router.push('/empresas')}>
          Voltar para Empresas
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/empresas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {company.razaoSocial}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              {company.cnpj}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/empresas/${resolvedParams.id}/nfse`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              NFSe
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={triggerSync.isPending || !company.hasCertificate}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                triggerSync.isPending ? 'animate-spin' : ''
              }`}
            />
            Sincronizar
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm
              initialData={{
                cnpj: company.cnpj,
                razaoSocial: company.razaoSocial,
                nomeFantasia: company.nomeFantasia || undefined,
                ie: company.ie || undefined,
                im: company.im || undefined,
                uf: company.uf,
                monitorNfe: company.monitorNfe,
                monitorCte: company.monitorCte,
                monitorMdfe: company.monitorMdfe,
              }}
              onSubmit={handleUpdate}
              loading={updateCompany.isPending}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Certificate */}
          <CertificateUpload
            companyId={company.id}
            hasCertificate={company.hasCertificate}
            expiryDate={company.certificateExpiry || undefined}
            onSuccess={() => refetch()}
          />

          {/* NSU Control */}
          {nsuControls && nsuControls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status de Sincronizacao</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nsuControls.map((control) => (
                  <div
                    key={`${control.companyId}-${control.docType}`}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge>{control.docType}</Badge>
                      <Badge
                        variant={
                          control.syncStatus === 'idle'
                            ? 'secondary'
                            : control.syncStatus === 'syncing'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {control.syncStatus}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ultimo NSU:</span>{' '}
                        <span className="font-mono">{control.lastNsu}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Maximo NSU:</span>{' '}
                        <span className="font-mono">{control.maxNsu || '-'}</span>
                      </div>
                    </div>
                    {control.lastSync && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ultima sync:{' '}
                        {format(new Date(control.lastSync), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                    {control.lastError && (
                      <p className="mt-1 text-xs text-red-500">
                        Erro: {control.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
