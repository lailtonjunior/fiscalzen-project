import { createParser, parseDate, parseDecimal, extractCnpjCpf, buildSearchContent } from '../utils';
import type { DocumentStatus } from '../types';

export interface DocumentoOriginario {
  tipo: 'NFE' | 'NF' | 'OUTROS';
  chave?: string;
  serie?: string;
  numero?: string;
  dataEmissao?: string;
  valorTotal?: number;
}

export interface CTeData {
  tipo: 'CTE';
  chave: string;
  numero: number;
  serie: number;
  dataEmissao: Date;
  emitente: {
    cnpj: string;
    razaoSocial: string;
    uf: string;
  };
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
  };
  remetente: {
    cnpjCpf: string;
    razaoSocial: string;
  };
  valorTotal: number;
  valorFrete: number;
  situacao: DocumentStatus;
  documentosOriginarios: DocumentoOriginario[];
  metadata: Record<string, unknown>;
  searchContent: string;
}

export function parseCTe(xml: string): CTeData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  // Find the main CTe structure
  const procCTe = parsed.cteProc || parsed.procCTe;
  if (!procCTe) {
    throw new Error('XML não é um CTe válido (procCTe não encontrado)');
  }

  const cte = procCTe.CTe;
  if (!cte) {
    throw new Error('Elemento CTe não encontrado');
  }

  const infCte = cte.infCte;
  const ide = infCte.ide;
  const emit = infCte.emit;
  const rem = infCte.rem || {}; // Remetente
  const dest = infCte.dest || {}; // Destinatário
  const vPrest = infCte.vPrest;
  const protCTe = procCTe.protCTe?.infProt;
  const infDoc = infCte.infCTeNorm?.infDoc || {};

  // Extract referenced documents (NFe, NF papel, outros)
  const documentosOriginarios: DocumentoOriginario[] = [];

  // NFe eletronica (most common)
  const infNFeList = Array.isArray(infDoc.infNFe) ? infDoc.infNFe : (infDoc.infNFe ? [infDoc.infNFe] : []);
  for (const nfe of infNFeList) {
    documentosOriginarios.push({
      tipo: 'NFE',
      chave: String(nfe.chave || ''),
    });
  }

  // NF papel (legacy)
  const infNFList = Array.isArray(infDoc.infNF) ? infDoc.infNF : (infDoc.infNF ? [infDoc.infNF] : []);
  for (const nf of infNFList) {
    documentosOriginarios.push({
      tipo: 'NF',
      serie: String(nf.serie || ''),
      numero: String(nf.nDoc || ''),
      dataEmissao: nf.dEmi,
      valorTotal: parseDecimal(nf.vBC),
    });
  }

  // Outros documentos
  const infOutrosList = Array.isArray(infDoc.infOutros) ? infDoc.infOutros : (infDoc.infOutros ? [infDoc.infOutros] : []);
  for (const outro of infOutrosList) {
    documentosOriginarios.push({
      tipo: 'OUTROS',
      numero: String(outro.nDoc || ''),
      dataEmissao: outro.dEmi,
      valorTotal: parseDecimal(outro.vDocFisc),
    });
  }

  // Extract access key
  const chave = infCte['@_Id']?.replace('CTe', '') || protCTe?.chCTe || '';

  // Determine document status
  let situacao: DocumentStatus = 'autorizada';
  const cStat = String(protCTe?.cStat || '');
  if (cStat === '101' || cStat === '135') {
    situacao = 'cancelada';
  } else if (cStat === '110' || cStat === '301' || cStat === '302') {
    situacao = 'denegada';
  }

  // Build search content
  const searchContent = buildSearchContent([
    emit.xNome,
    emit.CNPJ,
    rem.xNome,
    extractCnpjCpf(rem),
    dest.xNome,
    extractCnpjCpf(dest),
    chave,
    ide.natOp,
  ]);

  return {
    tipo: 'CTE',
    chave,
    numero: parseInt(String(ide.nCT), 10),
    serie: parseInt(String(ide.serie), 10),
    dataEmissao: parseDate(ide.dhEmi),
    emitente: {
      cnpj: String(emit.CNPJ || ''),
      razaoSocial: String(emit.xNome || ''),
      uf: String(emit.enderEmit?.UF || ''),
    },
    destinatario: {
      cnpjCpf: extractCnpjCpf(dest),
      razaoSocial: String(dest.xNome || ''),
    },
    remetente: {
      cnpjCpf: extractCnpjCpf(rem),
      razaoSocial: String(rem.xNome || ''),
    },
    valorTotal: parseDecimal(vPrest?.vTPrest),
    valorFrete: parseDecimal(vPrest?.vRec),
    situacao,
    documentosOriginarios,
    metadata: {
      natOp: ide.natOp,
      tpCTe: ide.tpCTe, // 0=Normal, 1=Complemento, 2=Anulação, 3=Substituto
      modal: ide.modal, // 01=Rodoviário, 02=Aéreo, etc
      tpServ: ide.tpServ,
      protocolo: protCTe?.nProt,
      dataAutorizacao: protCTe?.dhRecbto,
      modelo: ide.mod,
      ufInicio: ide.UFIni,
      ufFim: ide.UFFim,
    },
    searchContent,
  };
}
