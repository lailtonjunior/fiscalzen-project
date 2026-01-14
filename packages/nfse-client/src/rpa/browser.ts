import { chromium, Browser, BrowserContext, Page } from 'playwright';

// ============================================
// Browser Manager
// ============================================

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  /**
   * Initialize the browser instance
   */
  async init(options?: {
    headless?: boolean;
    proxy?: { server: string; username?: string; password?: string };
  }): Promise<void> {
    if (this.browser) {
      return;
    }

    this.browser = await chromium.launch({
      headless: options?.headless ?? true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,720',
      ],
    });

    const contextOptions: any = {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    };

    if (options?.proxy) {
      contextOptions.proxy = options.proxy;
    }

    this.context = await this.browser.newContext(contextOptions);

    // Block unnecessary resources for faster scraping
    await this.context.route('**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2}', (route) =>
      route.abort()
    );
  }

  /**
   * Create a new page
   */
  async newPage(): Promise<Page> {
    if (!this.browser || !this.context) {
      await this.init();
    }
    return this.context!.newPage();
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get current browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Get current context
   */
  getContext(): BrowserContext | null {
    return this.context;
  }
}

// ============================================
// Singleton instance for reuse
// ============================================

let browserManagerInstance: BrowserManager | null = null;

export function getBrowserManager(): BrowserManager {
  if (!browserManagerInstance) {
    browserManagerInstance = new BrowserManager();
  }
  return browserManagerInstance;
}

export async function closeBrowserManager(): Promise<void> {
  if (browserManagerInstance) {
    await browserManagerInstance.close();
    browserManagerInstance = null;
  }
}
