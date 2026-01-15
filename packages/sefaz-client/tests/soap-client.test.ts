import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  extractSoapBody,
  extractElement,
  extractTagValue,
  extractAllElements,
  extractAttribute,
} from '../src/soap-client';

const fixturesDir = join(__dirname, 'fixtures');

function loadFixture(filename: string): string {
  return readFileSync(join(fixturesDir, filename), 'utf-8');
}

describe('SOAP Response Parsing', () => {
  describe('extractSoapBody', () => {
    it('should extract body from SOAP response', () => {
      const soapXml = loadFixture('soap-response-distdfe.xml');
      const body = extractSoapBody(soapXml);

      expect(body).toContain('nfeDistDFeInteresseResponse');
      expect(body).toContain('retDistDFeInt');
      expect(body).not.toContain('soap:Envelope');
    });

    it('should throw error for invalid SOAP', () => {
      expect(() => extractSoapBody('<invalid>xml</invalid>')).toThrow();
    });
  });

  describe('extractTagValue', () => {
    it('should extract simple tag values', () => {
      const xml = '<root><cStat>138</cStat><xMotivo>Documento localizado</xMotivo></root>';

      expect(extractTagValue(xml, 'cStat')).toBe('138');
      expect(extractTagValue(xml, 'xMotivo')).toBe('Documento localizado');
    });

    it('should return null for non-existent tags', () => {
      const xml = '<root><cStat>138</cStat></root>';

      expect(extractTagValue(xml, 'nonExistent')).toBeNull();
    });
  });

  describe('extractElement', () => {
    it('should extract element with content', () => {
      const xml = '<root><loteDistDFeInt><docZip>content</docZip></loteDistDFeInt></root>';

      const lote = extractElement(xml, 'loteDistDFeInt');
      expect(lote).toContain('<docZip>content</docZip>');
    });
  });

  describe('extractAllElements', () => {
    it('should extract all matching elements', () => {
      const soapXml = loadFixture('soap-response-distdfe.xml');
      const body = extractSoapBody(soapXml);
      const docZips = extractAllElements(body, 'docZip');

      expect(docZips.length).toBeGreaterThan(0);
    });
  });
});

describe('DistDFe Response Parsing', () => {
  it('should parse successful response', () => {
    const soapXml = loadFixture('soap-response-distdfe.xml');
    const body = extractSoapBody(soapXml);

    const cStat = extractTagValue(body, 'cStat');
    const xMotivo = extractTagValue(body, 'xMotivo');
    const ultNSU = extractTagValue(body, 'ultNSU');
    const maxNSU = extractTagValue(body, 'maxNSU');

    expect(cStat).toBe('138');
    expect(xMotivo).toBe('Documento localizado');
    expect(ultNSU).toBe('000000000000123');
    expect(maxNSU).toBe('000000000000150');
  });
});

describe('Manifestacao Response Parsing', () => {
  it('should parse successful manifestacao response', () => {
    const soapXml = loadFixture('soap-response-manifestacao.xml');
    const body = extractSoapBody(soapXml);

    const cStat = extractTagValue(body, 'cStat');
    const nProt = extractTagValue(body, 'nProt');
    const chNFe = extractTagValue(body, 'chNFe');
    const tpEvento = extractTagValue(body, 'tpEvento');

    // O primeiro cStat e do lote (128), o segundo e do evento (135)
    expect(body).toContain('<cStat>135</cStat>');
    expect(nProt).toBe('135240000123457');
    expect(chNFe).toBe('35240112345678000199550010000001231234567890');
    expect(tpEvento).toBe('210210');
  });
});
