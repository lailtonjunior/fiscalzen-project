import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import { parseNFe } from '../src/parsers/nfe';
import { parseResNFe } from '../src/parsers/res-nfe';
import { parseResEvento, isManifestacaoEvento, isCancelamentoEvento } from '../src/parsers/res-evento';
import { parseProcEventoNFe, isEventoSucesso } from '../src/parsers/proc-evento';
import { detectDocumentType, detectXmlSchema, parseChaveAcesso, isValidChaveAcesso } from '../src/detector';
import { decodeDocZip, encodeToDocZip, isBase64Gzip } from '../src/gzip';

// Fixtures
const fixturesDir = join(__dirname, 'fixtures');

function loadFixture(filename: string): string {
  return readFileSync(join(fixturesDir, filename), 'utf-8');
}

describe('NFe Parser', () => {
  let procNFeXml: string;

  beforeAll(() => {
    procNFeXml = loadFixture('proc-nfe.xml');
  });

  it('should parse a valid procNFe XML', () => {
    const result = parseNFe(procNFeXml);

    expect(result.tipo).toBe('NFE');
    expect(result.chave).toBe('35240112345678000199550010000001231234567890');
    expect(result.numero).toBe(123);
    expect(result.serie).toBe(1);
    expect(result.emitente.cnpj).toBe('12345678000199');
    expect(result.emitente.razaoSocial).toBe('EMPRESA EMITENTE LTDA');
    expect(result.emitente.uf).toBe('SP');
    expect(result.destinatario.cnpjCpf).toBe('98765432000111');
    expect(result.destinatario.razaoSocial).toBe('EMPRESA DESTINATARIO LTDA');
    expect(result.valorTotal).toBe(15750.50);
    expect(result.situacao).toBe('autorizada');
    expect(result.itens).toHaveLength(2);
  });

  it('should extract items correctly', () => {
    const result = parseNFe(procNFeXml);

    expect(result.itens[0].codigo).toBe('PROD001');
    expect(result.itens[0].descricao).toBe('PRODUTO TESTE 1');
    expect(result.itens[0].quantidade).toBe(10);
    expect(result.itens[0].valorTotal).toBe(10000);

    expect(result.itens[1].codigo).toBe('PROD002');
    expect(result.itens[1].valorTotal).toBe(5750.5);
  });

  it('should include metadata', () => {
    const result = parseNFe(procNFeXml);

    expect(result.metadata.natOp).toBe('VENDA DE MERCADORIA');
    expect(result.metadata.protocolo).toBe('135240000123456');
  });

  it('should generate search content', () => {
    const result = parseNFe(procNFeXml);

    expect(result.searchContent).toContain('EMPRESA EMITENTE');
    expect(result.searchContent).toContain('12345678000199');
  });
});

describe('resNFe Parser', () => {
  let resNFeXml: string;

  beforeAll(() => {
    resNFeXml = loadFixture('res-nfe.xml');
  });

  it('should parse a valid resNFe XML', () => {
    const result = parseResNFe(resNFeXml);

    expect(result.tipo).toBe('resNFe');
    expect(result.chave).toBe('35240112345678000199550010000001231234567890');
    expect(result.cnpjCpf).toBe('12345678000199');
    expect(result.razaoSocial).toBe('EMPRESA EMITENTE LTDA');
    expect(result.ie).toBe('123456789012');
    expect(result.tipoNF).toBe('1');
    expect(result.valorTotal).toBe(15750.50);
    expect(result.protocolo).toBe('135240000123456');
    expect(result.situacao).toBe('autorizada');
  });

  it('should parse dates correctly', () => {
    const result = parseResNFe(resNFeXml);

    expect(result.dataEmissao).toBeInstanceOf(Date);
    expect(result.dataRecebimento).toBeInstanceOf(Date);
  });
});

describe('resEvento Parser', () => {
  let resEventoXml: string;

  beforeAll(() => {
    resEventoXml = loadFixture('res-evento.xml');
  });

  it('should parse a valid resEvento XML', () => {
    const result = parseResEvento(resEventoXml);

    expect(result.tipo).toBe('resEvento');
    expect(result.orgao).toBe(35);
    expect(result.cnpjCpf).toBe('98765432000111');
    expect(result.chave).toBe('35240112345678000199550010000001231234567890');
    expect(result.tipoEvento).toBe('210210');
    expect(result.sequencia).toBe(1);
    expect(result.descricaoEvento).toBe('Ciencia da Operacao');
    expect(result.protocolo).toBe('135240000123457');
  });

  it('should identify manifestação events', () => {
    expect(isManifestacaoEvento('210200')).toBe(true);
    expect(isManifestacaoEvento('210210')).toBe(true);
    expect(isManifestacaoEvento('210220')).toBe(true);
    expect(isManifestacaoEvento('210240')).toBe(true);
    expect(isManifestacaoEvento('110111')).toBe(false);
  });

  it('should identify cancelamento events', () => {
    expect(isCancelamentoEvento('110111')).toBe(true);
    expect(isCancelamentoEvento('110112')).toBe(true);
    expect(isCancelamentoEvento('210210')).toBe(false);
  });
});

