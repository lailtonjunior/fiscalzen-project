import { Page } from 'playwright';
import type {
  MunicipioConfig,
  NfseCredentials,
  NfseRpaResult,
  ConsultaParams,
} from '../types';

// ============================================
// Base NFSe Scraper
// ============================================

export abstract class BaseNfseScraper {
  protected page: Page;
  protected config: MunicipioConfig;
  protected defaultTimeout: number = 30000;

  constructor(page: Page, config: MunicipioConfig) {
    this.page = page;
    this.config = config;
  }

  // ============================================
  // Abstract Methods (must be implemented by each municipality)
  // ============================================

  /**
   * Login to the municipality NFSe portal
   */
  abstract login(credentials: NfseCredentials): Promise<void>;

  /**
   * Consult received NFSe (tomador)
   */
  abstract consultarNfseRecebidas(params: ConsultaParams): Promise<NfseRpaResult[]>;

  /**
   * Consult issued NFSe (prestador)
   */
  abstract consultarNfseEmitidas(params: ConsultaParams): Promise<NfseRpaResult[]>;

  /**
   * Download XML of a specific NFSe
   */
  abstract downloadXml(nfse: NfseRpaResult): Promise<string>;

  /**
   * Logout from the portal
   */
  abstract logout(): Promise<void>;

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Wait for a selector to appear
   */
  protected async waitForSelector(
    selector: string,
    options?: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' }
  ): Promise<void> {
    await this.page.waitForSelector(selector, {
      timeout: options?.timeout ?? this.defaultTimeout,
      state: options?.state ?? 'visible',
    });
  }

  /**
   * Fill an input field
   */
  protected async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  /**
   * Click an element
   */
  protected async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  /**
   * Wait for navigation
   */
  protected async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a specific URL pattern
   */
  protected async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: this.defaultTimeout });
  }

  /**
   * Take a screenshot for debugging
   */
  protected async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Extract text from an element
   */
  protected async getText(selector: string): Promise<string> {
    const element = await this.page.$(selector);
    if (!element) return '';
    return (await element.textContent()) || '';
  }

  /**
   * Extract data from a table
   */
  protected async extractTable(
    tableSelector: string,
    columnSelectors: Record<string, string>
  ): Promise<Record<string, string>[]> {
    const rows = await this.page.$$(`${tableSelector} tbody tr`);
    const results: Record<string, string>[] = [];

    for (const row of rows) {
      const rowData: Record<string, string> = {};

      for (const [key, selector] of Object.entries(columnSelectors)) {
        const cell = await row.$(selector);
        rowData[key] = cell ? ((await cell.textContent()) || '').trim() : '';
      }

      results.push(rowData);
    }

    return results;
  }

  /**
   * Handle alerts/popups
   */
  protected async handleDialog(action: 'accept' | 'dismiss' = 'accept'): Promise<void> {
    this.page.on('dialog', async (dialog) => {
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Wait for download and return file content
   */
  protected async waitForDownload(): Promise<Buffer> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
    ]);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream?.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream?.on('end', () => resolve(Buffer.concat(chunks)));
      stream?.on('error', reject);
    });
  }

  /**
   * Format date for input fields (DD/MM/YYYY format common in Brazil)
   */
  protected formatDateBR(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Clean CNPJ string (remove formatting)
   */
  protected cleanCnpj(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  /**
   * Parse Brazilian currency to number
   */
  protected parseCurrency(value: string): number {
    const cleaned = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Retry an action with exponential backoff
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError || new Error('Retry failed');
  }

  /**
   * Check if element exists
   */
  protected async elementExists(selector: string): Promise<boolean> {
    const element = await this.page.$(selector);
    return element !== null;
  }

  /**
   * Wait for element to be gone
   */
  protected async waitForElementToDisappear(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'hidden' });
  }

  /**
   * Scroll element into view
   */
  protected async scrollIntoView(selector: string): Promise<void> {
    await this.page.$eval(selector, (el) => el.scrollIntoView());
  }

  /**
   * Select option from dropdown
   */
  protected async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  /**
   * Get all options from a select element
   */
  protected async getSelectOptions(selector: string): Promise<{ value: string; text: string }[]> {
    return this.page.$$eval(`${selector} option`, (options) =>
      options.map((opt) => ({
        value: opt.value,
        text: opt.textContent?.trim() || '',
      }))
    );
  }
}
