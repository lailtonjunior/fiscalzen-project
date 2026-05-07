'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge, Button, Checkbox } from '@fiscalzen/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@fiscalzen/ui';
import { MoreHorizontal, Eye, Download, FileCheck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useDownloadPdf, useDownloadXml } from '@/lib/hooks/use-documents';
import type { Document } from '@/lib/types';

// ============================================
// Cell Components
// ============================================

function DocTypeBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    NFE: 'bg-green-100 text-green-800',
    CTE: 'bg-blue-100 text-blue-800',
    MDFE: 'bg-orange-100 text-orange-800',
  };

  return (
    <Badge className={colors[value] || 'bg-gray-100 text-gray-800'}>
      {value}
    </Badge>
  );
}

function SituacaoBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    autorizada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
    denegada: 'bg-red-100 text-red-800',
    pendente: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <Badge variant="outline" className={colors[value] || 'bg-gray-100 text-gray-800'}>
      {value}
    </Badge>
  );
}

function CurrencyCell({ value }: { value: string | number }) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return (
    <span className="font-medium">
      {new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numValue)}
    </span>
  );
}

function DateCell({ value }: { value: string }) {
  return format(new Date(value), 'dd/MM/yyyy');
}

function DocumentActions({ document }: { document: Document }) {
  const downloadXml = useDownloadXml();
  const downloadPdf = useDownloadPdf();
  const canGeneratePdf = document.docType === 'NFE' || document.docType === 'CTE';

  const handleDownloadXml = async () => {
    try {
      await downloadXml.mutateAsync(document.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Falha ao baixar XML do documento.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadPdf.mutateAsync(document.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Falha ao gerar PDF do documento.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/documentos/${document.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalhes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadXml} disabled={downloadXml.isPending}>
          <Download className="mr-2 h-4 w-4" />
          Download XML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadPdf} disabled={!canGeneratePdf || downloadPdf.isPending}>
          <FileText className="mr-2 h-4 w-4" />
          {canGeneratePdf ? 'Visualizar PDF' : 'PDF indisponivel'}
        </DropdownMenuItem>
        {!document.manifestacao && document.docType === 'NFE' && (
          <DropdownMenuItem asChild>
            <Link href={`/manifestacao?documentId=${document.id}`}>
              <FileCheck className="mr-2 h-4 w-4" />
              Manifestar
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// Column Definitions
// ============================================

export const columns: ColumnDef<Document>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'docType',
    header: 'Tipo',
    cell: ({ row }) => <DocTypeBadge value={row.getValue('docType')} />,
  },
  {
    accessorKey: 'numero',
    header: 'Numero',
    cell: ({ row }) => (
      <span className="font-medium">
        {row.getValue('numero')}/{row.original.serie}
      </span>
    ),
  },
  {
    accessorKey: 'emitRazaoSocial',
    header: 'Emitente',
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue('emitRazaoSocial')}>
        {row.getValue('emitRazaoSocial')}
      </div>
    ),
  },
  {
    accessorKey: 'destRazaoSocial',
    header: 'Destinatario',
    cell: ({ row }) => {
      const value = row.getValue('destRazaoSocial') as string | null;
      return (
        <div className="max-w-[200px] truncate" title={value || undefined}>
          {value || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'valorTotal',
    header: 'Valor',
    cell: ({ row }) => <CurrencyCell value={row.getValue('valorTotal')} />,
  },
  {
    accessorKey: 'dataEmissao',
    header: 'Data Emissao',
    cell: ({ row }) => <DateCell value={row.getValue('dataEmissao')} />,
  },
  {
    accessorKey: 'situacao',
    header: 'Situacao',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <SituacaoBadge value={row.getValue('situacao')} />
        {!row.original.manifestacao && row.original.docType === 'NFE' && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            Pendente
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const document = row.original;

      return <DocumentActions document={document} />;
    },
  },
];
