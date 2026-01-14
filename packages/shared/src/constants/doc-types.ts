import type { DocType } from '../types/documents.js';

export interface DocTypeInfo {
  code: DocType;
  label: string;
  fullName: string;
  modelo: string;
  description: string;
}

export const DOC_TYPES: Record<DocType, DocTypeInfo> = {
  NFE: {
    code: 'NFE',
    label: 'NF-e',
    fullName: 'Nota Fiscal Eletrônica',
    modelo: '55',
    description: 'Nota Fiscal Eletrônica de mercadorias',
  },
  NFCE: {
    code: 'NFCE',
    label: 'NFC-e',
    fullName: 'Nota Fiscal de Consumidor Eletrônica',
    modelo: '65',
    description: 'Nota Fiscal de Consumidor Eletrônica',
  },
  NFSE: {
    code: 'NFSE',
    label: 'NFS-e',
    fullName: 'Nota Fiscal de Serviços Eletrônica',
    modelo: 'ABRASF',
    description: 'Nota Fiscal de Serviços Eletrônica (municipal)',
  },
  CTE: {
    code: 'CTE',
    label: 'CT-e',
    fullName: 'Conhecimento de Transporte Eletrônico',
    modelo: '57',
    description: 'Documento de transporte de cargas',
  },
  MDFE: {
    code: 'MDFE',
    label: 'MDF-e',
    fullName: 'Manifesto Eletrônico de Documentos Fiscais',
    modelo: '58',
    description: 'Manifesto de carga para transporte',
  },
  SAT: {
    code: 'SAT',
    label: 'SAT',
    fullName: 'Sistema de Autenticação e Transmissão',
    modelo: '59',
    description: 'Cupom Fiscal Eletrônico (SP)',
  },
};

export function getDocTypeInfo(docType: DocType): DocTypeInfo {
  return DOC_TYPES[docType];
}

export function getDocTypeByModelo(modelo: string): DocType | null {
  for (const [code, info] of Object.entries(DOC_TYPES)) {
    if (info.modelo === modelo) {
      return code as DocType;
    }
  }
  return null;
}

export function getAllDocTypes(): DocTypeInfo[] {
  return Object.values(DOC_TYPES);
}

export function getDocTypeOptions(): Array<{ value: DocType; label: string }> {
  return Object.values(DOC_TYPES).map((info) => ({
    value: info.code,
    label: info.label,
  }));
}
