import { createParser, parseDate, extractCnpjCpf } from '../utils';
import type { ResEventoData } from '../types';

/**
 * Parser para Resumo de Evento (resEvento_v1.01.xsd)
 *
 * Este resumo é retornado pela SEFAZ quando há eventos associados
 * a documentos fiscais do destinatário.
 *
 * Tipos de evento mais comuns:
 * - 110110: Carta de Correção (CCe)
 * - 110111: Cancelamento
 * - 210200: Confirmação da Operação
 * - 210210: Ciência da Emissão
 * - 210220: Desconhecimento da Operação
 * - 210240: Operação não Realizada
 *
 * Estrutura do XML:
 * <resEvento versao="1.01">
 *   <cOrgao>35</cOrgao>
 *   <CNPJ>12345678000199</CNPJ>  <!-- ou CPF -->
 *   <chNFe>35240112345678000199550010000001231234567890</chNFe>
 *   <dhEvento>2024-01-15T14:00:00-03:00</dhEvento>
 *   <tpEvento>210210</tpEvento>
 *   <nSeqEvento>1</nSeqEvento>
 *   <xEvento>Ciencia da Operacao</xEvento>
 *   <dhRecbto>2024-01-15T14:00:05-03:00</dhRecbto>
 *   <nProt>135240000123457</nProt>
 * </resEvento>
 */

/**
 * Mapeamento de códigos de evento para descrições
 */
export const eventTypeDescriptions: Record<string, string> = {
  '110110': 'Carta de Correção',
  '110111': 'Cancelamento',
  '110112': 'Cancelamento por Substituição',
  '110140': 'EPEC',
  '210200': 'Confirmação da Operação',
  '210210': 'Ciência da Emissão',
  '210220': 'Desconhecimento da Operação',
  '210240': 'Operação não Realizada',
};

export function parseResEvento(xml: string): ResEventoData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  const resEvento = parsed.resEvento;
  if (!resEvento) {
    throw new Error('XML não é um Resumo de Evento válido (resEvento não encontrado)');
  }

  // Extrair CNPJ ou CPF
  const cnpjCpf = extractCnpjCpf(resEvento);

  // Código do órgão
  const orgao = parseInt(String(resEvento.cOrgao || '0'), 10);

  // Tipo e sequência do evento
  const tipoEvento = String(resEvento.tpEvento || '');
  const sequencia = parseInt(String(resEvento.nSeqEvento || '1'), 10);

  // Descrição do evento
  const descricaoEvento = String(resEvento.xEvento || eventTypeDescriptions[tipoEvento] || 'Evento');

  return {
    tipo: 'resEvento',
    orgao,
    cnpjCpf,
    chave: String(resEvento.chNFe || ''),
    dataEvento: parseDate(resEvento.dhEvento),
    tipoEvento,
    sequencia,
    descricaoEvento,
    dataRecebimento: parseDate(resEvento.dhRecbto),
    protocolo: String(resEvento.nProt || ''),
    metadata: {
      versao: resEvento['@_versao'],
      tipoEventoNome: eventTypeDescriptions[tipoEvento] || 'Desconhecido',
    },
  };
}

/**
 * Verifica se o XML é um Resumo de Evento
 */
export function isResEvento(xml: string): boolean {
  return xml.includes('<resEvento') && xml.includes('</resEvento>');
}

/**
 * Verifica se o evento é uma manifestação do destinatário
 */
export function isManifestacaoEvento(tipoEvento: string): boolean {
  return ['210200', '210210', '210220', '210240'].includes(tipoEvento);
}

/**
 * Verifica se o evento é cancelamento
 */
export function isCancelamentoEvento(tipoEvento: string): boolean {
  return ['110111', '110112'].includes(tipoEvento);
}

/**
 * Verifica se o evento é CCe (Carta de Correção)
 */
export function isCCeEvento(tipoEvento: string): boolean {
  return tipoEvento === '110110';
}

/**
 * Extrai informações básicas do resumo de evento
 */
export function extractResEventoInfo(xml: string): {
  chave: string;
  tipoEvento: string;
  descricao: string;
  protocolo: string;
} | null {
  try {
    const parser = createParser();
    const parsed = parser.parse(xml);
    const resEvento = parsed.resEvento;

    if (!resEvento) return null;

    const tipoEvento = String(resEvento.tpEvento || '');

    return {
      chave: String(resEvento.chNFe || ''),
      tipoEvento,
      descricao: String(resEvento.xEvento || eventTypeDescriptions[tipoEvento] || ''),
      protocolo: String(resEvento.nProt || ''),
    };
  } catch {
    return null;
  }
}
