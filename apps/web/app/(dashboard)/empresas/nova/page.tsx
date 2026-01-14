'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@fiscalzen/ui';
import { ArrowLeft, Building2 } from 'lucide-react';
import { CompanyForm } from '@/components/companies';
import { useCreateCompany } from '@/lib/hooks/use-companies';
import type { CompanyFormData } from '@/lib/types';

export default function NovaEmpresaPage() {
  const router = useRouter();
  const createCompany = useCreateCompany();

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      const company = await createCompany.mutateAsync(data);
      router.push(`/empresas/${company?.id}`);
    } catch (error) {
      console.error('Failed to create company:', error);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/empresas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Empresa</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova empresa para monitoramento
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm
            onSubmit={handleSubmit}
            loading={createCompany.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
