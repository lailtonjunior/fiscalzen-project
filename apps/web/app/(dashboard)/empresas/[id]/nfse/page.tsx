'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton, Badge, Alert, AlertDescription } from '@fiscalzen/ui';
import { ArrowLeft, Building2, Plus, FileText, Globe, Bot, Info } from 'lucide-react';
import { useCompany } from '@/lib/hooks/use-companies';
import {
  useNfseConfigs,
  useCreateNfseConfig,
  useUpdateNfseConfig,
  useDeleteNfseConfig,
  useToggleNfseConfig,
  useTriggerNfseSync,
  useTestNfseConnection,
} from '@/lib/hooks/use-nfse';
import {
  NfseConfigCard,
  AddMunicipioDialog,
  EditNfseDialog,
} from '@/components/nfse';
import type { NfseConfig, NfseConfigFormData } from '@/lib/types';

interface NfsePageProps {
  params: Promise<{ id: string }>;
}

export default function NfsePage({ params }: NfsePageProps) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;

  const { data: company, isLoading: companyLoading } = useCompany(companyId);
  const { data: configs, isLoading: configsLoading } = useNfseConfigs(companyId);

  const createConfig = useCreateNfseConfig();
  const updateConfig = useUpdateNfseConfig();
  const deleteConfig = useDeleteNfseConfig();
  const toggleConfig = useToggleNfseConfig();
  const triggerSync = useTriggerNfseSync();
  const testConnection = useTestNfseConnection();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<NfseConfig | null>(null);
  const [syncingMunicipio, setSyncingMunicipio] = useState<string | null>(null);

  const handleCreate = async (data: NfseConfigFormData) => {
    await createConfig.mutateAsync({ companyId, data });
  };

  const handleUpdate = async (data: Partial<NfseConfigFormData>) => {
    if (!editConfig) return;
    await updateConfig.mutateAsync({
      companyId,
      codigoMunicipio: editConfig.codigoMunicipio,
      data,
    });
  };

  const handleDelete = async (config: NfseConfig) => {
    if (!confirm(`Deseja remover a configuracao de ${config.nomeMunicipio}?`)) {
      return;
    }
    await deleteConfig.mutateAsync({
      companyId,
      codigoMunicipio: config.codigoMunicipio,
    });
  };

  const handleToggle = async (config: NfseConfig, isActive: boolean) => {
    await toggleConfig.mutateAsync({
      companyId,
      codigoMunicipio: config.codigoMunicipio,
      isActive,
    });
  };

  const handleSync = async (config: NfseConfig) => {
    setSyncingMunicipio(config.codigoMunicipio);
    try {
      await triggerSync.mutateAsync({
        companyId,
        codigoMunicipio: config.codigoMunicipio,
      });
    } finally {
      setSyncingMunicipio(null);
    }
  };

  const handleTest = async (codigoMunicipio: string) => {
    const result = await testConnection.mutateAsync({
      companyId,
      codigoMunicipio,
    });
    return result;
  };

  const isLoading = companyLoading || configsLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Empresa nao encontrada</h2>
        <Link href="/empresas">
          <Button className="mt-4">Voltar para Empresas</Button>
        </Link>
      </div>
    );
  }

  const existingCodigos = configs?.map((c) => c.codigoMunicipio) || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/empresas/${companyId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Configuracao NFSe
            </h1>
            <p className="text-sm text-muted-foreground">
              {company.razaoSocial}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Municipio
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure os municipios onde sua empresa emite ou recebe NFSe. O sistema
          consultara automaticamente as notas fiscais de servico conforme configurado.
        </AlertDescription>
      </Alert>

      {/* Integration Types Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              ABRASF Web Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Integracao direta via API padronizada. Mais rapido e confiavel.
              Disponivel para a maioria das capitais.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4" />
              RPA (Automacao)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulta automatizada via navegador. Requer credenciais de
              acesso ao portal do municipio.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configured Municipalities */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Municipios Configurados</h2>

        {!configs || configs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                Nenhum municipio configurado
              </h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Adicione um municipio para comecar a monitorar NFSe
              </p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Municipio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {configs.map((config) => (
              <NfseConfigCard
                key={config.codigoMunicipio}
                config={config}
                onToggle={(isActive) => handleToggle(config, isActive)}
                onSync={() => handleSync(config)}
                onEdit={() => setEditConfig(config)}
                onDelete={() => handleDelete(config)}
                toggleLoading={toggleConfig.isPending}
                syncLoading={syncingMunicipio === config.codigoMunicipio}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Municipality Dialog */}
      <AddMunicipioDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleCreate}
        onTest={handleTest}
        excludeCodigos={existingCodigos}
        loading={createConfig.isPending}
        testLoading={testConnection.isPending}
      />

      {/* Edit Config Dialog */}
      <EditNfseDialog
        open={!!editConfig}
        onOpenChange={(open) => !open && setEditConfig(null)}
        config={editConfig}
        onSubmit={handleUpdate}
        onTest={
          editConfig
            ? () => handleTest(editConfig.codigoMunicipio)
            : undefined
        }
        loading={updateConfig.isPending}
        testLoading={testConnection.isPending}
      />
    </div>
  );
}
