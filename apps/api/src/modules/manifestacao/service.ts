import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { companies, documentHistory, documentEvents, documents } from '@fiscalzen/database/schema';
import { NotFoundError, ValidationError, ExternalServiceError } from '../../utils/errors';
import {
  confirmarOperacao,
  desconhecerOperacao,
  operacaoNaoRealizada,
  registrarCiencia,
  registrarDesacordoCTe,
  type CertificadoA1,
  type SefazAmbiente,
} from '@fiscalzen/sefaz-client';
import { env } from '../../config/env';
import type {
  ManifestacaoHistoryQuery,
  ManifestacaoSubmitInput,
  ManifestacaoTipoInput,
  PendentesQuery,
} from './schemas';
import { historyService } from '../history/service';
import { certificateCrypto } from '../companies/crypto.service';

const FINAL_MANIFESTACOES = new Set<ManifestacaoTipoInput>(['210200', '210220', '210240']);
const AWAITING_FINAL_MANIFESTACAO = '210210';

const manifestacaoConfig: Record<
  ManifestacaoTipoInput,
  {
    description: string;
    sourceLabel: string;
    execute: (params: {
      ambiente: SefazAmbiente;
      chNFe: string;
      cnpj: string;
      certificado: CertificadoA1;
      justificativa?: string;
    }) => Promise<{ sucesso: boolean; nProt?: string; cStat: string; xMotivo: string; dhRegEvento?: string }>;
  }
> = {
  '210200': {
    description: 'Confirmacao da Operacao',
    sourceLabel: 'confirmacao_operacao',
    execute: ({ ambiente, chNFe, cnpj, certificado }) =>
      confirmarOperacao(ambiente, chNFe, cnpj, certificado),
  },
  '210210': {
    description: 'Ciencia da Operacao',
    sourceLabel: 'ciencia_operacao',
    execute: ({ ambiente, chNFe, cnpj, certificado }) =>
      registrarCiencia(ambiente, chNFe, cnpj, certificado),
  },
  '210220': {
    description: 'Desconhecimento da Operacao',
    sourceLabel: 'desconhecimento_operacao',
    execute: ({ ambiente, chNFe, cnpj, certificado }) =>
      desconhecerOperacao(ambiente, chNFe, cnpj, certificado),
  },
  '210240': {
    description: 'Operacao nao Realizada',
    sourceLabel: 'operacao_nao_realizada',
    execute: ({ ambiente, chNFe, cnpj, certificado, justificativa }) =>
      operacaoNaoRealizada(ambiente, chNFe, cnpj, certificado, justificativa ?? ''),
  },
};

async function getCompanyWithCertificate(tenantId: string, companyId: string) {
  const company = await db.query.companies.findFirst({
    where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
  });

  if (!company) {
    throw new NotFoundError('Empresa', companyId);
  }

  if (!company.certificate || !company.certificatePassword) {
    throw new ValidationError('Empresa nao possui certificado digital configurado');
  }

  if (company.certificateExpiry && company.certificateExpiry < new Date()) {
    throw new ValidationError('Certificado digital expirado');
  }

  const certificado: CertificadoA1 = {
    pfxBuffer: certificateCrypto.decrypt(company.certificate as string),
    password: certificateCrypto.decryptPassword(company.certificatePassword),
  };

  return { company, certificado };
}

async function getDocumentForManifestacao(tenantId: string, documentId: string) {
  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
  });

  if (!document) {
    throw new NotFoundError('Documento', documentId);
  }

  if (document.docType !== 'NFE') {
    throw new ValidationError('Manifestacao do destinatario esta disponivel apenas para NF-e');
  }

  return document;
}

