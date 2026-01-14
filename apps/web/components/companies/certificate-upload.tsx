'use client';

import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@fiscalzen/ui';
import { Upload, Shield, X, Lock } from 'lucide-react';
import { useUploadCertificate } from '@/lib/hooks/use-companies';

interface CertificateUploadProps {
  companyId: string;
  hasCertificate?: boolean;
  expiryDate?: string;
  onSuccess?: () => void;
}

export function CertificateUpload({
  companyId,
  hasCertificate,
  expiryDate,
  onSuccess,
}: CertificateUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCertificate = useUploadCertificate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.pfx') && !selectedFile.name.endsWith('.p12')) {
        alert('Selecione um arquivo .pfx ou .p12');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !password) return;

    try {
      await uploadCertificate.mutateAsync({
        companyId,
        file,
        password,
      });

      setFile(null);
      setPassword('');
      onSuccess?.();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPassword('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Certificado Digital A1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCertificate && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">
                Certificado instalado
              </span>
            </div>
            {expiryDate && (
              <p className="mt-1 text-sm text-green-600">
                Valido ate:{' '}
                {new Date(expiryDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label>Arquivo do Certificado (.pfx / .p12)</Label>
            {file ? (
              <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: .pfx, .p12
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pfx,.p12"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Password */}
          {file && (
            <div className="space-y-2">
              <Label htmlFor="certPassword">Senha do Certificado</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="certPassword"
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          {file && password && (
            <Button
              onClick={handleUpload}
              disabled={uploadCertificate.isPending}
              className="w-full"
            >
              {uploadCertificate.isPending ? (
                'Enviando...'
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {hasCertificate ? 'Atualizar Certificado' : 'Enviar Certificado'}
                </>
              )}
            </Button>
          )}

          {uploadCertificate.isError && (
            <p className="text-sm text-red-500">
              Erro ao enviar certificado. Verifique a senha e tente novamente.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
