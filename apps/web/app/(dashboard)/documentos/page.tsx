'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PaginationState, RowSelectionState } from '@tanstack/react-table';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@fiscalzen/ui';
import { Download, FileArchive, RotateCcw, Search, Upload } from 'lucide-react';
import { columns, DataTable } from '@/components/documents';
import { useCompanies } from '@/lib/hooks/use-companies';
import { useDocuments } from '@/lib/hooks/use-documents';
import { useCreateBatchDownload } from '@/lib/hooks/use-downloads';
import type { DocType, Document, DocumentFilters, Situacao } from '@/lib/types';

const docTypeOptions: Array<{ value: DocType; label: string }> = [
  { value: 'NFE', label: 'NF-e' },
  { value: 'CTE', label: 'CT-e' },
  { value: 'MDFE', label: 'MDF-e' },
];

const situacaoOptions: Array<{ value: Situacao; label: string }> = [
  { value: 'autorizada', label: 'Autorizada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'denegada', label: 'Denegada' },
  { value: 'pendente', label: 'Pendente' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function DocumentosPage() {
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [docType, setDocType] = useState('');
  const [situacao, setSituacao] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [downloadJob, setDownloadJob] = useState<{ id: string; status: string } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const filters: DocumentFilters = useMemo(
    () => ({
      search: search || undefined,
      companyId: companyId || undefined,
      docType: (docType || undefined) as DocType | undefined,
      situacao: (situacao || undefined) as Situacao | undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    }),
    [companyId, docType, endDate, pagination.pageIndex, pagination.pageSize, search, situacao, startDate]
  );

  const { data: companies = [] } = useCompanies();
  const {
    data: documentsResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useDocuments(filters);
  const createBatchDownload = useCreateBatchDownload();
  const documents = useMemo(() => documentsResult?.items ?? [], [documentsResult?.items]);
  const totalDocuments = documentsResult?.pagination?.total ?? documentsResult?.meta?.total ?? 0;
  const totalPages = documentsResult?.pagination?.pages ?? 1;

  const selectedDocuments = useMemo(
    () =>
      Object.keys(rowSelection)
        .map((index) => documents[Number(index)])
        .filter(Boolean) as Document[],
    [documents, rowSelection]
  );

  const totals = useMemo(() => {
    return documents.reduce(
      (acc, document) => {
        acc.count += 1;
        acc.value += Number(document.valorTotal || 0);
        acc.pendingManifestation += !document.manifestacao && document.docType === 'NFE' ? 1 : 0;
        return acc;
      },
      { count: 0, value: 0, pendingManifestation: 0 }
    );
  }, [documents]);

  const resetFilters = () => {
    setSearch('');
    setCompanyId('');
    setDocType('');
    setSituacao('');
    setStartDate('');
    setEndDate('');
    setRowSelection({});
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const createDownloadPackage = async (format: 'xml' | 'both') => {
    if (selectedDocuments.length === 0) {
      setBatchError('Selecione ao menos um documento antes de gerar o pacote.');
      return;
    }

    try {
      setBatchError(null);
      const job = await createBatchDownload.mutateAsync({
        documentIds: selectedDocuments.map((document) => document.id),
        format,
        includeMetadata: true,
        organizacao: 'by-type',
      });

      setDownloadJob({
        id: job.jobId,
        status: job.status,
      });
      setRowSelection({});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar o pacote em lote.';
      setBatchError(message);
    }
  };

  const activeFilters = [search, companyId, docType, situacao, startDate, endDate].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Caixa de entrada fiscal para consulta, triagem e ações em lote.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Enviar XML
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documentos encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalDocuments}</p>
            <p className="text-xs text-muted-foreground">{totals.count} visiveis na pagina atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor total visivel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totals.value)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NFe pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totals.pendingManifestation}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_140px_160px_150px_150px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPagination((current) => ({ ...current, pageIndex: 0 }));
                }}
                placeholder="Buscar chave, numero ou emitente"
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
            >
              <option value="">Todas empresas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.razaoSocial}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={docType}
              onChange={(event) => {
                setDocType(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
            >
              <option value="">Todos tipos</option>
              {docTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={situacao}
              onChange={(event) => {
                setSituacao(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
            >
              <option value="">Todas situacoes</option>
              {situacaoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
            />
            <Button variant="outline" onClick={resetFilters}>
              Limpar
              {activeFilters > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedDocuments.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 px-4 py-3">
          <div className="text-sm">
            <span className="font-medium">{selectedDocuments.length}</span> documento(s) selecionado(s)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={createBatchDownload.isPending}
              onClick={() => createDownloadPackage('xml')}
            >
              <Download className="mr-2 h-4 w-4" />
              XML selecionados
            </Button>
            <Button
              variant="outline"
              disabled={createBatchDownload.isPending}
              onClick={() => createDownloadPackage('both')}
            >
              <FileArchive className="mr-2 h-4 w-4" />
              Gerar pacote
            </Button>
          </div>
        </div>
      )}

      {batchError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {batchError}
        </div>
      )}

      {downloadJob && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Pacote enfileirado com status <span className="font-medium">{downloadJob.status}</span>.
          Job ID: <span className="font-mono">{downloadJob.id}</span>.{' '}
          <Link href="/downloads" className="font-medium underline">
            Acompanhar downloads
          </Link>
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Falha ao carregar documentos.'}
        </div>
      )}

      <DataTable
        columns={columns}
        data={documents}
        loading={isLoading}
        pagination={pagination}
        pageCount={Math.max(1, totalPages)}
        onPaginationChange={(nextPagination) => {
          setRowSelection({});
          setPagination(nextPagination);
        }}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
