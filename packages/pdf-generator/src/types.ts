import { ParsedDocument } from '@fiscalzen/xml-parser';

export interface PdfGeneratorConfig {
    format: 'A4' | 'A4-landscape';
    margin: { top: number; right: number; bottom: number; left: number };
    fontSize: number;
}

export interface GeneratedPdf {
    buffer: Buffer;
    metadata: {
        chave: string;
        tipo: 'DANFE' | 'DACTE' | 'DACTE_OS' | 'DAMDFE';
        paginas: number;
        geradoEm: Date;
    };
}

export interface IPdfGenerator {
    generate(xmlParsed: ParsedDocument): Promise<GeneratedPdf>;
    generateFromXml(xml: string): Promise<GeneratedPdf>;
}