function assertManifestacaoAllowed(currentManifestacao: string | null, nextTipo: ManifestacaoTipoInput) {
  if (currentManifestacao && FINAL_MANIFESTACOES.has(currentManifestacao as ManifestacaoTipoInput)) {
    throw new ValidationError('Este documento ja possui manifestacao final registrada');
  }

  if (currentManifestacao === AWAITING_FINAL_MANIFESTACAO && nextTipo === AWAITING_FINAL_MANIFESTACAO) {
    throw new ValidationError('A ciencia da operacao ja foi registrada para este documento');
  }
}

async function logManifestacaoEvent(params: {
  tenantId: string;
  documentId: string;
  companyId: string;
  userId?: string;
  eventType: string;
  title: string;
  summary: string;
  tipo: string;
  protocol?: string | null;
  cStat?: string | null;
  xMotivo?: string | null;
  error?: string | null;
  createdAt?: Date;
}) {
  const correlationId = `${params.documentId}:${params.tipo}:${params.protocol ?? 'sem-protocolo'}`;

  await historyService.registerEvent({
    tenantId: params.tenantId,
    documentId: params.documentId,
    companyId: params.companyId,
    userId: params.userId ?? null,
    eventType: params.eventType,
    source: 'manifestacao',
    title: params.title,
    summary: params.summary,
    details: {
      tipoManifestacao: params.tipo,
      protocolo: params.protocol ?? null,
      cStat: params.cStat ?? null,
      xMotivo: params.xMotivo ?? null,
      error: params.error ?? null,
      sourceId: params.documentId,
      correlationId,
    },
    createdAt: params.createdAt,
  });
}

async function recordManifestacao(params: {
  tenantId: string;
  companyId: string;
  userId?: string;
  documentId: string;
  tipo: string;
  descricao: string;
  protocol?: string;
  cStat: string;
  xMotivo: string;
  createdAt?: Date;
  justificativa?: string;
}) {
  const eventDate = params.createdAt ?? new Date();

  const existingEvent = await db.query.documentEvents.findFirst({
    where: and(
      eq(documentEvents.documentId, params.documentId),
      eq(documentEvents.eventType, params.tipo),
      eq(documentEvents.eventSeq, 1)
    ),
  });

  if (!existingEvent) {
    await db.insert(documentEvents).values({
      documentId: params.documentId,
      eventType: params.tipo,
      description: params.descricao,
      eventSeq: 1,
      eventDate,
      protocol: params.protocol,
      metadata: {
        cStat: params.cStat,
        xMotivo: params.xMotivo,
        justificativa: params.justificativa ?? null,
      },
    });
  }

  await db
    .update(documents)
    .set({
      manifestacao: params.tipo,
      manifestacaoData: eventDate,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, params.documentId));

  await logManifestacaoEvent({
    tenantId: params.tenantId,
    documentId: params.documentId,
    companyId: params.companyId,
    userId: params.userId,
    eventType: 'manifestacao.completed',
    title: 'Manifestacao concluida',
    summary: params.descricao,
    tipo: params.tipo,
    protocol: params.protocol ?? null,
    cStat: params.cStat,
    xMotivo: params.xMotivo,
    createdAt: eventDate,
  });
}

