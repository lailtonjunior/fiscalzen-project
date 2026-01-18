'use client';

import { useState } from 'react';
import {
  Input,
  Label,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Alert,
  AlertDescription,
} from '@fiscalzen/ui';
import { Loader2, Eye, EyeOff, Save, TestTube, Globe, Bot } from 'lucide-react';
import type { MunicipioInfo, NfseConfigFormData } from '@/lib/types';

interface NfseConfigFormProps {
  municipio: MunicipioInfo;
  initialData?: Partial<NfseConfigFormData>;
  onSubmit: (data: NfseConfigFormData) => Promise<void>;
  onTest?: () => Promise<{ success: boolean; message: string } | undefined>;
  loading?: boolean;
  testLoading?: boolean;
}

export function NfseConfigForm({
  municipio,
  initialData,
  onSubmit,
  onTest,
  loading,
  testLoading,
}: NfseConfigFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<NfseConfigFormData>({
    codigoMunicipio: municipio.codigo,
    inscricaoMunicipal: initialData?.inscricaoMunicipal || '',
    rpaLogin: initialData?.rpaLogin || '',
    rpaPassword: initialData?.rpaPassword || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleTest = async () => {
    if (!onTest) return;
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result ?? null);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao testar conexao',
      });
    }
  };

  const requiresCredentials = municipio.tipo === 'rpa' || municipio.requiresRpa;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Municipality Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {municipio.tipo === 'abrasf' ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {municipio.nome} - {municipio.uf}
          </CardTitle>
          <CardDescription>
            {municipio.tipo === 'abrasf' ? (
              <>
                Integracao via Web Service ABRASF versao {municipio.versaoAbrasf}
              </>
            ) : (
              <>
                Integracao via RPA (Robotic Process Automation)
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Codigo IBGE:</span>
              <span className="font-mono">{municipio.codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de integracao:</span>
              <span className="font-medium">
                {municipio.tipo === 'abrasf' ? 'ABRASF Web Service' : 'RPA'}
              </span>
            </div>
            {municipio.versaoAbrasf && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versao ABRASF:</span>
                <span className="font-mono">{municipio.versaoAbrasf}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company Credentials */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados da Empresa</CardTitle>
          <CardDescription>
            Informacoes necessarias para consultar NFSe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inscricaoMunicipal">Inscricao Municipal</Label>
            <Input
              id="inscricaoMunicipal"
              placeholder="Numero da inscricao municipal"
              value={formData.inscricaoMunicipal || ''}
              onChange={(e) =>
                setFormData({ ...formData, inscricaoMunicipal: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Necessaria para identificar a empresa no municipio
            </p>
          </div>
        </CardContent>
      </Card>

      {/* RPA Credentials */}
      {requiresCredentials && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Credenciais de Acesso</CardTitle>
            <CardDescription>
              Login e senha do portal de NFSe do municipio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                Este municipio requer credenciais de acesso ao portal de NFSe
                para consulta automatizada.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rpaLogin">Login / Usuario</Label>
              <Input
                id="rpaLogin"
                placeholder="Usuario do portal NFSe"
                value={formData.rpaLogin || ''}
                onChange={(e) =>
                  setFormData({ ...formData, rpaLogin: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rpaPassword">Senha</Label>
              <div className="relative">
                <Input
                  id="rpaPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha do portal NFSe"
                  value={formData.rpaPassword || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, rpaPassword: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A senha sera armazenada de forma criptografada
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onTest && (
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testLoading}
          >
            {testLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="mr-2 h-4 w-4" />
            )}
            Testar Conexao
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configuracao
        </Button>
      </div>
    </form>
  );
}
