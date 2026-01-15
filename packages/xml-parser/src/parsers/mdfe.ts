import { createParser, parseDate, parseDecimal, ensureArray, buildSearchContent } from '../utils';
import type { DocumentStatus } from '../types';

export interface MDFeData {
  tipo: 'MDFE';
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
  valorTotal: number;
  situacao: DocumentStatus;
  documentosVinculados: number;
  metadata: Record<string, unknown>;
  searchContent: string;
}

export function parseMDFe(xml: string): MDFeData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  // Find the main MDF-e structure
  const procMDFe = parsed.mdfeProc || parsed.procMDFe;
  if (!procMDFe) {
    throw new Error('XML não é um MDF-e válido (procMDFe não encontrado)');
  }

  const mdfe = procMDFe.MDFe;
  if (!mdfe) {
    throw new Error('Elemento MDFe não encontrado');
  }

  const infMDFe = mdfe.infMDFe;
  const ide = infMDFe.ide;
  const emit = infMDFe.emit;
  const tot = infMDFe.tot;
  const protMDFe = procMDFe.protMDFe?.infProt;

  // Extract access key
  const chave = infMDFe['@_Id']?.replace('MDFe', '') || protMDFe?.chMDFe || '';

  // Determine document status
  let situacao: DocumentStatus = 'autorizada';
  const cStat = String(protMDFe?.cStat || '');
  if (cStat === '101' || cStat === '135') {
    situacao = 'cancelada';
  }

  // Count linked documents
  const infMunDescarga = ensureArray(infMDFe.infDoc?.infMunDescarga);
  let documentosVinculados = 0;
  for (const mun of infMunDescarga) {
    const infCTe = ensureArray(mun.infCTe);
    const infNFe = ensureArray(mun.infNFe);
    documentosVinculados += infCTe.length + infNFe.length;
  }

  // Build search content
  const searchContent = buildSearchContent([
    emit.xNome,
    emit.CNPJ,
    chave,
    ide.UFIni,
    ide.UFFim,
  ]);

  return {
    tipo: 'MDFE',
    chave,
    numero: parseInt(String(ide.nMDF), 10),
    serie: parseInt(String(ide.serie), 10),
    dataEmissao: parseDate(ide.dhEmi),
    emitente: {
      cnpj: String(emit.CNPJ || ''),
      razaoSocial: String(emit.xNome || ''),
      uf: String(emit.enderEmit?.UF || ''),
    },
    destinatario: {
      cnpjCpf: '',
      razaoSocial: '',
    },
    valorTotal: parseDecimal(tot.vCarga),
    situacao,
    documentosVinculados,
    metadata: {
      modal: ide.modal,
      tpEmit: ide.tpEmit,
      tpTransp: ide.tpTransp,
      protocolo: protMDFe?.nProt,
      dataAutorizacao: protMDFe?.dhRecbto,
      modelo: ide.mod,
      ufInicio: ide.UFIni,
      ufFim: ide.UFFim,
      qCTe: tot.qCTe,
      qNFe: tot.qNFe,
    },
    searchContent,
  };
}