async function executeManifestacao(params: {
  tenantId: string;
  companyId: string;
  userId?: string;
  chNFe: string;
  tipo: ManifestacaoTipoInput;
  justificativa?: string;
}) {
  const { company, certificado } = await getCompanyWithCertificate(params.tenantId, params.companyId);
  const document = await db.query.documents.findFirst({
    where: and(eq(documents.chave, params.chNFe), eq(documents.tenantId, params.tenantId)),
  });

  if (!document) {
    throw new NotFoundError('Documento');
  }

  if (document.companyId !== params.companyId) {
    throw new ValidationError('Documento nao pertence a empresa informada');
  }

  if (!document.chave) {
    throw new ValidationError('Documento sem chave fiscal apta para manifestacao');
  }

  assertManifestacaoAllowed(document.manifestacao ?? null, params.tipo);

  const config = manifestacaoConfig[params.tipo];
  const ambiente: SefazAmbiente = env.SEFAZ_AMBIENTE;

  await logManifestacaoEvent({
    tenantId: params.tenantId,
    documentId: document.id,
    companyId: company.id,
    userId: params.userId,
    eventType: 'manifestacao.requested',
    title: 'Manifestacao solicitada',
    summary: `${config.description} enviada para processamento`,
    tipo: params.tipo,
  });

  try {
    const result = await config.execute({
      ambiente,
      chNFe: params.chNFe,
      cnpj: company.cnpj,
      certificado,
      justificativa: params.justificativa,
    });

    if (!result.sucesso) {
      throw new ExternalServiceError('SEFAZ', result.xMotivo);
    }

    await recordManifestacao({
      tenantId: params.tenantId,
      companyId: company.id,
      userId: params.userId,
      documentId: document.id,
      tipo: params.tipo,
      descricao: config.description,
      protocol: result.nProt ?? undefined,
      cStat: result.cStat,
      xMotivo: result.xMotivo,
      createdAt: result.dhRegEvento ? new Date(result.dhRegEvento) : undefined,
      justificativa: params.justificativa,
    });

    return {
      documentId: document.id,
      chNFe: params.chNFe,
      tipoEvento: params.tipo,
      tipoManifestacao: config.sourceLabel,
      descricao: config.description,
      status: 'completed' as const,
      protocolo: result.nProt ?? null,
      dataRegistro: result.dhRegEvento ?? null,
      cStat: result.cStat,
      xMotivo: result.xMotivo,
    };
  } catch (error) {
    const message =
      error instanceof ExternalServiceError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Erro desconhecido';

    await logManifestacaoEvent({
      tenantId: params.tenantId,
      documentId: document.id,
      companyId: company.id,
      userId: params.userId,
      eventType: 'manifestacao.failed',
      title: 'Manifestacao com erro',
      summary: `${config.description} falhou no envio ou retorno fiscal`,
      tipo: params.tipo,
      error: message,
    });

    if (error instanceof ExternalServiceError) {
      throw error;
    }

    throw new ExternalServiceError('SEFAZ', message);
  }
}

