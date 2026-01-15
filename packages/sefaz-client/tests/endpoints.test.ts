import { describe, it, expect } from 'vitest';
import {
  NFE_DISTDFE_ENDPOINTS,
  NFE_RECEPCAO_EVENTO_ENDPOINTS,
  CTE_DISTDFE_ENDPOINTS,
  MDFE_DISTDFE_ENDPOINTS,
  UF_CODES,
  UF_FROM_CODE,
  getAmbienteCode,
  getUfCode,
  getUfFromCode,
  getNFeDistDFeEndpoint,
  getNFeEventoEndpoint,
  getCTeDistDFeEndpoint,
  getMDFeDistDFeEndpoint,
  SOAP_ACTIONS,
  SCHEMA_VERSIONS,
} from '../src/constants/endpoints';

describe('Endpoints', () => {
  describe('NFe Endpoints', () => {
    it('should have production and homologation URLs', () => {
      expect(NFE_DISTDFE_ENDPOINTS.producao).toContain('www1.nfe.fazenda.gov.br');
      expect(NFE_DISTDFE_ENDPOINTS.homologacao).toContain('hom1.nfe.fazenda.gov.br');
    });

    it('should get correct endpoint by ambiente', () => {
      expect(getNFeDistDFeEndpoint('producao')).toBe(NFE_DISTDFE_ENDPOINTS.producao);
      expect(getNFeDistDFeEndpoint('homologacao')).toBe(NFE_DISTDFE_ENDPOINTS.homologacao);
    });

    it('should have evento endpoints', () => {
      expect(getNFeEventoEndpoint('producao')).toContain('NFeRecepcaoEvento');
      expect(getNFeEventoEndpoint('homologacao')).toContain('NFeRecepcaoEvento');
    });
  });

  describe('CTe Endpoints', () => {
    it('should have production and homologation URLs', () => {
      expect(CTE_DISTDFE_ENDPOINTS.producao).toContain('cte.fazenda.gov.br');
      expect(CTE_DISTDFE_ENDPOINTS.homologacao).toContain('cte.fazenda.gov.br');
    });

    it('should get correct endpoint by ambiente', () => {
      expect(getCTeDistDFeEndpoint('producao')).toBe(CTE_DISTDFE_ENDPOINTS.producao);
      expect(getCTeDistDFeEndpoint('homologacao')).toBe(CTE_DISTDFE_ENDPOINTS.homologacao);
    });
  });

  describe('MDFe Endpoints', () => {
    it('should have production and homologation URLs', () => {
      expect(MDFE_DISTDFE_ENDPOINTS.producao).toContain('mdfe.svrs.rs.gov.br');
      expect(MDFE_DISTDFE_ENDPOINTS.homologacao).toContain('mdfe-homologacao');
    });

    it('should get correct endpoint by ambiente', () => {
      expect(getMDFeDistDFeEndpoint('producao')).toBe(MDFE_DISTDFE_ENDPOINTS.producao);
      expect(getMDFeDistDFeEndpoint('homologacao')).toBe(MDFE_DISTDFE_ENDPOINTS.homologacao);
    });
  });
});

describe('UF Codes', () => {
  it('should have all Brazilian states', () => {
    expect(UF_CODES.SP).toBe(35);
    expect(UF_CODES.RJ).toBe(33);
    expect(UF_CODES.MG).toBe(31);
    expect(UF_CODES.RS).toBe(43);
    expect(UF_CODES.PR).toBe(41);
    expect(UF_CODES.BA).toBe(29);
    expect(UF_CODES.AN).toBe(91); // Ambiente Nacional
  });

  it('should have reverse mapping', () => {
    expect(UF_FROM_CODE[35]).toBe('SP');
    expect(UF_FROM_CODE[33]).toBe('RJ');
    expect(UF_FROM_CODE[91]).toBe('AN');
  });

  it('should get UF code correctly', () => {
    expect(getUfCode('SP')).toBe(35);
    expect(getUfCode('sp')).toBe(35); // Case insensitive
    expect(getUfCode('XX')).toBeUndefined();
  });

  it('should get UF from code correctly', () => {
    expect(getUfFromCode(35)).toBe('SP');
    expect(getUfFromCode(999)).toBeUndefined();
  });
});

describe('Ambiente Code', () => {
  it('should return 1 for producao', () => {
    expect(getAmbienteCode('producao')).toBe('1');
  });

  it('should return 2 for homologacao', () => {
    expect(getAmbienteCode('homologacao')).toBe('2');
  });
});

describe('SOAP Actions', () => {
  it('should have all required actions', () => {
    expect(SOAP_ACTIONS.nfeDistDFe).toContain('nfeDistDFeInteresse');
    expect(SOAP_ACTIONS.nfeRecepcaoEvento).toContain('nfeRecepcaoEvento');
    expect(SOAP_ACTIONS.cteDistDFe).toContain('cteDistDFeInteresse');
    expect(SOAP_ACTIONS.mdfeDistDFe).toContain('mdfeDistDFeInteresse');
  });
});

describe('Schema Versions', () => {
  it('should have correct versions', () => {
    expect(SCHEMA_VERSIONS.nfe).toBe('4.00');
    expect(SCHEMA_VERSIONS.cte).toBe('4.00');
    expect(SCHEMA_VERSIONS.mdfe).toBe('3.00');
    expect(SCHEMA_VERSIONS.distDFe).toBe('1.01');
    expect(SCHEMA_VERSIONS.evento).toBe('1.00');
  });
});
