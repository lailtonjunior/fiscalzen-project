import { Page } from 'playwright';
import { BaseNfseScraper } from '../base-scraper';
import type {
  MunicipioConfig,
  NfseCredentials,
  NfseRpaResult,
  ConsultaParams,
} from '../../types';

// ============================================
// Template Scraper for New Municipalities
// ============================================

/**
 * This is a template for implementing RPA scrapers for new municipalities.
 * Copy this file and customize for each municipality's portal.
 *
 * Steps:
 * 1. Copy this file to a new file named after the municipality
 * 2. Update TEMPLATE_CONFIG with the municipality's details
 * 3. Implement the abstract methods based on the portal's structure
 * 4. Register the scraper in the factory
 */

export const TEMPLATE_CONFIG: MunicipioConfig = {
  codigo: '0000000', // Replace with IBGE code
  nome: 'Template Municipality',
  uf: 'XX',
  tipo: 'rpa',
  particularidades: {
    usaToken: false, // Set to true if portal uses additional tokens
  },
};

export class TemplateScraper extends BaseNfseScraper {
  private baseUrl = 'https://nfse.example.gov.br'; // Replace with actual URL

  constructor(page: Page) {
    super(page, TEMPLATE_CONFIG);
  }

  // ============================================
  // Authentication
  // ============================================

  async login(credentials: NfseCredentials): Promise<void> {
    // Navigate to login page
    await this.page.goto(`${this.baseUrl}/login`);
    await this.waitForNavigation();

    // Fill login form
    // Customize these selectors based on the actual portal
    await this.fillInput('#username', credentials.login);
    await this.fillInput('#password', credentials.senha);

    // Handle additional fields if needed
    if (credentials.inscricaoMunicipal) {
      await this.fillInput('#inscricaoMunicipal', credentials.inscricaoMunicipal);
    }

    // Submit form
    await this.click('#btnLogin');
    await this.waitForNavigation();

    // Verify login success
    const isLoggedIn = await this.elementExists('#userMenu');
    if (!isLoggedIn) {
      throw new Error('Falha no login: credenciais invalidas');
    }
  }

  async logout(): Promise<void> {
    // Click logout button
    await this.click('#btnLogout');
    await this.waitForNavigation();
  }

  // ============================================
  // NFSe Consultation
  // ============================================

  async consultarNfseRecebidas(params: ConsultaParams): Promise<NfseRpaResult[]> {
    // Navigate to consultation page
    await this.page.goto(`${this.baseUrl}/consulta/recebidas`);
    await this.waitForNavigation();

    // Fill search form
    await this.fillInput('#dataInicio', this.formatDateBR(params.dataInicio));
    await this.fillInput('#dataFim', this.formatDateBR(params.dataFim));

    // Submit search
    await this.click('#btnBuscar');
    await this.waitForSelector('#tabelaResultados');

    // Extract results from table
    const results = await this.extractTableResults();

    return results;
  }

  async consultarNfseEmitidas(params: ConsultaParams): Promise<NfseRpaResult[]> {
    // Navigate to consultation page
    await this.page.goto(`${this.baseUrl}/consulta/emitidas`);
    await this.waitForNavigation();

    // Fill search form
    await this.fillInput('#dataInicio', this.formatDateBR(params.dataInicio));
    await this.fillInput('#dataFim', this.formatDateBR(params.dataFim));

    // Submit search
    await this.click('#btnBuscar');
    await this.waitForSelector('#tabelaResultados');

    // Extract results from table
    const results = await this.extractTableResults();

    return results;
  }

  // ============================================
  // XML Download
  // ============================================

  async downloadXml(nfse: NfseRpaResult): Promise<string> {
    // Navigate to NFSe details or use download URL
    if (nfse.downloadUrl) {
      const response = await this.page.goto(nfse.downloadUrl);
      return (await response?.text()) || '';
    }

    // Alternative: click download button on details page
    await this.page.goto(`${this.baseUrl}/nfse/${nfse.numero}/detalhes`);
    await this.waitForNavigation();

    // Wait for and trigger download
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.click('#btnDownloadXml'),
    ]);

    // Read downloaded file
    const path = await download.path();
    if (!path) {
      throw new Error('Falha ao baixar XML');
    }

    const content = await this.waitForDownload();
    return content.toString('utf-8');
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async extractTableResults(): Promise<NfseRpaResult[]> {
    const rows = await this.page.$$('#tabelaResultados tbody tr');
    const results: NfseRpaResult[] = [];

    for (const row of rows) {
      // Extract data from each column
      // Customize these selectors based on actual table structure
      const numero = await row.$eval('td:nth-child(1)', (el) => el.textContent?.trim() || '');
      const codigoVerificacao = await row.$eval('td:nth-child(2)', (el) => el.textContent?.trim() || '');
      const dataEmissao = await row.$eval('td:nth-child(3)', (el) => el.textContent?.trim() || '');
      const prestadorCnpj = await row.$eval('td:nth-child(4)', (el) => el.textContent?.trim() || '');
      const prestadorNome = await row.$eval('td:nth-child(5)', (el) => el.textContent?.trim() || '');
      const valorServico = await row.$eval('td:nth-child(6)', (el) => el.textContent?.trim() || '');

      // Get download link if available
      const downloadLink = await row.$('a[href*="xml"]');
      const downloadUrl = downloadLink
        ? await downloadLink.getAttribute('href')
        : undefined;

      results.push({
        numero,
        codigoVerificacao,
        dataEmissao,
        prestadorCnpj: this.cleanCnpj(prestadorCnpj),
        prestadorNome,
        valorServico,
        downloadUrl: downloadUrl || undefined,
      });
    }

    return results;
  }
}
