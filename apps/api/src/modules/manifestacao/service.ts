import { eq, and, sql, desc, isNull } from 'drizzle-orm';
import { db } from '../../config/database';
import { documents, companies, documentEvents } from '@fiscalzen/database/schema';
import { NotFoundError, ValidationError, ExternalServiceError } from '../../utils/errors';
import {
  registrarCiencia,
  confirmarOperacao,
  desconhecerOperacao,
  operacaoNaoRealizada,
  type CertificadoA1,
  type SefazAmbiente,
} from '@fiscalzen/sefaz-client';
import { env } from '../../config/env';
import type { PendentesQuery } from './schemas';

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

  return company;
}

async function recordManifestacao(
  documentId: string,
  tipoEvento: string,
  descEvento: string,
  nProt: string | undefined,
  cStat: string,
  xMotivo: string
) {
  // Insert event record
  await db.insert(documentEvents).values({
    documentId,
    tpEvento: tipoEvento,
    descEvento,
    nProt,
    cStat,
    xMotivo,
    dhEvento: new Date(),
    dhRegEvento: new Date(),
  });

  // Update document manifestacao status
  await db
    .update(documents)
    .set({
      manifestacao: tipoEvento,
      manifestacaoData: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));
}

export const manifestacaoService = {
  async registrarCiencia(tenantId: string, companyId: string, chNFe: string) {
    const company = await getCompanyWithCertificate(tenantId, companyId);

    // Find document
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.chave, chNFe), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento');
    }

    const certificado: CertificadoA1 = {
      pfxBuffer: company.certificate!,
      password: company.certificatePassword!,
    };

    const ambiente: SefazAmbiente = env.SEFAZ_AMBIENTE;

    try {
      const result = await registrarCiencia(ambiente, chNFe, company.cnpj, certificado);

      if (!result.sucesso) {
        throw new ExternalServiceError('SEFAZ', result.xMotivo);
      }

      await recordManifestacao(
        document.id,
        '210210',
        'Ciencia da Operacao',
        result.nProt ?? undefined,
        result.cStat,
        result.xMotivo
      );

      return {
        success: true,
        chNFe,
        tipoEvento: '210210',
        descricao: 'Ciencia da Operacao',
        protocolo: result.nProt,
        dataRegistro: result.dhRegEvento,
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new ExternalServiceError('SEFAZ', message);
    }
  },

  async confirmarOperacao(tenantId: string, companyId: string, chNFe: string) {
    const company = await getCompanyWithCertificate(tenantId, companyId);

    const document = await db.query.documents.findFirst({
      where: and(eq(documents.chave, chNFe), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento');
    }

    const certificado: CertificadoA1 = {
      pfxBuffer: company.certificate!,
      password: company.certificatePassword!,
    };

    const ambiente: SefazAmbiente = env.SEFAZ_AMBIENTE;

    try {
      const result = await confirmarOperacao(ambiente, chNFe, company.cnpj, certificado);

      if (!result.sucesso) {
        throw new ExternalServiceError('SEFAZ', result.xMotivo);
      }

      await recordManifestacao(
        document.id,
        '210200',
        'Confirmacao da Operacao',
        result.nProt ?? undefined,
        result.cStat,
        result.xMotivo
      );

      return {
        success: true,
        chNFe,
        tipoEvento: '210200',
        descricao: 'Confirmacao da Operacao',
        protocolo: result.nProt,
        dataRegistro: result.dhRegEvento,
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new ExternalServiceError('SEFAZ', message);
    }
  },

  async desconhecerOperacao(tenantId: string, companyId: string, chNFe: string) {
    const company = await getCompanyWithCertificate(tenantId, companyId);

    const document = await db.query.documents.findFirst({
      where: and(eq(documents.chave, chNFe), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento');
    }

    const certificado: CertificadoA1 = {
      pfxBuffer: company.certificate!,
      password: company.certificatePassword!,
    };

    const ambiente: SefazAmbiente = env.SEFAZ_AMBIENTE;

    try {
      const result = await desconhecerOperacao(ambiente, chNFe, company.cnpj, certificado);

      if (!result.sucesso) {
        throw new ExternalServiceError('SEFAZ', result.xMotivo);
      }

      await recordManifestacao(
        document.id,
        '210220',
        'Desconhecimento da Operacao',
        result.nProt ?? undefined,
        result.cStat,
        result.xMotivo
      );

      return {
        success: true,
        chNFe,
        tipoEvento: '210220',
        descricao: 'Desconhecimento da Operacao',
        protocolo: result.nProt,
        dataRegistro: result.dhRegEvento,
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new ExternalServiceError('SEFAZ', message);
    }
  },

  async operacaoNaoRealizada(
    tenantId: string,
    companyId: string,
    chNFe: string,
    justificativa: string
  ) {
    const company = await getCompanyWithCertificate(tenantId, companyId);

    const document = await db.query.documents.findFirst({
      where: and(eq(documents.chave, chNFe), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento');
    }

    const certificado: CertificadoA1 = {
      pfxBuffer: company.certificate!,
      password: company.certificatePassword!,
    };

    const ambiente: SefazAmbiente = env.SEFAZ_AMBIENTE;

    try {
      const result = await operacaoNaoRealizada(
        ambiente,
        chNFe,
        company.cnpj,
        certificado,
        justificativa
      );

      if (!result.sucesso) {
        throw new ExternalServiceError('SEFAZ', result.xMotivo);
      }

      await recordManifestacao(
        document.id,
        '210240',
        'Operacao nao Realizada',
        result.nProt ?? undefined,
        result.cStat,
        result.xMotivo
      );

      return {
        success: true,
        chNFe,
        tipoEvento: '210240',
        descricao: 'Operacao nao Realizada',
        protocolo: result.nProt,
        dataRegistro: result.dhRegEvento,
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new ExternalServiceError('SEFAZ', message);
    }
  },

  async getPendentes(tenantId: string, query: PendentesQuery) {
    const { page, limit, companyId } = query;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(documents.tenantId, tenantId),
      eq(documents.docType, 'NFE'),
      isNull(documents.manifestacao),
    ];

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
          emitRazaoSocial: documents.emitRazaoSocial,
          emitCnpj: documents.emitCnpj,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.dataEmissao))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(...conditions)),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  },
};
