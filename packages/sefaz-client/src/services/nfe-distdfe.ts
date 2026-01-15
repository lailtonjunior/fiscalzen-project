// ============================================
// NFeDistribuicaoDFe - Distribuição de DFe NFe
// ============================================
// Serviço para consulta de documentos fiscais destinados ao CNPJ
// conforme Manual de Orientação do Contribuinte (MOC)

import type {
  DistDFeParams,
  DistDFeResponse,
  DocumentoDistDFe,
  SefazAmbiente,
  CertificadoA1,
} from '../types';
import { SefazError } from '../types';
import { SEFAZ_STATUS } from '../constants';
import { SoapClient, extractSoapBody, extractTagValue, extractAllElements } from '../soap-client';
import {
  getNFeDistDFeEndpoint,
  SOAP_ACTIONS,
  SOAP_NAMESPACES,
  SCHEMA_VERSIONS,
  getAmbienteCode,
  UF_CODES,
} from '../constants/endpoints';
import { decodeDocZip, isBase64Gzip } from '@fiscalzen/xml-parser';
import { detectXmlSchema } from '@fiscalzen/xml-parser';

// ============================================
// Builders de XML
// ============================================

/**
 * Constrói o XML da consulta distNSU (consulta por lote)
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
<distDFeInt xmlns="${SOAP_NAMESPACES.nfe}" versao="${SCHEMA_VERSIONS.distDFe}">
  <tpAmb>${tpAmb}</tpAmb>
  <cUFAutor>${cUFAutor}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <distNSU>
    <ultNSU>${ultNSU.padStart(15, '0')}</ultNSU>
  </distNSU>
</distDFeInt>`.trim();
}

/**
 * Constrói o XML da consulta consNSU (consulta NSU específico)
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
<distDFeInt xmlns="${SOAP_NAMESPACES.nfe}" versao="${SCHEMA_VERSIONS.distDFe}">
  <tpAmb>${tpAmb}</tpAmb>
  <cUFAutor>${cUFAutor}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <consNSU>
    <NSU>${nsu.padStart(15, '0')}</NSU>
  </consNSU>
</distDFeInt>`.trim();
}

/**
 * Constrói o XML da consulta consChNFe (consulta por chave)
 */
function buildConsChNFeRequest(
  ambiente: SefazAmbiente,
  cnpj: string,
  chNFe: string,
  ufAutor?: number
): string {
  const tpAmb = getAmbienteCode(ambiente);
  const cUFAutor = ufAutor ?? UF_CODES.AN;

  return `
<distDFeInt xmlns="${SOAP_NAMESPACES.nfe}" versao="${SCHEMA_VERSIONS.distDFe}">
  <tpAmb>${tpAmb}</tpAmb>
  <cUFAutor>${cUFAutor}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <consChNFe>
    <chNFe>${chNFe}</chNFe>
  </consChNFe>
</distDFeInt>`.trim();
}

/**
 * Constrói o body do SOAP com o nfeDadosMsg
 */
function buildSoapBody(distDFeXml: string): string {
  return `
<nfeDistDFeInteresse xmlns="${SOAP_NAMESPACES.nfe}">
  <nfeDadosMsg>
    ${distDFeXml}
  </nfeDadosMsg>
</nfeDistDFeInteresse>`.trim();
}

// ============================================
// Parser de Resposta
// ============================================

/**
 * Processa a resposta da SEFAZ
 */
function parseDistDFeResponse(soapResponse: string): DistDFeResponse {
  try {
    const body = extractSoapBody(soapResponse);

    // Extrai o retDistDFeInt
    const cStat = extractTagValue(body, 'cStat') ?? '';
    const xMotivo = extractTagValue(body, 'xMotivo') ?? '';
    const ultNSU = extractTagValue(body, 'ultNSU') ?? '000000000000000';
    const maxNSU = extractTagValue(body, 'maxNSU') ?? '000000000000000';
    const dhResp = extractTagValue(body, 'dhResp');
    const versaoApp = extractTagValue(body, 'verAplic');

    // Verifica status de sucesso
    const sucesso = cStat === SEFAZ_STATUS.DOCUMENTO_LOCALIZADO ||
                    cStat === SEFAZ_STATUS.NENHUM_DOCUMENTO;

    // Extrai documentos
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
    throw new SefazError(`Erro ao processar resposta: ${message}`, 'PARSE_ERROR');
  }
}