export const manifestacaoService = {
  registrarCiencia(tenantId: string, companyId: string, chNFe: string, userId?: string) {
    return executeManifestacao({ tenantId, companyId, chNFe, tipo: '210210', userId });
  },

  confirmarOperacao(tenantId: string, companyId: string, chNFe: string, userId?: string) {
    return executeManifestacao({ tenantId, companyId, chNFe, tipo: '210200', userId });
  },

  desconhecerOperacao(tenantId: string, companyId: string, chNFe: string, userId?: string) {
    return executeManifestacao({ tenantId, companyId, chNFe, tipo: '210220', userId });
  },

  operacaoNaoRealizada(
    tenantId: string,
    companyId: string,
    chNFe: string,
    justificativa: string,
    userId?: string
  ) {
    return executeManifestacao({
      tenantId,
      companyId,
      chNFe,
      tipo: '210240',
      justificativa,
      userId,
    });
  },

  async manifestarDocumento(
    tenantId: string,
    documentId: string,
    input: ManifestacaoSubmitInput,
    userId?: string
  ) {
    const document = await getDocumentForManifestacao(tenantId, documentId);
    assertManifestacaoAllowed(document.manifestacao ?? null, input.tipo);

    if (input.tipo === '210240' && !input.justificativa) {
      throw new ValidationError('Justificativa obrigatoria para operacao nao realizada');
    }

    return executeManifestacao({
      tenantId,
      companyId: document.companyId,
      chNFe: document.chave,
      tipo: input.tipo,
      justificativa: input.justificativa,
      userId,
    });
  },

  async registrarDesacordo(
    tenantId: string,
    companyId: string,
    chCTe: string,
    observacao: string,
    indDesacordoOper: '1' | '2' | '3' | '4',
    userId?: string
  ) {
    const { company, certificado } = await getCompanyWithCertificate(tenantId, companyId);
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.chave, chCTe), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento');
    }

    if (document.docType !== 'CTE') {
      throw new ValidationError('Desacordo so e permitido para CTe');
    }

    if (document.statusDesacordo) {
      throw new ValidationError('Este CTe ja possui registro de desacordo');
    }

    if (document.dataAutorizacao) {
      const diasDesdeAutorizacao = Math.ceil(
        Math.abs(new Date().getTime() - new Date(document.dataAutorizacao).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diasDesdeAutorizacao > 45) {
        throw new ValidationError('Prazo para registro de desacordo expirado (45 dias)');
      }
    }

    const ambiente: SefazAmbiente = env.SEFAZ_AMBIENTE;

    await historyService.registerEvent({
      tenantId,
      documentId: document.id,
      companyId: company.id,
      userId: userId ?? null,
      eventType: 'manifestacao.requested',
      source: 'manifestacao',
      title: 'Manifestacao solicitada',
      summary: 'Prestacao em desacordo enviada para processamento',
      details: {
        tipoManifestacao: 'prestacao_desacordo',
        correlationId: `${document.id}:610110`,
        sourceId: document.id,
      },
    });

    try {
      const result = await registrarDesacordoCTe({
        ambiente,
        chCTe,
        cnpjTomador: company.cnpj,
        certificado,
        observacao,
        indDesacordoOper,
      });

      if (!result.sucesso) {
        throw new ExternalServiceError('SEFAZ', result.xMotivo);
      }

      await recordManifestacao({
        tenantId,
        companyId: company.id,
        userId,
        documentId: document.id,
        tipo: '610110',
        descricao: 'Prestacao do Servico em Desacordo',
        protocol: result.nProt ?? undefined,
        cStat: result.cStat,
        xMotivo: result.xMotivo,
        createdAt: result.dhRegEvento ? new Date(result.dhRegEvento) : undefined,
      });

      await db
        .update(documents)
        .set({
          statusDesacordo: indDesacordoOper,
          dataDesacordo: result.dhRegEvento ? new Date(result.dhRegEvento) : new Date(),
          protocoloDesacordo: result.nProt,
          observacaoDesacordo: observacao,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, document.id));

      return {
        success: true,
        chCTe,
        tipoEvento: '610110',
        descricao: 'Prestacao do Servico em Desacordo',
        protocolo: result.nProt,
        dataRegistro: result.dhRegEvento,
      };
    } catch (error) {
      await historyService.registerEvent({
        tenantId,
        documentId: document.id,
        companyId: company.id,
        userId: userId ?? null,
        eventType: 'manifestacao.failed',
        source: 'manifestacao',
        title: 'Manifestacao com erro',
        summary: 'Prestacao em desacordo falhou no envio ou retorno fiscal',
        details: {
          tipoManifestacao: 'prestacao_desacordo',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          correlationId: `${document.id}:610110`,
          sourceId: document.id,
        },
      });

      if (error instanceof ExternalServiceError) throw error;
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new ExternalServiceError('SEFAZ', message);
    }
  },

  async getPendentes(tenantId: string, query: PendentesQuery) {
    const { page, limit, companyId } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(documents.tenantId, tenantId), eq(documents.docType, 'NFE'), isNull(documents.manifestacao)];

    if (companyId) {
      conditions.push(eq(documents.companyId, companyId));
    }

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: documents.id,
          chave: documents.chave,
          numero: documents.numero,
          serie: documents.serie,
          dataEmissao: documents.dataEmissao,
          valorTotal: documents.valorTotal,
          emitRazaoSocial: documents.emitRazao,
          emitCnpj: documents.emitCnpj,
          companyId: documents.companyId,
          nsu: documents.nsu,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.dataEmissao))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(documents).where(and(...conditions)),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  },

  async getAwaitingFinal(tenantId: string, query: PendentesQuery) {
    const { page, limit, companyId } = query;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(documents.tenantId, tenantId),
      eq(documents.docType, 'NFE'),
      eq(documents.manifestacao, AWAITING_FINAL_MANIFESTACAO),
    ];

    if (companyId) {
      conditions.push(eq(documents.companyId, companyId));
    }

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: documents.id,
          companyId: documents.companyId,
          chave: documents.chave,
          numero: documents.numero,
          serie: documents.serie,
          dataEmissao: documents.dataEmissao,
          valorTotal: documents.valorTotal,
          emitRazaoSocial: documents.emitRazao,
          emitCnpj: documents.emitCnpj,
          manifestacaoData: documents.manifestacaoData,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.manifestacaoData), desc(documents.dataEmissao))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(documents).where(and(...conditions)),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  },

  async getHistory(tenantId: string, query: ManifestacaoHistoryQuery) {
    const { page, limit, companyId } = query;
    const offset = (page - 1) * limit;

    const historyConditions = [
      eq(documentHistory.tenantId, tenantId),
      inArray(documentHistory.eventType, ['manifestacao.completed', 'manifestacao.failed']),
    ];

    if (companyId) {
      historyConditions.push(eq(documentHistory.companyId, companyId));
    }

    const [rows, countResult] = await Promise.all([
      db
        .select({
          historyId: documentHistory.id,
          documentId: documentHistory.documentId,
          companyId: documentHistory.companyId,
          createdAt: documentHistory.createdAt,
          details: documentHistory.details,
          chave: documents.chave,
          numero: documents.numero,
          serie: documents.serie,
          dataEmissao: documents.dataEmissao,
          valorTotal: documents.valorTotal,
          emitRazaoSocial: documents.emitRazao,
          emitCnpj: documents.emitCnpj,
          manifestacao: documents.manifestacao,
        })
        .from(documentHistory)
        .innerJoin(documents, eq(documentHistory.documentId, documents.id))
        .where(and(...historyConditions))
        .orderBy(desc(documentHistory.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(documentHistory).where(and(...historyConditions)),
    ]);

    return {
      items: rows.map((row) => {
        const details = (row.details as Record<string, unknown> | null) ?? {};
        return {
          id: row.historyId,
          document: {
            id: row.documentId!,
            tenantId,
            companyId: row.companyId!,
            chave: row.chave ?? '',
            numero: String(row.numero ?? ''),
            serie: String(row.serie ?? ''),
            docType: 'NFE' as const,
            situacao: 'autorizada' as const,
            dataEmissao: String(row.dataEmissao),
            valorTotal: String(row.valorTotal ?? '0'),
            emitCnpj: row.emitCnpj ?? '',
            emitRazaoSocial: row.emitRazaoSocial ?? '',
            uf: '',
            manifestacao: (details.tipoManifestacao as string | undefined) as any,
            manifestacaoData: row.createdAt?.toISOString(),
            createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
            updatedAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
          },
          tipo: (details.tipoManifestacao as string | undefined) ?? row.manifestacao ?? '210210',
          data: row.createdAt?.toISOString() ?? new Date().toISOString(),
          justificativa: (details.justificativa as string | undefined) ?? undefined,
          status: details.error ? 'failed' : 'completed',
          protocolo: (details.protocolo as string | undefined) ?? undefined,
          erro: (details.error as string | undefined) ?? undefined,
        };
      }),
      total: Number(countResult[0]?.count ?? 0),
    };
  },

  async getCounts(tenantId: string, companyId?: string) {
    const [pending, awaitingFinal] = await Promise.all([
      this.getPendentes(tenantId, { companyId, page: 1, limit: 1 }),
      this.getAwaitingFinal(tenantId, { companyId, page: 1, limit: 1 }),
    ]);

    return {
      pendingCiencia: pending.total,
      awaitingFinal: awaitingFinal.total,
      total: pending.total + awaitingFinal.total,
    };
  },
};
