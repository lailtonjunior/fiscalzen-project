import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import * as https from 'https';
import { format } from 'date-fns';
import type {
  MunicipioConfig,
  CertificadoA1,
  ConsultaNfseServicoTomadoParams,
  ConsultaNfseServicoPrestadoParams,
  ConsultaNfsePorFaixaParams,
  NfseConsultaResponse,
  ParsedNfse,
  NfseErro,
} from '../types';

// ============================================
// XML Namespaces
// ============================================

const ABRASF_NAMESPACE = 'http://www.abrasf.org.br/nfse.xsd';

// ============================================
// ABRASF Client
// ============================================

export class AbrasfClient {
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor(
    protected config: MunicipioConfig,
    protected certificado: CertificadoA1,
    protected ambiente: 'producao' | 'homologacao' = 'producao'
  ) {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true,
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });
  }

  // ============================================
  // Public Methods
  // ============================================

  async consultarNfseServicoTomado(
    params: ConsultaNfseServicoTomadoParams
  ): Promise<NfseConsultaResponse> {
    const xml = this.buildConsultaNfseServicoTomadoXml(params);
    const signedXml = await this.signXml(xml);
    const response = await this.sendRequest('ConsultarNfseServicoTomado', signedXml);
    return this.parseConsultaResponse(response);
  }

  async consultarNfseServicoPrestado(
    params: ConsultaNfseServicoPrestadoParams
  ): Promise<NfseConsultaResponse> {
    const xml = this.buildConsultaNfseServicoPrestadoXml(params);
    const signedXml = await this.signXml(xml);
    const response = await this.sendRequest('ConsultarNfseServicoPrestado', signedXml);
    return this.parseConsultaResponse(response);
  }

  async consultarNfsePorFaixa(
    params: ConsultaNfsePorFaixaParams
  ): Promise<NfseConsultaResponse> {
    const xml = this.buildConsultaNfsePorFaixaXml(params);
    const signedXml = await this.signXml(xml);
    const response = await this.sendRequest('ConsultarNfseFaixa', signedXml);
    return this.parseConsultaResponse(response);
  }

  async testarConexao(): Promise<{ success: boolean; message: string }> {
    try {
      // Try a simple request to test connectivity
      const endpoint = this.getEndpoint();
      const url = new URL(endpoint);

      return new Promise((resolve) => {
        const req = https.request(
          {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'GET',
            timeout: 10000,
          },
          (res) => {
            resolve({
              success: res.statusCode !== undefined && res.statusCode < 500,
              message: `Conexao estabelecida com ${this.config.nome}`,
            });
          }
        );

        req.on('error', (err) => {
          resolve({
            success: false,
            message: `Falha na conexao: ${err.message}`,
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            success: false,
            message: 'Timeout na conexao',
          });
        });

        req.end();
      });
    } catch (error) {
      return {
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  // ============================================
  // XML Building Methods
  // ============================================

  protected buildConsultaNfseServicoTomadoXml(params: ConsultaNfseServicoTomadoParams): string {
    const namespace = this.config.particularidades?.namespaceCustom || ABRASF_NAMESPACE;

    return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseServicoTomadoEnvio xmlns="${namespace}">
  <Consulente>
    <CpfCnpj>
      <Cnpj>${params.cnpjTomador}</Cnpj>
    </CpfCnpj>
  </Consulente>
  ${params.cnpjPrestador ? `
  <Prestador>
    <CpfCnpj>
      <Cnpj>${params.cnpjPrestador}</Cnpj>
    </CpfCnpj>
  </Prestador>` : ''}
  <PeriodoEmissao>
    <DataInicial>${this.formatDate(params.dataInicio)}</DataInicial>
    <DataFinal>${this.formatDate(params.dataFim)}</DataFinal>
  </PeriodoEmissao>
  <Pagina>${params.pagina || 1}</Pagina>
</ConsultarNfseServicoTomadoEnvio>`;
  }

  protected buildConsultaNfseServicoPrestadoXml(params: ConsultaNfseServicoPrestadoParams): string {
    const namespace = this.config.particularidades?.namespaceCustom || ABRASF_NAMESPACE;

    return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseServicoPrestadoEnvio xmlns="${namespace}">
  <Prestador>
    <CpfCnpj>
      <Cnpj>${params.cnpjPrestador}</Cnpj>
    </CpfCnpj>
  </Prestador>
  ${params.cnpjTomador ? `
  <Tomador>
    <CpfCnpj>
      <Cnpj>${params.cnpjTomador}</Cnpj>
    </CpfCnpj>
  </Tomador>` : ''}
  <PeriodoEmissao>
    <DataInicial>${this.formatDate(params.dataInicio)}</DataInicial>
    <DataFinal>${this.formatDate(params.dataFim)}</DataFinal>
  </PeriodoEmissao>
  <Pagina>${params.pagina || 1}</Pagina>
</ConsultarNfseServicoPrestadoEnvio>`;
  }

  protected buildConsultaNfsePorFaixaXml(params: ConsultaNfsePorFaixaParams): string {
    const namespace = this.config.particularidades?.namespaceCustom || ABRASF_NAMESPACE;

    return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseFaixaEnvio xmlns="${namespace}">
  <Prestador>
    <CpfCnpj>
      <Cnpj>${params.cnpjPrestador}</Cnpj>
    </CpfCnpj>
  </Prestador>
  <Faixa>
    <NumeroNfseInicial>${params.numeroInicial}</NumeroNfseInicial>
    <NumeroNfseFinal>${params.numeroFinal}</NumeroNfseFinal>
  </Faixa>
</ConsultarNfseFaixaEnvio>`;
  }

  protected buildSoapEnvelope(body: string, action: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${action} xmlns="${this.getServiceNamespace()}">
      <nfseCabecMsg>
        <![CDATA[<?xml version="1.0" encoding="UTF-8"?>
        <cabecalho xmlns="${ABRASF_NAMESPACE}" versao="${this.config.versaoAbrasf || '2.04'}">
          <versaoDados>${this.config.versaoAbrasf || '2.04'}</versaoDados>
        </cabecalho>]]>
      </nfseCabecMsg>
      <nfseDadosMsg>
        <![CDATA[${body}]]>
      </nfseDadosMsg>
    </${action}>
  </soap:Body>
</soap:Envelope>`;
  }

  // ============================================
  // Signing Methods
  // ============================================

  protected async signXml(xml: string): Promise<string> {
    // In a real implementation, this would use node-signpdf or similar
    // to sign the XML with the A1 certificate
    // For now, we return the XML as-is (signing should be implemented per municipality)
    return xml;
  }

  // ============================================
  // Request Methods
  // ============================================

  protected async sendRequest(action: string, xml: string): Promise<string> {
    const endpoint = this.getEndpoint();
    const soapEnvelope = this.buildSoapEnvelope(xml, action);

    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);

      // Load certificate for mutual TLS
      const pfx = this.certificado.pfxBuffer;
      const passphrase = this.certificado.password;

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(soapEnvelope, 'utf8'),
          'SOAPAction': this.getSoapAction(action),
        },
        pfx,
        passphrase,
        rejectUnauthorized: true,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(soapEnvelope);
      req.end();
    });
  }

  // ============================================
  // Response Parsing
  // ============================================

  protected parseConsultaResponse(responseXml: string): NfseConsultaResponse {
    try {
      const parsed = this.parser.parse(responseXml);

      // Extract SOAP body
      const envelope = parsed['soap:Envelope'] || parsed['Envelope'] || parsed;
      const body = envelope['soap:Body'] || envelope['Body'] || envelope;

      // Find the response element
      const responseElement = this.findResponseElement(body);

      if (!responseElement) {
        return {
          success: false,
          nfses: [],
          erros: [{ codigo: 'PARSE_ERROR', mensagem: 'Resposta invalida' }],
        };
      }

      // Check for errors
      const listaMensagemRetorno = responseElement.ListaMensagemRetorno;
      if (listaMensagemRetorno) {
        const erros = this.parseErros(listaMensagemRetorno);
        if (erros.length > 0 && erros.some((e) => e.codigo.startsWith('E'))) {
          return {
            success: false,
            nfses: [],
            erros,
          };
        }
      }

      // Parse NFSe list
      const listaNfse = responseElement.ListaNfse || responseElement.CompNfse;
      const nfses = this.parseNfseList(listaNfse);

      // Get pagination info
      const proximaPagina = responseElement.ProximaPagina;

      return {
        success: true,
        nfses,
        proximaPagina: proximaPagina ? parseInt(proximaPagina, 10) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        nfses: [],
        erros: [{
          codigo: 'PARSE_ERROR',
          mensagem: error instanceof Error ? error.message : 'Erro ao processar resposta',
        }],
      };
    }
  }

  protected findResponseElement(body: any): any {
    // Try common response element names
    const responseNames = [
      'ConsultarNfseServicoTomadoResponse',
      'ConsultarNfseServicoPrestadoResponse',
      'ConsultarNfseFaixaResponse',
      'ConsultarNfseResposta',
    ];

    for (const name of responseNames) {
      if (body[name]) {
        return body[name];
      }
    }

    // Try to find any Response element
    for (const key of Object.keys(body)) {
      if (key.includes('Response') || key.includes('Resposta')) {
        return body[key];
      }
    }

    return null;
  }

  protected parseErros(listaMensagem: any): NfseErro[] {
    if (!listaMensagem) return [];

    const mensagens = Array.isArray(listaMensagem.MensagemRetorno)
      ? listaMensagem.MensagemRetorno
      : [listaMensagem.MensagemRetorno];

    return mensagens
      .filter((m: any) => m)
      .map((m: any) => ({
        codigo: m.Codigo || '',
        mensagem: m.Mensagem || '',
        correcao: m.Correcao,
      }));
  }

  protected parseNfseList(listaNfse: any): ParsedNfse[] {
    if (!listaNfse) return [];

    const items = Array.isArray(listaNfse) ? listaNfse : [listaNfse];

    return items
      .filter((item: any) => item)
      .map((item: any) => this.parseNfse(item.Nfse || item.CompNfse?.Nfse || item));
  }

  protected parseNfse(nfse: any): ParsedNfse {
    const infNfse = nfse.InfNfse || nfse;
    const valores = infNfse.ValoresNfse || infNfse.Servico?.Valores || {};
    const servico = infNfse.Servico || {};
    const prestador = infNfse.PrestadorServico || infNfse.Prestador || {};
    const tomador = infNfse.TomadorServico || infNfse.Tomador || {};

    return {
      identificacao: {
        numero: String(infNfse.Numero || ''),
        codigoVerificacao: String(infNfse.CodigoVerificacao || ''),
        dataEmissao: new Date(infNfse.DataEmissao || Date.now()),
        competencia: String(infNfse.Competencia || ''),
      },
      prestador: {
        cnpj: this.extractCpfCnpj(prestador.IdentificacaoPrestador || prestador),
        inscricaoMunicipal: prestador.IdentificacaoPrestador?.InscricaoMunicipal || '',
        razaoSocial: prestador.RazaoSocial || '',
        nomeFantasia: prestador.NomeFantasia,
        endereco: this.parseEndereco(prestador.Endereco),
        contato: this.parseContato(prestador.Contato),
      },
      tomador: {
        cpfCnpj: this.extractCpfCnpj(tomador.IdentificacaoTomador || tomador),
        inscricaoMunicipal: tomador.IdentificacaoTomador?.InscricaoMunicipal,
        razaoSocial: tomador.RazaoSocial || '',
        endereco: this.parseEndereco(tomador.Endereco),
        contato: this.parseContato(tomador.Contato),
      },
      servico: {
        itemListaServico: servico.ItemListaServico || '',
        codigoCnae: servico.CodigoCnae,
        discriminacao: servico.Discriminacao || '',
        codigoMunicipio: servico.CodigoMunicipio || '',
        exigibilidadeIss: servico.ExigibilidadeISS || '1',
      },
      valores: {
        valorServicos: this.parseDecimal(valores.ValorServicos),
        valorDeducoes: this.parseDecimal(valores.ValorDeducoes),
        valorPis: this.parseDecimal(valores.ValorPis),
        valorCofins: this.parseDecimal(valores.ValorCofins),
        valorInss: this.parseDecimal(valores.ValorInss),
        valorIr: this.parseDecimal(valores.ValorIr),
        valorCsll: this.parseDecimal(valores.ValorCsll),
        issRetido: valores.IssRetido === '1' || valores.IssRetido === 'true',
        valorIss: this.parseDecimal(valores.ValorIss),
        valorIssRetido: this.parseDecimal(valores.ValorIssRetido),
        outrasRetencoes: this.parseDecimal(valores.OutrasRetencoes),
        baseCalculo: this.parseDecimal(valores.BaseCalculo),
        aliquota: this.parseDecimal(valores.Aliquota),
        valorLiquidoNfse: this.parseDecimal(valores.ValorLiquidoNfse),
        descontoIncondicionado: this.parseDecimal(valores.DescontoIncondicionado),
        descontoCondicionado: this.parseDecimal(valores.DescontoCondicionado),
      },
      optanteSimplesNacional: infNfse.OptanteSimplesNacional === '1',
      incentivoFiscal: infNfse.IncentivoFiscal === '1',
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  protected getEndpoint(): string {
    if (!this.config.endpoints) {
      throw new Error(`Endpoints not configured for ${this.config.nome}`);
    }
    return this.ambiente === 'producao'
      ? this.config.endpoints.producao
      : this.config.endpoints.homologacao;
  }

  protected getServiceNamespace(): string {
    return this.config.particularidades?.namespaceCustom || ABRASF_NAMESPACE;
  }

  protected getSoapAction(action: string): string {
    if (this.config.particularidades?.soapAction) {
      return `${this.config.particularidades.soapAction}/${action}`;
    }
    return `${this.getServiceNamespace()}/${action}`;
  }

  protected formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  protected extractCpfCnpj(obj: any): string {
    if (!obj) return '';
    if (obj.CpfCnpj) {
      return obj.CpfCnpj.Cnpj || obj.CpfCnpj.Cpf || '';
    }
    return obj.Cnpj || obj.Cpf || '';
  }

  protected parseEndereco(endereco: any): any {
    if (!endereco) return undefined;
    return {
      logradouro: endereco.Endereco || endereco.Logradouro,
      numero: endereco.Numero,
      complemento: endereco.Complemento,
      bairro: endereco.Bairro,
      codigoMunicipio: endereco.CodigoMunicipio,
      uf: endereco.Uf,
      cep: endereco.Cep,
    };
  }

  protected parseContato(contato: any): any {
    if (!contato) return undefined;
    return {
      telefone: contato.Telefone,
      email: contato.Email,
    };
  }

  protected parseDecimal(value: any): number {
    if (value === undefined || value === null) return 0;
    const parsed = parseFloat(String(value).replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
}
