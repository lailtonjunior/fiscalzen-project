import { XMLParser } from 'fast-xml-parser';
import type { DocType, XmlSchemaType, XmlDetectionResult } from './types.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});

/**
 * Detecta o tipo de documento fiscal a partir do XML
 *
 * @param xml - Conteúdo XML do documento
 * @returns Tipo do documento ou null se não reconhecido
 */
export function detectDocumentType(xml: string): DocType | null {
  const result = detectXmlSchema(xml);
  return result.docType;
}

/**
 * Detecta informações detalhadas sobre o schema do XML
 *
 * Esta função identifica:
 * - Tipo do schema (procNFe, resNFe, procEventoNFe, etc)
 * - Tipo do documento fiscal (NFE, CTE, MDFE, etc)
 * - Se é um resumo (antes da manifestação)
 * - Se é um evento
 * - Chave de acesso (quando disponível)
 *
 * @param xml - Conteúdo XML do documento
 * @returns Informações detalhadas sobre o XML
 */
export function detectXmlSchema(xml: string): XmlDetectionResult {
  try {
    const parsed = parser.parse(xml);

    // ============================================
    // NFe - Nota Fiscal Eletrônica
    // ============================================

    // procNFe - NFe completa autorizada
    if (parsed.nfeProc || parsed.procNFe) {
      const proc = parsed.nfeProc || parsed.procNFe;
      const infNFe = proc?.NFe?.infNFe;
      const mod = infNFe?.ide?.mod;

      // Verificar se é NFCe (mod=65)
      if (mod === '65' || mod === 65) {
        return {
          schemaType: 'procNFe',
          docType: 'NFCE',
          isResumo: false,
          isEvento: false,
          chave: extractChaveFromInfNFe(infNFe),
        };
      }

      return {
        schemaType: 'procNFe',
        docType: 'NFE',
        isResumo: false,
        isEvento: false,
        chave: extractChaveFromInfNFe(infNFe),
      };
    }

    // resNFe - Resumo da NFe (antes da manifestação)
    if (parsed.resNFe) {
      return {
        schemaType: 'resNFe',
        docType: 'NFE',
        isResumo: true,
        isEvento: false,
        chave: String(parsed.resNFe.chNFe || ''),
      };
    }

    // procEventoNFe - Evento processado (NFe)
    if (parsed.procEventoNFe) {
      const chave = parsed.procEventoNFe.evento?.infEvento?.chNFe ||
                    parsed.procEventoNFe.retEvento?.infEvento?.chNFe;
      return {
        schemaType: 'procEventoNFe',
        docType: 'NFE',
        isResumo: false,
        isEvento: true,
        chave: String(chave || ''),
      };
    }

    // resEvento - Resumo de evento
    if (parsed.resEvento) {
      // Determinar tipo de documento pela chave (se disponível)
      const chave = String(parsed.resEvento.chNFe || '');
      const docType = detectDocTypeFromChave(chave);

      return {
        schemaType: 'resEvento',
        docType,
        isResumo: true,
        isEvento: true,
        chave,
      };
    }

    // NFe avulsa (sem procNFe)
    if (parsed.NFe) {
      const infNFe = parsed.NFe.infNFe;
      const mod = infNFe?.ide?.mod;

      if (mod === '65' || mod === 65) {
        return {
          schemaType: 'procNFe',
          docType: 'NFCE',
          isResumo: false,
          isEvento: false,
          chave: extractChaveFromInfNFe(infNFe),
        };
      }

      return {
        schemaType: 'procNFe',
        docType: 'NFE',
        isResumo: false,
        isEvento: false,
        chave: extractChaveFromInfNFe(infNFe),
      };
    }

    // ============================================
    // CTe - Conhecimento de Transporte Eletrônico
    // ============================================

    if (parsed.cteProc || parsed.procCTe) {
      const proc = parsed.cteProc || parsed.procCTe;
      const chave = proc?.CTe?.infCte?.['@_Id']?.replace('CTe', '') ||
                    proc?.protCTe?.infProt?.chCTe;
      return {
        schemaType: 'procCTe',
        docType: 'CTE',
        isResumo: false,
        isEvento: false,
        chave: String(chave || ''),
      };
    }

    if (parsed.resCTe) {
      return {
        schemaType: 'resCTe',
        docType: 'CTE',
        isResumo: true,
        isEvento: false,
        chave: String(parsed.resCTe.chCTe || ''),
      };
    }

    if (parsed.CTe) {
      const chave = parsed.CTe.infCte?.['@_Id']?.replace('CTe', '');
      return {
        schemaType: 'procCTe',
        docType: 'CTE',
        isResumo: false,
        isEvento: false,
        chave: String(chave || ''),
      };
    }

    // ============================================
    // MDF-e - Manifesto Eletrônico
    // ============================================

    if (parsed.mdfeProc || parsed.procMDFe) {
      const proc = parsed.mdfeProc || parsed.procMDFe;
      const chave = proc?.MDFe?.infMDFe?.['@_Id']?.replace('MDFe', '') ||
                    proc?.protMDFe?.infProt?.chMDFe;
      return {
        schemaType: 'procMDFe',
        docType: 'MDFE',
        isResumo: false,
        isEvento: false,
        chave: String(chave || ''),
      };
    }

    if (parsed.MDFe) {
      const chave = parsed.MDFe.infMDFe?.['@_Id']?.replace('MDFe', '');
      return {
        schemaType: 'procMDFe',
        docType: 'MDFE',
        isResumo: false,
        isEvento: false,
        chave: String(chave || ''),
      };
    }

    // ============================================
    // SAT - Cupom Fiscal Eletrônico
    // ============================================

    if (parsed.CFe) {
      const chave = parsed.CFe.infCFe?.['@_Id']?.replace('CFe', '');
      return {
        schemaType: 'CFe',
        docType: 'SAT',
        isResumo: false,
        isEvento: false,
        chave: String(chave || ''),
      };
    }

    if (parsed.CFeCanc) {
      const chave = parsed.CFeCanc.infCFe?.['@_Id']?.replace('CFe', '');
      return {
        schemaType: 'CFeCanc',
        docType: 'SAT',
        isResumo: false,
        isEvento: true,
        chave: String(chave || ''),
      };
    }

    // ============================================
    // NFSe - Nota Fiscal de Serviços (ABRASF)
    // ============================================

    if (parsed.CompNfse || parsed.tcCompNfse || parsed.Nfse || parsed.ListaNfse ||
        parsed.ConsultarNfseResposta || parsed.EnviarLoteRpsSincronoResposta) {
      return {
        schemaType: 'CompNfse',
        docType: 'NFSE',
        isResumo: false,
        isEvento: false,
      };
    }

    // Não reconhecido
    return {
      schemaType: 'unknown',
      docType: null,
      isResumo: false,
      isEvento: false,
    };
  } catch {
    return {
      schemaType: 'unknown',
      docType: null,
      isResumo: false,
      isEvento: false,
    };
  }
}

