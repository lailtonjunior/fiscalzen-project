import { detectDocumentType } from '../detector';
import { parseNFe, type NFeData } from './nfe';
import { parseCTe, type CTeData } from './cte';
import { parseMDFe, type MDFeData } from './mdfe';
import { parseSAT, type SATData } from './sat';
import { parseNFCe, type NFCeData } from './nfce';
import { parseNFSe, type NFSeData } from './nfse';

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
