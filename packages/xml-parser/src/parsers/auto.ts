import { detectDocumentType } from '../detector.js';
import { parseNFe, type NFeData } from './nfe.js';
import { parseCTe, type CTeData } from './cte.js';
import { parseMDFe, type MDFeData } from './mdfe.js';
import { parseSAT, type SATData } from './sat.js';
import { parseNFCe, type NFCeData } from './nfce.js';
import { parseNFSe, type NFSeData } from './nfse.js';
import type { DocType } from '../types.js';

export type ParsedDocument = NFeData | CTeData | MDFeData | SATData | NFCeData | NFSeData;

export function parseDocument(xml: string): ParsedDocument {
  const docType = detectDocumentType(xml);

  if (!docType) {
    throw new Error('Tipo de documento fiscal não reconhecido');
  }

  switch (docType) {
    case 'NFE':
      return parseNFe(xml);
    case 'CTE':
      return parseCTe(xml);
    case 'MDFE':
      return parseMDFe(xml);
    case 'SAT':
      return parseSAT(xml);
    case 'NFCE':
      return parseNFCe(xml);
    case 'NFSE':
      return parseNFSe(xml);
    default:
      throw new Error(`Parser não implementado para tipo: ${docType satisfies never}`);
  }
}
