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
} from './detector.js';

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
} from './gzip.js';

// ============================================
// Document Parsers
// ============================================
export { parseNFe, type NFeData, type NFeItem } from './parsers/nfe.js';
export { parseCTe, type CTeData } from './parsers/cte.js';
export { parseMDFe, type MDFeData } from './parsers/mdfe.js';
export { parseSAT, type SATData, type SATItem } from './parsers/sat.js';
export { parseNFCe, type NFCeData, type NFCeItem } from './parsers/nfce.js';
export { parseNFSe, type NFSeData } from './parsers/nfse.js';
export { parseDocument, type ParsedDocument } from './parsers/auto.js';

// ============================================
// Resumo Parsers (DistDFe)
// ============================================
export {
  parseResNFe,
  isResNFe,
  extractResNFeInfo,
} from './parsers/res-nfe.js';

export {
  parseResEvento,
  isResEvento,
  isManifestacaoEvento,
  isCancelamentoEvento,
  isCCeEvento,
  extractResEventoInfo,
  eventTypeDescriptions,
} from './parsers/res-evento.js';

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
} from './parsers/proc-evento.js';

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
} from './types.js';

export {
  docTypes,
  documentStatuses,
  xmlSchemaTypes,
  manifestacaoEventTypes,
  nfeEventTypes,
} from './types.js';

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
} from './utils.js';
