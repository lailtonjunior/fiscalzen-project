import { injectable, inject } from 'tsyringe';
import { documents } from '@fiscalzen/database/schema';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { createRequire } from 'module';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import { DATABASE_TOKEN } from '../../providers/database';
import { StorageService } from '../../services/storage';
import { parseNFe, parseCTe, type NFeData, type CTeData } from '@fiscalzen/xml-parser';
import { NotFoundError, ValidationError } from '../../utils/errors';

// Use createRequire for CommonJS pdfmake module
const require = createRequire(import.meta.url);
const PdfPrinter = require('pdfmake/js/Printer').default;

// Layouts
import { getNFeLayout, type DanfeLayoutOptions } from './layouts/nfe';
import { getCTeLayout, type DacteLayoutOptions } from './layouts/cte';
import { getCTeOsLayout } from './layouts/cte-os';

// Utils
import { generateCode128, generateQRCode, getCTeConsultaUrl } from './utils/barcode';

// ============================================
// Types
// ============================================

export interface GeneratedPdf {
  buffer: Buffer;
  metadata: {
    chave: string;
    tipo: 'DANFE' | 'DACTE' | 'DACTE_OS';
    paginas: number;
    geradoEm: Date;
  };
}

export interface PdfResult {
  url: string;
  cached: boolean;
  metadata: GeneratedPdf['metadata'];
}

export interface PdfBufferResult {
  buffer: Buffer;
  cached: boolean;
  metadata: GeneratedPdf['metadata'];
  storageKey: string;
}

type Database = NodePgDatabase<typeof schema>;

// ============================================
// Fonts para pdfmake
// ============================================

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

// ============================================
// PdfService
// ============================================

@injectable()
export class PdfService {
  private printer: any;

  constructor(
    @inject(DATABASE_TOKEN) private db: Database,
    @inject(StorageService) private storage: StorageService
  ) {
    this.printer = new PdfPrinter(fonts);
  }

  // ============================================
  // Main method: Generate PDF for document
  // ============================================

  async generatePdf(documentId: string, tenantId: string): Promise<PdfResult> {
    const result = await this.getPdfBuffer(documentId, tenantId);
    const url = await this.storage.generatePresignedUrl(result.storageKey);

    return {
      url,
      cached: result.cached,
      metadata: result.metadata,
    };
  }

  async getPdfBuffer(documentId: string, tenantId: string): Promise<PdfBufferResult> {
    // 1. Fetch document
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento', documentId);
    }

    // 2. Check if PDF already exists
    if (document.pdfStorageKey) {
      try {
        const buffer = await this.storage.downloadPdf(document.pdfStorageKey);

        return {
          buffer,
          cached: true,
          storageKey: document.pdfStorageKey,
          metadata: {
            chave: document.chave || '',
            tipo: this.getDocTipo(document.docType),
            paginas: 1,
            geradoEm: new Date(),
          },
        };
      } catch {
        // Cached artifact became unavailable; continue with regeneration from XML.
      }
    }

    // 3. Download XML
    const xmlKey = document.xmlStorageKey;
    if (!xmlKey) {
      throw new ValidationError('XML nao encontrado para este documento');
    }
    const xml = await this.storage.downloadXml(xmlKey);

    // 4. Generate PDF based on document type
    let pdf: GeneratedPdf;

    if (document.docType === 'NFE' || document.docType === 'NFCE') {
      const parsed = parseNFe(xml);
      pdf = await this.generateDanfeInternal(parsed);
    } else if (document.docType === 'CTE') {
      const parsed = parseCTe(xml);
      // Check if CTe OS (modelo 67)
      if (parsed.metadata.modelo === '67') {
        pdf = await this.generateDacteOsInternal(parsed);
      } else {
        pdf = await this.generateDacteInternal(parsed);
      }
    } else {
      throw new ValidationError(`Tipo de documento nao suportado para PDF: ${document.docType}`);
    }

    // 5. Upload PDF to S3
    const dataEmissao = new Date(document.dataEmissao);
    const storageKeyParams = {
      tenantId,
      companyId: document.companyId,
      docType: document.docType,
      year: dataEmissao.getFullYear(),
      month: dataEmissao.getMonth() + 1,
      documentId: document.chave || document.id,
    };

