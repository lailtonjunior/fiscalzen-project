import { Worker } from 'bullmq';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { documentsService } from '../modules/documents/service';
import { storage } from '../services/storage';
import { redis as redisConnection } from '../config/redis';
import { db } from '../config/database';
import { downloadRegistry } from '@fiscalzen/database/schema';
import { eq } from 'drizzle-orm';
import { historyService } from '../modules/history/service';

interface BatchDownloadPayload {
    tenantId: string;
    userId: string;
    documentIds?: string[];
    filters?: any;
    format: 'xml' | 'pdf' | 'both';
    includeMetadata: boolean;
    organizacao: 'flat' | 'by-date' | 'by-type' | 'by-company';
}

export const batchDownloadWorker = new Worker<BatchDownloadPayload>(
    'batch-download',
    async (job) => {
        const { tenantId, userId, documentIds, filters, format, includeMetadata, organizacao } = job.data;
        let documents: any[] = [];

        try {
            await db
                .update(downloadRegistry)
                .set({
                    status: 'active',
                    progress: 1,
                    startedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(downloadRegistry.jobId, String(job.id)));

            await job.updateProgress(1);

            if (documentIds && documentIds.length > 0) {
                const results = await Promise.allSettled(
                    documentIds.map(id => documentsService.getById(tenantId, id))
                );
                documents = results
                    .filter(r => r.status === 'fulfilled')
                    .map(r => (r as PromiseFulfilledResult<any>).value);
            } else if (filters) {
                const result = await documentsService.list(tenantId, { ...filters, page: 1, limit: 5000 } as any);
                const fullDocs = await Promise.all(
                    result.items.map(d => documentsService.getById(tenantId, d.id))
                );
                documents = fullDocs;
            }

            if (documents.length === 0) {
                throw new Error('Nenhum documento encontrado para download');
            }

            await historyService.registerMany(
                documents.map((doc) => ({
                    tenantId,
                    documentId: doc.id,
                    companyId: doc.companyId,
                    userId,
                    eventType: 'download.batch.processing_started',
                    source: 'jobs.batch-download',
                    title: 'Processamento do pacote iniciado',
                    summary: `O documento entrou no processamento do pacote ${job.id}`,
                    details: {
                        jobId: String(job.id),
                        sourceId: String(job.id),
                        correlationId: String(job.id),
                        format,
                        includeMetadata,
                        organizacao,
                    },
                }))
            );

            await job.updateProgress(5);

            const archive = archiver('zip', { zlib: { level: 6 } });
            const passThrough = new PassThrough();
            const chunks: Buffer[] = [];
            passThrough.on('data', (c) => chunks.push(c));
            archive.pipe(passThrough);

            let processed = 0;
            const errors: any[] = [];

            for (const doc of documents) {
                try {
                    const basePath = getOrganizationPath(doc, organizacao);

                    if (format === 'xml' || format === 'both') {
                        try {
                            const xml = await documentsService.getXml(tenantId, doc.id);
                            archive.append(xml, { name: `${basePath}/${doc.chave}.xml` });
                        } catch (err: any) {
                            errors.push({ chave: doc.chave, type: 'XML', error: err.message });
                        }
                    }

                    if (format === 'pdf' || format === 'both') {
                        try {
                            const { buffer: pdfBuffer } = await documentsService.getPdf(tenantId, doc.id);
                            archive.append(pdfBuffer, { name: `${basePath}/${doc.chave}.pdf` });
                        } catch (err: any) {
                            errors.push({ chave: doc.chave, type: 'PDF', error: err.message });
                        }
                    }

                    if (includeMetadata) {
                        const meta = {
                            chave: doc.chave,
                            tipo: doc.docType,
                            data: doc.dataEmissao,
                            numero: doc.numero,
                            valor: doc.valorTotal,
                            emitente: { cnpj: doc.emitCnpj, nome: doc.emitRazao },
                            destinatario: { cnpj: doc.destCnpjCpf, nome: doc.destRazao }
                        };
                        archive.append(JSON.stringify(meta, null, 2), { name: `${basePath}/${doc.chave}_meta.json` });
                    }

                    processed++;
                    if (processed % Math.ceil(documents.length / 10) === 0) {
                        await job.updateProgress(5 + Math.round((processed / documents.length) * 90));
                    }
                } catch (err: any) {
                    errors.push({ id: doc.id, error: err.message });
                }
            }

            if (errors.length > 0) {
                archive.append(JSON.stringify(errors, null, 2), { name: 'ERROS.json' });
            }

            await archive.finalize();
            await new Promise<void>((resolve) => passThrough.on('finish', resolve));

            const zipBuffer = Buffer.concat(chunks);
            const fileName = `export_${new Date().toISOString().slice(0, 10)}_${job.id}.zip`;
            const zipPath = `${tenantId}/downloads/${fileName}`;
            await storage.uploadZip(zipPath, zipBuffer);

            const downloadUrl = await storage.generatePresignedUrl(zipPath, 86400);

            await job.updateProgress(100);

            const result = {
                success: true,
                downloadUrl,
                storageKey: zipPath,
                processed,
                errors: errors.length
            };

            await db
                .update(downloadRegistry)
                .set({
                    status: 'completed',
                    progress: 100,
                    processedDocuments: processed,
                    errorCount: errors.length,
                    result,
                    downloadUrl,
                    finishedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(downloadRegistry.jobId, String(job.id)));

            await historyService.registerMany(
                documents.map((doc) => ({
                    tenantId,
                    documentId: doc.id,
                    companyId: doc.companyId,
                    userId,
                    eventType: 'download.batch.completed',
                    source: 'jobs.batch-download',
                    title: 'Pacote concluido',
                    summary: `O documento foi incluido no pacote concluido ${job.id}`,
                    details: {
                        jobId: String(job.id),
                        sourceId: String(job.id),
                        correlationId: String(job.id),
                        format,
                        errors: errors.length,
                        downloadPrepared: true,
                    },
                }))
            );

            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido no processamento do lote';

            await db
                .update(downloadRegistry)
                .set({
                    status: 'failed',
                    errorMessage: message,
                    finishedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(downloadRegistry.jobId, String(job.id)));

            if (documents.length > 0) {
                await historyService.registerMany(
                    documents.map((doc) => ({
                        tenantId,
                        documentId: doc.id,
                        companyId: doc.companyId,
                        userId,
                        eventType: 'download.batch.failed',
                        source: 'jobs.batch-download',
                        title: 'Falha no pacote',
                        summary: `Falha ao processar o pacote ${job.id}`,
                        details: {
                            jobId: String(job.id),
                            sourceId: String(job.id),
                            correlationId: String(job.id),
                            error: message,
                        },
                    }))
                );
            } else {
                await historyService.registerEvent({
                    tenantId,
                    userId,
                    eventType: 'download.batch.failed',
                    source: 'jobs.batch-download',
                    title: 'Falha no pacote',
                    summary: `Falha ao processar o pacote ${job.id}`,
                    details: {
                        jobId: String(job.id),
                        sourceId: String(job.id),
                        correlationId: String(job.id),
                        error: message,
                    },
                });
            }

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 2,
        limiter: { max: 10, duration: 60000 } // Rate limit
    }
);

batchDownloadWorker.on('failed', async (job, err) => {
    if (!job?.id) {
        return;
    }

    await db
        .update(downloadRegistry)
        .set({
            status: 'failed',
            errorMessage: err.message,
            finishedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(downloadRegistry.jobId, String(job.id)));
});

function getOrganizationPath(doc: any, org: string): string {
    const d = new Date(doc.dataEmissao);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');

    switch (org) {
        case 'by-date': return `${y}/${m}`;
        case 'by-type': return doc.docType;
        case 'by-company': return doc.emitCnpj;
        default: return '.';
    }
}
