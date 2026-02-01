'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiClient } from '@/lib/api'
import { columns } from './columns'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function EmpresasPage() {
  const [search, setSearch] = useState('')
  const apiClient = useApiClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['empresas', search],
    queryFn: async () => {
      const res = await apiClient.get('/companies', {
        params: {
          search: search || undefined,
          page: 1, // Default to page 1 for now, full pagination requires state
          limit: 10
        }
      });
      return res.data;
    },
  })

  // Normalize data if API returns { data: [], meta: {} } or similar
  const data = Array.isArray(response?.data) ? response.data :
    Array.isArray(response) ? response : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Empresas</h1>
        <Button asChild>
          <Link href="/empresas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por CNPJ ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
      />
    </div>
  )
}
