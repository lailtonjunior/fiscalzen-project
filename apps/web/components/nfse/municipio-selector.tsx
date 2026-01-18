'use client';

import { useState, useMemo } from 'react';
import {
  Input,
  Label,
  Card,
  CardContent,
  Badge,
} from '@fiscalzen/ui';
import { Search, MapPin, Globe, Bot, Check } from 'lucide-react';
import { useMunicipios } from '@/lib/hooks/use-nfse';
import type { MunicipioInfo } from '@/lib/types';

interface MunicipioSelectorProps {
  onSelect: (municipio: MunicipioInfo) => void;
  selectedCodigo?: string;
  excludeCodigos?: string[];
}

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export function MunicipioSelector({
  onSelect,
  selectedCodigo,
  excludeCodigos = [],
}: MunicipioSelectorProps) {
  const { data: municipios, isLoading } = useMunicipios();
  const [search, setSearch] = useState('');
  const [ufFilter, setUfFilter] = useState<string>('');

  const filteredMunicipios = useMemo(() => {
    if (!municipios) return [];

    return municipios
      .filter((m) => !excludeCodigos.includes(m.codigo))
      .filter((m) => {
        const matchesSearch =
          !search ||
          m.nome.toLowerCase().includes(search.toLowerCase()) ||
          m.codigo.includes(search);
        const matchesUf = !ufFilter || m.uf === ufFilter;
        return matchesSearch && matchesUf;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [municipios, search, ufFilter, excludeCodigos]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Buscar Municipio</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nome ou codigo IBGE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-24">
          <Label htmlFor="uf">UF</Label>
          <select
            id="uf"
            value={ufFilter}
            onChange={(e) => setUfFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Todas</option>
            {UF_LIST.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Municipality List */}
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-2">
        {filteredMunicipios.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MapPin className="mx-auto h-8 w-8 opacity-50" />
            <p className="mt-2">Nenhum municipio encontrado</p>
          </div>
        ) : (
          filteredMunicipios.map((municipio) => (
            <Card
              key={municipio.codigo}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedCodigo === municipio.codigo ? 'border-primary bg-accent' : ''
              }`}
              onClick={() => onSelect(municipio)}
            >
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{municipio.nome}</span>
                      <Badge variant="outline">{municipio.uf}</Badge>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      IBGE: {municipio.codigo}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={municipio.tipo === 'abrasf' ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    {municipio.tipo === 'abrasf' ? (
                      <>
                        <Globe className="h-3 w-3" />
                        ABRASF {municipio.versaoAbrasf}
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3" />
                        RPA
                      </>
                    )}
                  </Badge>
                  {selectedCodigo === municipio.codigo && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredMunicipios.length} municipio(s) encontrado(s)
      </p>
    </div>
  );
}
