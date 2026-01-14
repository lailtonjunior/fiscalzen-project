'use client';

import { useState } from 'react';
import { Button } from '@fiscalzen/ui';
import { Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { DataTable, columns, DocumentFilters } from '@/components/documents';
import { useDocuments } from '@/lib/hooks/use-documents';
import { useFiltersStore } from '@/lib/stores/filters';
import type { PaginationState, RowSelectionState } from '@tanstack/react-table';

export default function DocumentosPage() {
  const {
    companyId,
    docType,
    situacao,
    searchQuery,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useFiltersStore();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize,
  };

  const { data, isLoading } = useDocuments({
    companyId: companyId || undefined,
    docType: docType || undefined,
    situacao: situacao || undefined,
    search: searchQuery || undefined,
    page,
    pageSize,
  });

  const documents = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const handlePaginationChange = (newPagination: PaginationState) => {
    setPage(newPagination.pageIndex + 1);
    setPageSize(newPagination.pageSize);
  };

  const selectedDocumentIds = Object.keys(rowSelection);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus documentos fiscais
          </p>
        </div>
        <div className="flex gap-2">
          {selectedDocumentIds.length > 0 && (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar ({selectedDocumentIds.length})
            </Button>
          )}
          <Link href="/upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload XML
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <DocumentFilters />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={documents}
        loading={isLoading}
        pageCount={totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
