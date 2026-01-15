// ============================================
// CTeDistribuicaoDFe - Distribuição de DFe CTe
// ============================================
// Serviço para consulta de CT-e destinados ao CNPJ

import type {
  DistDFeParams,
  DistDFeResponse,
  DocumentoDistDFe,
  SefazAmbiente,
  CertificadoA1,
} from '../types';
import { SefazError } from '../types';
import { SEFAZ_STATUS } from '../constants';
import { SoapClient, extractSoapBody, extractTagValue } from '../soap-client';
import {
  getCTeDistDFeEndpoint,
  SOAP_ACTIONS,
  SOAP_NAMESPACES,
  SCHEMA_VERSIONS,
  getAmbienteCode,
  UF_CODES,
  XML_NAMESPACES,
} from '../constants/endpoints';
import { decodeDocZip, isBase64Gzip } from '@fiscalzen/xml-parser';
import { detectXmlSchema } from '@fiscalzen/xml-parser';

// ============================================
// Builders de XML
// ============================================

/**
 * Constrói o XML da consulta distNSU para CT-e
 */
function buildDistNSURequest(
  ambiente: SefazAmbiente,
  cnpj: string,
  ultNSU: string,
  ufAutor?: number
): string {
  const tpAmb = getAmbienteCode(ambiente);
  const cUFAutor = ufAutor ?? UF_CODES.AN;

  return `
<distDFeInt xmlns="${XML_NAMESPACES.cte}" versao="${SCHEMA_VERSIONS.distDFe}">
  <tpAmb>${tpAmb}</tpAmb>
  <cUFAutor>${cUFAutor}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <distNSU>
    <ultNSU>${ultNSU.padStart(15, '0')}</ultNSU>
  </distNSU>
</distDFeInt>`.trim();
}

/**
 * Constrói o XML da consulta consNSU para CT-e
 */
function buildConsNSURequest(
  ambiente: SefazAmbiente,
  cnpj: string,
  nsu: string,
  ufAutor?: number
): string {
  const tpAmb = getAmbienteCode(ambiente);
  const cUFAutor = ufAutor ?? UF_CODES.AN;

  return `
<distDFeInt xmlns="${XML_NAMESPACES.cte}" versao="${SCHEMA_VERSIONS.distDFe}">
  <tpAmb>${tpAmb}</tpAmb>
  <cUFAutor>${cUFAutor}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <consNSU>
    <NSU>${nsu.padStart(15, '0')}</NSU>
  </consNSU>
</distDFeInt>`.trim();
}

/**
 * Constrói o XML da consulta por chave para CT-e
 */
function buildConsChCTeRequest(
  ambiente: SefazAmbiente,
  cnpj: string,
  chCTe: string,
  ufAutor?: number
): string {
  const tpAmb = getAmbienteCode(ambiente);
  const cUFAutor = ufAutor ?? UF_CODES.AN;

  return `
<distDFeInt xmlns="${XML_NAMESPACES.cte}" versao="${SCHEMA_VERSIONS.distDFe}">
  <tpAmb>${tpAmb}</tpAmb>
  <cUFAutor>${cUFAutor}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <consChCTe>
    <chCTe>${chCTe}</chCTe>
  </consChCTe>
</distDFeInt>`.trim();
}

/**
 * Constrói o body do SOAP com o cteDadosMsg
 */
function buildSoapBody(distDFeXml: string): string {
  return `
<cteDistDFeInteresse xmlns="${SOAP_NAMESPACES.cte}">
  <cteDadosMsg>
    ${distDFeXml}
  </cteDadosMsg>
</cteDistDFeInteresse>`.trim();
}

// ============================================
// Parser de Resposta
// ============================================

/**
 * Processa a resposta da SEFAZ para CT-e
 */
