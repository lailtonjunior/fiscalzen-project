// ============================================
// Manifestacao do Destinatario (NFeRecepcaoEvento)
// ============================================
// Servico para registro de eventos de manifestacao:
// - 210200: Confirmacao da Operacao
// - 210210: Ciencia da Emissao
// - 210220: Desconhecimento da Operacao
// - 210240: Operacao nao Realizada

import type {
  ManifestacaoParams,
  ManifestacaoResponse,
  SefazAmbiente,
  TipoEventoManifestacao,
  CertificadoA1,
} from '../types';
import { SefazError, MANIFESTACAO_DESCRICOES } from '../types';
import { SEFAZ_STATUS } from '../constants';
import { SoapClient, extractSoapBody, extractTagValue } from '../soap-client';
import {
  getNFeEventoEndpoint,
  SOAP_ACTIONS,
  SOAP_NAMESPACES,
  SCHEMA_VERSIONS,
  getAmbienteCode,
  UF_CODES,
  XML_NAMESPACES,
} from '../constants/endpoints';
import { signXml, gerarEventoId } from '../signature';

// ============================================
// Builders de XML
// ============================================

/**
 * Gera timestamp no formato ISO para eventos
 */
function getEventoTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '-03:00');
}

/**
 * Constroi o XML do evento de manifestacao
 */
function buildEventoXml(params: ManifestacaoParams): { xml: string; eventoId: string } {
  const {
    ambiente,
    chNFe,
    cnpjDestinatario,
    tipoEvento,
    justificativa,
    sequencia = 1,
  } = params;

  const tpAmb = getAmbienteCode(ambiente);
  const dhEvento = getEventoTimestamp();
  const eventoId = gerarEventoId(tipoEvento, chNFe, sequencia);
  const descEvento = MANIFESTACAO_DESCRICOES[tipoEvento];

  // Valida justificativa para Operacao nao Realizada
  if (tipoEvento === '210240') {
    if (!justificativa || justificativa.length < 15 || justificativa.length > 255) {
      throw new SefazError(
        'Justificativa obrigatoria para Operacao nao Realizada (15-255 caracteres)',
        'INVALID_PARAMS'
      );
    }
  }

  // Monta detEvento com ou sem justificativa
  const detEventoContent =
    tipoEvento === '210240' && justificativa
      ? `<descEvento>${descEvento}</descEvento><xJust>${escapeXml(justificativa)}</xJust>`
      : `<descEvento>${descEvento}</descEvento>`;

  const eventoXml = `
<evento xmlns="${XML_NAMESPACES.nfe}" versao="${SCHEMA_VERSIONS.evento}">
  <infEvento Id="${eventoId}">
    <cOrgao>${UF_CODES.AN}</cOrgao>
    <tpAmb>${tpAmb}</tpAmb>
    <CNPJ>${cnpjDestinatario}</CNPJ>
    <chNFe>${chNFe}</chNFe>
    <dhEvento>${dhEvento}</dhEvento>
    <tpEvento>${tipoEvento}</tpEvento>
    <nSeqEvento>${sequencia}</nSeqEvento>
    <verEvento>${SCHEMA_VERSIONS.evento}</verEvento>
    <detEvento versao="${SCHEMA_VERSIONS.evento}">
      ${detEventoContent}
    </detEvento>
  </infEvento>
</evento>`.trim();

  return { xml: eventoXml, eventoId };
}

/**
 * Constroi o lote de eventos
 */
function buildEnvEventoXml(eventoAssinado: string, idLote: string): string {
  return `
<envEvento xmlns="${XML_NAMESPACES.nfe}" versao="${SCHEMA_VERSIONS.evento}">
  <idLote>${idLote}</idLote>
  ${eventoAssinado}
</envEvento>`.trim();
}

/**
 * Constroi o body do SOAP
 */
function buildSoapBody(envEventoXml: string): string {
  return `
<nfeRecepcaoEvento xmlns="${SOAP_NAMESPACES.nfeEvento}">
  <nfeDadosMsg>
    ${envEventoXml}
  </nfeDadosMsg>
</nfeRecepcaoEvento>`.trim();
}

/**
 * Gera ID do lote baseado em timestamp
 */
function gerarIdLote(): string {
  return Date.now().toString().slice(-15).padStart(15, '0');
}

// ============================================
// Parser de Resposta
// ============================================

/**
 * Processa a resposta do evento de manifestacao
 */
