// ============================================
// Município Types
// ============================================

export type AbrasfVersion = '1.00' | '2.02' | '2.03' | '2.04';
export type MunicipioTipo = 'abrasf' | 'rpa' | 'nao_suportado';

export interface MunicipioEndpoints {
  producao: string;
  homologacao: string;
}

export interface MunicipioParticularidades {
  usaToken?: boolean;
  namespaceCustom?: string;
  camposExtras?: string[];
  requiresInscricaoMunicipal?: boolean;
  soapAction?: string;
}

export interface MunicipioConfig {
  codigo: string;
  nome: string;
  uf: string;
  tipo: MunicipioTipo;
  versaoAbrasf?: AbrasfVersion;
  endpoints?: MunicipioEndpoints;
  particularidades?: MunicipioParticularidades;
}

// ============================================
// Certificado Types
// ============================================

export interface CertificadoA1 {
  pfxBuffer: Buffer;
  password: string;
  serialNumber?: string;
  validFrom?: Date;
  validTo?: Date;
}

// ============================================
// NFSe Types
// ============================================

export interface NfseIdentificacao {
  numero: string;
  codigoVerificacao: string;
  dataEmissao: Date;
  competencia: string;
}

export interface NfsePrestador {
  cnpj: string;
  inscricaoMunicipal?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco?: NfseEndereco;
  contato?: NfseContato;
}

export interface NfseTomador {
  cpfCnpj: string;
  inscricaoMunicipal?: string;
  razaoSocial: string;
  endereco?: NfseEndereco;
  contato?: NfseContato;
}

export interface NfseEndereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  codigoMunicipio?: string;
  nomeMunicipio?: string;
  uf?: string;
  cep?: string;
}

export interface NfseContato {
  telefone?: string;
  email?: string;
}

export interface NfseServico {
  itemListaServico: string;
  codigoCnae?: string;
  discriminacao: string;
  codigoMunicipio: string;
  codigoPais?: string;
  exigibilidadeIss: string;
}

export interface NfseValores {
  valorServicos: number;
  valorDeducoes?: number;
  valorPis?: number;
  valorCofins?: number;
  valorInss?: number;
  valorIr?: number;
  valorCsll?: number;
  issRetido: boolean;
  valorIss?: number;
  valorIssRetido?: number;
  outrasRetencoes?: number;
  baseCalculo?: number;
  aliquota?: number;
  valorLiquidoNfse?: number;
  descontoIncondicionado?: number;
  descontoCondicionado?: number;
}

export interface ParsedNfse {
  identificacao: NfseIdentificacao;
  prestador: NfsePrestador;
  tomador: NfseTomador;
  servico: NfseServico;
  valores: NfseValores;
  optanteSimplesNacional: boolean;
  incentivoFiscal: boolean;
  xml?: string;
}

// ============================================
// Consulta Types
// ============================================

export interface ConsultaParams {
  dataInicio: Date;
  dataFim: Date;
  pagina?: number;
}

export interface ConsultaNfseServicoTomadoParams extends ConsultaParams {
  cnpjTomador: string;
  cnpjPrestador?: string;
  cnpjIntermediario?: string;
}

export interface ConsultaNfseServicoPrestadoParams extends ConsultaParams {
  cnpjPrestador: string;
  cnpjTomador?: string;
  cnpjIntermediario?: string;
}

export interface ConsultaNfsePorFaixaParams {
  cnpjPrestador: string;
  numeroInicial: number;
  numeroFinal: number;
}

export interface NfseConsultaResponse {
  success: boolean;
  nfses: ParsedNfse[];
  proximaPagina?: number;
  totalPaginas?: number;
  mensagemRetorno?: string;
  erros?: NfseErro[];
}

export interface NfseErro {
  codigo: string;
  mensagem: string;
  correcao?: string;
}

// ============================================
// RPA Types
// ============================================

export interface NfseCredentials {
  login: string;
  senha: string;
  inscricaoMunicipal?: string;
  token?: string;
}

export interface NfseRpaResult {
  numero: string;
  codigoVerificacao: string;
  dataEmissao: string;
  prestadorCnpj: string;
  prestadorNome: string;
  valorServico: string;
  valorIss?: string;
  downloadUrl?: string;
}

// ============================================
// Response Types
// ============================================

export interface NfseTestConnectionResult {
  success: boolean;
  message: string;
  municipioNome?: string;
  versaoAbrasf?: string;
}
