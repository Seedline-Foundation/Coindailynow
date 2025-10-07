// Server-side only module - do not import in client components
if (typeof window !== 'undefined') {
  throw new Error('critical-css.ts is a server-side only module and cannot be imported in client components');
}

import { promises as fs } from 'fs';
import path from 'path';

interface CriticalCSSConfig {
  pagePath: string;
  cssFile: string;
  priority: number;
}

// Critical CSS configurations for different page types
const CRITICAL_CSS_CONFIG: CriticalCSSConfig[] = [
  { pagePath: '/', cssFile: 'critical-home.css', priority: 1 },
  { pagePath: '/news', cssFile: 'critical-news.css', priority: 2 },
  { pagePath: '/market', cssFile: 'critical-market.css', priority: 3 },
  { pagePath: '/dashboard', cssFile: 'critical-dashboard.css', priority: 4 }
];

export class CriticalCSSManager {
  private static instance: CriticalCSSManager;
  private cssCache: Map<string, string> = new Map();
  private criticalDir: string;

  constructor() {
    this.criticalDir = path.join(process.cwd(), 'public', 'critical');
  }

  static getInstance(): CriticalCSSManager {
    if (!CriticalCSSManager.instance) {
      CriticalCSSManager.instance = new CriticalCSSManager();
    }
    return CriticalCSSManager.instance;
  }

  /**
   * Get critical CSS for a specific page
   */
  async getCriticalCSS(pagePath: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.cssCache.has(pagePath)) {
        return this.cssCache.get(pagePath)!;
      }

      // Find matching CSS file
      const config = CRITICAL_CSS_CONFIG.find(c => 
        pagePath === c.pagePath || pagePath.startsWith(c.pagePath)
      );

      if (!config) {
        return null;
      }

      // Read critical CSS file
      const cssPath = path.join(this.criticalDir, config.cssFile);
      
      try {
        const criticalCSS = await fs.readFile(cssPath, 'utf-8');
        
        // Cache for future requests
        this.cssCache.set(pagePath, criticalCSS);
        
        return criticalCSS;
      } catch (fileError) {
        console.warn(`Critical CSS file not found: ${cssPath}`);
        return null;
      }
    } catch (error) {
      console.error(`Error loading critical CSS for ${pagePath}:`, error);
      return null;
    }
  }

  /**
   * Generate critical CSS HTML tag with inline styles
   */
  async getCriticalCSSTag(pagePath: string): Promise<string> {
    const criticalCSS = await this.getCriticalCSS(pagePath);
    
    if (!criticalCSS) {
      return '';
    }

    // Minify CSS (basic minification)
    const minifiedCSS = criticalCSS
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .trim();

    return `<style data-critical-css>${minifiedCSS}</style>`;
  }

  /**
   * Preload non-critical CSS
   */
  getNonCriticalCSSPreload(): string {
    const preloadTags = [
      '<link rel="preload" href="/_next/static/css/app.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">',
      '<link rel="preload" href="/_next/static/css/components.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">',
      '<noscript><link rel="stylesheet" href="/_next/static/css/app.css"></noscript>',
      '<noscript><link rel="stylesheet" href="/_next/static/css/components.css"></noscript>'
    ];

    return preloadTags.join('\n');
  }

  /**
   * Get font preload tags for critical fonts
   */
  getFontPreloadTags(): string {
    const fontPreloads = [
      {
        href: '/fonts/inter-var.woff2',
        type: 'font/woff2',
        crossorigin: 'anonymous'
      },
      {
        href: '/fonts/jetbrains-mono-var.woff2',
        type: 'font/woff2',
        crossorigin: 'anonymous'
      }
    ];

    return fontPreloads
      .map(font => 
        `<link rel="preload" href="${font.href}" as="font" type="${font.type}" crossorigin="${font.crossorigin}">`
      )
      .join('\n');
  }

  /**
   * Get resource hints for performance
   */
  getResourceHints(): string {
    const hints = [
      // DNS prefetch for external domains
      '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="//fonts.gstatic.com">',
      '<link rel="dns-prefetch" href="//api.coindaily.africa">',
      '<link rel="dns-prefetch" href="//cdn.coindaily.africa">',
      
      // Preconnect for critical resources
      '<link rel="preconnect" href="//fonts.googleapis.com" crossorigin>',
      '<link rel="preconnect" href="//fonts.gstatic.com" crossorigin>',
      '<link rel="preconnect" href="//api.coindaily.africa" crossorigin>',
      
      // Prefetch for likely next pages
      '<link rel="prefetch" href="/news">',
      '<link rel="prefetch" href="/market">',
      '<link rel="prefetch" href="/dashboard">'
    ];

    return hints.join('\n');
  }

  /**
   * Clear CSS cache (for development)
   */
  clearCache(): void {
    this.cssCache.clear();
    console.log('✅ Critical CSS cache cleared');
  }

  /**
   * Warm up cache by preloading all critical CSS files
   */
  async warmUpCache(): Promise<void> {
    console.log('🔥 Warming up Critical CSS cache...');
    
    const promises = CRITICAL_CSS_CONFIG.map(async (config) => {
      try {
        await this.getCriticalCSS(config.pagePath);
        console.log(`✅ Cached critical CSS for ${config.pagePath}`);
      } catch (error) {
        console.error(`❌ Failed to cache critical CSS for ${config.pagePath}:`, error);
      }
    });

    await Promise.all(promises);
    console.log('🎉 Critical CSS cache warm-up completed');
  }

  /**
   * Get performance-optimized head tags for a page
   */
  async getOptimizedHeadTags(pagePath: string): Promise<{
    criticalCSS: string;
    preloadCSS: string;
    fontPreloads: string;
    resourceHints: string;
  }> {
    const [criticalCSS] = await Promise.all([
      this.getCriticalCSSTag(pagePath)
    ]);

    return {
      criticalCSS,
      preloadCSS: this.getNonCriticalCSSPreload(),
      fontPreloads: this.getFontPreloadTags(),
      resourceHints: this.getResourceHints()
    };
  }
}

// Export singleton instance
export const criticalCSS = CriticalCSSManager.getInstance();

// Helper function for Next.js pages
export async function getPerformanceHeadTags(pagePath: string) {
  return await criticalCSS.getOptimizedHeadTags(pagePath);
}