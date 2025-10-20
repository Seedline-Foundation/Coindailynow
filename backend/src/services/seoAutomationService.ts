// Dynamic SEO & Ranking Automation Service - Task 63
// Automated SEO monitoring, broken link detection, and real-time optimization

import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';
import axios from 'axios';

const prisma = new PrismaClient();

// ============= INTERFACES =============

export interface AutomationConfig {
  googleSearchConsole: {
    enabled: boolean;
    apiKey: string;
    siteUrl: string;
  };
  ahrefs: {
    enabled: boolean;
    apiKey: string;
  };
  semrush: {
    enabled: boolean;
    apiKey: string;
  };
  monitoring: {
    rankTracking: boolean;
    brokenLinks: boolean;
    internalLinks: boolean;
    schemaValidation: boolean;
  };
  schedules: {
    rankTracking: string; // cron format
    brokenLinkCheck: string;
    schemaAudit: string;
    internalLinkReflow: string;
  };
}

export interface RankTrackingResult {
  keywordId: string;
  keyword: string;
  previousPosition: number | null;
  currentPosition: number | null;
  change: number;
  searchVolume: number;
  url: string;
  snippet: string;
  timestamp: Date;
}

export interface BrokenLinkResult {
  url: string;
  sourceUrl: string;
  statusCode: number;
  error: string;
  isFixed: boolean;
  redirectedTo: string | null;
  fixedAt: Date | null;
}

export interface InternalLinkSuggestion {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  relevanceScore: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface SchemaValidationResult {
  url: string;
  isValid: boolean;
  schemaType: string;
  errors: string[];
  warnings: string[];
  score: number;
  lastChecked: Date;
}

// ============= GOOGLE SEARCH CONSOLE INTEGRATION =============

export class GoogleSearchConsoleService {
  private apiKey: string;
  private siteUrl: string;

  constructor(apiKey: string, siteUrl: string) {
    this.apiKey = apiKey;
    this.siteUrl = siteUrl;
  }

  async getRankings(keywords: string[]): Promise<RankTrackingResult[]> {
    const results: RankTrackingResult[] = [];

    for (const keyword of keywords) {
      try {
        // Google Search Console API call
        const response = await axios.post(
          `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
          {
            inspectionUrl: this.siteUrl,
            languageCode: 'en',
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          }
        );

        // Parse response and extract ranking data
        const rankData = response.data;
        
        results.push({
          keywordId: '', // Will be set by caller
          keyword,
          previousPosition: null,
          currentPosition: rankData.position || null,
          change: 0,
          searchVolume: 0,
          url: this.siteUrl,
          snippet: rankData.snippet || '',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Error fetching ranking for keyword ${keyword}:`, error);
      }
    }

    return results;
  }

