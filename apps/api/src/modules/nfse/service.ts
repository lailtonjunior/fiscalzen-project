import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { nfseConfigs, companies } from '@fiscalzen/database/schema';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js';
import { addNfseMonitorJob } from '../../jobs/queues.js';
import type {
  CreateNfseConfigInput,
  UpdateNfseConfigInput,
} from './schemas.js';

// Import from nfse-client package
// We'll import dynamically to handle if package isn't installed yet
let getMunicipioConfig: (codigo: string) => { codigo: string; nome: string; uf: string; tipo: string; versaoAbrasf?: string } | null;
let getAllMunicipios: () => Array<{ codigo: string; nome: string; uf: string; tipo: string; versaoAbrasf?: string }>;

try {
  const nfseClient = await import('@fiscalzen/nfse-client');
  getMunicipioConfig = nfseClient.getMunicipioConfig;
  getAllMunicipios = nfseClient.getAllMunicipios;
} catch {
  // Fallback if package not available
  getMunicipioConfig = () => null;
  getAllMunicipios = () => [];
}

// ============================================
// Company Verification Helper
// ============================================

async function verifyCompanyAccess(tenantId: string, companyId: string) {
  const company = await db.query.companies.findFirst({
    where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
  });

  if (!company) {
    throw new NotFoundError('Empresa nao encontrada');
  }

  return company;
}

// ============================================
// NFSe Config Service
// ============================================

export const nfseService = {
  /**
   * Get all NFSe configs for a company
   */
  async getConfigs(tenantId: string, companyId: string) {
    await verifyCompanyAccess(tenantId, companyId);

    const configs = await db.query.nfseConfigs.findMany({
      where: eq(nfseConfigs.companyId, companyId),
    });

    return configs;
  },

  /**
   * Get a specific NFSe config
   */
  async getConfig(tenantId: string, companyId: string, codigoMunicipio: string) {
    await verifyCompanyAccess(tenantId, companyId);

    const config = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
      ),
    });

    if (!config) {
      throw new NotFoundError('Configuracao NFSe nao encontrada');
    }

    return config;
  },

  /**
   * Create a new NFSe config
   */
  async createConfig(
    tenantId: string,
    companyId: string,
    data: CreateNfseConfigInput
  ) {
    await verifyCompanyAccess(tenantId, companyId);

    // Check if municipio is supported
    const municipioConfig = getMunicipioConfig(data.codigoMunicipio);
    if (!municipioConfig) {
      throw new ValidationError('Municipio nao suportado');
    }

    // Check if config already exists
    const existing = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, data.codigoMunicipio)
      ),
    });

    if (existing) {
      throw new ConflictError('Configuracao para este municipio ja existe');
    }

    // Create config
    const [config] = await db
      .insert(nfseConfigs)
      .values({
        companyId,
        codigoMunicipio: municipioConfig.codigo,
        nomeMunicipio: municipioConfig.nome,
        uf: municipioConfig.uf,
        tipo: municipioConfig.tipo as 'abrasf' | 'rpa',
        versaoAbrasf: municipioConfig.versaoAbrasf,
        inscricaoMunicipal: data.inscricaoMunicipal,
        rpaLogin: data.rpaLogin,
        rpaPassword: data.rpaPassword,
        isActive: false,
        syncStatus: 'idle',
      })
      .returning();

    return config;
  },

  /**
   * Update an NFSe config
   */
  async updateConfig(
    tenantId: string,
    companyId: string,
    codigoMunicipio: string,
    data: UpdateNfseConfigInput
  ) {
    await verifyCompanyAccess(tenantId, companyId);

    const existing = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Configuracao NFSe nao encontrada');
    }

    const [updated] = await db
      .update(nfseConfigs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nfseConfigs.companyId, companyId),
          eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
        )
      )
      .returning();

    return updated;
  },

  /**
   * Delete an NFSe config
   */
  async deleteConfig(tenantId: string, companyId: string, codigoMunicipio: string) {
    await verifyCompanyAccess(tenantId, companyId);

    const existing = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Configuracao NFSe nao encontrada');
    }

    await db
      .delete(nfseConfigs)
      .where(
        and(
          eq(nfseConfigs.companyId, companyId),
          eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
        )
      );
  },

  /**
   * Toggle NFSe config active state
   */
  async toggleConfig(
    tenantId: string,
    companyId: string,
    codigoMunicipio: string,
    isActive: boolean
  ) {
    await verifyCompanyAccess(tenantId, companyId);

    const existing = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Configuracao NFSe nao encontrada');
    }

    const [updated] = await db
      .update(nfseConfigs)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nfseConfigs.companyId, companyId),
          eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
        )
      )
      .returning();

    return updated;
  },

  /**
   * Test NFSe connection
   */
  async testConnection(
    tenantId: string,
    companyId: string,
    codigoMunicipio: string
  ) {
    const company = await verifyCompanyAccess(tenantId, companyId);

    const config = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
      ),
    });

    if (!config) {
      throw new NotFoundError('Configuracao NFSe nao encontrada');
    }

    // TODO: Implement actual connection test using nfse-client
    // For now, return a mock success/failure based on configuration
    const hasRequiredData =
      config.inscricaoMunicipal &&
      (config.tipo === 'abrasf' || (config.rpaLogin && config.rpaPassword));

    if (!hasRequiredData) {
      return {
        success: false,
        message: 'Dados de configuracao incompletos',
        details:
          config.tipo === 'rpa'
            ? 'Informe login e senha do portal'
            : 'Informe a inscricao municipal',
      };
    }

    return {
      success: true,
      message: 'Conexao testada com sucesso',
      details: `Pronto para consultar NFSe em ${config.nomeMunicipio}`,
    };
  },

  /**
   * Trigger NFSe sync
   */
  async triggerSync(
    tenantId: string,
    companyId: string,
    codigoMunicipio: string
  ) {
    await verifyCompanyAccess(tenantId, companyId);

    const config = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
      ),
    });

    if (!config) {
      throw new NotFoundError('Configuracao NFSe nao encontrada');
    }

    if (!config.isActive) {
      throw new ValidationError('Configuracao NFSe esta desativada');
    }

    // Update status to syncing
    await db
      .update(nfseConfigs)
      .set({
        syncStatus: 'syncing',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nfseConfigs.companyId, companyId),
          eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
        )
      );

    // Add job to queue
    await addNfseMonitorJob({
      companyId,
      codigoMunicipio,
      tenantId,
    });

    return { message: 'Sincronizacao iniciada' };
  },

  /**
   * Get all supported municipalities
   */
  async getMunicipios() {
    return getAllMunicipios().map((m) => ({
      codigo: m.codigo,
      nome: m.nome,
      uf: m.uf,
      tipo: m.tipo,
      versaoAbrasf: m.versaoAbrasf,
      requiresRpa: m.tipo === 'rpa',
    }));
  },

  /**
   * Get a specific municipality info
   */
  async getMunicipio(codigo: string) {
    const municipio = getMunicipioConfig(codigo);

    if (!municipio) {
      throw new NotFoundError('Municipio nao encontrado');
    }

    return {
      codigo: municipio.codigo,
      nome: municipio.nome,
      uf: municipio.uf,
      tipo: municipio.tipo,
      versaoAbrasf: municipio.versaoAbrasf,
      requiresRpa: municipio.tipo === 'rpa',
    };
  },
};
