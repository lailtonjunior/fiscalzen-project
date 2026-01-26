// ============================================
// Event Query Service
// ============================================
// Servico para consulta de eventos fiscais via DistDFe
// Os eventos (cancelamentos, CCe, manifestacoes) sao retornados
// pelo mesmo servico de distribuicao de documentos

import type { SefazAmbiente, CertificadoA1, DocumentoDistDFe } from '../types';
import { consultarDistDFe } from './nfe-distdfe';
import { consultarCTeDistDFe } from './cte-distdfe';
import {
  parseResEvento,
  parseProcEventoNFe,
  isResEvento,
  isProcEventoNFe,
  type ResEventoData,
  type ProcEventoNFeData,
} from '@fiscalzen/xml-parser';

// ============================================
// Types
// ============================================

export interface ConsultarEventosParams {
  cnpj: string;
  certificado: CertificadoA1;
  ambiente: SefazAmbiente;
  ultNSU?: string;
  tiposDocumento?: ('NFE' | 'CTE')[];
  ufAutor?: number;
}

export interface EventoConsultado {
  nsu: string;
  chave: string;
  tipoEvento: string;
  descricaoEvento: string;
  dataEvento: Date;
  protocolo?: string;
  cnpjCpf?: string;
  sequencia?: number;
  docType: 'NFE' | 'CTE';
  xmlOriginal: string;
}

export interface ConsultarEventosResponse {
  sucesso: boolean;
  eventos: EventoConsultado[];
  ultNSU: string;
  maxNSU: string;
  temMais: boolean;
  erro?: { codigo: string; mensagem: string };
}

// ============================================
// Main Service Function
// ============================================

/**
 * Consulta eventos fiscais (cancelamentos, CCe, manifestacoes)
 * via servico DistDFe da SEFAZ.
 *
 * A SEFAZ nao possui um servico separado para eventos.
 * Os eventos sao retornados pelo mesmo servico DistDFe,
 * marcados com isEvento=true.
 */
export async function consultarEventos(
  params: ConsultarEventosParams
): Promise<ConsultarEventosResponse> {
  const {
    cnpj,
    certificado,
    ambiente,
    ultNSU = '0',
    tiposDocumento = ['NFE', 'CTE'],
    ufAutor,
  } = params;

  const eventos: EventoConsultado[] = [];
  let lastNSU = ultNSU;
  let maxNSU = '0';
  let hasMore = false;
  let lastError: { codigo: string; mensagem: string } | undefined;

  // Consultar NFe DistDFe
  if (tiposDocumento.includes('NFE')) {
    try {
      const nfeResponse = await consultarDistDFe({
        ambiente,
        cnpj,
        certificado,
        ultNSU,
        ufAutor,
      });

      if (nfeResponse.sucesso) {
        // Filtrar apenas eventos
        const eventDocs = nfeResponse.documentos.filter((d) => d.isEvento);

        for (const doc of eventDocs) {
          const evento = parseEventDocument(doc, 'NFE');
          if (evento) {
            eventos.push(evento);
          }
        }

        // Atualizar controle de NSU
        if (nfeResponse.ultNSU > lastNSU) {
          lastNSU = nfeResponse.ultNSU;
        }
        if (nfeResponse.maxNSU > maxNSU) {
          maxNSU = nfeResponse.maxNSU;
        }
        hasMore = hasMore || nfeResponse.ultNSU < nfeResponse.maxNSU;
      } else if (nfeResponse.erro) {
        lastError = nfeResponse.erro;
      }
    } catch (err) {
      console.warn('Erro ao consultar eventos NFe:', err);
    }
  }

  // Consultar CTe DistDFe
  if (tiposDocumento.includes('CTE')) {
    try {
      const cteResponse = await consultarCTeDistDFe({
        ambiente,
        cnpj,
        certificado,
        ultNSU,
        ufAutor,
      });

      if (cteResponse.sucesso) {
        // Filtrar apenas eventos
        const eventDocs = cteResponse.documentos.filter((d) => d.isEvento);

        for (const doc of eventDocs) {
          const evento = parseEventDocument(doc, 'CTE');
          if (evento) {
            eventos.push(evento);
          }
        }

        // Atualizar controle de NSU
        if (cteResponse.ultNSU > lastNSU) {
          lastNSU = cteResponse.ultNSU;
        }
        if (cteResponse.maxNSU > maxNSU) {
          maxNSU = cteResponse.maxNSU;
        }
        hasMore = hasMore || cteResponse.ultNSU < cteResponse.maxNSU;
      } else if (cteResponse.erro && !lastError) {
        lastError = cteResponse.erro;
      }
    } catch (err) {
      console.warn('Erro ao consultar eventos CTe:', err);
    }
  }

  // Ordenar eventos por NSU
  eventos.sort((a, b) => a.nsu.localeCompare(b.nsu));

  return {
    sucesso: eventos.length > 0 || !lastError,
    eventos,
    ultNSU: lastNSU,
    maxNSU,
    temMais: hasMore,
    erro: eventos.length === 0 ? lastError : undefined,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parseia um documento de evento e retorna estrutura padronizada
 */
function parseEventDocument(
  doc: DocumentoDistDFe,
  docType: 'NFE' | 'CTE'
): EventoConsultado | null {
  try {
    // Tentar parsear como resEvento
    if (isResEvento(doc.xml)) {
      const parsed = parseResEvento(doc.xml);
      return mapResEventoToEvento(doc.nsu, parsed, docType, doc.xml);
    }

    // Tentar parsear como procEventoNFe
    if (isProcEventoNFe(doc.xml)) {
      const parsed = parseProcEventoNFe(doc.xml);
      return mapProcEventoToEvento(doc.nsu, parsed, docType, doc.xml);
    }

    // Schema desconhecido mas marcado como evento
    console.warn(`Evento com schema desconhecido: ${doc.schema}`);
    return null;
  } catch (err) {
    console.warn(`Erro ao parsear evento NSU ${doc.nsu}:`, err);
    return null;
  }
}

/**
 * Mapeia ResEventoData para EventoConsultado
 */
function mapResEventoToEvento(
  nsu: string,
  parsed: ResEventoData,
  docType: 'NFE' | 'CTE',
  xml: string
): EventoConsultado {
  return {
    nsu,
    chave: parsed.chave,
    tipoEvento: parsed.tipoEvento,
    descricaoEvento: parsed.descricaoEvento,
    dataEvento: parsed.dataEvento,
    protocolo: parsed.protocolo,
    cnpjCpf: parsed.cnpjCpf,
    sequencia: parsed.sequencia,
    docType,
    xmlOriginal: xml,
  };
}

/**
 * Mapeia ProcEventoNFeData para EventoConsultado
 */
function mapProcEventoToEvento(
  nsu: string,
  parsed: ProcEventoNFeData,
  docType: 'NFE' | 'CTE',
  xml: string
): EventoConsultado {
  return {
    nsu,
    chave: parsed.evento.chave,
    tipoEvento: parsed.evento.tipoEvento,
    descricaoEvento: parsed.retorno.descricaoEvento || parsed.evento.descricaoEvento || 'Evento',
    dataEvento: parsed.evento.dataEvento,
    protocolo: parsed.retorno.protocolo,
    cnpjCpf: parsed.evento.cnpjCpf,
    sequencia: parsed.evento.sequencia,
    docType,
    xmlOriginal: xml,
  };
}
