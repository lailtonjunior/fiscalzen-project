import { Job } from 'bullmq';
import { subDays } from 'date-fns';
import { db } from '../config/database.js';
import { companies, documents, nfseConfigs } from '@fiscalzen/database/schema';
import { eq, and } from 'drizzle-orm';
import type { NfseMonitorJobData } from './queues.js';
import { addNfseMonitorJob } from './queues.js';
import { logger } from '../utils/logger.js';

// ============================================
// NFSe Monitor Processor
// ============================================

const NFSE_MONITOR_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

export async function processNfseMonitor(job: Job<NfseMonitorJobData>) {
  const { companyId, tenantId, codigoMunicipio, tipo } = job.data;

  logger.info(`[NFSe Monitor] Starting for company ${companyId}, municipality ${codigoMunicipio}`);

  try {
    // Get company data
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!company) {
      logger.error(`[NFSe Monitor] Company ${companyId} not found`);
      return { success: false, error: 'Company not found' };
    }

    // Get NFSe config for this company/municipality
    const nfseConfig = await db.query.nfseConfigs.findFirst({
      where: and(
        eq(nfseConfigs.companyId, companyId),
        eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
      ),
    });

    if (!nfseConfig || !nfseConfig.isActive) {
      logger.info(`[NFSe Monitor] NFSe monitoring not active for company ${companyId}`);
      return { success: false, error: 'NFSe monitoring not active' };
    }

    // Update status to syncing
    await db
      .update(nfseConfigs)
      .set({ syncStatus: 'syncing', updatedAt: new Date() })
      .where(
        and(
          eq(nfseConfigs.companyId, companyId),
          eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
        )
      );

    // Process based on integration type
    let result;
    const integrationType = tipo || nfseConfig.tipo;

    if (integrationType === 'abrasf') {
      result = await processAbrasfMonitor(company, nfseConfig, codigoMunicipio);
    } else if (integrationType === 'rpa') {
      result = await processRpaMonitor(company, nfseConfig, codigoMunicipio);
    } else {
      throw new Error(`Unknown integration type: ${integrationType}`);
    }

    // Update status to success
    await db
      .update(nfseConfigs)
      .set({
        syncStatus: 'success',
        lastSync: new Date(),
        lastError: result.errors.length > 0 ? result.errors[0] : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nfseConfigs.companyId, companyId),
          eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
        )
      );

    // Schedule next run
    await addNfseMonitorJob(job.data, NFSE_MONITOR_INTERVAL);

    logger.info(`[NFSe Monitor] Completed for company ${companyId}, processed ${result.processed} NFSe`);

    return {
      success: true,
      processed: result.processed,
      errors: result.errors,
    };
  } catch (error) {
    logger.error(`[NFSe Monitor] Error for company ${companyId}:`, error);

    // Update status to error
    await db
      .update(nfseConfigs)
      .set({
        syncStatus: 'error',
        lastError: error instanceof Error ? error.message : String(error),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nfseConfigs.companyId, companyId),
          eq(nfseConfigs.codigoMunicipio, codigoMunicipio)
        )
      );

    // Still schedule next run even on error
    await addNfseMonitorJob(job.data, NFSE_MONITOR_INTERVAL);

    throw error;
  }
}

// ============================================
// ABRASF Integration
// ============================================