/**
 * Extrai e processa os documentos da resposta
 */
function parseDocumentos(responseXml: string): DocumentoDistDFe[] {
  const documentos: DocumentoDistDFe[] = [];

  // Extrai todos os docZip
  const docZipRegex = /<docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([^<]*)<\/docZip>/gi;
  let match: RegExpExecArray | null;

  while ((match = docZipRegex.exec(responseXml)) !== null) {
    const [, nsu, schema, content] = match;

    try {
      // Decodifica o conteúdo (Base64 + GZip)
      const xml = isBase64Gzip(content) ? decodeDocZip(content) : content;

      // Detecta o tipo do documento
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
      // Log do erro mas continua processando outros documentos
      console.error(`Erro ao processar docZip NSU ${nsu}:`, error);
    }
  }

  return documentos;
}

// ============================================
// Serviço Principal
// ============================================

/**
 * Consulta documentos fiscais via NFeDistribuicaoDFe
 */
export async function consultarDistDFe(params: DistDFeParams): Promise<DistDFeResponse> {
  const { ambiente, cnpj, certificado, ufAutor } = params;

  // Valida parâmetros
  validateParams(params);

  // Determina o tipo de consulta
  let requestXml: string;

  if (params.ultNSU !== undefined) {
    // Consulta por lote (distNSU)
    requestXml = buildDistNSURequest(ambiente, cnpj, params.ultNSU, ufAutor);
  } else if (params.nsu !== undefined) {
    // Consulta NSU específico (consNSU)
    requestXml = buildConsNSURequest(ambiente, cnpj, params.nsu, ufAutor);
  } else if (params.chNFe !== undefined) {
    // Consulta por chave (consChNFe)
    requestXml = buildConsChNFeRequest(ambiente, cnpj, params.chNFe, ufAutor);
  } else {
    throw new SefazError('É necessário informar ultNSU, nsu ou chNFe', 'INVALID_PARAMS');
  }

  // Cria cliente SOAP
  const soapClient = new SoapClient({ certificado });

  // Monta o body do SOAP
  const soapBody = buildSoapBody(requestXml);

  // Envia requisição
  const endpoint = getNFeDistDFeEndpoint(ambiente);
  const response = await soapClient.send(endpoint, {
    action: SOAP_ACTIONS.nfeDistDFe,
    body: soapBody,
    namespace: SOAP_NAMESPACES.nfe,
  });

  // Processa resposta
  return parseDistDFeResponse(response.body);
}

/**
 * Consulta em lote (distNSU) - helper
 */
export async function consultarPorUltNSU(
  ambiente: SefazAmbiente,
  cnpj: string,
  ultNSU: string,
  certificado: CertificadoA1,
  ufAutor?: number
): Promise<DistDFeResponse> {
  return consultarDistDFe({
    ambiente,
    cnpj,
    ultNSU,
    certificado,
    ufAutor,
  });
}

/**
 * Consulta NSU específico (consNSU) - helper
 */
export async function consultarPorNSU(
  ambiente: SefazAmbiente,
  cnpj: string,
  nsu: string,
  certificado: CertificadoA1,
  ufAutor?: number
): Promise<DistDFeResponse> {
  return consultarDistDFe({
    ambiente,
    cnpj,
    nsu,
    certificado,
    ufAutor,
  });
}

/**
 * Consulta por chave (consChNFe) - helper
 */
export async function consultarPorChave(
  ambiente: SefazAmbiente,
  cnpj: string,
  chNFe: string,
  certificado: CertificadoA1,
  ufAutor?: number
): Promise<DistDFeResponse> {
  return consultarDistDFe({
    ambiente,
    cnpj,
    chNFe,
    certificado,
    ufAutor,
  });
}

// ============================================
// Validações
// ============================================

function validateParams(params: DistDFeParams): void {
  const { cnpj, chNFe } = params;

  // Valida CNPJ
  if (!/^\d{14}$/.test(cnpj)) {
    throw new SefazError('CNPJ deve ter 14 dígitos', 'INVALID_PARAMS');
  }

  // Valida chave se informada
  if (chNFe && !/^\d{44}$/.test(chNFe)) {
    throw new SefazError('Chave de acesso deve ter 44 dígitos', 'INVALID_PARAMS');
  }
}
