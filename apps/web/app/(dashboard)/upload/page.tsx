'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@fiscalzen/ui';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useUploadDocuments } from '@/lib/hooks/use-documents';

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const uploadDocuments = useUploadDocuments();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.name.endsWith('.xml')
    );

    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      (file) => file.name.endsWith('.xml')
    );

    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles = newFiles.map((file) => ({
      file,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // Update all to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading' } : f
      )
    );

    try {
      await uploadDocuments.mutateAsync(
        pendingFiles.map((f) => f.file)
      );

      // Update status based on result
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status === 'uploading') {
            return { ...f, status: 'success' };
          }
          return f;
        })
      );
    } catch (error) {
      // Mark all uploading as error
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status === 'uploading') {
            return {
              ...f,
              status: 'error',
              error: 'Falha no upload',
            };
          }
          return f;
        })
      );
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status === 'pending'));
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload de XMLs</h1>
        <p className="text-muted-foreground">
          Faca upload manual de documentos fiscais em formato XML
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Selecionar Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload
              className={`mx-auto h-12 w-12 ${
                isDragging ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <p className="mt-4 text-lg font-medium">
              Arraste arquivos XML aqui ou clique para selecionar
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Formatos aceitos: NFe, CTe, MDFe (arquivos .xml)
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            accept=".xml"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>
              Arquivos Selecionados
              <Badge variant="secondary" className="ml-2">
                {files.length}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              {(successCount > 0 || errorCount > 0) && (
                <Button variant="outline" size="sm" onClick={clearCompleted}>
                  Limpar Concluidos
                </Button>
              )}
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploadDocuments.isPending}
                >
                  {uploadDocuments.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar ({pendingCount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            {(successCount > 0 || errorCount > 0) && (
              <div className="mb-4 flex gap-4">
                {successCount > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">{successCount} enviado(s)</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{errorCount} com erro</span>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{pendingCount} pendente(s)</span>
                  </div>
                )}
              </div>
            )}

            {/* File List */}
            <div className="space-y-2">
              {files.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    item.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : item.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.status === 'pending' && (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    {item.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {item.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}

                    <div>
                      <p className="font-medium">{item.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                      {item.error && (
                        <p className="text-sm text-red-600">{item.error}</p>
                      )}
                    </div>
                  </div>

                  {item.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
