import type { MunicipioConfig } from './types.js';

// ============================================
// Registro de Municípios Suportados
// ============================================

export const MUNICIPIOS: Record<string, MunicipioConfig> = {
  // São Paulo - Capital
  '3550308': {
    codigo: '3550308',
    nome: 'Sao Paulo',
    uf: 'SP',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx',
      homologacao: 'https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx',
    },
    particularidades: {
      namespaceCustom: 'http://www.prefeitura.sp.gov.br/nfe',
      requiresInscricaoMunicipal: true,
    },
  },

  // Rio de Janeiro - Capital (Nota Carioca)
  '3304557': {
    codigo: '3304557',
    nome: 'Rio de Janeiro',
    uf: 'RJ',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://notacarioca.rio.gov.br/WSNacional/nfse.asmx',
      homologacao: 'https://homologacao.notacarioca.rio.gov.br/WSNacional/nfse.asmx',
    },
  },

  // Belo Horizonte
  '3106200': {
    codigo: '3106200',
    nome: 'Belo Horizonte',
    uf: 'MG',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://bhissdigital.pbh.gov.br/bhiss-ws/nfse',
      homologacao: 'https://bhisshomologa.pbh.gov.br/bhiss-ws/nfse',
    },
  },

  // Curitiba
  '4106902': {
    codigo: '4106902',
    nome: 'Curitiba',
    uf: 'PR',
    tipo: 'abrasf',
    versaoAbrasf: '2.03',
    endpoints: {
      producao: 'https://isscuritiba.curitiba.pr.gov.br/Iss.NfseWebService/nfsews.asmx',
      homologacao: 'https://pilotoisscuritiba.curitiba.pr.gov.br/nfse_ws/nfsews.asmx',
    },
  },

  // Porto Alegre
  '4314902': {
    codigo: '4314902',
    nome: 'Porto Alegre',
    uf: 'RS',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfse.portoalegre.rs.gov.br/nfseserv/webservice/principal',
      homologacao: 'https://nfse-teste.procempa.com.br/nfseserv/webservice/principal',
    },
  },

  // Brasília
  '5300108': {
    codigo: '5300108',
    nome: 'Brasilia',
    uf: 'DF',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfse.fazenda.df.gov.br/NfseWs/NfseWsService',
      homologacao: 'https://nfse-homolog.fazenda.df.gov.br/NfseWs/NfseWsService',
    },
  },

  // Salvador
  '2927408': {
    codigo: '2927408',
    nome: 'Salvador',
    uf: 'BA',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfse.salvador.ba.gov.br/rps/NFSE',
      homologacao: 'https://nfsehml.salvador.ba.gov.br/rps/NFSE',
    },
  },

  // Recife
  '2611606': {
    codigo: '2611606',
    nome: 'Recife',
    uf: 'PE',
    tipo: 'abrasf',
    versaoAbrasf: '2.02',
    endpoints: {
      producao: 'https://nfse.recife.pe.gov.br/nfseservice.svc',
      homologacao: 'https://nfsehomolog.recife.pe.gov.br/nfseservice.svc',
    },
  },

  // Fortaleza
  '2304400': {
    codigo: '2304400',
    nome: 'Fortaleza',
    uf: 'CE',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://iss.fortaleza.ce.gov.br/grpfor/nfse.asmx',
      homologacao: 'https://isshomolog.sefin.fortaleza.ce.gov.br/grpfor/nfse.asmx',
    },
  },

  // Campinas
  '3509502': {
    codigo: '3509502',
    nome: 'Campinas',
    uf: 'SP',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfse.campinas.sp.gov.br/NotaFiscal/webservice/NFServicos',
      homologacao: 'https://nfse-homologacao.campinas.sp.gov.br/NotaFiscal/webservice/NFServicos',
    },
  },

  // Guarulhos
  '3518800': {
    codigo: '3518800',
    nome: 'Guarulhos',
    uf: 'SP',
    tipo: 'abrasf',
    versaoAbrasf: '2.02',
    endpoints: {
      producao: 'https://nfe.guarulhos.sp.gov.br/webservices/nfse.asmx',
      homologacao: 'https://nfe-hom.guarulhos.sp.gov.br/webservices/nfse.asmx',
    },
  },

  // Goiânia
  '5208707': {
    codigo: '5208707',
    nome: 'Goiania',
    uf: 'GO',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://www.goiania.go.gov.br/sistemas/nfse/nfse_webservice/nfse.asmx',
      homologacao: 'https://nfse-homolog.goiania.go.gov.br/sistemas/nfse/nfse_webservice/nfse.asmx',
    },
  },

  // Manaus
  '1302603': {
    codigo: '1302603',
    nome: 'Manaus',
    uf: 'AM',
    tipo: 'rpa',
    particularidades: {
      usaToken: true,
    },
  },

  // Belém
  '1501402': {
    codigo: '1501402',
    nome: 'Belem',
    uf: 'PA',
    tipo: 'rpa',
  },

  // Florianópolis
  '4205407': {
    codigo: '4205407',
    nome: 'Florianopolis',
    uf: 'SC',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfps.pmf.sc.gov.br/nfse_ws/NfseWs.asmx',
      homologacao: 'https://nfps-h.pmf.sc.gov.br/nfse_ws/NfseWs.asmx',
    },
  },

  // Vitória
  '3205309': {
    codigo: '3205309',
    nome: 'Vitoria',
    uf: 'ES',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfse.vitoria.es.gov.br/webservice/nfse.asmx',
      homologacao: 'https://nfse-homolog.vitoria.es.gov.br/webservice/nfse.asmx',
    },
  },

  // Natal
  '2408102': {
    codigo: '2408102',
    nome: 'Natal',
    uf: 'RN',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfseweb.natal.rn.gov.br:8443/nfse-ws/nfse',
      homologacao: 'https://nfseweb-hom.natal.rn.gov.br:8443/nfse-ws/nfse',
    },
  },

  // João Pessoa
  '2507507': {
    codigo: '2507507',
    nome: 'Joao Pessoa',
    uf: 'PB',
    tipo: 'abrasf',
    versaoAbrasf: '2.04',
    endpoints: {
      producao: 'https://nfse.joaopessoa.pb.gov.br/nfse.asmx',
      homologacao: 'https://nfse-hom.joaopessoa.pb.gov.br/nfse.asmx',
    },
  },

  // Teresina
  '2211001': {
    codigo: '2211001',
    nome: 'Teresina',
    uf: 'PI',
    tipo: 'rpa',
  },

  // São Luís
  '2111300': {
    codigo: '2111300',
    nome: 'Sao Luis',
    uf: 'MA',
    tipo: 'rpa',
  },
};

// ============================================
// Helper Functions
// ============================================

export function getMunicipioConfig(codigoIbge: string): MunicipioConfig | null {
  return MUNICIPIOS[codigoIbge] || null;
}

export function isMunicipioSuportado(codigoIbge: string): boolean {
  const config = getMunicipioConfig(codigoIbge);
  return config !== null && config.tipo !== 'nao_suportado';
}

export function getMunicipiosByUf(uf: string): MunicipioConfig[] {
  return Object.values(MUNICIPIOS).filter((m) => m.uf === uf);
}

export function getMunicipiosByTipo(tipo: 'abrasf' | 'rpa'): MunicipioConfig[] {
  return Object.values(MUNICIPIOS).filter((m) => m.tipo === tipo);
}

export function getAllMunicipios(): MunicipioConfig[] {
  return Object.values(MUNICIPIOS);
}

export function searchMunicipios(query: string): MunicipioConfig[] {
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return Object.values(MUNICIPIOS).filter((m) => {
    const normalizedNome = m.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedNome.includes(normalizedQuery) || m.codigo.includes(query);
  });
}
