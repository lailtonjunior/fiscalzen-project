'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from '@fiscalzen/ui';
import {
  ArrowLeft,
  Download,
  FileText,
  Building2,
  Calendar,
  Hash,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { useDocument, useDownloadXml } from '@/lib/hooks/use-documents';
import { XmlViewer, EventsTimeline } from '@/components/documents';

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

const docTypeColors = {
  NFE: 'bg-green-100 text-green-800',
  CTE: 'bg-blue-100 text-blue-800',
  MDFE: 'bg-orange-100 text-orange-800',
};

const situacaoColors = {
  autorizada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  denegada: 'bg-red-100 text-red-800',
  pendente: 'bg-yellow-100 text-yellow-800',
};

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

function formatCnpj(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: document, isLoading } = useDocument(resolvedParams.id);
  const downloadXml = useDownloadXml();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Documento nao encontrado</h2>
        <p className="text-muted-foreground">
          O documento solicitado nao existe ou foi removido.
        </p>
        <Button className="mt-4" onClick={() => router.push('/documentos')}>
          Voltar para Documentos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/documentos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Badge className={docTypeColors[document.docType]}>
                {document.docType}
              </Badge>
              <h1 className="text-2xl font-bold">
                {document.numero}/{document.serie}
              </h1>
              <Badge
                variant="outline"
                className={situacaoColors[document.situacao]}
              >
                {document.situacao}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {document.chave}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadXml.mutate(document.id)}
            disabled={downloadXml.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Download XML
          </Button>
          {!document.manifestacao && document.docType === 'NFE' && (
            <Link href={`/manifestacao?documentId=${document.id}`}>
              <Button>
                <FileCheck className="mr-2 h-4 w-4" />
                Manifestar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Emitente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Emitente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Razao Social</p>
              <p className="font-medium">{document.emitRazaoSocial}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-mono">{formatCnpj(document.emitCnpj)}</p>
            </div>
            {document.emitIe && (
              <div>
                <p className="text-sm text-muted-foreground">IE</p>
                <p className="font-mono">{document.emitIe}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Destinatario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Destinatario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {document.destRazaoSocial ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Razao Social</p>
                  <p className="font-medium">{document.destRazaoSocial}</p>
                </div>
                {document.destCnpj && (
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-mono">{formatCnpj(document.destCnpj)}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Nao informado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Values and Dates */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(document.valorTotal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Data Emissao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {format(new Date(document.dataEmissao), 'dd/MM/yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(document.dataEmissao), 'HH:mm:ss')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Hash className="h-4 w-4" />
              NSU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{document.nsu || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Natureza da Operacao */}
      {document.natOp && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Natureza da Operacao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{document.natOp}</p>
          </CardContent>
        </Card>
      )}

      {/* Events Timeline */}
      <EventsTimeline events={document.events} />

      {/* XML Viewer */}
      <XmlViewer xml={document.xmlOriginal} title="XML Original" />
    </div>
  );
}
