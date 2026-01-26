import pLimit from 'p-limit';
import { db } from '../config/database';
import { logger } from '../utils/logger';
import { addSefazMonitorJob } from './index';
import { companies, nsuControl } from '@fiscalzen/database/schema';
import { eq, and, sql, ne } from 'drizzle-orm';

// Document types constants
const DOC_TYPES = ['NFE', 'CTE', 'MDFE'] as const;
let isRunning = false;

// ... other imports ...

// Limit concurrent job scheduling to prevent overwhelming Redis/BullMQ
const CONCURRENCY_LIMIT = 50;

// ... existing code ...

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
        companyId: (nsuControl as any).companyId,
        docType: (nsuControl as any).docType,
        tenantId: (companies as any).tenantId,
        companyName: (companies as any).razaoSocial,
      })
      .from(nsuControl as any)
      .innerJoin(companies as any, eq((nsuControl as any).companyId, (companies as any).id))
      .where(
        and(
          // Company is active
          eq((companies as any).active, true),
          // Has certificate configured
          sql`${(companies as any).certificate} IS NOT NULL`,
          // Certificate not expired  
          sql`${(companies as any).certificateExpiry} > NOW()`,
          // Ready for sync (nextSync is null or in the past)
          sql`(${(nsuControl as any).nextSync} IS NULL OR ${(nsuControl as any).nextSync} <= NOW())`,
          // Not currently syncing or rate limited
          ne((nsuControl as any).syncStatus, 'syncing'),
          ne((nsuControl as any).syncStatus, 'rate_limited')
        )
      );

    logger.info(`Found ${pendingEntries.length} pending sync entries`);

    // Schedule jobs in parallel with concurrency limit
    const limit = pLimit(CONCURRENCY_LIMIT);
    let scheduled = 0;

    await Promise.all(
      pendingEntries.map((entry) =>
        limit(async () => {
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
        })
      )
    );

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

// ... startScheduler/stopScheduler ...

export async function triggerCompanySync(
  tenantId: string,
  companyId: string,
  docTypes?: Array<'NFE' | 'CTE' | 'MDFE'>
) {
  const types = docTypes ?? DOC_TYPES;

  logger.info(`Triggering manual sync`, { companyId, docTypes: types });

  const results = await Promise.all(
    types.map(async (docType) => {
      try {
        await addSefazMonitorJob({
          companyId,
          tenantId,
          docType,
        });

        return { docType, success: true };
      } catch (error) {
        return {
          docType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown',
        };
      }
    })
  );

  return results;
}

export async function triggerAllCompaniesSync(tenantId: string) {
  logger.info(`Triggering sync for all companies`, { tenantId });

  // Get all active companies for tenant
  const activeCompanies = await (db.query as any).companies.findMany({
    where: and(
      eq((companies as any).tenantId, tenantId),
      eq((companies as any).active, true)
      // TODO: Add certificate check when certificate fields are added to schema
      // sql`${companies.certificate} IS NOT NULL`
    ),
  });
  await Promise.all(
    activeCompanies.map(async (company: any) => {
      const companyId = company.id;

      await Promise.all(
        DOC_TYPES.map(async (docType) => {
          // Check if already exists
          const existing = await (db.query as any).nsuControl.findFirst({
            where: and(eq((nsuControl as any).companyId, companyId), eq((nsuControl as any).docType, docType)),
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
        })
      );
    })
  );
}
