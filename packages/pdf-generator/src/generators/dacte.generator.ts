import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import { CTeData } from '@fiscalzen/xml-parser';
import { IPdfGenerator, PdfGeneratorConfig, GeneratedPdf } from '../types';

export class DacteGenerator implements IPdfGenerator {
    private config: PdfGeneratorConfig;

    constructor(config?: Partial<PdfGeneratorConfig>) {
        this.config = {
            format: 'A4',
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            fontSize: 7,
            ...config
        };
    }

    private isCTeData(doc: any): doc is CTeData {
        // Basic duck typing check
        return doc && doc.emitente && doc.remetente && doc.destinatario;
    }

    async generate(xmlParsed: any): Promise<GeneratedPdf> {
        if (!this.isCTeData(xmlParsed)) {
            throw new Error('Documento invalido para DACTE');
        }
        const cte = xmlParsed;

        const doc = new PDFDocument({
            size: this.config.format,
            margins: this.config.margin
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // ═══════════════════════════════════════════════════
        // HEADER - IDENTIFICACAO DO DACTE
        // ═══════════════════════════════════════════════════
        await this.renderHeader(doc, cte);

        // ═══════════════════════════════════════════════════
        // MODAL DE TRANSPORTE
        // ═══════════════════════════════════════════════════
        this.renderModal(doc, cte.modal);

        // ═══════════════════════════════════════════════════
        // REMETENTE / DESTINATARIO / EXPEDIDOR / RECEBEDOR
        // ═══════════════════════════════════════════════════
        this.renderParticipantes(doc, cte);

        // ═══════════════════════════════════════════════════
        // INFORMACOES DA CARGA
        // ═══════════════════════════════════════════════════
        this.renderCarga(doc, cte.carga);

        // ═══════════════════════════════════════════════════
        // COMPONENTES DO VALOR DA PRESTACAO
        // ═══════════════════════════════════════════════════
        this.renderValorPrestacao(doc, cte.valorPrestacao);

        // ═══════════════════════════════════════════════════
        // DOCUMENTOS ORIGINARIOS (NFe vinculadas)
        // ═══════════════════════════════════════════════════
        this.renderDocumentosOriginarios(doc, cte.documentosOriginarios || []);

        // ═══════════════════════════════════════════════════
        // INFORMACOES ESPECIFICAS DO MODAL
        // ═══════════════════════════════════════════════════
        if (cte.modal === 'RODOVIARIO' && cte.rodoviario) {
            this.renderModalRodoviario(doc, cte.rodoviario);
        }

        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => {
                resolve({
                    buffer: Buffer.concat(chunks),
                    metadata: {
                        chave: cte.chave,
                        tipo: 'DACTE',
                        paginas: doc.bufferedPageRange().count,
                        geradoEm: new Date()
                    }
                });
            });
        });
    }

    async generateFromXml(xml: string): Promise<GeneratedPdf> {
        throw new Error("Method not implemented.");
    }

    private async renderHeader(doc: PDFKit.PDFDocument, cte: CTeData): Promise<void> {
        const startY = doc.y;
        // Emitente
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(cte.emitente.razaoSocial, 80, startY);

        // Barcode
        const barcodeBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: cte.chave,
            scale: 2,
            height: 15,
            includetext: false
        });
        doc.image(barcodeBuffer, 300, startY, { width: 250, height: 40 });

        doc.fontSize(8).font('Helvetica');
        doc.text(`DACTE - Documento Auxiliar do Conhecimento de Transporte Eletronico`, 300, startY + 45);

        doc.moveDown(4);
    }

    private renderModal(doc: PDFKit.PDFDocument, modal: string): void {
        doc.fontSize(8).font('Helvetica-Bold').text(`MODAL: ${modal}`);
        doc.moveDown();
    }

    private renderParticipantes(doc: PDFKit.PDFDocument, cte: CTeData): void {
        doc.fontSize(8);
        doc.text(`Remetente: ${cte.remetente.razaoSocial}`);
        doc.text(`Destinatario: ${cte.destinatario.razaoSocial}`);
        if (cte.expedidor) doc.text(`Expedidor: ${cte.expedidor.razaoSocial}`);
        if (cte.recebedor) doc.text(`Recebedor: ${cte.recebedor.razaoSocial}`);
        doc.moveDown();
    }

    private renderCarga(doc: PDFKit.PDFDocument, carga: any): void {
        // Placeholder
        doc.text('Informacoes da Carga...');
        doc.moveDown();
    }

    private renderValorPrestacao(doc: PDFKit.PDFDocument, valor: any): void {
        // Placeholder
        doc.text(`Valor Total Prestacao: ${valor.total}`);
        doc.moveDown();
    }

    private renderDocumentosOriginarios(doc: PDFKit.PDFDocument, docs: any[]): void {
        // IMPORTANTE: Esta secao mostra as NFe vinculadas ao CTe
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('DOCUMENTOS ORIGINARIOS');
        doc.moveDown(0.3);

        doc.fontSize(6).font('Helvetica');
        // Basic render
        for (const documento of docs) {
            doc.text(`${documento.tipo || 'NFe'} | ${documento.chave || documento.descricao} | ${documento.valor || ''}`);
        }
        doc.moveDown();
    }

    private renderModalRodoviario(doc: PDFKit.PDFDocument, rodoviario: any): void {
        doc.text(`RNTRC: ${rodoviario.rntrc}`);
    }
}
