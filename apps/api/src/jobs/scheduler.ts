import { eq, and, ne, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { companies, nsuControl } from '@fiscalzen/database/schema';
import { addSefazMonitorJob } from './queues';
import { logger } from './events';

// ============================================
// Constants
// ============================================

const SCHEDULER_INTERVAL = 30 * 60 * 1000; // 30 minutes
const DOC_TYPES = ['NFE', 'CTE', 'MDFE'] as const;

// ============================================
// Scheduler State
// ============================================

let schedulerInterval: NodeJS.Timeout | null = null;
let isRunning = false;

// ============================================
// Main Scheduler
// ============================================

export async function runScheduler() {
  if (isRunning) {
    logger.warn(`Scheduler already running, skipping`);
    return;
  }

  isRunning = true;
  logger.info(`Running scheduler check`);

  try {
    // Find all NSU control entries that need sync
    const pendingEntries = await db
      .select({
        companyId: nsuControl.companyId,
        docType: nsuControl.docType,
        tenantId: companies.tenantId,
        companyName: companies.razaoSocial,
      })
      .from(nsuControl)
      .innerJoin(companies, eq(nsuControl.companyId, companies.id))
      .where(
        and(
          // Company is active
          eq(companies.ativo, true),
          // Has certificate configured
          sql`${companies.certificate} IS NOT NULL`,
          // Certificate not expired
          sql`${companies.certificateExpiry} > NOW()`,
          // Ready for sync (nextSync is null or in the past)
          sql`(${nsuControl.nextSync} IS NULL OR ${nsuControl.nextSync} <= NOW())`,
          // Not currently syncing or rate limited
          ne(nsuControl.syncStatus, 'syncing'),
          ne(nsuControl.syncStatus, 'rate_limited')
        )
      );

    logger.info(`Found ${pendingEntries.length} pending sync entries`);

    // Schedule jobs
    let scheduled = 0;

    for (const entry of pendingEntries) {
      try {
        await addSefazMonitorJob({
          companyId: entry.companyId,
          tenantId: entry.tenantId,
          docType: entry.docType as 'NFE' | 'CTE' | 'MDFE',
        });

        scheduled++;

        logger.debug(`Scheduled sync job`, {
          companyId: entry.companyId,
          companyName: entry.companyName,
          docType: entry.docType,
        });
      } catch (error) {
        logger.error(`Failed to schedule sync job`, {
          companyId: entry.companyId,
          docType: entry.docType,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    logger.info(`Scheduler completed`, {
      pending: pendingEntries.length,
      scheduled,
    });
  } catch (error) {
    logger.error(`Scheduler error`, {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  } finally {
    isRunning = false;
  }
}

// ============================================
// Start/Stop Scheduler
// ============================================

export function startScheduler() {
  if (schedulerInterval) {
    logger.warn(`Scheduler already started`);
    return;
  }

  logger.info(`Starting scheduler`, { interval: SCHEDULER_INTERVAL });

  // Run immediately on startup
  runScheduler();

  // Then run periodically
  schedulerInterval = setInterval(runScheduler, SCHEDULER_INTERVAL);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info(`Scheduler stopped`);
  }
}

// ============================================
// Manual Sync Triggers
// ============================================

export async function triggerCompanySync(
  tenantId: string,
  companyId: string,
  docTypes?: Array<'NFE' | 'CTE' | 'MDFE'>
) {
  const types = docTypes ?? DOC_TYPES;

  logger.info(`Triggering manual sync`, { companyId, docTypes: types });

  const results: Array<{ docType: string; success: boolean; error?: string }> = [];

  for (const docType of types) {
    try {
      await addSefazMonitorJob({
        companyId,
        tenantId,
        docType,
      });

      results.push({ docType, success: true });
    } catch (error) {
      results.push({
        docType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  return results;
}

export async function triggerAllCompaniesSync(tenantId: string) {
  logger.info(`Triggering sync for all companies`, { tenantId });

  // Get all active companies for tenant
  const activeCompanies = await db.query.companies.findMany({
    where: and(
      eq(companies.tenantId, tenantId),
      eq(companies.ativo, true),
      sql`${companies.certificate} IS NOT NULL`
    ),
  });

  const results: Array<{
    companyId: string;
    companyName: string;
    scheduled: number;
    errors: number;
  }> = [];

  for (const company of activeCompanies) {
    let scheduled = 0;
    let errors = 0;

    for (const docType of DOC_TYPES) {
      try {
        await addSefazMonitorJob({
          companyId: company.id,
          tenantId,
          docType,
        });
        scheduled++;
      } catch {
        errors++;
      }
    }

    results.push({
      companyId: company.id,
      companyName: company.razaoSocial,
      scheduled,
      errors,
    });
  }

  logger.info(`All companies sync triggered`, {
    tenantId,
    companies: results.length,
    totalScheduled: results.reduce((sum, r) => sum + r.scheduled, 0),
  });

  return results;
}

// ============================================
// Initialize Company NSU Control
// ============================================

export async function initializeCompanyNsuControl(companyId: string) {
  logger.info(`Initializing NSU control for company`, { companyId });

  for (const docType of DOC_TYPES) {
    // Check if already exists
    const existing = await db.query.nsuControl.findFirst({
      where: and(eq(nsuControl.companyId, companyId), eq(nsuControl.docType, docType)),
    });

    if (!existing) {
      await db.insert(nsuControl).values({
        companyId,
        docType,
        lastNsu: '000000000000000',
        syncStatus: 'idle',
      });

      logger.debug(`Created NSU control entry`, { companyId, docType });
    }
  }
}
