'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@fiscalzen/ui';
import type { CompanyFormData } from '@/lib/types';

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const companySchema = z.object({
  cnpj: z
    .string()
    .min(14, 'CNPJ invalido')
    .max(18, 'CNPJ invalido')
    .transform((val) => val.replace(/\D/g, '')),
  razaoSocial: z.string().min(1, 'Razao Social e obrigatoria'),
  nomeFantasia: z.string().optional(),
  ie: z.string().optional(),
  im: z.string().optional(),
  uf: z.string().length(2, 'UF invalida'),
  monitorNfe: z.boolean(),
  monitorCte: z.boolean(),
  monitorMdfe: z.boolean(),
});

interface CompanyFormProps {
  initialData?: Partial<CompanyFormData>;
  onSubmit: (data: CompanyFormData) => void;
  loading?: boolean;
}

export function CompanyForm({ initialData, onSubmit, loading }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      cnpj: initialData?.cnpj || '',
      razaoSocial: initialData?.razaoSocial || '',
      nomeFantasia: initialData?.nomeFantasia || '',
      ie: initialData?.ie || '',
      im: initialData?.im || '',
      uf: initialData?.uf || '',
      monitorNfe: initialData?.monitorNfe ?? true,
      monitorCte: initialData?.monitorCte ?? false,
      monitorMdfe: initialData?.monitorMdfe ?? false,
    },
  });

  const uf = watch('uf');
  const monitorNfe = watch('monitorNfe');
  const monitorCte = watch('monitorCte');
  const monitorMdfe = watch('monitorMdfe');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* CNPJ */}
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ *</Label>
        <Input
          id="cnpj"
          placeholder="00.000.000/0000-00"
          {...register('cnpj')}
          disabled={!!initialData?.cnpj}
        />
        {errors.cnpj && (
          <p className="text-sm text-red-500">{errors.cnpj.message}</p>
        )}
      </div>

      {/* Razao Social */}
      <div className="space-y-2">
        <Label htmlFor="razaoSocial">Razao Social *</Label>
        <Input
          id="razaoSocial"
          placeholder="Empresa LTDA"
          {...register('razaoSocial')}
        />
        {errors.razaoSocial && (
          <p className="text-sm text-red-500">{errors.razaoSocial.message}</p>
        )}
      </div>

      {/* Nome Fantasia */}
      <div className="space-y-2">
        <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
        <Input
          id="nomeFantasia"
          placeholder="Nome comercial"
          {...register('nomeFantasia')}
        />
      </div>

      {/* IE and IM */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ie">Inscricao Estadual</Label>
          <Input id="ie" placeholder="000000000" {...register('ie')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="im">Inscricao Municipal</Label>
          <Input id="im" placeholder="000000000" {...register('im')} />
        </div>
      </div>

      {/* UF */}
      <div className="space-y-2">
        <Label>UF *</Label>
        <Select value={uf} onValueChange={(value) => setValue('uf', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            {UF_LIST.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.uf && (
          <p className="text-sm text-red-500">{errors.uf.message}</p>
        )}
      </div>

      {/* Monitoring options */}
      <div className="space-y-4">
        <Label>Monitoramento de Documentos</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="monitorNfe"
              checked={monitorNfe}
              onCheckedChange={(checked) =>
                setValue('monitorNfe', checked as boolean)
              }
            />
            <label
              htmlFor="monitorNfe"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              NF-e (Notas Fiscais Eletronicas)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="monitorCte"
              checked={monitorCte}
              onCheckedChange={(checked) =>
                setValue('monitorCte', checked as boolean)
              }
            />
            <label
              htmlFor="monitorCte"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              CT-e (Conhecimentos de Transporte)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="monitorMdfe"
              checked={monitorMdfe}
              onCheckedChange={(checked) =>
                setValue('monitorMdfe', checked as boolean)
              }
            />
            <label
              htmlFor="monitorMdfe"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              MDF-e (Manifestos de Documentos Fiscais)
            </label>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
      </Button>
    </form>
  );
}
