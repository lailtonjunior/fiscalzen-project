// ============================================
// Detector
// ============================================
export {
  detectDocumentType,
  detectXmlSchema,
  detectDocTypeFromChave,
  isValidChaveAcesso,
  parseChaveAcesso,
  quickDetectType,
} from './detector';

// ============================================
// GZip Utilities
// ============================================
export {
  decodeDocZip,
  encodeToDocZip,
  processLoteDistDFe,
  isBase64Gzip,
  tryDecode,
  extractNsuFromDocZip,
  extractSchemaFromDocZip,
  getDocTypeFromSchema,
} from './gzip';

// ============================================
// Document Parsers
// ============================================
export { parseNFe, type NFeData, type NFeItem } from './parsers/nfe';
export { parseCTe, type CTeData, type DocumentoOriginario } from './parsers/cte';
export { parseMDFe, type MDFeData } from './parsers/mdfe';
export { parseSAT, type SATData, type SATItem } from './parsers/sat';
export { parseNFCe, type NFCeData, type NFCeItem } from './parsers/nfce';
export { parseNFSe, type NFSeData } from './parsers/nfse';
export { parseDocument, type ParsedDocument } from './parsers/auto';

// ============================================
// Resumo Parsers (DistDFe)
// ============================================
export {
  parseResNFe,
  isResNFe,
  extractResNFeInfo,
} from './parsers/res-nfe';

export {
  parseResEvento,
  isResEvento,
  isManifestacaoEvento,
  isCancelamentoEvento,
  isCCeEvento,
  extractResEventoInfo,
  eventTypeDescriptions,
} from './parsers/res-evento';

// ============================================
// Event Parsers
// ============================================
export {
  parseProcEventoNFe,
  isProcEventoNFe,
  isEventoSucesso,
  extractProcEventoInfo,
  extractJustificativa,
  extractCorrecao,
} from './parsers/proc-evento';

// ============================================
// Types
// ============================================
export type {
  DocType,
  DocumentStatus,
  XmlSchemaType,
  XmlDetectionResult,
  ParsedDocumentBase,
  DocumentItem,
  ResNFeData,
  ResEventoData,
  ProcEventoNFeData,
  DecodeResult,
  ManifestacaoEventCode,
  NFeEventCode,
} from './types';

export {
  docTypes,
  documentStatuses,
  xmlSchemaTypes,
  manifestacaoEventTypes,
  nfeEventTypes,
} from './types';

// ============================================
// Utils (for advanced usage)
// ============================================
export {
  createParser,
  parseDate,
  parseDecimal,
  ensureArray,
  extractCnpjCpf,
  buildSearchContent,
} from './utils';
