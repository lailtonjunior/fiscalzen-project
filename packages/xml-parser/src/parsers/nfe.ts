import { createParser, parseDate, parseDecimal, ensureArray, extractCnpjCpf, buildSearchContent } from '../utils';
import type { DocumentStatus } from '../types';

export interface NFeItem {
  numero: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface NFeData {
  tipo: 'NFE';
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
  itens: NFeItem[];
  metadata: Record<string, unknown>;
  searchContent: string;
}

export function parseNFe(xml: string): NFeData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  // Find the main NFe structure
  const procNFe = parsed.nfeProc || parsed.procNFe;
  if (!procNFe) {
    throw new Error('XML não é uma NFe válida (procNFe não encontrado)');
  }

  const nfe = procNFe.NFe;
  if (!nfe) {
    throw new Error('Elemento NFe não encontrado');
  }

  const infNFe = nfe.infNFe;
  const ide = infNFe.ide;
  const emit = infNFe.emit;
  const dest = infNFe.dest || {};
  const total = infNFe.total.ICMSTot;
  const protNFe = procNFe.protNFe?.infProt;

  // Extract access key
  const chave = infNFe['@_Id']?.replace('NFe', '') || protNFe?.chNFe || '';

  // Parse items
  const dets = ensureArray(infNFe.det);
  const itens: NFeItem[] = dets.map((det) => ({
    numero: parseInt(det['@_nItem'] || '0', 10),
    codigo: String(det.prod?.cProd || ''),
    descricao: String(det.prod?.xProd || ''),
    ncm: String(det.prod?.NCM || ''),
    cfop: String(det.prod?.CFOP || ''),
    quantidade: parseDecimal(det.prod?.qCom),
    valorUnitario: parseDecimal(det.prod?.vUnCom),
    valorTotal: parseDecimal(det.prod?.vProd),
  }));

  // Determine document status
  let situacao: DocumentStatus = 'autorizada';
  const cStat = String(protNFe?.cStat || '');
  if (cStat === '101' || cStat === '135') {
    situacao = 'cancelada';
  } else if (cStat === '110' || cStat === '301' || cStat === '302') {
    situacao = 'denegada';
  }

  // Build search content
  const searchContent = buildSearchContent([
    emit.xNome,
    emit.CNPJ,
    dest.xNome,
    extractCnpjCpf(dest),
    chave,
    ide.natOp,
    ...itens.map((i) => i.descricao),
  ]);

  return {
    tipo: 'NFE',
    chave,
    numero: parseInt(String(ide.nNF), 10),
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
    valorTotal: parseDecimal(total.vNF),
    situacao,
    itens,
    metadata: {
      natOp: ide.natOp,
      tpNF: ide.tpNF, // 0=entrada, 1=saída
      indPag: ide.indPag,
      modFrete: infNFe.transp?.modFrete,
      protocolo: protNFe?.nProt,
      dataAutorizacao: protNFe?.dhRecbto,
      modelo: ide.mod,
      uf: emit.enderEmit?.UF,
    },
    searchContent,
  };
}
