import { createParser, parseDate, parseDecimal, ensureArray, extractCnpjCpf, buildSearchContent } from '../utils.js';
import type { DocumentStatus } from '../types.js';

export interface SATItem {
  numero: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface SATData {
  tipo: 'SAT';
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
  itens: SATItem[];
  metadata: Record<string, unknown>;
  searchContent: string;
}

export function parseSAT(xml: string): SATData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  // Find the main CFe structure
  const cfe = parsed.CFe;
  if (!cfe) {
    throw new Error('XML não é um SAT/CFe válido (CFe não encontrado)');
  }

  const infCFe = cfe.infCFe;
  const ide = infCFe.ide;
  const emit = infCFe.emit;
  const dest = infCFe.dest || {};
  const total = infCFe.total.ICMSTot || infCFe.total;

  // Extract access key
  const chave = infCFe['@_Id']?.replace('CFe', '') || '';

  // Parse items
  const dets = ensureArray(infCFe.det);
  const itens: SATItem[] = dets.map((det) => ({
    numero: parseInt(det['@_nItem'] || '0', 10),
    codigo: String(det.prod?.cProd || ''),
    descricao: String(det.prod?.xProd || ''),
    ncm: String(det.prod?.NCM || ''),
    cfop: String(det.prod?.CFOP || ''),
    quantidade: parseDecimal(det.prod?.qCom),
    valorUnitario: parseDecimal(det.prod?.vUnCom),
    valorTotal: parseDecimal(det.prod?.vProd),
  }));

  // Determine document status (SAT usually autorizada if exists)
  const situacao: DocumentStatus = 'autorizada';

  // Build search content
  const searchContent = buildSearchContent([
    emit.xNome,
    emit.CNPJ,
    dest.xNome,
    extractCnpjCpf(dest),
    chave,
    ...itens.map((i) => i.descricao),
  ]);

  // Parse date from SAT format (YYYYMMDD)
  const dataEmissao = parseDate(String(ide.dEmi));

  return {
    tipo: 'SAT',
    chave,
    numero: parseInt(String(ide.nCFe), 10),
    serie: parseInt(String(ide.nserieSAT), 10),
    dataEmissao,
    emitente: {
      cnpj: String(emit.CNPJ || ''),
      razaoSocial: String(emit.xNome || ''),
      uf: 'SP', // SAT is SP only
    },
    destinatario: {
      cnpjCpf: extractCnpjCpf(dest),
      razaoSocial: String(dest.xNome || ''),
    },
    valorTotal: parseDecimal(total.vCFe || total.vNF),
    situacao,
    itens,
    metadata: {
      signAC: ide.signAC,
      numeroCaixa: ide.numeroCaixa,
      nserieSAT: ide.nserieSAT,
      modelo: '59', // SAT is always model 59
    },
    searchContent,
  };
}
