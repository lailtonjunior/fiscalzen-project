import type { Job } from 'bullmq';
import {
  parseResNFe,
  detectXmlSchema,
} from '@fiscalzen/xml-parser';
import { documentsService } from '../modules/documents/service';
import { eventsService } from '../modules/events/service';
import type { XmlProcessorJobData } from './queues';
import { logger } from './events';

// ============================================
// Main Job Processor
// ============================================

export async function processXmlProcessor(job: Job<XmlProcessorJobData>) {
  const { companyId, tenantId, nsu, schema, xmlContent, isResumo, isEvento } = job.data;

  logger.info(`Processing XML`, {
    jobId: job.id,
    companyId,
    nsu,
    schema,
    isResumo,
    isEvento,
  });

  try {
    // Detect XML schema details for confident routing
    const detection = detectXmlSchema(xmlContent);

    // 1. EVENTOS
    if (isEvento || detection.isEvento || detection.schemaType.includes('evento')) {
      // Delegate to Events Service
      const result = await eventsService.ingestEvent({
        tenantId,
        companyId,
        xmlContent,
      });

      logger.info(`Event processed`, {
        jobId: job.id,
        result,
      });
      return result;
    }

    // 2. RESUMO (NFe/CTe)
    if (isResumo || detection.isResumo || schema.includes('res')) {
      // Parse locally for now to satisfy simple signature, or delegate fully if service updated
      const resumoData = parseResNFe(xmlContent);

      const result = await documentsService.ingestResumo({
        tenantId,
        companyId,
        resumoData,
        xmlContent,
        nsu: nsu || '',
      });

      logger.info(`Resumo processed`, {
        jobId: job.id,
        result,
      });
      return result;
    }

    // 3. FULL DOCUMENT (procNFe, procCTe, etc.)
    // Delegate to Documents Service
    const result = await documentsService.ingestDocument({
      tenantId,
      companyId,
      xmlContent,
      nsu,
      source: 'job',
    });

    logger.info(`Document processed`, {
      jobId: job.id,
      result,
    });

    return result;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`XML processing failed`, {
      jobId: job.id,
      companyId,
      nsu,
      error: message,
    });

    throw error;
  }
}

