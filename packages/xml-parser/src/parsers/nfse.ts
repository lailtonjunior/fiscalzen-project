import { createParser, parseDate, parseDecimal, extractCnpjCpf, buildSearchContent } from '../utils';
import type { DocumentStatus } from '../types';

export type AbrasfVersion = '1.00' | '2.02' | '2.03' | '2.04' | 'unknown';

export interface NFSeData {
  tipo: 'NFSE';
  chave?: string;
  numero: number;
  serie: number;
  dataEmissao: Date;
  emitente: {
    cnpj: string;
    razaoSocial: string;
    inscricaoMunicipal: string;
    codigoMunicipio: string;
  };
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
    inscricaoMunicipal?: string;
  };
  servico: {
    itemListaServico: string;
    codigoCnae?: string;
    discriminacao: string;
    codigoMunicipio?: string;
  };
  valores: {
    valorServicos: number;
    valorDeducoes: number;
    valorPis?: number;
    valorCofins?: number;
    valorInss?: number;
    valorIr?: number;
    valorCsll?: number;
    issRetido: boolean;
    valorIss?: number;
    valorIssRetido?: number;
    baseCalculo?: number;
    aliquota?: number;
    valorLiquido: number;
  };
  valorTotal: number;
  valorServicos: number;
  valorDeducoes: number;
  valorLiquido: number;
  situacao: DocumentStatus;
  abrasfVersion: AbrasfVersion;
  metadata: Record<string, unknown>;
  searchContent: string;
}