function parseManifestacaoResponse(
  soapResponse: string,
  params: ManifestacaoParams
): ManifestacaoResponse {
  try {
    const body = extractSoapBody(soapResponse);

    // Tenta extrair do retEvento
    const cStat = extractTagValue(body, 'cStat') ?? '';
    const xMotivo = extractTagValue(body, 'xMotivo') ?? '';
    const nProt = extractTagValue(body, 'nProt');
    const dhRegEvento = extractTagValue(body, 'dhRegEvento');

    // Verifica se foi sucesso
    const sucesso = cStat === SEFAZ_STATUS.EVENTO_REGISTRADO ||
                    cStat === SEFAZ_STATUS.EVENTO_REGISTRADO_NAO_VINCULADO;

    return {
      sucesso,
      chNFe: params.chNFe,
      tipoEvento: params.tipoEvento,
      descricaoEvento: MANIFESTACAO_DESCRICOES[params.tipoEvento],
      sequencia: params.sequencia ?? 1,
      dhRegEvento: dhRegEvento ? new Date(dhRegEvento) : undefined,
      nProt,
      cStat,
      xMotivo,
      erro: sucesso
        ? undefined
        : {
            codigo: cStat,
            mensagem: xMotivo,
          },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new SefazError(`Erro ao processar resposta de manifestacao: ${message}`, 'PARSE_ERROR');
  }
}

// ============================================
// Servico Principal
// ============================================

/**
 * Envia evento de manifestacao do destinatario
 */
export async function enviarManifestacao(
  params: ManifestacaoParams
): Promise<ManifestacaoResponse> {
  const { ambiente, certificado } = params;

  // Valida parametros
  validateParams(params);

  // Constroi o XML do evento
  const { xml: eventoXml, eventoId } = buildEventoXml(params);

  // Assina o evento
  const eventoAssinado = signXml(eventoXml, certificado, {
    referenceUri: `#${eventoId}`,
  });

  // Monta o lote
  const idLote = gerarIdLote();
  const envEventoXml = buildEnvEventoXml(eventoAssinado, idLote);

  // Cria cliente SOAP
  const soapClient = new SoapClient({ certificado });
  const soapBody = buildSoapBody(envEventoXml);

  // Envia requisicao
  const endpoint = getNFeEventoEndpoint(ambiente);
  const response = await soapClient.send(endpoint, {
    action: SOAP_ACTIONS.nfeRecepcaoEvento,
    body: soapBody,
    namespace: SOAP_NAMESPACES.nfeEvento,
  });

  // Processa resposta
  return parseManifestacaoResponse(response.body, params);
}

// ============================================
// Helpers para cada tipo de manifestacao
// ============================================

/**
 * Confirma a operacao (210200)
 * Indica que a operacao foi realizada conforme a NFe
 */
export async function confirmarOperacao(
  ambiente: SefazAmbiente,
  chNFe: string,
  cnpjDestinatario: string,
  certificado: CertificadoA1
): Promise<ManifestacaoResponse> {
  return enviarManifestacao({
    ambiente,
    chNFe,
    cnpjDestinatario,
    tipoEvento: '210200',
    certificado,
  });
}

/**
 * Registra ciencia da emissao (210210)
 * Indica que o destinatario tomou conhecimento da NFe
 * Este evento permite baixar a NFe completa
 */
export async function registrarCiencia(
  ambiente: SefazAmbiente,
  chNFe: string,
  cnpjDestinatario: string,
  certificado: CertificadoA1
): Promise<ManifestacaoResponse> {
  return enviarManifestacao({
    ambiente,
    chNFe,
    cnpjDestinatario,
    tipoEvento: '210210',
    certificado,
  });
}

/**
 * Declara desconhecimento da operacao (210220)
 * Indica que o destinatario nao reconhece a NFe
 */
export async function desconhecerOperacao(
  ambiente: SefazAmbiente,
  chNFe: string,
  cnpjDestinatario: string,
  certificado: CertificadoA1
): Promise<ManifestacaoResponse> {
  return enviarManifestacao({
    ambiente,
    chNFe,
    cnpjDestinatario,
    tipoEvento: '210220',
    certificado,
  });
}

/**
 * Declara operacao nao realizada (210240)
 * Indica que a operacao nao foi realizada (requer justificativa)
 */
export async function operacaoNaoRealizada(
  ambiente: SefazAmbiente,
  chNFe: string,
  cnpjDestinatario: string,
  certificado: CertificadoA1,
  justificativa: string
): Promise<ManifestacaoResponse> {
  return enviarManifestacao({
    ambiente,
    chNFe,
    cnpjDestinatario,
    tipoEvento: '210240',
    justificativa,
    certificado,
  });
}

// ============================================
// Validacoes
// ============================================

function validateParams(params: ManifestacaoParams): void {
  const { chNFe, cnpjDestinatario, tipoEvento, justificativa } = params;

  // Valida chave
  if (!/^\d{44}$/.test(chNFe)) {
    throw new SefazError('Chave de acesso deve ter 44 digitos', 'INVALID_PARAMS');
  }

  // Valida CNPJ
  if (!/^\d{14}$/.test(cnpjDestinatario)) {
    throw new SefazError('CNPJ do destinatario deve ter 14 digitos', 'INVALID_PARAMS');
  }

  // Valida tipo de evento
  const tiposValidos: TipoEventoManifestacao[] = ['210200', '210210', '210220', '210240'];
  if (!tiposValidos.includes(tipoEvento)) {
    throw new SefazError(`Tipo de evento invalido: ${tipoEvento}`, 'INVALID_PARAMS');
  }

  // Valida justificativa para 210240
  if (tipoEvento === '210240') {
    if (!justificativa) {
      throw new SefazError(
        'Justificativa e obrigatoria para Operacao nao Realizada',
        'INVALID_PARAMS'
      );
    }
    if (justificativa.length < 15 || justificativa.length > 255) {
      throw new SefazError(
        'Justificativa deve ter entre 15 e 255 caracteres',
        'INVALID_PARAMS'
      );
    }
  }
}

/**
 * Escapa caracteres especiais XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
