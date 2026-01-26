import type {
    SefazAmbiente,
    CertificadoA1,
} from '../types';
import { SefazError } from '../types';
import { SEFAZ_STATUS } from '../constants';
import { SoapClient, extractSoapBody, extractTagValue } from '../soap-client';
import {
    getCTeEventoEndpoint,
    SOAP_ACTIONS,
    SOAP_NAMESPACES,
    SCHEMA_VERSIONS,
    getAmbienteCode,
    UF_CODES,
    XML_NAMESPACES,
} from '../constants/endpoints';
import { signXml, gerarEventoId } from '../signature';

export interface CTeDesacordoParams {
    ambiente: SefazAmbiente;
    chCTe: string;
    cnpjTomador: string; // CNPJ do autor (Tomador do servico)
    observacao: string; // xObs, 15-255 chars
    indDesacordoOper: '1' | '2' | '3' | '4'; // 1-Servico nao prestado, 2-Dados incorretos, 3-Valor divergente, 4-Outros
    certificado: CertificadoA1;
    sequencia?: number;
}

export interface CTeEventoResponse {
    sucesso: boolean;
    chCTe: string;
    tipoEvento: string;
    cStat: string;
    xMotivo: string;
    dhRegEvento?: Date;
    nProt?: string;
    erro?: {
        codigo: string;
        mensagem: string;
    };
}

const TIPO_EVENTO_DESACORDO = '610110';
const DESC_EVENTO_DESACORDO = 'Prestacao do Servico em Desacordo';

function getEventoTimestamp(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '-03:00');
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildEventoXml(params: CTeDesacordoParams): { xml: string; eventoId: string } {
    const {
        ambiente,
        chCTe,
        cnpjTomador,
        observacao,
        indDesacordoOper,
        sequencia = 1,
    } = params;

    if (observacao.length < 15 || observacao.length > 255) {
        throw new SefazError('Observacao deve ter entre 15 e 255 caracteres', 'INVALID_PARAMS');
    }

    const tpAmb = getAmbienteCode(ambiente);
    const dhEvento = getEventoTimestamp();
    const eventoId = gerarEventoId(TIPO_EVENTO_DESACORDO, chCTe, sequencia);

    // O XML namespace principal eh o do cte
    // Mas dentro de detEvento, evPrestDesacordo tem seu proprio namespace ou herda
    // A estrutura padrao para CT-e 4.00 (ou 3.00) usa namespaces especificos.
    // Vamos usar o padrao observado: namespace cte na raiz do evento.

    const eventoXml = `
<evento xmlns="${XML_NAMESPACES.cte}" versao="${SCHEMA_VERSIONS.cte}">
  <infEvento Id="${eventoId}">
    <cOrgao>${UF_CODES.AN}</cOrgao>
    <tpAmb>${tpAmb}</tpAmb>
    <CNPJ>${cnpjTomador}</CNPJ>
    <chCTe>${chCTe}</chCTe>
    <dhEvento>${dhEvento}</dhEvento>
    <tpEvento>${TIPO_EVENTO_DESACORDO}</tpEvento>
    <nSeqEvento>${sequencia}</nSeqEvento>
    <detEvento versao="${SCHEMA_VERSIONS.cte}">
      <evPrestDesacordo xmlns="${XML_NAMESPACES.cte}">
        <descEvento>${DESC_EVENTO_DESACORDO}</descEvento>
        <indDesacordoOper>${indDesacordoOper}</indDesacordoOper>
        <xObs>${escapeXml(observacao)}</xObs>
      </evPrestDesacordo>
    </detEvento>
  </infEvento>
</evento>`.trim();

    return { xml: eventoXml, eventoId };
}

function buildEnvEventoXml(eventoAssinado: string, idLote: string): string {
    return `
<eventoCTe xmlns="${XML_NAMESPACES.cte}" versao="${SCHEMA_VERSIONS.cte}">
  <idLote>${idLote}</idLote>
  ${eventoAssinado}
</eventoCTe>`.trim();
}

function buildSoapBody(envEventoXml: string): string {
    return `
<cteDadosMsg xmlns="${SOAP_NAMESPACES.cteEvento}">
  ${envEventoXml}
</cteDadosMsg>`.trim();
}

function gerarIdLote(): string {
    return Date.now().toString().slice(-15).padStart(15, '0');
}

function parseResponse(soapResponse: string, params: CTeDesacordoParams): CTeEventoResponse {
    try {
        const body = extractSoapBody(soapResponse);
        /*
          <retEventoCTe>
            <infEvento>
              <cStat>...</cStat>
              <xMotivo>...</xMotivo>
              ...
            </infEvento>
          </retEventoCTe>
        */
        const cStat = extractTagValue(body, 'cStat') ?? '';
        const xMotivo = extractTagValue(body, 'xMotivo') ?? '';
        const nProt = extractTagValue(body, 'nProt');
        const dhRegEvento = extractTagValue(body, 'dhRegEvento');

        const sucesso = cStat === SEFAZ_STATUS.EVENTO_REGISTRADO ||
            cStat === SEFAZ_STATUS.EVENTO_REGISTRADO_NAO_VINCULADO;

        return {
            sucesso,
            chCTe: params.chCTe,
            tipoEvento: TIPO_EVENTO_DESACORDO,
            cStat,
            xMotivo,
            nProt: nProt ?? undefined,
            dhRegEvento: dhRegEvento ? new Date(dhRegEvento) : undefined,
            erro: sucesso ? undefined : { codigo: cStat, mensagem: xMotivo }
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new SefazError(`Erro ao processar resposta CTe Evento: ${message}`, 'PARSE_ERROR');
    }
}

export async function registrarDesacordoCTe(params: CTeDesacordoParams): Promise<CTeEventoResponse> {
    const { ambiente, certificado } = params;

    if (!/^\d{44}$/.test(params.chCTe)) {
        throw new SefazError('Chave de acesso deve ter 44 digitos', 'INVALID_PARAMS');
    }

    const { xml, eventoId } = buildEventoXml(params);

    const eventoAssinado = signXml(xml, certificado, {
        referenceUri: `#${eventoId}`,
    });

    const idLote = gerarIdLote();
    // Nota: Para CTe o envelope de envio costuma ser <eventoCTe> ou <distDFeInt> dependendo da acao.
    // Para evento eh <eventoCTe> no SOAP Body.
    const envEventoXml = buildEnvEventoXml(eventoAssinado, idLote);

    const soapClient = new SoapClient({ certificado });
    // O SOAP Action e body envelope devem bater com CTeRecepcaoEvento
    const soapBody = `
<cteRecepcaoEvento xmlns="${SOAP_NAMESPACES.cteEvento}">
  <cteDadosMsg>${envEventoXml}</cteDadosMsg>
</cteRecepcaoEvento>`.trim();

    // Correction: buildSoapBody above was slightly different, deciding to use inline here for clarity or reuse helper?
    // I will use manual construction here to match exactly what is needed for CTeRecepcaoEvento

    const endpoint = getCTeEventoEndpoint(ambiente);
    const response = await soapClient.send(endpoint, {
        action: SOAP_ACTIONS.cteRecepcaoEvento,
        body: soapBody,
        namespace: SOAP_NAMESPACES.cteEvento,
    });

    return parseResponse(response.body, params);
}
