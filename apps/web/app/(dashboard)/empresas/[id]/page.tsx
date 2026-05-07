'use client';

import { use } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton, Badge } from '@fiscalzen/ui';
import { Activity, AlertTriangle, ArrowLeft, Building2, Clock, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CompanyForm, CertificateUpload } from '@/components/companies';
import {
  useCompany,
  useUpdateCompany,
  useDeleteCompany,
  useCompanyNsuControl,
} from '@/lib/hooks/use-companies';
import { useTriggerSync } from '@/lib/hooks/use-jobs';
import type { CompanyFormData, NsuControl } from '@/lib/types';
import { format } from 'date-fns';

interface EmpresaPageProps {
  params: Promise<{ id: string }>;
}

function getSyncStatusLabel(status: NsuControl['syncStatus']) {
  const labels: Record<NsuControl['syncStatus'], string> = {
    idle: 'Em espera',
    syncing: 'Sincronizando',
    error: 'Com erro',
    rate_limited: 'Limitado',
  };

  return labels[status];
}

function getSyncStatusVariant(status: NsuControl['syncStatus']) {
  if (status === 'error' || status === 'rate_limited') {
    return 'destructive' as const;
  }

  if (status === 'idle') {
    return 'secondary' as const;
  }

  return 'default' as const;
}

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return format(date, 'dd/MM/yyyy HH:mm');
}

function getNsuProgress(control: NsuControl) {
  const lastNsu = Number(control.lastNsu);
  const maxNsu = Number(control.maxNsu);

  if (!Number.isFinite(lastNsu) || !Number.isFinite(maxNsu) || maxNsu <= 0) {
    return null;
  }

  return Math.min(100, Math.round((lastNsu / maxNsu) * 100));
}

export default function EmpresaPage({ params }: EmpresaPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const { data: company, isLoading, isError, error, refetch } = useCompany(resolvedParams.id);
  const {
    data: nsuControls = [],
    isLoading: isLoadingNsu,
    isError: isNsuError,
    error: nsuError,
    refetch: refetchNsu,
  } = useCompanyNsuControl(resolvedParams.id);
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const triggerSync = useTriggerSync();

  const handleUpdate = async (data: CompanyFormData) => {
    try {
      setActionError(null);
      await updateCompany.mutateAsync({ id: resolvedParams.id, data });
      setActionSuccess('Dados da empresa atualizados com sucesso.');
    } catch (error) {
      setActionSuccess(null);
      setActionError(error instanceof Error ? error.message : 'Falha ao atualizar a empresa.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      setActionError(null);
      await deleteCompany.mutateAsync(resolvedParams.id);
      router.push('/empresas');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao desativar a empresa.');
    }
  };

  const handleSync = async () => {
    try {
      setActionError(null);
      await triggerSync.mutateAsync(resolvedParams.id);
      await refetchNsu();
      setActionSuccess('Sincronizacao solicitada. Atualize em alguns instantes para acompanhar o NSU.');
    } catch (error) {
      setActionSuccess(null);
      setActionError(error instanceof Error ? error.message : 'Falha ao solicitar sincronizacao.');
    }
  };

  const totalErrors = nsuControls.reduce((sum, control) => sum + control.errorCount, 0);
  const hasActiveSync = nsuControls.some((control) => control.syncStatus === 'syncing');
  const latestSync = nsuControls
    .map((control) => control.lastSync)
    .filter(Boolean)
    .sort()
    .at(-1);

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

  if (isError || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Empresa nao encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'A empresa solicitada nao existe ou nao esta acessivel para este tenant.'}
        </p>
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
          {actionError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              {actionSuccess}
            </div>
          )}
          {!company.hasCertificate && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
              Esta empresa ainda nao possui certificado A1 configurado. O botao de sincronizacao permanece bloqueado ate o upload.
            </div>
          )}
          {company.certificateExpiry && new Date(company.certificateExpiry).getTime() < Date.now() && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              O certificado desta empresa esta expirado. Atualize o A1 antes de rodar novas sincronizacoes.
            </div>
          )}

          {/* Certificate */}
          <CertificateUpload
            companyId={company.id}
            hasCertificate={company.hasCertificate}
            expiryDate={company.certificateExpiry || undefined}
            onSuccess={() => refetch()}
          />

          {/* NSU Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status de Sincronizacao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingNsu ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-24" />
                </div>
              ) : isNsuError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {nsuError instanceof Error ? nsuError.message : 'Falha ao carregar o status NSU desta empresa.'}
                </div>
              ) : nsuControls.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum controle de NSU foi criado para esta empresa ainda. Isso pode indicar empresa nova, sincronizacao ainda nao executada ou ambiente sem historico.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Status geral</p>
                      <p className="mt-1 text-sm font-medium">
                        {hasActiveSync ? 'Sincronizando' : 'Operacional'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Ultima sync</p>
                      <p className="mt-1 text-sm font-medium">{formatDateTime(latestSync)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Erros acumulados</p>
                      <p className="mt-1 text-sm font-medium">{totalErrors}</p>
                    </div>
                  </div>

                  {nsuControls.map((control) => {
                    const progress = getNsuProgress(control);

                    return (
                      <div
                        key={`${control.companyId}-${control.docType}`}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Badge>{control.docType}</Badge>
                          <Badge variant={getSyncStatusVariant(control.syncStatus)}>
                            {getSyncStatusLabel(control.syncStatus)}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Ultimo NSU</span>
                            <p className="font-mono">{control.lastNsu}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Maximo NSU</span>
                            <p className="font-mono">{control.maxNsu || '-'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ultima sync</span>
                            <p>{formatDateTime(control.lastSync)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Proxima sync</span>
                            <p>{formatDateTime(control.nextSync)}</p>
                          </div>
                        </div>
                        {progress !== null && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Avanco NSU</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )}
                        {control.errorCount > 0 && (
                          <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
                            <span>
                              {control.errorCount} erro(s)
                              {control.lastError ? `: ${control.lastError}` : ''}
                            </span>
                          </div>
                        )}
                        {control.syncStatus === 'rate_limited' && !control.lastError && (
                          <div className="mt-3 flex items-start gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                            <Clock className="mt-0.5 h-3.5 w-3.5 flex-none" />
                            <span>Sincronizacao limitada temporariamente pela SEFAZ.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