    const pdfKey = await this.storage.uploadPdf(storageKeyParams as any, pdf.buffer);

    // 6. Update document with pdfStorageKey
    await this.db
      .update(documents)
      .set({ pdfStorageKey: pdfKey, updatedAt: new Date() })
      .where(and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)));

    return {
      buffer: pdf.buffer,
      cached: false,
      storageKey: pdfKey,
      metadata: pdf.metadata,
    };
  }

  // ============================================
  // DANFE Generation (NFe/NFCe)
  // ============================================

  async generateDanfe(data: NFeData): Promise<Buffer> {
    const pdf = await this.generateDanfeInternal(data);
    return pdf.buffer;
  }

  private async generateDanfeInternal(data: NFeData): Promise<GeneratedPdf> {
    // Generate barcode
    const barcodeBase64 = await generateCode128(data.chave);

    const options: DanfeLayoutOptions = {
      barcodeBase64,
    };

    // Generate layout
    const docDefinition = await getNFeLayout(data, options);

    // Create PDF
    const buffer = await this.createPdf(docDefinition);

    return {
      buffer,
      metadata: {
        chave: data.chave,
        tipo: 'DANFE',
        paginas: 1,
        geradoEm: new Date(),
      },
    };
  }

  // ============================================
  // DACTE Generation (CTe)
  // ============================================

  async generateDacte(data: CTeData): Promise<Buffer> {
    const pdf = await this.generateDacteInternal(data);
    return pdf.buffer;
  }

  private async generateDacteInternal(data: CTeData): Promise<GeneratedPdf> {
    // Generate barcode
    const barcodeBase64 = await generateCode128(data.chave);

    // Generate QR Code
    const qrCodeUrl = getCTeConsultaUrl(data.chave);
    const qrCodeBase64 = await generateQRCode(qrCodeUrl);

    const options: DacteLayoutOptions = {
      barcodeBase64,
      qrCodeBase64,
    };

    // Generate layout
    const docDefinition = await getCTeLayout(data, options);

    // Create PDF
    const buffer = await this.createPdf(docDefinition);

    return {
      buffer,
      metadata: {
        chave: data.chave,
        tipo: 'DACTE',
        paginas: 1,
        geradoEm: new Date(),
      },
    };
  }

  // ============================================
  // DACTE OS Generation (CTe OS - modelo 67)
  // ============================================

  async generateDacteOs(data: CTeData): Promise<Buffer> {
    const pdf = await this.generateDacteOsInternal(data);
    return pdf.buffer;
  }

  private async generateDacteOsInternal(data: CTeData): Promise<GeneratedPdf> {
    // Generate barcode
    const barcodeBase64 = await generateCode128(data.chave);

    // Generate QR Code
    const qrCodeUrl = getCTeConsultaUrl(data.chave);
    const qrCodeBase64 = await generateQRCode(qrCodeUrl);

    const options: DacteLayoutOptions = {
      barcodeBase64,
      qrCodeBase64,
    };

    // Generate layout
    const docDefinition = await getCTeOsLayout(data, options);

    // Create PDF
    const buffer = await this.createPdf(docDefinition);

    return {
      buffer,
      metadata: {
        chave: data.chave,
        tipo: 'DACTE_OS',
        paginas: 1,
        geradoEm: new Date(),
      },
    };
  }

  // ============================================
  // Batch Generation
  // ============================================

  async generateBatchPdf(documentIds: string[], tenantId: string) {
    // TODO: Implement with BullMQ job queue
    return { message: 'Batch generation started', count: documentIds.length };
  }

  // ============================================
  // Helpers
  // ============================================

  private createPdf(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const pdfDoc = await this.printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        pdfDoc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        pdfDoc.on('error', (err: Error) => {
          reject(err);
        });

        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getDocTipo(docType: string): 'DANFE' | 'DACTE' | 'DACTE_OS' {
    if (docType === 'NFE' || docType === 'NFCE') return 'DANFE';
    if (docType === 'CTE') return 'DACTE';
    return 'DANFE';
  }
}
