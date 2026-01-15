import { eq, and, ilike, sql, desc } from 'drizzle-orm';
import { db } from '../../config/database';
import { companies, nsuControl } from '@fiscalzen/database/schema';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { validateCertificado, getCertificadoInfo } from '@fiscalzen/sefaz-client';
import type { CreateCompanyInput, UpdateCompanyInput, ListCompaniesQuery } from './schemas';
import type { CertificadoA1 } from '@fiscalzen/sefaz-client';

export interface CompanyWithNsu {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  ie: string | null;
  ativo: boolean;
  certificateExpiry: Date | null;
  createdAt: Date;
  nsuStatus?: {
    nfe: { lastNsu: string; maxNsu: string | null; lastSync: Date | null };
    cte: { lastNsu: string; maxNsu: string | null; lastSync: Date | null };
    mdfe: { lastNsu: string; maxNsu: string | null; lastSync: Date | null };
  };
}

export const companiesService = {
  async list(tenantId: string, query: ListCompaniesQuery) {
    const { page, limit, ativo, search } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(companies.tenantId, tenantId)];

    if (ativo !== undefined) {
      conditions.push(eq(companies.ativo, ativo));
    }

    if (search) {
      conditions.push(
        sql`(${companies.razaoSocial} ILIKE ${'%' + search + '%'} OR ${companies.cnpj} LIKE ${'%' + search + '%'})`
      );
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(companies)
        .where(and(...conditions))
        .orderBy(desc(companies.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(and(...conditions)),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  },

  async getById(tenantId: string, companyId: string): Promise<CompanyWithNsu> {
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!company) {
      throw new NotFoundError('Empresa', companyId);
    }

    // Get NSU status
    const nsuEntries = await db
      .select()
      .from(nsuControl)
      .where(eq(nsuControl.companyId, companyId));

    const nsuStatus = {
      nfe: { lastNsu: '000000000000000', maxNsu: null as string | null, lastSync: null as Date | null },
      cte: { lastNsu: '000000000000000', maxNsu: null as string | null, lastSync: null as Date | null },
      mdfe: { lastNsu: '000000000000000', maxNsu: null as string | null, lastSync: null as Date | null },
    };

    for (const entry of nsuEntries) {
      if (entry.docType === 'NFE') {
        nsuStatus.nfe = { lastNsu: entry.lastNsu, maxNsu: entry.maxNsu, lastSync: entry.lastSync };
      } else if (entry.docType === 'CTE') {
        nsuStatus.cte = { lastNsu: entry.lastNsu, maxNsu: entry.maxNsu, lastSync: entry.lastSync };
      } else if (entry.docType === 'MDFE') {
        nsuStatus.mdfe = { lastNsu: entry.lastNsu, maxNsu: entry.maxNsu, lastSync: entry.lastSync };
      }
    }

    return {
      ...company,
      nsuStatus,
    };
  },

  async create(tenantId: string, data: CreateCompanyInput) {
    // Check if CNPJ already exists for this tenant
    const existing = await db.query.companies.findFirst({
      where: and(eq(companies.tenantId, tenantId), eq(companies.cnpj, data.cnpj)),
    });

    if (existing) {
      throw new ConflictError(`Empresa com CNPJ ${data.cnpj} ja existe`);
    }

    const [company] = await db
      .insert(companies)
      .values({
        tenantId,
        cnpj: data.cnpj,
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia,
        ie: data.ie,
        im: data.im,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        regimeTributario: data.regimeTributario,
        ativo: data.ativo ?? true,
      })
      .returning();

    // Create NSU control entries
    await db.insert(nsuControl).values([
      { companyId: company.id, docType: 'NFE' },
      { companyId: company.id, docType: 'CTE' },
      { companyId: company.id, docType: 'MDFE' },
    ]);

    return company;
  },

  async update(tenantId: string, companyId: string, data: UpdateCompanyInput) {
    const existing = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundError('Empresa', companyId);
    }

    // Check CNPJ conflict if changing
    if (data.cnpj && data.cnpj !== existing.cnpj) {
      const cnpjExists = await db.query.companies.findFirst({
        where: and(
          eq(companies.tenantId, tenantId),
          eq(companies.cnpj, data.cnpj),
          sql`${companies.id} != ${companyId}`
        ),
      });

      if (cnpjExists) {
        throw new ConflictError(`Empresa com CNPJ ${data.cnpj} ja existe`);
      }
    }

    const [updated] = await db
      .update(companies)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)))
      .returning();

    return updated;
  },

  async delete(tenantId: string, companyId: string) {
    const existing = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundError('Empresa', companyId);
    }

    // Soft delete - just mark as inactive
    await db
      .update(companies)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(companies.id, companyId));
  },

  async uploadCertificate(tenantId: string, companyId: string, pfxBuffer: Buffer, password: string) {
    const existing = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundError('Empresa', companyId);
    }

    // Validate certificate
    const certificado: CertificadoA1 = { pfxBuffer, password };

    const validation = validateCertificado(certificado);
    if (!validation.valid) {
      throw new ValidationError(validation.message);
    }

    // Get certificate info
    const info = getCertificadoInfo(certificado);

    // Verify CNPJ matches
    if (info.cnpj !== existing.cnpj) {
      throw new ValidationError(
        `CNPJ do certificado (${info.cnpj}) nao corresponde ao CNPJ da empresa (${existing.cnpj})`
      );
    }

    // Store certificate (encrypted in production)
    await db
      .update(companies)
      .set({
        certificate: pfxBuffer,
        certificatePassword: password, // Should be encrypted in production
        certificateExpiry: info.validTo,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    return {
      cnpj: info.cnpj,
      razaoSocial: info.razaoSocial,
      validFrom: info.validFrom,
      validTo: info.validTo,
      daysUntilExpiry: validation.daysUntilExpiry,
    };
  },

  async getNsuStatus(tenantId: string, companyId: string) {
    const existing = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundError('Empresa', companyId);
    }

    const nsuEntries = await db
      .select()
      .from(nsuControl)
      .where(eq(nsuControl.companyId, companyId));

    return nsuEntries.map((entry) => ({
      docType: entry.docType,
      lastNsu: entry.lastNsu,
      maxNsu: entry.maxNsu,
      lastSync: entry.lastSync,
      nextSync: entry.nextSync,
      syncStatus: entry.syncStatus,
      errorCount: entry.errorCount,
      lastError: entry.lastError,
    }));
  },
};