function parseDistDFeResponse(soapResponse: string): DistDFeResponse {
  try {
    const body = extractSoapBody(soapResponse);

    const cStat = extractTagValue(body, 'cStat') ?? '';
    const xMotivo = extractTagValue(body, 'xMotivo') ?? '';
    const ultNSU = extractTagValue(body, 'ultNSU') ?? '000000000000000';
    const maxNSU = extractTagValue(body, 'maxNSU') ?? '000000000000000';
    const dhResp = extractTagValue(body, 'dhResp');
    const versaoApp = extractTagValue(body, 'verAplic');

    const sucesso = cStat === SEFAZ_STATUS.DOCUMENTO_LOCALIZADO ||
                    cStat === SEFAZ_STATUS.NENHUM_DOCUMENTO;

    const documentos = parseDocumentos(body);

    return {
      sucesso,
      cStat,
      xMotivo,
      ultNSU,
      maxNSU,
      documentos,
      dhResp: dhResp ? new Date(dhResp) : undefined,
      versaoApp,
      erro: sucesso
        ? undefined
        : {
            codigo: cStat,
            mensagem: xMotivo,
          },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new SefazError(`Erro ao processar resposta CTe: ${message}`, 'PARSE_ERROR');
  }
}

/**
 * Extrai e processa os documentos CT-e da resposta
 */
function parseDocumentos(responseXml: string): DocumentoDistDFe[] {
  const documentos: DocumentoDistDFe[] = [];

  const docZipRegex = /<docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([^<]*)<\/docZip>/gi;
  let match: RegExpExecArray | null;

  while ((match = docZipRegex.exec(responseXml)) !== null) {
    const [, nsu, schema, content] = match;

    try {
      const xml = isBase64Gzip(content) ? decodeDocZip(content) : content;
      const detection = detectXmlSchema(xml);

      documentos.push({
        nsu,
        schema,
        xml,
        tipo: detection.docType,
        isResumo: detection.isResumo,
        isEvento: detection.isEvento,
        chave: detection.chave,
      });
    } catch (error) {
      console.error(`Erro ao processar docZip CTe NSU ${nsu}:`, error);
    }
  }

  return documentos;
}

// ============================================
// Serviço Principal
// ============================================

/**
 * Consulta CT-e via CTeDistribuicaoDFe
 */
export async function consultarCTeDistDFe(params: DistDFeParams): Promise<DistDFeResponse> {
  const { ambiente, cnpj, certificado, ufAutor } = params;

  validateParams(params);

  let requestXml: string;

  if (params.ultNSU !== undefined) {
    requestXml = buildDistNSURequest(ambiente, cnpj, params.ultNSU, ufAutor);
  } else if (params.nsu !== undefined) {
    requestXml = buildConsNSURequest(ambiente, cnpj, params.nsu, ufAutor);
  } else if (params.chNFe !== undefined) {
    // Para CTe, chNFe é usado para chCTe
    requestXml = buildConsChCTeRequest(ambiente, cnpj, params.chNFe, ufAutor);
  } else {
    throw new SefazError('É necessário informar ultNSU, nsu ou chNFe', 'INVALID_PARAMS');
  }

  const soapClient = new SoapClient({ certificado });
  const soapBody = buildSoapBody(requestXml);

  const endpoint = getCTeDistDFeEndpoint(ambiente);
  const response = await soapClient.send(endpoint, {
    action: SOAP_ACTIONS.cteDistDFe,
    body: soapBody,
    namespace: SOAP_NAMESPACES.cte,
  });

  return parseDistDFeResponse(response.body);
}

/**
 * Consulta CT-e por último NSU
 */
export async function consultarCTePorUltNSU(
  ambiente: SefazAmbiente,
  cnpj: string,
  ultNSU: string,
  certificado: CertificadoA1,
  ufAutor?: number
): Promise<DistDFeResponse> {
  return consultarCTeDistDFe({
    ambiente,
    cnpj,
    ultNSU,
    certificado,
    ufAutor,
  });
}

/**
 * Consulta CT-e por NSU específico
 */
export async function consultarCTePorNSU(
  ambiente: SefazAmbiente,
  cnpj: string,
  nsu: string,
  certificado: CertificadoA1,
  ufAutor?: number
): Promise<DistDFeResponse> {
  return consultarCTeDistDFe({
    ambiente,
    cnpj,
    nsu,
    certificado,
    ufAutor,
  });
}

/**
 * Consulta CT-e por chave de acesso
 */
export async function consultarCTePorChave(
  ambiente: SefazAmbiente,
  cnpj: string,
  chCTe: string,
  certificado: CertificadoA1,
  ufAutor?: number
): Promise<DistDFeResponse> {
  return consultarCTeDistDFe({
    ambiente,
    cnpj,
    chNFe: chCTe, // Reutiliza o campo
    certificado,
    ufAutor,
  });
}

// ============================================
// Validações
// ============================================

function validateParams(params: DistDFeParams): void {
  const { cnpj, chNFe } = params;

  if (!/^\d{14}$/.test(cnpj)) {
    throw new SefazError('CNPJ deve ter 14 dígitos', 'INVALID_PARAMS');
  }

  if (chNFe && !/^\d{44}$/.test(chNFe)) {
    throw new SefazError('Chave de acesso deve ter 44 dígitos', 'INVALID_PARAMS');
  }
}
