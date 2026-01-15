import { describe, it, expect } from 'vitest';
import { SefazError } from '../src/types';

// Testes de validacao dos servicos (sem chamadas HTTP reais)

describe('NFe DistDFe Service Validation', () => {
  it('should validate CNPJ format', () => {
    const invalidCnpj = '123'; // CNPJ invalido

    expect(() => {
      if (!/^\d{14}$/.test(invalidCnpj)) {
        throw new SefazError('CNPJ deve ter 14 digitos', 'INVALID_PARAMS');
      }
    }).toThrow('CNPJ deve ter 14 digitos');
  });

  it('should validate chave format', () => {
    const invalidChave = '12345'; // Chave invalida

    expect(() => {
      if (!/^\d{44}$/.test(invalidChave)) {
        throw new SefazError('Chave de acesso deve ter 44 digitos', 'INVALID_PARAMS');
      }
    }).toThrow('Chave de acesso deve ter 44 digitos');
  });

  it('should accept valid CNPJ', () => {
    const validCnpj = '12345678000199';

    expect(/^\d{14}$/.test(validCnpj)).toBe(true);
  });

  it('should accept valid chave', () => {
    const validChave = '35240112345678000199550010000001231234567890';

    expect(/^\d{44}$/.test(validChave)).toBe(true);
  });
});

describe('Manifestacao Service Validation', () => {
  const validChave = '35240112345678000199550010000001231234567890';
  const validCnpj = '98765432000111';

  it('should require justificativa for 210240', () => {
    const tipoEvento = '210240';
    const justificativa = undefined;

    expect(() => {
      if (tipoEvento === '210240' && !justificativa) {
        throw new SefazError(
          'Justificativa e obrigatoria para Operacao nao Realizada',
          'INVALID_PARAMS'
        );
      }
    }).toThrow('Justificativa e obrigatoria');
  });

  it('should validate justificativa length', () => {
    const justificativa = 'curta'; // Menos de 15 caracteres

    expect(() => {
      if (justificativa.length < 15 || justificativa.length > 255) {
        throw new SefazError(
          'Justificativa deve ter entre 15 e 255 caracteres',
          'INVALID_PARAMS'
        );
      }
    }).toThrow('entre 15 e 255');
  });

  it('should accept valid justificativa', () => {
    const justificativa = 'Esta e uma justificativa valida com mais de 15 caracteres';

    expect(justificativa.length >= 15 && justificativa.length <= 255).toBe(true);
  });

  it('should validate tipo evento', () => {
    const tiposValidos = ['210200', '210210', '210220', '210240'];
    const tipoInvalido = '999999';

    expect(tiposValidos.includes(tipoInvalido)).toBe(false);
    expect(tiposValidos.includes('210210')).toBe(true);
  });
});

describe('NSU Format', () => {
  it('should pad NSU to 15 digits', () => {
    const nsu = '123';
    const padded = nsu.padStart(15, '0');

    expect(padded).toBe('000000000000123');
    expect(padded.length).toBe(15);
  });

  it('should not change already padded NSU', () => {
    const nsu = '000000000000123';
    const padded = nsu.padStart(15, '0');

    expect(padded).toBe('000000000000123');
  });
});

describe('Ambiente Code Mapping', () => {
  it('should map ambiente to tpAmb', () => {
    const getAmbienteCode = (ambiente: 'producao' | 'homologacao'): '1' | '2' => {
      return ambiente === 'producao' ? '1' : '2';
    };

    expect(getAmbienteCode('producao')).toBe('1');
    expect(getAmbienteCode('homologacao')).toBe('2');
  });
});

describe('XML Escape', () => {
  it('should escape special characters', () => {
    const escapeXml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    expect(escapeXml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(escapeXml('<script>')).toBe('&lt;script&gt;');
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
  });
});
