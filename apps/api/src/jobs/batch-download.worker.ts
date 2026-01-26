import { Worker } from 'bullmq';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { documentsService } from '../modules/documents/service';
import { storage } from '../services/storage';
import { redis as redisConnection } from '../config/redis';

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
        const { tenantId, documentIds, filters, format, includeMetadata, organizacao } = job.data;

        await job.updateProgress(1);

        // 1. Fetch documents
        let documents: any[] = [];
        if (documentIds && documentIds.length > 0) {
            // Fetch by IDs (simulated batch fetch via loop if repository doesn't have findByIds)
            // Ideally repository has findByIds, checking DocumentsService...
            // documentsService.list has filters but not "ids". 
            // We will loop for now or add findByIds later. 
            // Optimization: Use list with "id in (...)" if supported, or parallel getById.
            // documentsService.getById throws if not found, so map logic carefully.

            // For performance, let's try to query DB directly via documentsService.
            // But documentsService.db is private. 
            // We'll trust documentsService.list to support simple filtering and maybe we should implement a specific method there.
            // For now, looping getById is safe but slow. 
            // Better: Use `list` with a custom filter if possible, but list defines specific filters.
            // Let's stick to safe looping.

            const results = await Promise.allSettled(
                documentIds.map(id => documentsService.getById(tenantId, id))
            );
            documents = results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<any>).value);

        } else if (filters) {
            // Use existing list method
            // Note: list returns paginated { items, total }. We need ALL items.
            // This might kill memory if huge. Limit 5000 is enforced in controller.
            const result = await documentsService.list(tenantId, { ...filters, page: 1, limit: 5000 });
            documents = result.items;

            // Items from list() are partial selection? 
            // Checking service.ts: select({ id, chave, ... }). 
            // We need storageKeys which are usually not in list projection?
            // DocumentsService.list projects: id, chave, numero, serie, docType, situacao, dataEmissao, valorTotal...
            // It DOES NOT select xmlStorageKey or pdfStorageKey.
            // Criticial Issue: list() return is insufficient for download.
            // We must fetch full details.

            // Solution: Fetch full details for list items.
            const fullDocs = await Promise.all(
                documents.map(d => documentsService.getById(tenantId, d.id))
            );
            documents = fullDocs;
        }

        if (documents.length === 0) {
            throw new Error('Nenhum documento encontrado para download');
        }

        await job.updateProgress(5);

        // 2. Prepare Archive
        const archive = archiver('zip', { zlib: { level: 6 } });
        const passThrough = new PassThrough();
        const chunks: Buffer[] = [];
        passThrough.on('data', (c) => chunks.push(c));
        archive.pipe(passThrough);

        // 3. Process
        let processed = 0;
        const errors: any[] = [];

        for (const doc of documents) {
            try {
                const basePath = getOrganizationPath(doc, organizacao);

                // XML
                if (format === 'xml' || format === 'both') {
                    try {
                        // DocumentsService.getXml handles key lookup
                        const xml = await documentsService.getXml(tenantId, doc.id);
                        archive.append(xml, { name: `${basePath}/${doc.chave}.xml` });
                    } catch (err: any) {
                        errors.push({ chave: doc.chave, type: 'XML', error: err.message });
                    }
                }

                // PDF
                if (format === 'pdf' || format === 'both') {
                    try {
                        // PdfService.generatePdf returns metadata and url, likely not buffer? 
                        // Wait, generatePdf returns { url, cached, metadata }.
                        // We need the BUFFER to append to ZIP. 
                        // PdfService DOES NOT return buffer in generatePdf. 
                        // But documentsService.getPdf returns buffer!

                        const pdfBuffer = await documentsService.getPdf(tenantId, doc.id);
                        archive.append(pdfBuffer, { name: `${basePath}/${doc.chave}.pdf` });
                    } catch (err: any) {
                        errors.push({ chave: doc.chave, type: 'PDF', error: err.message });
                    }
                }

                // Metadata
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
                // Report progress every 10%
                if (processed % Math.ceil(documents.length / 10) === 0) {
                    await job.updateProgress(5 + Math.round((processed / documents.length) * 90));
                }

            } catch (err: any) {
                errors.push({ id: doc.id, error: err.message });
            }
        }

        // Errors Report
        if (errors.length > 0) {
            archive.append(JSON.stringify(errors, null, 2), { name: 'ERROS.json' });
        }

        await archive.finalize();
        await new Promise<void>((resolve) => passThrough.on('finish', resolve));

        const zipBuffer = Buffer.concat(chunks);

        // 4. Upload ZIP
        const fileName = `export_${new Date().toISOString().slice(0, 10)}_${job.id}.zip`;
        // We reuse storage service, but we don't have a "ZIP" key builder. 
        // storage.uploadPdf expects StorageKey...
        // We should use raw s3 client or add a generic upload method?
        // Checking StorageService... it has uploadXml and uploadPdf.
        // It seems rigid. 
        // I can assume "PDF" type and force a key, or better, extend StorageService? 
        // Or just hack it by using uploadPdf with a fake StorageKey that produces the path we want?
        // StorageKey: { tenantId, companyId, docType, year, month, documentId }
        // Key = tenant/company/docType/year/month/docId.xml
        // This is too structured for a transient download.
        // 
        // Workaround: I will implement a simpler `uploadFile` in `StorageService` OR 
        // just utilize the existing client from `storage` if exposed. 
        // `storage.client` is private.
        // I should create a new method in StorageService.

        // For now, I will add `uploadArchive` to StorageService in next step. 
        // Here I will assume it exists or use `uploadPdf` with a strict key override if possible.
        // Wait, I can import S3Client directly like StorageService does?
        // No, cleaner to add method to Storage. 
        // I'll leave a TODO here and fix StorageService next.

        // Let's assume storage.uploadZip exists.
        const zipPath = `${tenantId}/downloads/${fileName}`;
        await (storage as any).uploadZip(zipPath, zipBuffer);

        const downloadUrl = await storage.generatePresignedUrl(zipPath, 86400); // 24h

        await job.updateProgress(100);

        return {
            success: true,
            downloadUrl,
            processed,
            errors: errors.length
        };
    },
    {
        connection: redisConnection,
        concurrency: 2,
        limiter: { max: 10, duration: 60000 } // Rate limit
    }
);

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
