import { createParser, parseDate, extractCnpjCpf } from '../utils';
import type { ProcEventoNFeData } from '../types';
import { eventTypeDescriptions } from './res-evento';

/**
 * Parser para Evento Processado (procEventoNFe_v1.00.xsd)
 *
 * Este é o XML completo de um evento que foi processado pela SEFAZ.
 * Contém tanto os dados do evento enviado quanto o retorno da SEFAZ.
 *
 * Estrutura do XML:
 * <procEventoNFe versao="1.00" xmlns="...">
 *   <evento versao="1.00">
 *     <infEvento Id="ID2102103524011234567800019955001000000123123456789001">
 *       <cOrgao>91</cOrgao>
 *       <tpAmb>1</tpAmb>
 *       <CNPJ>12345678000199</CNPJ>
 *       <chNFe>35240112345678000199550010000001231234567890</chNFe>
 *       <dhEvento>2024-01-15T14:00:00-03:00</dhEvento>
 *       <tpEvento>210210</tpEvento>
 *       <nSeqEvento>1</nSeqEvento>
 *       <verEvento>1.00</verEvento>
 *       <detEvento versao="1.00">
 *         <descEvento>Ciencia da Operacao</descEvento>
 *         <!-- xJust para 210240, xCorrecao para CCe -->
 *       </detEvento>
 *     </infEvento>
 *     <Signature>...</Signature>
 *   </evento>
 *   <retEvento versao="1.00">
 *     <infEvento>
 *       <tpAmb>1</tpAmb>
 *       <verAplic>AN_1.0.0</verAplic>
 *       <cOrgao>91</cOrgao>
 *       <cStat>135</cStat>
 *       <xMotivo>Evento registrado e vinculado a NF-e</xMotivo>
 *       <chNFe>35240112345678000199550010000001231234567890</chNFe>
 *       <tpEvento>210210</tpEvento>
 *       <xEvento>Ciencia da Operacao</xEvento>
 *       <nSeqEvento>1</nSeqEvento>
 *       <dhRegEvento>2024-01-15T14:00:05-03:00</dhRegEvento>
 *       <nProt>135240000123457</nProt>
 *     </infEvento>
 *   </retEvento>
 * </procEventoNFe>
 */

export function parseProcEventoNFe(xml: string): ProcEventoNFeData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  const procEvento = parsed.procEventoNFe;
  if (!procEvento) {
    throw new Error('XML não é um Evento Processado válido (procEventoNFe não encontrado)');
  }

  const evento = procEvento.evento;
  const retEvento = procEvento.retEvento;

  if (!evento || !retEvento) {
    throw new Error('Estrutura de evento incompleta (evento ou retEvento ausente)');
  }

  const infEvento = evento.infEvento;
  const retInfEvento = retEvento.infEvento;
  const detEvento = infEvento.detEvento;

  if (!infEvento || !retInfEvento) {
    throw new Error('Estrutura de infEvento incompleta');
  }

  // Extrair CNPJ ou CPF do autor do evento
  const cnpjCpf = extractCnpjCpf(infEvento);

  // Tipo do evento
  const tipoEvento = String(infEvento.tpEvento || '');

  // Dados do detalhamento do evento
  const descricaoEvento = String(detEvento?.descEvento || eventTypeDescriptions[tipoEvento] || '');
  const justificativa = detEvento?.xJust ? String(detEvento.xJust) : undefined;
  const correcao = detEvento?.xCorrecao ? String(detEvento.xCorrecao) : undefined;

  // Status do retorno
  const status = parseInt(String(retInfEvento.cStat || '0'), 10);

  return {
    tipo: 'procEventoNFe',
    versao: String(procEvento['@_versao'] || '1.00'),
    evento: {
      orgao: parseInt(String(infEvento.cOrgao || '0'), 10),
      ambiente: infEvento.tpAmb === '2' ? '2' : '1',
      cnpjCpf,
      chave: String(infEvento.chNFe || ''),
      dataEvento: parseDate(infEvento.dhEvento),
      tipoEvento,
      sequencia: parseInt(String(infEvento.nSeqEvento || '1'), 10),
      versaoEvento: String(infEvento.verEvento || '1.00'),
      descricaoEvento,
      justificativa,
      correcao,
    },
    retorno: {
      ambiente: retInfEvento.tpAmb === '2' ? '2' : '1',
      versaoApp: String(retInfEvento.verAplic || ''),
      orgao: parseInt(String(retInfEvento.cOrgao || '0'), 10),
      status,
      motivo: String(retInfEvento.xMotivo || ''),
      chave: String(retInfEvento.chNFe || ''),
      tipoEvento: String(retInfEvento.tpEvento || ''),
      descricaoEvento: String(retInfEvento.xEvento || ''),
      sequencia: parseInt(String(retInfEvento.nSeqEvento || '1'), 10),
      dataRegistro: parseDate(retInfEvento.dhRegEvento),
      protocolo: String(retInfEvento.nProt || ''),
    },
    metadata: {
      eventoId: infEvento['@_Id'],
      versaoEvento: evento['@_versao'],
      versaoRetorno: retEvento['@_versao'],
      tipoEventoNome: eventTypeDescriptions[tipoEvento] || 'Desconhecido',
      sucesso: isEventoSucesso(status),
    },
  };
}

/**
 * Verifica se o XML é um Evento Processado
 */
export function isProcEventoNFe(xml: string): boolean {
  return xml.includes('<procEventoNFe') && xml.includes('</procEventoNFe>');
}

/**
 * Códigos de status que indicam sucesso no registro do evento
 */
const sucessoStatus = [
  135, // Evento registrado e vinculado a NF-e
  136, // Evento registrado, mas não vinculado a NF-e
  155, // Cancelamento homologado fora de prazo
];

/**
 * Verifica se o status indica sucesso no registro do evento
 */
export function isEventoSucesso(status: number): boolean {
  return sucessoStatus.includes(status);
}

/**
 * Extrai informações básicas do evento processado
 */
export function extractProcEventoInfo(xml: string): {
  chave: string;
  tipoEvento: string;
  status: number;
  protocolo: string;
  sucesso: boolean;
} | null {
  try {
    const parser = createParser();
    const parsed = parser.parse(xml);
    const procEvento = parsed.procEventoNFe;

    if (!procEvento) return null;

    const retInfEvento = procEvento.retEvento?.infEvento;
    const status = parseInt(String(retInfEvento?.cStat || '0'), 10);

    return {
      chave: String(retInfEvento?.chNFe || ''),
      tipoEvento: String(retInfEvento?.tpEvento || ''),
      status,
      protocolo: String(retInfEvento?.nProt || ''),
      sucesso: isEventoSucesso(status),
    };
  } catch {
    return null;
  }
}

/**
 * Extrai a justificativa de um evento (para tpEvento 210240)
 */
export function extractJustificativa(xml: string): string | null {
  try {
    const parser = createParser();
    const parsed = parser.parse(xml);
    const detEvento = parsed.procEventoNFe?.evento?.infEvento?.detEvento;
    return detEvento?.xJust ? String(detEvento.xJust) : null;
  } catch {
    return null;
  }
}

/**
 * Extrai o texto de correção de um evento CCe
 */
export function extractCorrecao(xml: string): string | null {
  try {
    const parser = createParser();
    const parsed = parser.parse(xml);
    const detEvento = parsed.procEventoNFe?.evento?.infEvento?.detEvento;
    return detEvento?.xCorrecao ? String(detEvento.xCorrecao) : null;
  } catch {
    return null;
  }
}
