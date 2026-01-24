import pLimit from 'p-limit';

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
          eq(companies.active, true),
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
  const activeCompanies = await db.query.companies.findMany({
    where: and(
      eq(companies.tenantId, tenantId),
      eq(companies.active, true)
      // TODO: Add certificate check when certificate fields are added to schema
      // sql`${companies.certificate} IS NOT NULL`
    ),
  });

  const limit = pLimit(CONCURRENCY_LIMIT);

  const results = await Promise.all(
    activeCompanies.map((company) =>
      limit(async () => {
        let scheduled = 0;
        let errors = 0;

        await Promise.all(
          DOC_TYPES.map(async (docType) => {
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
          })
        );

        return {
          companyId: company.id,
          companyName: company.razaoSocial ?? '',
          scheduled,
          errors,
        };
      })
    )
  );

  logger.info(`All companies sync triggered`, {
    tenantId,
    companies: results.length,
    totalScheduled: results.reduce((sum, r) => sum + r.scheduled, 0),
  });

  return results;
}

// ... initializeCompanyNsuControl ...
// Fixed: use Promise.all here too for faster init
export async function initializeCompanyNsuControl(companyId: string) {
  logger.info(`Initializing NSU control for company`, { companyId });

  await Promise.all(
    DOC_TYPES.map(async (docType) => {
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
    })
  );
}