  async getSearchAnalytics(startDate: Date, endDate: Date) {
    try {
      const response = await axios.post(
        `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`,
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query', 'page'],
          rowLimit: 25000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.rows || [];
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      return [];
    }
  }
}

// ============= AHREFS INTEGRATION =============

export class AhrefsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getBacklinks(domain: string) {
    try {
      const response = await axios.get(
        `https://apiv2.ahrefs.com`,
        {
          params: {
            token: this.apiKey,
            target: domain,
            mode: 'domain',
            output: 'json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Ahrefs data:', error);
      return null;
    }
  }

  async getRankings(keywords: string[], domain: string): Promise<RankTrackingResult[]> {
    const results: RankTrackingResult[] = [];

    for (const keyword of keywords) {
      try {
        const response = await axios.get(
          `https://apiv2.ahrefs.com`,
          {
            params: {
              token: this.apiKey,
              target: domain,
              keyword,
              mode: 'exact',
              output: 'json',
            },
          }
        );

        const data = response.data;
        results.push({
          keywordId: '',
          keyword,
          previousPosition: null,
          currentPosition: data.position || null,
          change: 0,
          searchVolume: data.search_volume || 0,
          url: data.url || '',
          snippet: data.snippet || '',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Error fetching Ahrefs ranking for ${keyword}:`, error);
      }
    }

    return results;
  }
}

// ============= SEMRUSH INTEGRATION =============

export class SemrushService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDomainRankings(domain: string) {
    try {
      const response = await axios.get(
        `https://api.semrush.com/`,
        {
          params: {
            key: this.apiKey,
            type: 'domain_ranks',
            domain,
            export_columns: 'Ot,Oc,Or,Oa,Xn',
            database: 'us',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Semrush data:', error);
      return null;
    }
  }

  async getKeywordRankings(keywords: string[], domain: string): Promise<RankTrackingResult[]> {
    const results: RankTrackingResult[] = [];

    for (const keyword of keywords) {
      try {
        const response = await axios.get(
          `https://api.semrush.com/`,
          {
            params: {
              key: this.apiKey,
              type: 'phrase_this',
              phrase: keyword,
              export_columns: 'Ph,Po,Nq,Cp,Ur,Tr',
              domain,
              database: 'us',
            },
          }
        );

        const data = response.data.split('\n')[1]?.split(';') || [];
        results.push({
          keywordId: '',
          keyword,
          previousPosition: null,
          currentPosition: data[1] ? parseInt(data[1]) : null,
          change: 0,
          searchVolume: data[2] ? parseInt(data[2]) : 0,
          url: data[4] || '',
          snippet: '',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Error fetching Semrush ranking for ${keyword}:`, error);
      }
    }

    return results;
  }
}

// ============= RANK TRACKING SERVICE =============

export class RankTrackingService {
  private gscService?: GoogleSearchConsoleService;
  private ahrefsService?: AhrefsService;
  private semrushService?: SemrushService;

  constructor(config: AutomationConfig) {
    if (config.googleSearchConsole.enabled) {
      this.gscService = new GoogleSearchConsoleService(
        config.googleSearchConsole.apiKey,
        config.googleSearchConsole.siteUrl
      );
    }

    if (config.ahrefs.enabled) {
      this.ahrefsService = new AhrefsService(config.ahrefs.apiKey);
    }

    if (config.semrush.enabled) {
      this.semrushService = new SemrushService(config.semrush.apiKey);
    }
  }

  async trackKeywordRankings(): Promise<RankTrackingResult[]> {
    try {
      // Get all tracked keywords
      const keywords = (await prisma.sEOKeyword.findMany({
        where: { isActive: true } as any,
        select: {
          id: true,
          keyword: true,
          currentPosition: true,
          searchVolume: true,
          targetUrl: true,
        } as any,
      })) as unknown as Array<{
        id: string;
        keyword: string;
        currentPosition: number | null;
        searchVolume: number;
        targetUrl: string | null;
      }>;

      const allResults: RankTrackingResult[] = [];

      // Track rankings from each source
      const keywordStrings = keywords.map(k => k.keyword);

      if (this.gscService) {
        const gscResults = await this.gscService.getRankings(keywordStrings);
        allResults.push(...gscResults);
      }

      if (this.ahrefsService) {
        const ahrefsResults = await this.ahrefsService.getRankings(
          keywordStrings,
          process.env.SITE_DOMAIN || 'coindaily.com'
        );
        allResults.push(...ahrefsResults);
      }

      if (this.semrushService) {
        const semrushResults = await this.semrushService.getKeywordRankings(
          keywordStrings,
          process.env.SITE_DOMAIN || 'coindaily.com'
        );
        allResults.push(...semrushResults);
      }

      // Aggregate results and update database
      const aggregatedResults = this.aggregateRankings(allResults, keywords);

      for (const result of aggregatedResults) {
        const keyword = keywords.find(k => k.keyword === result.keyword);
        if (!keyword) continue;

        // Calculate change
        const change = keyword.currentPosition && result.currentPosition
          ? keyword.currentPosition - result.currentPosition
          : 0;

        // Update keyword ranking
        await prisma.sEOKeyword.update({
          where: { id: keyword.id },
          data: {
            previousPosition: keyword.currentPosition,
            currentPosition: result.currentPosition,
            positionChange: change,
            lastChecked: new Date(),
          } as any,
        });

        // Create ranking record
        await prisma.sEORanking.create({
          data: {
            id: `rank_${Date.now()}_${Math.random()}`,
            keywordId: keyword.id,
            position: result.currentPosition || 0,
            url: result.url,
            snippet: result.snippet,
            searchVolume: result.searchVolume,
            clicks: 0,
            impressions: 0,
            ctr: 0,
            date: new Date(),
            createdAt: new Date(),
          } as any,
        });

        // Create alert for significant changes
        if (Math.abs(change) >= 5) {
          await this.createRankingAlert(keyword.id, result, change);
        }
      }

      // Invalidate cache
      await redisClient.del('seo:dashboard:stats');
      await redisClient.del('seo:keywords:*');

      return aggregatedResults;
    } catch (error) {
      console.error('Error tracking keyword rankings:', error);
      throw error;
    }
  }

  private aggregateRankings(
    results: RankTrackingResult[],
    keywords: any[]
  ): RankTrackingResult[] {
    const aggregated = new Map<string, RankTrackingResult>();

    for (const result of results) {
      const existing = aggregated.get(result.keyword);
      
      if (!existing || (result.currentPosition && (!existing.currentPosition || result.currentPosition < existing.currentPosition))) {
        aggregated.set(result.keyword, result);
      }
    }

    return Array.from(aggregated.values());
  }

  private async createRankingAlert(keywordId: string, result: RankTrackingResult, change: number) {
    await prisma.sEOAlert.create({
      data: {
        id: `alert_${Date.now()}_${Math.random()}`,
        type: change > 0 ? 'ranking_improvement' : 'ranking_drop',
        severity: Math.abs(change) >= 10 ? 'critical' : 'warning',
        title: `Ranking ${change > 0 ? 'improved' : 'dropped'} by ${Math.abs(change)} positions`,
        message: `Keyword "${result.keyword}" ${change > 0 ? 'improved' : 'dropped'} from position ${result.previousPosition} to ${result.currentPosition}`,
        resourceType: 'keyword',
        resourceId: keywordId,
        actionRequired: Math.abs(change) >= 10,
        isRead: false,
        isResolved: false,
        metadata: JSON.stringify(result),
        createdAt: new Date(),
      } as any,
    });
  }
}

// ============= BROKEN LINK MONITOR =============

export class BrokenLinkMonitor {
  async scanForBrokenLinks(): Promise<BrokenLinkResult[]> {
    try {
      const brokenLinks: BrokenLinkResult[] = [];

      // Get all articles with content
      const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          slug: true,
          content: true,
        },
      });

      for (const article of articles) {
        const sourceUrl = `/news/${article.slug}`;
        const links = this.extractLinks(article.content);

        for (const link of links) {
          try {
            // Check if link is broken
            const response = await axios.head(link, {
              timeout: 10000,
              validateStatus: () => true,
            });

            if (response.status >= 400) {
              brokenLinks.push({
                url: link,
                sourceUrl,
                statusCode: response.status,
                error: `HTTP ${response.status}`,
                isFixed: false,
                redirectedTo: null,
                fixedAt: null,
              });

              // Store in database
              await this.storeBrokenLink(article.id, link, response.status);
            }
          } catch (error: any) {
            brokenLinks.push({
              url: link,
              sourceUrl,
              statusCode: 0,
              error: error.message,
              isFixed: false,
              redirectedTo: null,
              fixedAt: null,
            });

            await this.storeBrokenLink(article.id, link, 0);
          }
        }
      }

      return brokenLinks;
    } catch (error) {
      console.error('Error scanning for broken links:', error);
      throw error;
    }
  }

  private extractLinks(content: string): string[] {
    const linkRegex = /https?:\/\/[^\s<>"]+/g;
    return content.match(linkRegex) || [];
  }

  private async storeBrokenLink(articleId: string, url: string, statusCode: number) {
    await prisma.sEOIssue.create({
      data: {
        id: `issue_${Date.now()}_${Math.random()}`,
        pageId: `page_${articleId}`,
        severity: statusCode >= 500 ? 'critical' : 'error',
        category: 'links',
        type: 'broken_link',
        message: `Broken link detected: ${url}`,
        recommendation: 'Fix or remove the broken link, or set up a redirect',
        affectedUrl: `/news/${articleId}`,
        isResolved: false,
        detectedAt: new Date(),
        createdAt: new Date(),
        metadata: JSON.stringify({ url, statusCode }),
      } as any,
    });

    // Create alert
    await prisma.sEOAlert.create({
      data: {
        id: `alert_${Date.now()}_${Math.random()}`,
        type: 'broken_link',
        severity: statusCode >= 500 ? 'critical' : 'error',
        title: 'Broken link detected',
        message: `Broken link found in article: ${url}`,
        resourceType: 'article',
        resourceId: articleId,
        actionRequired: true,
        isRead: false,
        isResolved: false,
        metadata: JSON.stringify({ url, statusCode }),
        createdAt: new Date(),
      } as any,
    });
  }

  async fixBrokenLink(issueId: string, redirectUrl: string): Promise<boolean> {
    try {
      const issue = await prisma.sEOIssue.findUnique({
        where: { id: issueId },
      });

      if (!issue) return false;

      const metadata = JSON.parse((issue as any).metadata || '{}');
      const brokenUrl = metadata.url;

      // Create redirect rule
      await (prisma as any).redirect.create({
        data: {
          id: `redirect_${Date.now()}_${Math.random()}`,
          fromPath: brokenUrl,
          toPath: redirectUrl,
          statusCode: 301,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mark issue as resolved
      await prisma.sEOIssue.update({
        where: { id: issueId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error fixing broken link:', error);
      return false;
    }
  }
}

// ============= INTERNAL LINK OPTIMIZER =============

export class InternalLinkOptimizer {
  async generateLinkSuggestions(): Promise<InternalLinkSuggestion[]> {
    try {
      const suggestions: InternalLinkSuggestion[] = [];

      // Get all published articles
      const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          tags: true,
          categoryId: true,
        },
      });

      // Analyze content relationships
      for (const sourceArticle of articles) {
        const sourceUrl = `/news/${sourceArticle.slug}`;
        const sourceTags = sourceArticle.tags?.split(',') || [];

        // Find related articles
        const relatedArticles = articles.filter(target => {
          if (target.id === sourceArticle.id) return false;

          const targetTags = target.tags?.split(',') || [];
          const commonTags = sourceTags.filter(tag => targetTags.includes(tag));

          return (
            target.categoryId === sourceArticle.categoryId ||
            commonTags.length > 0 ||
            this.calculateContentSimilarity(sourceArticle.content, target.content) > 0.3
          );
        });

        for (const targetArticle of relatedArticles) {
          const targetUrl = `/news/${targetArticle.slug}`;
          
          // Check if link already exists
          if (sourceArticle.content.includes(targetUrl)) continue;

          const relevanceScore = this.calculateRelevanceScore(
            sourceArticle,
            targetArticle
          );

          if (relevanceScore > 0.5) {
            suggestions.push({
              sourceUrl,
              targetUrl,
              anchorText: targetArticle.title,
              relevanceScore,
              priority: relevanceScore > 0.8 ? 'high' : relevanceScore > 0.6 ? 'medium' : 'low',
              reason: this.generateReason(sourceArticle, targetArticle),
            });
          }
        }
      }

      // Store suggestions
      for (const suggestion of suggestions) {
        await prisma.internalLinkSuggestion.create({
          data: {
            id: `link_${Date.now()}_${Math.random()}`,
            sourceUrl: suggestion.sourceUrl,
            targetUrl: suggestion.targetUrl,
            anchorText: suggestion.anchorText,
            relevanceScore: suggestion.relevanceScore,
            priority: suggestion.priority,
            reason: suggestion.reason,
            status: 'suggested',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating link suggestions:', error);
      throw error;
    }
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple word overlap calculation
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private calculateRelevanceScore(source: any, target: any): number {
    let score = 0;

    // Category match
    if (source.categoryId === target.categoryId) {
      score += 0.3;
    }

    // Tag overlap
    const sourceTags = source.tags?.split(',') || [];
    const targetTags = target.tags?.split(',') || [];
    const commonTags = sourceTags.filter((tag: string) => targetTags.includes(tag));
    score += (commonTags.length / Math.max(sourceTags.length, 1)) * 0.3;

    // Content similarity
    score += this.calculateContentSimilarity(source.content, target.content) * 0.4;

    return Math.min(score, 1);
  }

  private generateReason(source: any, target: any): string {
    const reasons: string[] = [];

    if (source.categoryId === target.categoryId) {
      reasons.push('Same category');
    }

    const sourceTags = source.tags?.split(',') || [];
    const targetTags = target.tags?.split(',') || [];
    const commonTags = sourceTags.filter((tag: string) => targetTags.includes(tag));

    if (commonTags.length > 0) {
      reasons.push(`Common tags: ${commonTags.join(', ')}`);
    }

    return reasons.join('; ') || 'Related content';
  }

  async implementSuggestion(suggestionId: string): Promise<boolean> {
    try {
      const suggestion = await prisma.internalLinkSuggestion.findUnique({
        where: { id: suggestionId },
      });

      if (!suggestion) return false;

      // Mark as implemented by updating status
      await prisma.internalLinkSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'implemented',
          implementedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error implementing suggestion:', error);
      return false;
    }
  }
}

// ============= SCHEMA VALIDATOR =============

export class SchemaValidator {
  async validateAllSchemas(): Promise<SchemaValidationResult[]> {
    try {
      const results: SchemaValidationResult[] = [];

      // Get all articles with structured data
      const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          slug: true,
        },
      });

      for (const article of articles) {
        const url = `/news/${article.slug}`;
        const metadata = await prisma.sEOMetadata.findFirst({
          where: { contentId: article.id },
        });

        if (!metadata || !(metadata as any).structuredData) {
          results.push({
            url,
            isValid: false,
            schemaType: 'none',
            errors: ['No structured data found'],
            warnings: [],
            score: 0,
            lastChecked: new Date(),
          });
          continue;
        }

        // Validate structured data
        const validation = this.validateSchema((metadata as any).structuredData);
        results.push({
          url,
          isValid: validation.isValid,
          schemaType: validation.schemaType,
          errors: validation.errors,
          warnings: validation.warnings,
          score: validation.score,
          lastChecked: new Date(),
        });

        // Create issues for invalid schemas
        if (!validation.isValid) {
          await this.createSchemaIssue(article.id, url, validation);
        }
      }

      return results;
    } catch (error) {
      console.error('Error validating schemas:', error);
      throw error;
    }
  }

  private validateSchema(structuredData: string): {
    isValid: boolean;
    schemaType: string;
    errors: string[];
    warnings: string[];
    score: number;
  } {
    try {
      const schema = JSON.parse(structuredData);
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check required fields
      if (!schema['@context']) {
        errors.push('Missing @context field');
      }

      if (!schema['@type']) {
        errors.push('Missing @type field');
      }

      const schemaType = schema['@type'] || 'unknown';

      // Validate based on schema type
      if (schemaType === 'NewsArticle') {
        if (!schema.headline) errors.push('Missing headline');
        if (!schema.datePublished) errors.push('Missing datePublished');
        if (!schema.author) errors.push('Missing author');
        if (!schema.publisher) errors.push('Missing publisher');

        if (!schema.image) warnings.push('Missing image');
        if (!schema.description) warnings.push('Missing description');
      }

      const isValid = errors.length === 0;
      const score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));

      return {
        isValid,
        schemaType,
        errors,
        warnings,
        score,
      };
    } catch (error) {
      return {
        isValid: false,
        schemaType: 'invalid',
        errors: ['Invalid JSON format'],
        warnings: [],
        score: 0,
      };
    }
  }

  private async createSchemaIssue(articleId: string, url: string, validation: any) {
    await prisma.sEOIssue.create({
      data: {
        id: `issue_${Date.now()}_${Math.random()}`,
        pageId: `page_${articleId}`,
        severity: 'error',
        category: 'schema',
        type: 'invalid_schema',
        message: `Invalid schema markup: ${validation.errors.join(', ')}`,
        recommendation: 'Fix schema validation errors',
        affectedUrl: url,
        isResolved: false,
        detectedAt: new Date(),
        createdAt: new Date(),
        metadata: JSON.stringify(validation),
      } as any,
    });
  }
}

// ============= MAIN AUTOMATION SERVICE =============

export class SEOAutomationService {
  private config: AutomationConfig;
  private rankTracker: RankTrackingService;
  private linkMonitor: BrokenLinkMonitor;
  private linkOptimizer: InternalLinkOptimizer;
  private schemaValidator: SchemaValidator;

  constructor(config: AutomationConfig) {
    this.config = config;
    this.rankTracker = new RankTrackingService(config);
    this.linkMonitor = new BrokenLinkMonitor();
    this.linkOptimizer = new InternalLinkOptimizer();
    this.schemaValidator = new SchemaValidator();
  }

  async runAutomation(type: 'all' | 'ranking' | 'links' | 'internal-links' | 'schema') {
    const results = {
      ranking: null as RankTrackingResult[] | null,
      brokenLinks: null as BrokenLinkResult[] | null,
      linkSuggestions: null as InternalLinkSuggestion[] | null,
      schemaValidation: null as SchemaValidationResult[] | null,
    };

    try {
      if (type === 'all' || type === 'ranking') {
        if (this.config.monitoring.rankTracking) {
          console.log('Running rank tracking automation...');
          results.ranking = await this.rankTracker.trackKeywordRankings();
        }
      }

      if (type === 'all' || type === 'links') {
        if (this.config.monitoring.brokenLinks) {
          console.log('Running broken link monitoring...');
          results.brokenLinks = await this.linkMonitor.scanForBrokenLinks();
        }
      }

      if (type === 'all' || type === 'internal-links') {
        if (this.config.monitoring.internalLinks) {
          console.log('Running internal link optimization...');
          results.linkSuggestions = await this.linkOptimizer.generateLinkSuggestions();
        }
      }

      if (type === 'all' || type === 'schema') {
        if (this.config.monitoring.schemaValidation) {
          console.log('Running schema validation...');
          results.schemaValidation = await this.schemaValidator.validateAllSchemas();
        }
      }

      // Log automation run
      await this.logAutomationRun(type, results);

      return results;
    } catch (error) {
      console.error('Error running SEO automation:', error);
      throw error;
    }
  }

  private async logAutomationRun(type: string, results: any) {
    await (prisma as any).automationLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random()}`,
        type: `seo_${type}`,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 0,
        metadata: JSON.stringify(results),
        createdAt: new Date(),
      },
    });
  }

  async getAutomationStats() {
    try {
      const cacheKey = 'seo:automation:stats';
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const [
        totalKeywords,
        brokenLinks,
        linkSuggestions,
        schemaIssues,
        recentAlerts,
      ] = await Promise.all([
        prisma.sEOKeyword.count({ where: { isActive: true } as any }),
        prisma.sEOIssue.count({ where: { type: 'broken_link', isResolved: false } }),
        prisma.internalLinkSuggestion.count({ where: { implementedAt: null } }),
        prisma.sEOIssue.count({ where: { type: 'invalid_schema', isResolved: false } }),
        prisma.sEOAlert.count({
          where: {
            isRead: false,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const stats = {
        tracking: {
          totalKeywords,
          activeMonitoring: this.config.monitoring.rankTracking,
        },
        links: {
          brokenLinks,
          pendingSuggestions: linkSuggestions,
          autoFixEnabled: this.config.monitoring.brokenLinks,
        },
        schema: {
          totalIssues: schemaIssues,
          nightlyAudit: this.config.monitoring.schemaValidation,
        },
        alerts: {
          recent: recentAlerts,
        },
      };

      // Cache stats if Redis is available
      if (redisClient && typeof redisClient.setex === 'function') {
        try {
          await redisClient.setex(cacheKey, 300, JSON.stringify(stats));
        } catch (err) {
          // Redis not available - continue without caching
        }
      }
      return stats;
    } catch (error) {
      console.error('Error getting automation stats:', error);
      throw error;
    }
  }
}

// ============= EXPORTS =============

export default SEOAutomationService;
