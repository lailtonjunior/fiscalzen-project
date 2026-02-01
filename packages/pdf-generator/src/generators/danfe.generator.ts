import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import { NFeData, NFeItem } from '@fiscalzen/xml-parser';
import { IPdfGenerator, PdfGeneratorConfig, GeneratedPdf } from '../types';

export class DanfeGenerator implements IPdfGenerator {
    private config: PdfGeneratorConfig;

    constructor(config?: Partial<PdfGeneratorConfig>) {
        this.config = {
            format: 'A4',
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            fontSize: 7,
            ...config
        };
    }

    // Helper type check
    private isNFeData(doc: any): doc is NFeData {
        return doc && doc.emitente && doc.destinatario && doc.itens;
    }

    async generate(xmlParsed: any): Promise<GeneratedPdf> {
        if (!this.isNFeData(xmlParsed)) {
            throw new Error('Documento invalido para DANFE');
        }
        const nfe = xmlParsed;

        const doc = new PDFDocument({
            size: this.config.format,
            margins: this.config.margin,
            bufferPages: true
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // ═══════════════════════════════════════════════════
        // CABECALHO - IDENTIFICACAO DO EMITENTE
        // ═══════════════════════════════════════════════════
        await this.renderHeader(doc, nfe);

        // ═══════════════════════════════════════════════════
        // CODIGO DE BARRAS
        // ═══════════════════════════════════════════════════
        await this.renderBarcode(doc, nfe.chave);

        // ═══════════════════════════════════════════════════
        // DADOS DA NFE
        // ═══════════════════════════════════════════════════
        // this.renderDadosNFe(doc, nfe); // To be implemented fully

        // ═══════════════════════════════════════════════════
        // DESTINATARIO / REMETENTE
        // ═══════════════════════════════════════════════════
        // this.renderDestinatario(doc, nfe.destinatario);

        // ═══════════════════════════════════════════════════
        // PRODUTOS
        // ═══════════════════════════════════════════════════
        this.renderProdutos(doc, nfe.itens);

        // ═══════════════════════════════════════════════════
        // TOTAIS
        // ═══════════════════════════════════════════════════
        // this.renderTotais(doc, nfe.totais);

        // ═══════════════════════════════════════════════════
        // TRANSPORTE
        // ═══════════════════════════════════════════════════
        // this.renderTransporte(doc, nfe.transporte);

        // ═══════════════════════════════════════════════════
        // INFORMACOES ADICIONAIS
        // ═══════════════════════════════════════════════════
        // this.renderInformacoesAdicionais(doc, nfe.informacoesAdicionais);

        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => {
                resolve({
                    buffer: Buffer.concat(chunks),
                    metadata: {
                        chave: nfe.chave,
                        tipo: 'DANFE',
                        paginas: doc.bufferedPageRange().count,
                        geradoEm: new Date()
                    }
                });
            });
        });
    }

    // Placeholder for unimplemented interface method
    async generateFromXml(xml: string): Promise<GeneratedPdf> {
        throw new Error("Method not implemented.");
    }

    private async renderHeader(doc: PDFKit.PDFDocument, nfe: NFeData): Promise<void> {
        const { emitente } = nfe;
        const startY = doc.y;

        // Logo (if exists, skipped for now)
        // doc.image(emitente.logo, 10, startY, { width: 60 });

        // Dados do emitente
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(emitente.razaoSocial, 80, startY);

        doc.fontSize(7).font('Helvetica');
        doc.text(`CNPJ: ${this.formatCnpj(emitente.cnpj)}`);
        doc.text(`UF: ${emitente.uf}`);

        // Box DANFE
        const danfeBoxX = 350;
        doc.rect(danfeBoxX, startY, 100, 60).stroke();
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('DANFE', danfeBoxX + 25, startY + 5);
        doc.fontSize(7).font('Helvetica');
        doc.text('Documento Auxiliar da', danfeBoxX + 10, startY + 20);
        doc.text('Nota Fiscal Eletronica', danfeBoxX + 10, startY + 28);

        doc.fontSize(10).font('Helvetica-Bold');
        const tipoOperacao = (nfe.metadata?.tpNF === '0' || nfe.metadata?.tpNF === 0) ? '0 - ENTRADA' : '1 - SAIDA';
        doc.text(tipoOperacao, danfeBoxX + 15, startY + 42);

        // Numero em serie
        const numBoxX = 460;
        doc.rect(numBoxX, startY, 120, 60).stroke();
        doc.fontSize(8);
        doc.text(`N ${nfe.numero.toString().padStart(9, '0')}`, numBoxX + 20, startY + 10);
        doc.text(`Serie ${nfe.serie}`, numBoxX + 35, startY + 25);
        doc.text(`Folha 1/1`, numBoxX + 35, startY + 40);

        doc.y = startY + 70;
    }

    private async renderBarcode(doc: PDFKit.PDFDocument, chave: string): Promise<void> {
        // Gerar codigo de barras Code128
        const barcodeBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: chave,
            scale: 2,
            height: 15,
            includetext: false
        });

        doc.image(barcodeBuffer, 10, doc.y, { width: 570 });
        doc.moveDown(0.5);

        // Chave de acesso formatada
        doc.fontSize(7);
        doc.text(`CHAVE DE ACESSO: ${this.formatChave(chave)}`, { align: 'center' });
        doc.moveDown(0.5);
    }

    private renderProdutos(doc: PDFKit.PDFDocument, produtos: NFeItem[]): void {
        // Cabecalho da tabela
        const headers = ['CODIGO', 'DESCRICAO', 'NCM', 'CFOP', 'UN', 'QTD', 'V.UNIT', 'V.TOTAL'];
        const colWidths = [60, 180, 50, 40, 30, 50, 60, 60];

        let x = 10;
        doc.fontSize(6).font('Helvetica-Bold');

        headers.forEach((header, i) => {
            doc.text(header, x, doc.y, { width: colWidths[i], align: 'center' });
            x += colWidths[i];
        });

        doc.moveDown(0.3);
        doc.moveTo(10, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown(0.3);

        // Produtos
        doc.font('Helvetica');
        for (const produto of produtos) {
            x = 10;
            const y = doc.y;

            doc.text(produto.codigo, x, y, { width: colWidths[0] });
            doc.text(produto.descricao.substring(0, 50), x + colWidths[0], y, { width: colWidths[1] });
            doc.text(produto.ncm, x + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: 'center' });
            doc.text(produto.cfop, x + 290, y, { width: colWidths[3], align: 'center' });
            doc.text(produto.unidade, x + 330, y, { width: colWidths[4], align: 'center' });
            doc.text(this.formatNumber(produto.quantidade, 4), x + 360, y, { width: colWidths[5], align: 'right' });
            doc.text(this.formatCurrency(produto.valorUnitario), x + 410, y, { width: colWidths[6], align: 'right' });
            doc.text(this.formatCurrency(produto.valorTotal), x + 470, y, { width: colWidths[7], align: 'right' });

            doc.moveDown(0.5);

            // Verificar quebra de pagina
            if (doc.y > 750) {
                doc.addPage();
            }
        }
    }

    private formatCnpj(cnpj: string): string {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }

    private formatCep(cep: string): string {
        return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    }

    private formatChave(chave: string): string {
        return chave.replace(/(\d{4})/g, '$1 ').trim();
    }

    private formatCurrency(value: number): string {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    private formatNumber(value: number, decimals: number): string {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
}