async function processAbrasfMonitor(
  company: any,
  config: any,
  codigoMunicipio: string
): Promise<{ processed: number; errors: string[] }> {
  // Dynamic import to avoid loading heavy dependencies at startup
  const { getAbrasfClient, getMunicipioConfig } = await import('@fiscalzen/nfse-client');

  const municipioConfig = getMunicipioConfig(codigoMunicipio);
  if (!municipioConfig) {
    throw new Error(`Municipality ${codigoMunicipio} not found in registry`);
  }

  // Get certificate from company
  if (!company.certificatePfx || !company.certificatePassword) {
    throw new Error('Certificate not configured for company');
  }

  const certificado = {
    pfxBuffer: Buffer.from(company.certificatePfx, 'base64'),
    password: company.certificatePassword,
  };

  // Create ABRASF client
  const client = getAbrasfClient(codigoMunicipio, certificado, 'producao');

  // Query NFSe as tomador (received)
  const dataInicio = config.lastSync
    ? new Date(config.lastSync)
    : subDays(new Date(), 30);
  const dataFim = new Date();

  let processed = 0;
  const errors: string[] = [];
  let pagina = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.consultarNfseServicoTomado({
      cnpjTomador: company.cnpj,
      dataInicio,
      dataFim,
      pagina,
    });

    if (!response.success) {
      errors.push(...(response.erros?.map((e) => e.mensagem) || []));
      break;
    }

    // Process each NFSe
    for (const nfse of response.nfses) {
      try {
        await processNfse(company.id, company.tenantId, codigoMunicipio, nfse);
        processed++;
      } catch (error) {
        errors.push(`Error processing NFSe ${nfse.identificacao.numero}: ${error}`);
      }
    }

    // Check for more pages
    if (response.proximaPagina) {
      pagina = response.proximaPagina;
    } else {
      hasMore = false;
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { processed, errors };
}

// ============================================
// RPA Integration
// ============================================

async function processRpaMonitor(
  company: any,
  config: any,
  codigoMunicipio: string
): Promise<{ processed: number; errors: string[] }> {
  // Dynamic import
  const { getBrowserManager, getRpaScraper, getMunicipioConfig } = await import(
    '@fiscalzen/nfse-client'
  );

  const municipioConfig = getMunicipioConfig(codigoMunicipio);
  if (!municipioConfig) {
    throw new Error(`Municipality ${codigoMunicipio} not found in registry`);
  }

  // Check if RPA credentials are configured
  if (!config.rpaLogin || !config.rpaPassword) {
    throw new Error('RPA credentials not configured');
  }

  const browser = getBrowserManager();
  let processed = 0;
  const errors: string[] = [];

  try {
    await browser.init({ headless: true });
    const page = await browser.newPage();

    // Get scraper for this municipality
    const scraper = getRpaScraper(codigoMunicipio, page);

    // Login
    await scraper.login({
      login: config.rpaLogin,
      senha: config.rpaPassword,
      inscricaoMunicipal: config.inscricaoMunicipal,
    });

    // Query received NFSe
    const dataInicio = config.lastSync
      ? new Date(config.lastSync)
      : subDays(new Date(), 30);
    const dataFim = new Date();

    const nfseList = await scraper.consultarNfseRecebidas({
      dataInicio,
      dataFim,
    });

    // Download and process each NFSe
    for (const nfseResult of nfseList) {
      try {
        const xmlContent = await scraper.downloadXml(nfseResult);
        await processNfseXml(company.id, company.tenantId, codigoMunicipio, xmlContent);
        processed++;
      } catch (error) {
        errors.push(`Error processing NFSe ${nfseResult.numero}: ${error}`);
      }
    }

    // Logout
    await scraper.logout();
  } catch (error) {
    errors.push(`RPA error: ${error}`);
    throw error;
  } finally {
    await browser.close();
  }

  return { processed, errors };
}

// ============================================
// NFSe Processing Helpers
// ============================================

async function processNfse(
  companyId: string,
  tenantId: string,
  codigoMunicipio: string,
  nfse: any
): Promise<void> {
  // Check if already exists
  const existing = await db.query.documents.findFirst({
    where: and(
      eq(documents.companyId, companyId),
      eq(documents.numero, String(nfse.identificacao.numero)),
      eq(documents.docType, 'NFSE')
    ),
  });

  if (existing) {
    return; // Already processed
  }

  // Insert new NFSe document
  await db.insert(documents).values({
    id: crypto.randomUUID(),
    tenantId,
    companyId,
    chave: `${codigoMunicipio}-${nfse.identificacao.numero}-${nfse.identificacao.codigoVerificacao}`,
    numero: String(nfse.identificacao.numero),
    serie: '0',
    docType: 'NFSE',
    situacao: 'autorizada',
    dataEmissao: nfse.identificacao.dataEmissao,
    valorTotal: String(nfse.valores.valorServicos),
    emitCnpj: nfse.prestador.cnpj,
    emitRazaoSocial: nfse.prestador.razaoSocial,
    destCnpj: nfse.tomador.cpfCnpj,
    destRazaoSocial: nfse.tomador.razaoSocial,
    uf: codigoMunicipio.substring(0, 2), // First 2 digits of IBGE code are UF
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function processNfseXml(
  companyId: string,
  tenantId: string,
  codigoMunicipio: string,
  xmlContent: string
): Promise<void> {
  // Parse the XML
  const { parseNFSe } = await import('@fiscalzen/xml-parser');
  const parsed = parseNFSe(xmlContent);

  // Check if already exists
  const existing = await db.query.documents.findFirst({
    where: and(
      eq(documents.companyId, companyId),
      eq(documents.numero, String(parsed.numero)),
      eq(documents.docType, 'NFSE')
    ),
  });

  if (existing) {
    return; // Already processed
  }

  // Insert new NFSe document
  await db.insert(documents).values({
    id: crypto.randomUUID(),
    tenantId,
    companyId,
    chave: `${codigoMunicipio}-${parsed.numero}-${parsed.metadata.codigoVerificacao}`,
    numero: String(parsed.numero),
    serie: '0',
    docType: 'NFSE',
    situacao: parsed.situacao,
    dataEmissao: parsed.dataEmissao,
    valorTotal: String(parsed.valorTotal),
    emitCnpj: parsed.emitente.cnpj,
    emitRazaoSocial: parsed.emitente.razaoSocial,
    destCnpj: parsed.destinatario.cnpjCpf,
    destRazaoSocial: parsed.destinatario.razaoSocial,
    uf: codigoMunicipio.substring(0, 2),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
