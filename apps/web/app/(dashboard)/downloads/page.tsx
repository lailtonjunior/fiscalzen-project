'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress, Skeleton } from '@fiscalzen/ui';
import { Download, FileArchive, RefreshCw, XCircle } from 'lucide-react';
import { useAccessBatchDownload, useBatchDownloads } from '@/lib/hooks/use-downloads';
import type { BatchDownloadJob, DownloadJobStatus } from '@/lib/types';

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusLabel(status: DownloadJobStatus) {
  const labels: Record<DownloadJobStatus, string> = {
    queued: 'Na fila',
    active: 'Processando',
    completed: 'Concluido',
    failed: 'Falhou',
  };

  return labels[status] ?? status;
}

function statusVariant(status: DownloadJobStatus) {
  if (status === 'completed') {
    return 'default' as const;
  }

  if (status === 'failed') {
    return 'destructive' as const;
  }

  return 'secondary' as const;
}

function formatLabel(format?: string) {
  if (format === 'xml') return 'XML';
  if (format === 'pdf') return 'PDF';
  if (format === 'both') return 'XML + PDF';
  return '-';
}

function DownloadsSummary({ jobs }: { jobs: BatchDownloadJob[] }) {
  const summary = useMemo(
    () => ({
      active: jobs.filter((job) => job.status === 'queued' || job.status === 'active').length,
      completed: jobs.filter((job) => job.status === 'completed').length,
      failed: jobs.filter((job) => job.status === 'failed').length,
    }),
    [jobs]
  );

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Em andamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.active}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Concluidos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.completed}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Falhas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.failed}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DownloadsPage() {
  const { data: jobs = [], isLoading, isError, error, refetch, isFetching } = useBatchDownloads();
  const accessDownload = useAccessBatchDownload();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe os pacotes ZIP gerados a partir da caixa de documentos.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <DownloadsSummary jobs={jobs} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Pacotes recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error instanceof Error ? error.message : 'Falha ao carregar os downloads.'}
            </div>
          )}
          {downloadError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {downloadError}
            </div>
          )}
          {downloadSuccess && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              {downloadSuccess}
            </div>
          )}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum pacote de download foi solicitado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.jobId} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(job.status)}>{statusLabel(job.status)}</Badge>
                        <Badge variant="outline">{formatLabel(job.format)}</Badge>
                        {job.includeMetadata && <Badge variant="outline">Metadados</Badge>}
                      </div>
                      <p className="mt-2 font-mono text-xs text-muted-foreground">{job.jobId}</p>
                    </div>
                    {job.status === 'completed' ? (
                      <Button
                        onClick={async () => {
                          try {
                            setActiveJobId(job.jobId);
                            setDownloadError(null);
                            setDownloadSuccess(null);
                            const result = await accessDownload.mutateAsync(job.jobId);
                            if (result?.url) {
                              setDownloadSuccess('ZIP autenticado liberado em nova aba. Se o navegador bloquear o popup, tente novamente.');
                              window.open(result.url, '_blank', 'noopener,noreferrer');
                            } else {
                              setDownloadError('Link de download indisponivel para este pacote.');
                            }
                          } catch (downloadErr) {
                            setDownloadError(downloadErr instanceof Error ? downloadErr.message : 'Falha ao preparar o ZIP para download.');
                          } finally {
                            setActiveJobId(null);
                          }
                        }}
                        disabled={accessDownload.isPending && activeJobId === job.jobId}
                      >
                          <Download className="mr-2 h-4 w-4" />
                          {accessDownload.isPending && activeJobId === job.jobId ? 'Preparando...' : 'Baixar ZIP'}
                      </Button>
                    ) : job.status === 'failed' ? (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <XCircle className="h-4 w-4" />
                        Falha
                      </div>
                    ) : job.status === 'queued' ? (
                      <div className="text-sm text-muted-foreground">
                        Aguardando processamento
                      </div>
                    ) : job.status === 'active' ? (
                      <div className="text-sm text-muted-foreground">
                        Processando pacote
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{Math.round(job.progress ?? 0)}%</span>
                    </div>
                    <Progress value={job.progress ?? 0} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">Criado em</span>
                      <p>{formatDateTime(job.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Iniciado em</span>
                      <p>{formatDateTime(job.processedAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Finalizado em</span>
                      <p>{formatDateTime(job.finishedAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documentos</span>
                      <p>{job.result?.processed ?? job.estimatedDocuments ?? '-'}</p>
                    </div>
                  </div>

                  {job.error && (
                    <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {job.error}
                    </div>
                  )}
                  {job.status === 'completed' && !job.result && (
                    <div className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-900">
                      O pacote foi concluido, mas o resumo final ainda nao esta disponivel. Tente atualizar a pagina.
                    </div>
                  )}
                  {job.result?.errors ? (
                    <div className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-900">
                      Pacote concluido com {job.result.errors} erro(s). Consulte o arquivo ERROS.json no ZIP.
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
