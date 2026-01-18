'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@fiscalzen/ui';
import { Search, X, Calendar } from 'lucide-react';
import { useFiltersStore, selectActiveFiltersCount } from '@/lib/stores/filters';
import { useCompanies } from '@/lib/hooks/use-companies';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useEffect } from 'react';

export function DocumentFilters() {
  const {
    companyId,
    docType,
    situacao,
    searchQuery,
    setCompanyId,
    setDocType,
    setSituacao,
    setSearchQuery,
    resetFilters,
  } = useFiltersStore();

  const activeFiltersCount = useFiltersStore(selectActiveFiltersCount);
  const { data: companies } = useCompanies();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por numero, chave, emitente..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="outline" onClick={resetFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar filtros
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4">
        {/* Company Filter */}
        <Select
          value={companyId || 'all'}
          onValueChange={(value) => setCompanyId(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Empresas</SelectItem>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.razaoSocial}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Doc Type Filter */}
        <Select
          value={docType || 'all'}
          onValueChange={(value) => setDocType(value === 'all' ? null : (value as 'NFE' | 'CTE' | 'MDFE'))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="NFE">NF-e</SelectItem>
            <SelectItem value="CTE">CT-e</SelectItem>
            <SelectItem value="MDFE">MDF-e</SelectItem>
          </SelectContent>
        </Select>

        {/* Situacao Filter */}
        <Select
          value={situacao || 'all'}
          onValueChange={(value) =>
            setSituacao(value === 'all' ? null : (value as 'autorizada' | 'cancelada' | 'denegada' | 'pendente'))
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Situacao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="autorizada">Autorizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="denegada">Denegada</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range - placeholder for now */}
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Periodo
        </Button>
      </div>
    </div>
  );
}
