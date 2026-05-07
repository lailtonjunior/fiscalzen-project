import { describe, expect, it } from 'vitest';
import {
  buildPdfFilename,
  buildXmlFilename,
  getPdfRepresentation,
  isPdfSupportedDocumentType,
} from '../src/modules/documents/pdf-helpers';

describe('pdf helpers', () => {
  it('supports only document types with current PDF generation path', () => {
    expect(isPdfSupportedDocumentType('NFE')).toBe(true);
    expect(isPdfSupportedDocumentType('CTE')).toBe(true);
    expect(isPdfSupportedDocumentType('MDFE')).toBe(false);
  });

  it('builds deterministic filenames for fiscal artifacts', () => {
    expect(
      buildPdfFilename({ id: 'doc-1', chave: '123', docType: 'NFE' })
    ).toBe('NFe_123.pdf');
    expect(
      buildPdfFilename({ id: 'doc-2', chave: '456', docType: 'CTE' })
    ).toBe('CTe_456.pdf');
    expect(
      buildXmlFilename({ id: 'doc-3', chave: null, docType: 'MDFE' })
    ).toBe('DocumentoFiscal_doc-3.xml');
  });

  it('maps supported document types to the expected operational representation', () => {
    expect(getPdfRepresentation('NFE')).toBe('DANFE');
    expect(getPdfRepresentation('CTE')).toBe('DACTE');
  });
});