export function parseNFSe(xml: string): NFSeData {
  const parser = createParser();
  const parsed = parser.parse(xml);

  // Find the main NFSe structure (ABRASF format)
  let nfse = parsed.CompNfse?.Nfse?.InfNfse ||
             parsed.Nfse?.InfNfse ||
             parsed.tcCompNfse?.Nfse?.InfNfse ||
             parsed.ListaNfse?.CompNfse?.Nfse?.InfNfse;

  if (!nfse) {
    // Try other common structures
    const consultaResp = parsed.ConsultarNfseResposta;
    if (consultaResp?.ListaNfse?.CompNfse?.Nfse?.InfNfse) {
      nfse = consultaResp.ListaNfse.CompNfse.Nfse.InfNfse;
    }
  }

  if (!nfse) {
    throw new Error('XML não é uma NFSe válida (estrutura ABRASF não encontrada)');
  }

  const declaracaoPrestacaoServico = nfse.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico ||
                                      nfse.InfDeclaracaoPrestacaoServico;
  const prestador = declaracaoPrestacaoServico?.Prestador ||
                   nfse.PrestadorServico ||
                   nfse.Prestador;
  const tomador = declaracaoPrestacaoServico?.Tomador ||
                  nfse.TomadorServico ||
                  nfse.Tomador;
  const servico = declaracaoPrestacaoServico?.Servico ||
                  nfse.Servico;
  const valores = servico?.Valores || nfse.ValoresNfse || {};

  // Detect ABRASF version
  const abrasfVersion = detectAbrasfVersion(xml);

  // Build search content
  const searchContent = buildSearchContent([
    prestador?.RazaoSocial,
    prestador?.IdentificacaoPrestador?.CpfCnpj?.Cnpj,
    tomador?.RazaoSocial,
    tomador?.IdentificacaoTomador?.CpfCnpj?.Cnpj || tomador?.IdentificacaoTomador?.CpfCnpj?.Cpf,
    servico?.Discriminacao,
    String(nfse.Numero),
  ]);

  const valorServicos = parseDecimal(valores.ValorServicos);
  const valorDeducoes = parseDecimal(valores.ValorDeducoes);
  const valorLiquido = parseDecimal(valores.ValorLiquidoNfse || valores.ValorServicos);

  return {
    tipo: 'NFSE',
    numero: parseInt(String(nfse.Numero), 10),
    serie: 0, // NFSe typically doesn't have series
    dataEmissao: parseDate(nfse.DataEmissao || nfse.DataEmissaoRps),
    emitente: {
      cnpj: String(prestador?.IdentificacaoPrestador?.CpfCnpj?.Cnpj || ''),
      razaoSocial: String(prestador?.RazaoSocial || ''),
      inscricaoMunicipal: String(prestador?.IdentificacaoPrestador?.InscricaoMunicipal || ''),
      codigoMunicipio: String(nfse.OrgaoGerador?.CodigoMunicipio || prestador?.Endereco?.CodigoMunicipio || ''),
    },
    destinatario: {
      cnpjCpf: extractCnpjCpf(tomador?.IdentificacaoTomador?.CpfCnpj || {}),
      razaoSocial: String(tomador?.RazaoSocial || ''),
      inscricaoMunicipal: tomador?.IdentificacaoTomador?.InscricaoMunicipal,
    },
    servico: {
      itemListaServico: String(servico?.ItemListaServico || ''),
      codigoCnae: servico?.CodigoCnae,
      discriminacao: String(servico?.Discriminacao || ''),
      codigoMunicipio: servico?.CodigoMunicipio,
    },
    valores: {
      valorServicos,
      valorDeducoes,
      valorPis: parseDecimal(valores.ValorPis),
      valorCofins: parseDecimal(valores.ValorCofins),
      valorInss: parseDecimal(valores.ValorInss),
      valorIr: parseDecimal(valores.ValorIr),
      valorCsll: parseDecimal(valores.ValorCsll),
      issRetido: valores.IssRetido === '1' || valores.IssRetido === 'true' || valores.IssRetido === true,
      valorIss: parseDecimal(valores.ValorIss),
      valorIssRetido: parseDecimal(valores.ValorIssRetido),
      baseCalculo: parseDecimal(valores.BaseCalculo),
      aliquota: parseDecimal(valores.Aliquota),
      valorLiquido,
    },
    valorTotal: valorServicos,
    valorServicos,
    valorDeducoes,
    valorLiquido,
    situacao: 'autorizada',
    abrasfVersion,
    metadata: {
      codigoVerificacao: nfse.CodigoVerificacao,
      naturezaOperacao: nfse.NaturezaOperacao,
      optanteSimplesNacional: nfse.OptanteSimplesNacional,
      incentivoFiscal: nfse.IncentivoFiscal,
      competencia: nfse.Competencia,
      itemListaServico: servico?.ItemListaServico,
      codigoCnae: servico?.CodigoCnae,
      codigoTributacaoMunicipio: servico?.CodigoTributacaoMunicipio,
      discriminacao: servico?.Discriminacao,
      aliquota: valores.Aliquota,
      exigibilidadeIss: servico?.ExigibilidadeISS,
    },
    searchContent,
  };
}

/**
 * Detect ABRASF version from XML
 */
export function detectAbrasfVersion(xml: string): AbrasfVersion {
  // Check for versao attribute in cabecalho
  const versaoMatch = xml.match(/versao\s*=\s*["'](\d+\.\d+)["']/);
  if (versaoMatch) {
    const version = versaoMatch[1];
    if (['1.00', '2.02', '2.03', '2.04'].includes(version)) {
      return version as AbrasfVersion;
    }
  }

  // Check for versaoDados in cabecalho
  const versaoDadosMatch = xml.match(/<versaoDados>(\d+\.\d+)<\/versaoDados>/);
  if (versaoDadosMatch) {
    const version = versaoDadosMatch[1];
    if (['1.00', '2.02', '2.03', '2.04'].includes(version)) {
      return version as AbrasfVersion;
    }
  }

  // Check for specific namespace patterns
  if (xml.includes('xmlns="http://www.abrasf.org.br/nfse.xsd"')) {
    // Could be 2.02, 2.03, or 2.04
    if (xml.includes('ValorLiquidoNfse')) {
      return '2.04';
    }
    return '2.02';
  }

  if (xml.includes('xmlns:tc="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd"')) {
    return '1.00';
  }

  return 'unknown';
}