describe('procEventoNFe Parser', () => {
  let procEventoXml: string;

  beforeAll(() => {
    procEventoXml = loadFixture('proc-evento-nfe.xml');
  });

  it('should parse a valid procEventoNFe XML', () => {
    const result = parseProcEventoNFe(procEventoXml);

    expect(result.tipo).toBe('procEventoNFe');
    expect(result.versao).toBe('1.00');

    // Evento
    expect(result.evento.orgao).toBe(91);
    expect(result.evento.ambiente).toBe('1');
    expect(result.evento.cnpjCpf).toBe('98765432000111');
    expect(result.evento.chave).toBe('35240112345678000199550010000001231234567890');
    expect(result.evento.tipoEvento).toBe('210210');
    expect(result.evento.sequencia).toBe(1);
    expect(result.evento.descricaoEvento).toBe('Ciencia da Operacao');

    // Retorno
    expect(result.retorno.status).toBe(135);
    expect(result.retorno.motivo).toBe('Evento registrado e vinculado a NF-e');
    expect(result.retorno.protocolo).toBe('135240000123457');
  });

  it('should detect successful event status', () => {
    expect(isEventoSucesso(135)).toBe(true);
    expect(isEventoSucesso(136)).toBe(true);
    expect(isEventoSucesso(155)).toBe(true);
    expect(isEventoSucesso(999)).toBe(false);
  });
});

describe('Document Detector', () => {
  it('should detect procNFe', () => {
    const xml = loadFixture('proc-nfe.xml');
    const result = detectXmlSchema(xml);

    expect(result.schemaType).toBe('procNFe');
    expect(result.docType).toBe('NFE');
    expect(result.isResumo).toBe(false);
    expect(result.isEvento).toBe(false);
    expect(result.chave).toBe('35240112345678000199550010000001231234567890');
  });

  it('should detect resNFe', () => {
    const xml = loadFixture('res-nfe.xml');
    const result = detectXmlSchema(xml);

    expect(result.schemaType).toBe('resNFe');
    expect(result.docType).toBe('NFE');
    expect(result.isResumo).toBe(true);
    expect(result.isEvento).toBe(false);
  });

  it('should detect resEvento', () => {
    const xml = loadFixture('res-evento.xml');
    const result = detectXmlSchema(xml);

    expect(result.schemaType).toBe('resEvento');
    expect(result.isResumo).toBe(true);
    expect(result.isEvento).toBe(true);
  });

  it('should detect procEventoNFe', () => {
    const xml = loadFixture('proc-evento-nfe.xml');
    const result = detectXmlSchema(xml);

    expect(result.schemaType).toBe('procEventoNFe');
    expect(result.docType).toBe('NFE');
    expect(result.isEvento).toBe(true);
  });

  it('should use simple detectDocumentType', () => {
    const xml = loadFixture('proc-nfe.xml');
    expect(detectDocumentType(xml)).toBe('NFE');
  });
});

describe('Chave de Acesso', () => {
  const validChave = '35240112345678000199550010000001231234567890';

  it('should validate correct chave', () => {
    expect(isValidChaveAcesso(validChave)).toBe(true);
  });

  it('should reject invalid chave', () => {
    expect(isValidChaveAcesso('')).toBe(false);
    expect(isValidChaveAcesso('12345')).toBe(false);
    expect(isValidChaveAcesso('3524011234567800019955001000000123123456789X')).toBe(false);
  });

  it('should parse chave correctly', () => {
    const parsed = parseChaveAcesso(validChave);

    expect(parsed).not.toBeNull();
    expect(parsed!.uf).toBe('35');
    expect(parsed!.dataEmissao).toBe('2401');
    expect(parsed!.cnpj).toBe('12345678000199');
    expect(parsed!.modelo).toBe('55');
    expect(parsed!.serie).toBe('001');
    expect(parsed!.numero).toBe('000000123');
  });
});

describe('GZip Utilities', () => {
  const sampleXml = '<?xml version="1.0"?><test>Hello World</test>';

  it('should encode and decode correctly', () => {
    const encoded = encodeToDocZip(sampleXml);
    const decoded = decodeDocZip(encoded);

    expect(decoded).toBe(sampleXml);
  });

  it('should detect base64 gzip content', () => {
    const encoded = encodeToDocZip(sampleXml);

    expect(isBase64Gzip(encoded)).toBe(true);
    expect(isBase64Gzip('<?xml version="1.0"?>')).toBe(false);
    expect(isBase64Gzip('plain text')).toBe(false);
  });

  it('should handle whitespace in base64', () => {
    const encoded = encodeToDocZip(sampleXml);
    const withWhitespace = encoded.slice(0, 10) + '\n' + encoded.slice(10);
    const decoded = decodeDocZip(withWhitespace);

    expect(decoded).toBe(sampleXml);
  });
});
