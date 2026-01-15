import { createParser, parseDate, parseDecimal, extractCnpjCpf } from '../utils';
import type { ResNFeData, DocumentStatus } from '../types';

/**
 * Parser para Resumo de NFe (resNFe_v1.01.xsd)
 *
 * Este resumo é retornado pela SEFAZ quando o destinatário consulta
 * documentos via DistDFe ANTES de registrar a manifestação "Ciência da Emissão".
 *
 * Após registrar a ciência (tpEvento 210210), a próxima consulta retornará
 * o documento completo (procNFe).
 *
 * Estrutura do XML:
 * <resNFe versao="1.01">
 *   <chNFe>35240112345678000199550010000001231234567890</chNFe>
 *   <CNPJ>12345678000199</CNPJ>  <!-- ou CPF -->
 *   <xNome>RAZAO SOCIAL DO EMITENTE</xNome>
 *   <IE>123456789012</IE>
 *   <dhEmi>2024-01-15T10:30:00-03:00</dhEmi>
 *   <tpNF>1</tpNF>  <!-- 0=Entrada, 1=Saída -->
 *   <vNF>15750.50</vNF>
 *   <digVal>base64digest==</digVal>
 *   <dhRecbto>2024-01-15T10:35:00-03:00</dhRecbto>
 *   <nProt>135240000123456</nProt>
 *   <cSitNFe>1</cSitNFe>  <!-- 1=Autorizada, 2=Denegada, 3=Cancelada -->
 * </resNFe>
 */

export function parseResNFe(xml: string): ResNFeData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  const resNFe = parsed.resNFe;
  if (!resNFe) {
    throw new Error('XML não é um Resumo de NFe válido (resNFe não encontrado)');
  }

  // Extrair chave de acesso
  const chave = String(resNFe.chNFe || '');
  if (chave.length !== 44) {
    throw new Error(`Chave de acesso inválida: ${chave}`);
  }

  // Extrair CNPJ ou CPF do emitente
  const cnpjCpf = extractCnpjCpf(resNFe);

  // Mapear situação
  const cSitNFe = String(resNFe.cSitNFe || '1');
  let situacao: DocumentStatus = 'autorizada';
  switch (cSitNFe) {
    case '1':
      situacao = 'autorizada';
      break;
    case '2':
      situacao = 'denegada';
      break;
    case '3':
      situacao = 'cancelada';
      break;
  }

  // Tipo NF (0=Entrada, 1=Saída)
  const tipoNF = resNFe.tpNF === '0' ? '0' : '1';

  return {
    tipo: 'resNFe',
    chave,
    cnpjCpf,
    razaoSocial: String(resNFe.xNome || ''),
    ie: resNFe.IE ? String(resNFe.IE) : undefined,
    dataEmissao: parseDate(resNFe.dhEmi),
    tipoNF: tipoNF as '0' | '1',
    valorTotal: parseDecimal(resNFe.vNF),
    digestValue: String(resNFe.digVal || ''),
    dataRecebimento: parseDate(resNFe.dhRecbto),
    protocolo: String(resNFe.nProt || ''),
    situacao,
    metadata: {
      versao: resNFe['@_versao'],
      cSitNFe,
    },
  };
}

/**
 * Verifica se o XML é um Resumo de NFe
 */
export function isResNFe(xml: string): boolean {
  return xml.includes('<resNFe') && xml.includes('</resNFe>');
}

/**
 * Extrai informações básicas do resumo sem parsing completo
 * Útil para decisões rápidas (ex: precisa manifestar?)
 */
export function extractResNFeInfo(xml: string): {
  chave: string;
  cnpj: string;
  valor: number;
  situacao: string;
} | null {
  try {
    const parser = createParser();
    const parsed = parser.parse(xml);
    const resNFe = parsed.resNFe;

    if (!resNFe) return null;

    return {
      chave: String(resNFe.chNFe || ''),
      cnpj: String(resNFe.CNPJ || resNFe.CPF || ''),
      valor: parseDecimal(resNFe.vNF),
      situacao: String(resNFe.cSitNFe || '1'),
    };
  } catch {
    return null;
  }
}
