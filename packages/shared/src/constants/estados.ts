export interface Estado {
  codigo: string;
  sigla: string;
  nome: string;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
}

export const ESTADOS: Estado[] = [
  { codigo: '12', sigla: 'AC', nome: 'Acre', regiao: 'Norte' },
  { codigo: '27', sigla: 'AL', nome: 'Alagoas', regiao: 'Nordeste' },
  { codigo: '16', sigla: 'AP', nome: 'Amapá', regiao: 'Norte' },
  { codigo: '13', sigla: 'AM', nome: 'Amazonas', regiao: 'Norte' },
  { codigo: '29', sigla: 'BA', nome: 'Bahia', regiao: 'Nordeste' },
  { codigo: '23', sigla: 'CE', nome: 'Ceará', regiao: 'Nordeste' },
  { codigo: '53', sigla: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
  { codigo: '32', sigla: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste' },
  { codigo: '52', sigla: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste' },
  { codigo: '21', sigla: 'MA', nome: 'Maranhão', regiao: 'Nordeste' },
  { codigo: '51', sigla: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  { codigo: '50', sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  { codigo: '31', sigla: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste' },
  { codigo: '15', sigla: 'PA', nome: 'Pará', regiao: 'Norte' },
  { codigo: '25', sigla: 'PB', nome: 'Paraíba', regiao: 'Nordeste' },
  { codigo: '41', sigla: 'PR', nome: 'Paraná', regiao: 'Sul' },
  { codigo: '26', sigla: 'PE', nome: 'Pernambuco', regiao: 'Nordeste' },
  { codigo: '22', sigla: 'PI', nome: 'Piauí', regiao: 'Nordeste' },
  { codigo: '33', sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  { codigo: '24', sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  { codigo: '43', sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul' },
  { codigo: '11', sigla: 'RO', nome: 'Rondônia', regiao: 'Norte' },
  { codigo: '14', sigla: 'RR', nome: 'Roraima', regiao: 'Norte' },
  { codigo: '42', sigla: 'SC', nome: 'Santa Catarina', regiao: 'Sul' },
  { codigo: '35', sigla: 'SP', nome: 'São Paulo', regiao: 'Sudeste' },
  { codigo: '28', sigla: 'SE', nome: 'Sergipe', regiao: 'Nordeste' },
  { codigo: '17', sigla: 'TO', nome: 'Tocantins', regiao: 'Norte' },
];

export const UF_BY_SIGLA = ESTADOS.reduce(
  (acc, estado) => {
    acc[estado.sigla] = estado;
    return acc;
  },
  {} as Record<string, Estado>
);

export const UF_BY_CODIGO = ESTADOS.reduce(
  (acc, estado) => {
    acc[estado.codigo] = estado;
    return acc;
  },
  {} as Record<string, Estado>
);

export function getEstadoBySigla(sigla: string): Estado | undefined {
  return UF_BY_SIGLA[sigla.toUpperCase()];
}

export function getEstadoByCodigo(codigo: string): Estado | undefined {
  return UF_BY_CODIGO[codigo];
}

export function getUfOptions(): Array<{ value: string; label: string }> {
  return ESTADOS.map((e) => ({ value: e.sigla, label: `${e.sigla} - ${e.nome}` }));
}
