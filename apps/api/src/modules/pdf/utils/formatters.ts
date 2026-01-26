/**
 * Formata CNPJ: 12345678000199 -> 12.345.678/0001-99
 */
export function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '').padStart(14, '0');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF: 12345678901 -> 123.456.789-01
 */
export function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '').padStart(11, '0');
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ ou CPF baseado no tamanho
 */
export function formatCnpjCpf(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return formatCpf(cleaned);
  }
  return formatCnpj(cleaned);
}

/**
 * Formata chave de acesso: 35240112345678000199550010000001231234567890
 * -> 3524 0112 3456 7800 0199 5500 1000 0001 2312 3456 7890
 */
export function formatChaveAcesso(chave: string): string {
  return chave.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Formata valor monetário: 1500.50 -> 1.500,50
 */
export function formatCurrency(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata quantidade com casas decimais variáveis
 */
export function formatQuantidade(value: number | string | undefined, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata número inteiro com zeros à esquerda
 */
export function formatNumero(value: number | string | undefined, length = 9): string {
  const num = typeof value === 'string' ? parseInt(value, 10) : (value ?? 0);
  return num.toString().padStart(length, '0');
}

/**
 * Formata série com zeros à esquerda
 */
export function formatSerie(value: number | string | undefined): string {
  return formatNumero(value, 3);
}

/**
 * Formata data: Date -> DD/MM/YYYY
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora: Date -> DD/MM/YYYY HH:MM:SS
 */
export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR');
}

/**
 * Formata CEP: 12345678 -> 12.345-678
 */
export function formatCep(cep: string): string {
  const cleaned = cep.replace(/\D/g, '').padStart(8, '0');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3');
}

/**
 * Formata telefone: 11999998888 -> (11) 99999-8888
 */
export function formatTelefone(tel: string): string {
  const cleaned = tel.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return tel;
}

/**
 * Formata Inscrição Estadual
 */
export function formatIE(ie: string | undefined): string {
  if (!ie || ie === 'ISENTO') return 'ISENTO';
  return ie;
}

/**
 * Retorna descrição da modalidade de frete
 */
export function getModalidadeFrete(mod: string | undefined): string {
  const mods: Record<string, string> = {
    '0': '0 - Por conta do Remetente (CIF)',
    '1': '1 - Por conta do Destinatário (FOB)',
    '2': '2 - Por conta de Terceiros',
    '3': '3 - Transporte Próprio por conta do Remetente',
    '4': '4 - Transporte Próprio por conta do Destinatário',
    '9': '9 - Sem Frete',
  };
  return mods[mod ?? '9'] ?? mod ?? '';
}

/**
 * Retorna descrição do modal de transporte (CTe)
 */
export function getModalTransporte(modal: string | undefined): string {
  const modals: Record<string, string> = {
    '01': 'Rodoviário',
    '02': 'Aéreo',
    '03': 'Aquaviário',
    '04': 'Ferroviário',
    '05': 'Dutoviário',
    '06': 'Multimodal',
  };
  return modals[modal ?? ''] ?? modal ?? '';
}

/**
 * Retorna descrição do tipo de CTe
 */
export function getTipoCTe(tipo: string | undefined): string {
  const tipos: Record<string, string> = {
    '0': 'Normal',
    '1': 'Complemento',
    '2': 'Anulação',
    '3': 'Substituto',
  };
  return tipos[tipo ?? '0'] ?? tipo ?? '';
}

/**
 * Retorna descrição do tipo de serviço (CTe)
 */
export function getTipoServico(tipo: string | undefined): string {
  const tipos: Record<string, string> = {
    '0': 'Normal',
    '1': 'Subcontratação',
    '2': 'Redespacho',
    '3': 'Redespacho Intermediário',
    '4': 'Serviço Vinculado a Multimodal',
  };
  return tipos[tipo ?? '0'] ?? tipo ?? '';
}

/**
 * Retorna descrição do tomador do serviço (CTe)
 */
export function getTomadorServico(toma: string | undefined): string {
  const tomadores: Record<string, string> = {
    '0': 'Remetente',
    '1': 'Expedidor',
    '2': 'Recebedor',
    '3': 'Destinatário',
    '4': 'Outros',
  };
  return tomadores[toma ?? '0'] ?? toma ?? '';
}

/**
 * Monta endereço completo
 */
export function buildEndereco(endereco: {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}): string {
  const parts = [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.municipio ? `${endereco.municipio}/${endereco.uf}` : endereco.uf,
    endereco.cep ? `CEP: ${formatCep(endereco.cep)}` : null,
  ].filter(Boolean);
  return parts.join(', ');
}
