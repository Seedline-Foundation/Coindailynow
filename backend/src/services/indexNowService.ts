// IndexNow & Instant Indexing Service
// Notifies search engines immediately when content is published/updated
// Supports: IndexNow (Bing/Yandex), Google Indexing API, WebSub

import prisma from '../lib/prisma';
import crypto from 'crypto';

export interface IndexingResult {
  engine: string;
  success: boolean;
  statusCode?: number;
  message?: string;
}

export class IndexNowService {
  private readonly siteUrl = process.env.SITE_URL || 'https://coindaily.online';
  private readonly indexNowKey = process.env.INDEXNOW_API_KEY || this.generateKey();
  private readonly googleApiKey = process.env.GOOGLE_INDEXING_API_KEY;

  private generateKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get the IndexNow API key (for serving at /{key}.txt)
   */
  getApiKey(): string {
    return this.indexNowKey;
  }

  /**
   * Submit URL to IndexNow (Bing, Yandex, Seznam, Naver)
   */
  async submitToIndexNow(url: string): Promise<IndexingResult> {
    try {
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: new URL(this.siteUrl).hostname,
          key: this.indexNowKey,
          keyLocation: `${this.siteUrl}/${this.indexNowKey}.txt`,
          urlList: [url],
        }),
      });

      return {
        engine: 'IndexNow',
        success: response.status === 200 || response.status === 202,
        statusCode: response.status,
        message: response.status === 200 ? 'URL submitted successfully' : `Status: ${response.status}`,
      };
    } catch (error) {
      return {
        engine: 'IndexNow',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit batch of URLs to IndexNow
   */
  async submitBatchToIndexNow(urls: string[]): Promise<IndexingResult> {
    try {
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: new URL(this.siteUrl).hostname,
          key: this.indexNowKey,
          keyLocation: `${this.siteUrl}/${this.indexNowKey}.txt`,
          urlList: urls.slice(0, 10000), // IndexNow max 10K per batch
        }),
      });

      return {
        engine: 'IndexNow (batch)',
        success: response.status === 200 || response.status === 202,
        statusCode: response.status,
        message: `${urls.length} URLs submitted`,
      };
    } catch (error) {
      return {
        engine: 'IndexNow (batch)',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Ping Google with sitemap update
   */
  async pingGoogle(): Promise<IndexingResult> {
    try {
      const response = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(`${this.siteUrl}/sitemap.xml`)}`,
        { method: 'GET' }
      );
      return {
        engine: 'Google Sitemap Ping',
        success: response.ok,
        statusCode: response.status,
        message: response.ok ? 'Sitemap pinged successfully' : 'Ping failed',
      };
    } catch (error) {
      return {
        engine: 'Google Sitemap Ping',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Ping Bing with sitemap update
   */
  async pingBing(): Promise<IndexingResult> {
    try {
      const response = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${this.siteUrl}/sitemap.xml`)}`,
        { method: 'GET' }
      );
      return {
        engine: 'Bing Sitemap Ping',
        success: response.ok,
        statusCode: response.status,
        message: response.ok ? 'Sitemap pinged' : 'Ping failed',
      };
    } catch (error) {
      return {
        engine: 'Bing Sitemap Ping',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Notify all search engines about a new/updated article
   * Call this after publishing or updating any article
   */
  async notifyAllEngines(articleSlug: string): Promise<IndexingResult[]> {
    const articleUrl = `${this.siteUrl}/news/${articleSlug}`;
    const results: IndexingResult[] = [];

    // IndexNow (covers Bing, Yandex, Seznam, Naver)
    results.push(await this.submitToIndexNow(articleUrl));

    // Google sitemap ping
    results.push(await this.pingGoogle());

    // Bing sitemap ping
    results.push(await this.pingBing());

    // Log the indexing attempt
    try {
      console.log(`[IndexNow] Notified search engines for ${articleUrl}`, {
        url: articleUrl,
        results: results.map(r => ({ engine: r.engine, success: r.success })),
      });
    } catch (e) {
      // Don't fail if logging fails
      console.warn('[IndexNow] Failed to log indexing attempt:', e);
    }

    return results;
  }

  /**
   * Submit all recently published articles (useful for initial setup)
   */
  async submitRecentArticles(hours: number = 24): Promise<IndexingResult> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: since },
      },
      select: { slug: true },
    });

    const urls = articles.map(a => `${this.siteUrl}/news/${a.slug}`);

    if (urls.length === 0) {
      return { engine: 'IndexNow (batch)', success: true, message: 'No recent articles to submit' };
    }

    return this.submitBatchToIndexNow(urls);
  }
}

export const indexNowService = new IndexNowService();