/**
 * Extrai a chave de acesso do infNFe
 */
function extractChaveFromInfNFe(infNFe: Record<string, unknown> | undefined): string {
  if (!infNFe) return '';

  // Tentar extrair do atributo Id
  const id = infNFe['@_Id'];
  if (typeof id === 'string') {
    return id.replace('NFe', '');
  }

  return '';
}

/**
 * Detecta o tipo de documento a partir da chave de acesso
 *
 * A chave de acesso tem 44 dígitos. As posições 21-22 indicam o modelo:
 * - 55: NF-e
 * - 65: NFC-e
 * - 57: CT-e
 * - 58: MDF-e
 * - 59: CF-e SAT
 */
export function detectDocTypeFromChave(chave: string): DocType | null {
  if (!chave || chave.length !== 44) return null;

  const modelo = chave.substring(20, 22);

  switch (modelo) {
    case '55':
      return 'NFE';
    case '65':
      return 'NFCE';
    case '57':
      return 'CTE';
    case '58':
      return 'MDFE';
    case '59':
      return 'SAT';
    default:
      return null;
  }
}

/**
 * Valida se uma string é uma chave de acesso válida
 * (44 dígitos numéricos)
 */
export function isValidChaveAcesso(chave: string): boolean {
  if (!chave || chave.length !== 44) return false;
  return /^\d{44}$/.test(chave);
}

/**
 * Extrai informações da chave de acesso
 */
export function parseChaveAcesso(chave: string): {
  uf: string;
  dataEmissao: string;
  cnpj: string;
  modelo: string;
  serie: string;
  numero: string;
  tipoEmissao: string;
  codigoNumerico: string;
  digitoVerificador: string;
} | null {
  if (!isValidChaveAcesso(chave)) return null;

  return {
    uf: chave.substring(0, 2),
    dataEmissao: chave.substring(2, 6), // AAMM
    cnpj: chave.substring(6, 20),
    modelo: chave.substring(20, 22),
    serie: chave.substring(22, 25),
    numero: chave.substring(25, 34),
    tipoEmissao: chave.substring(34, 35),
    codigoNumerico: chave.substring(35, 43),
    digitoVerificador: chave.substring(43, 44),
  };
}

/**
 * Detecta rapidamente o tipo de documento usando regex
 * (mais rápido que parsing completo, mas menos preciso)
 */
export function quickDetectType(xml: string): XmlSchemaType {
  // Verificar por ordem de especificidade
  if (/<resNFe/.test(xml)) return 'resNFe';
  if (/<resEvento/.test(xml)) return 'resEvento';
  if (/<procEventoNFe/.test(xml)) return 'procEventoNFe';
  if (/<nfeProc|<procNFe/.test(xml)) return 'procNFe';
  if (/<cteProc|<procCTe/.test(xml)) return 'procCTe';
  if (/<mdfeProc|<procMDFe/.test(xml)) return 'procMDFe';
  if (/<CFeCanc/.test(xml)) return 'CFeCanc';
  if (/<CFe[^a-zA-Z]/.test(xml)) return 'CFe';
  if (/<CompNfse|<Nfse|<ListaNfse/.test(xml)) return 'CompNfse';

  return 'unknown';
}
