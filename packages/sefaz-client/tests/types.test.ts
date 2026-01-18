import { describe, it, expect } from 'vitest';
import {
  SefazError,
  CertificadoError,
  TimeoutError,
  MANIFESTACAO_DESCRICOES,
} from '../src/types';
import { SEFAZ_STATUS } from '../src/constants';

describe('Error Classes', () => {
  describe('SefazError', () => {
    it('should create error with code', () => {
      const error = new SefazError('Test error', '999');

      expect(error.name).toBe('SefazError');
      expect(error.message).toBe('Test error');
      expect(error.codigo).toBe('999');
    });

    it('should include request/response XML', () => {
      const error = new SefazError(
        'Test error',
        '999',
        '<request/>',
        '<response/>'
      );

      expect(error.xmlRequest).toBe('<request/>');
      expect(error.xmlResponse).toBe('<response/>');
    });
  });

  describe('CertificadoError', () => {
    it('should create certificate error', () => {
      const error = new CertificadoError('Invalid certificate');

      expect(error.name).toBe('CertificadoError');
      expect(error.message).toBe('Invalid certificate');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error with default message', () => {
      const error = new TimeoutError();

      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Request timeout');
    });

    it('should accept custom message', () => {
      const error = new TimeoutError('Custom timeout');

      expect(error.message).toBe('Custom timeout');
    });
  });
});

describe('SEFAZ_STATUS Constants', () => {
  it('should have DistDFe status codes', () => {
    expect(SEFAZ_STATUS.NENHUM_DOC_LOCALIZADO).toBe('137');
    expect(SEFAZ_STATUS.DOC_LOCALIZADO).toBe('138');
    expect(SEFAZ_STATUS.CONSUMO_INDEVIDO).toBe('656');
  });

  it('should have evento status codes', () => {
    expect(SEFAZ_STATUS.EVENTO_REGISTRADO).toBe('135');
    expect(SEFAZ_STATUS.EVENTO_REGISTRADO_NAO_VINCULADO).toBe('136');
    // EVENTO_DUPLICADO não é mais uma constante definida
  });

  it('should have general status codes', () => {
    expect(SEFAZ_STATUS.AUTORIZADO).toBe('100');
    expect(SEFAZ_STATUS.CANCELADO).toBe('101');
    expect(SEFAZ_STATUS.USO_DENEGADO).toBe('110');
    expect(SEFAZ_STATUS.INUTILIZADO).toBe('102');
  });
});

describe('MANIFESTACAO_DESCRICOES', () => {
  it('should have all manifestacao types', () => {
    expect(MANIFESTACAO_DESCRICOES['210200']).toBe('Confirmacao da Operacao');
    expect(MANIFESTACAO_DESCRICOES['210210']).toBe('Ciencia da Operacao');
    expect(MANIFESTACAO_DESCRICOES['210220']).toBe('Desconhecimento da Operacao');
    expect(MANIFESTACAO_DESCRICOES['210240']).toBe('Operacao nao Realizada');
  });
});
