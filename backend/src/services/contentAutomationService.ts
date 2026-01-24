/**
 * Content Automation Service
 * Task 62: AI-Driven Content Automation System
 * 
 * Handles automated content collection, rewriting, optimization, categorization, and translation
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import Parser from 'rss-parser';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const rssParser = new Parser();

interface ContentFeedConfig {
  name: string;
  url: string;
  type: 'RSS' | 'API' | 'SCRAPER' | 'TWITTER' | 'TELEGRAM';
  category: string;
  region?: string;
  checkInterval?: number;
}

interface RewriteResult {
  title: string;
  content: string;
  excerpt: string;
  keywords: string[];
  readabilityScore: number;
}

interface OptimizationResult {
  headline: string;
  score: number;
  suggestions: string[];
}

interface CategoryResult {
  category: string;
  tags: string[];
  confidence: number;
}

export class ContentAutomationService {
  // ===== Feed Source Management =====
  
  async createFeedSource(config: ContentFeedConfig) {
    return prisma.contentFeedSource.create({
      data: {
        name: config.name,
        url: config.url,
        type: config.type,
        category: config.category,
        region: config.region || null,
        checkInterval: config.checkInterval || 3600,
        updatedAt: new Date()
      }
    });
  }

  async updateFeedSource(id: string, updates: Partial<ContentFeedConfig>) {
    return prisma.contentFeedSource.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  async deleteFeedSource(id: string) {
    return prisma.contentFeedSource.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() }
    });
  }

  async getFeedSources(filters?: { type?: string; category?: string; isActive?: boolean }) {
    return prisma.contentFeedSource.findMany({
      ...(filters && { where: filters }),
      orderBy: [{ priority: 'desc' }, { name: 'asc' }]
    });
  }

  // ===== Content Collection Agent =====
  
  async collectContentFromFeeds(limit: number = 10): Promise<any[]> {
    const feeds = await prisma.contentFeedSource.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
      take: limit
    });

    const results = [];
    
    for (const feed of feeds) {
      try {
        const articles = await this.fetchFeedContent(feed);
        
        for (const article of articles) {
          const existing = await prisma.automatedArticle.findFirst({
            where: { originalUrl: article.link }
          });

          if (!existing) {
            const created = await prisma.automatedArticle.create({
              data: {
                feedSourceId: feed.id,
                originalUrl: article.link || '',
                originalTitle: article.title || '',
                originalContent: article.contentSnippet || article.content || '',
                originalPublishedAt: article.pubDate ? new Date(article.pubDate) : null,
                status: 'COLLECTED',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });

            results.push(created);
          }
        }

        // Update feed stats
        await prisma.contentFeedSource.update({
          where: { id: feed.id },
          data: {
            lastCheckedAt: new Date(),
            successCount: { increment: 1 },
            updatedAt: new Date()
          }
        });

      } catch (error: any) {
        await prisma.contentFeedSource.update({
          where: { id: feed.id },
          data: {
            failureCount: { increment: 1 },
            updatedAt: new Date()
          }
        });

        await this.logError(feed.id, 'COLLECTION', error.message);
      }
    }

    return results;
  }

  private async fetchFeedContent(feed: any): Promise<any[]> {
    if (feed.type === 'RSS') {
      const parsedFeed = await rssParser.parseURL(feed.url);
      return parsedFeed.items.slice(0, 10);
    }
    
    // Add other feed types as needed (API, SCRAPER, etc.)
    return [];
  }

  // ===== AI Rewriter & Optimizer Agent =====
  
  async rewriteContent(articleId: string): Promise<RewriteResult> {
    const article = await prisma.automatedArticle.findUnique({
      where: { id: articleId },
      include: { feedSource: true }
    });

    if (!article) throw new Error('Article not found');

    const startTime = Date.now();

    try {
      const prompt = `You are a professional crypto and finance content writer for CoinDaily, an African cryptocurrency news platform.

Rewrite the following article to be:
1. Unique and plagiarism-free (80%+ uniqueness)
2. SEO-optimized with relevant keywords
3. Engaging and readable (70+ readability score)
4. Focused on the ${article.feedSource.category} category
5. Relevant to African crypto markets when applicable

Original Title: ${article.originalTitle}
Original Content: ${article.originalContent}

Provide a JSON response with:
{
  "title": "rewritten title (60-80 characters)",
  "excerpt": "engaging excerpt (150-200 characters)",
  "content": "full rewritten article (500-1000 words in HTML)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "readabilityScore": 75
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      const processingTime = Date.now() - startTime;

      // Update article with rewritten content
      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          rewrittenTitle: result.title,
          rewrittenContent: result.content,
          rewrittenExcerpt: result.excerpt,
          seoKeywords: JSON.stringify(result.keywords),
          readabilityScore: result.readabilityScore,
          status: 'REWRITTEN',
          processingTimeMs: processingTime,
          updatedAt: new Date()
        }
      });

      await this.logInfo(articleId, 'REWRITE', `Content rewritten successfully in ${processingTime}ms`);

      return result;

    } catch (error: any) {
      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          errorMessage: error.message,
          retryCount: { increment: 1 },
          updatedAt: new Date()
        }
      });

      await this.logError(articleId, 'REWRITE', error.message);
      throw error;
    }
  }

  // ===== Headline Optimizer Agent =====
  
  async optimizeHeadline(articleId: string): Promise<OptimizationResult> {
    const article = await prisma.automatedArticle.findUnique({
      where: { id: articleId }
    });

    if (!article || !article.rewrittenTitle) {
      throw new Error('Article not found or not rewritten');
    }

    try {
      const prompt = `You are a headline optimization expert specializing in crypto and finance content.

Optimize this headline for maximum CTR (Click-Through Rate):
"${article.rewrittenTitle}"

Guidelines:
- Use power words and emotional triggers
- Keep it under 70 characters
- Include numbers when relevant
- Make it curiosity-driven
- Optimize for African crypto audience

Provide a JSON response with:
{
  "headline": "optimized headline",
  "score": 85,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          optimizedHeadline: result.headline,
          headlineScore: result.score,
          status: 'OPTIMIZED',
          updatedAt: new Date()
        }
      });

      await this.logInfo(articleId, 'OPTIMIZE', `Headline optimized with score ${result.score}`);

      return result;

    } catch (error: any) {
      await this.logError(articleId, 'OPTIMIZE', error.message);
      throw error;
    }
  }

  // ===== Auto-Tagger + Categorizer Agent =====
  
  async categorizeContent(articleId: string): Promise<CategoryResult> {
    const article = await prisma.automatedArticle.findUnique({
      where: { id: articleId },
      include: { feedSource: true }
    });

    if (!article || !article.rewrittenContent) {
      throw new Error('Article not found or not rewritten');
    }

    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true }
      });

      const categoryList = categories.map(c => c.name).join(', ');

      const prompt = `You are a content categorization expert for a crypto news platform.

Analyze this article and suggest the most appropriate category and tags:

Title: ${article.rewrittenTitle}
Content: ${article.rewrittenContent}

Available Categories: ${categoryList}

Provide a JSON response with:
{
  "category": "best matching category",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 0.95
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          suggestedCategory: result.category,
          suggestedTags: JSON.stringify(result.tags),
          confidence: result.confidence,
          updatedAt: new Date()
        }
      });

      await this.logInfo(articleId, 'CATEGORIZE', `Categorized as ${result.category} with ${result.confidence} confidence`);

      return result;

    } catch (error: any) {
      await this.logError(articleId, 'CATEGORIZE', error.message);
      throw error;
    }
  }

  // ===== Multilingual Translator Agent =====
  
  async translateContent(articleId: string, languages: string[]): Promise<any> {
    const article = await prisma.automatedArticle.findUnique({
      where: { id: articleId }
    });

    if (!article || !article.rewrittenContent) {
      throw new Error('Article not found or not rewritten');
    }

    const results = [];

    for (const lang of languages) {
      try {
        const prompt = `Translate the following crypto/finance article to ${this.getLanguageName(lang)}.

Maintain:
- Technical terms in English (Bitcoin, Ethereum, DeFi, etc.)
- Professional tone
- Cultural relevance for African markets

Title: ${article.rewrittenTitle}
Content: ${article.rewrittenContent}

Provide a JSON response with:
{
  "title": "translated title",
  "content": "translated content",
  "excerpt": "translated excerpt"
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        });

        const translation = JSON.parse(response.choices[0]?.message?.content || '{}');
        results.push({ language: lang, ...translation });

      } catch (error: any) {
        await this.logError(articleId, 'TRANSLATE', `Failed to translate to ${lang}: ${error.message}`);
      }
    }

    await prisma.automatedArticle.update({
      where: { id: articleId },
      data: {
        translationStatus: 'COMPLETED',
        translatedLanguages: JSON.stringify(languages),
        status: 'TRANSLATED',
        updatedAt: new Date()
      }
    });

    await this.logInfo(articleId, 'TRANSLATE', `Translated to ${languages.length} languages`);

    return results;
  }

  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'fr': 'French',
      'sw': 'Swahili',
      'am': 'Amharic',
      'zu': 'Zulu',
      'yo': 'Yoruba',
      'ha': 'Hausa',
      'ig': 'Igbo',
      'pt': 'Portuguese',
      'ar': 'Arabic',
      'so': 'Somali'
    };
    return languages[code] || code;
  }

  // ===== Quality Scoring =====
  
  async calculateQualityScore(articleId: string): Promise<number> {
    const article = await prisma.automatedArticle.findUnique({
      where: { id: articleId }
    });

    if (!article) throw new Error('Article not found');

    let score = 0;
    let maxScore = 100;

    // Uniqueness score (20 points)
    score += (article.uniquenessScore || 0) * 0.2;

    // Readability score (20 points)
    score += (article.readabilityScore || 0) * 0.2;

    // Headline score (15 points)
    score += (article.headlineScore || 0) * 0.15;

    // Confidence in categorization (15 points)
    score += (article.confidence || 0) * 15;

    // Content length bonus (10 points)
    const contentLength = article.rewrittenContent?.length || 0;
    if (contentLength > 800) score += 10;
    else if (contentLength > 500) score += 5;

    // Has keywords (10 points)
    if (article.seoKeywords) score += 10;

    // Has translation (10 points)
    if (article.translationStatus === 'COMPLETED') score += 10;

    const finalScore = Math.min(score, maxScore);

    await prisma.automatedArticle.update({
      where: { id: articleId },
      data: {
        qualityScore: finalScore,
        updatedAt: new Date()
      }
    });

    return finalScore;
  }

  // ===== Full Automation Pipeline =====
  
  async processArticlePipeline(articleId: string, options: {
    skipRewrite?: boolean;
    skipOptimize?: boolean;
    skipCategorize?: boolean;
    skipTranslate?: boolean;
    translationLanguages?: string[];
  } = {}): Promise<any> {
    const startTime = Date.now();

    try {
      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          processingStartedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Step 1: Rewrite content
      if (!options.skipRewrite) {
        await this.rewriteContent(articleId);
      }

      // Step 2: Optimize headline
      if (!options.skipOptimize) {
        await this.optimizeHeadline(articleId);
      }

      // Step 3: Categorize content
      if (!options.skipCategorize) {
        await this.categorizeContent(articleId);
      }

      // Step 4: Calculate uniqueness (simplified - would use plagiarism API in production)
      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          uniquenessScore: 85 + Math.random() * 15, // Mock score
          updatedAt: new Date()
        }
      });

      // Step 5: Translate content
      if (!options.skipTranslate) {
        const languages = options.translationLanguages || ['fr', 'sw', 'pt'];
        await this.translateContent(articleId, languages);
      }

      // Step 6: Calculate final quality score
      const qualityScore = await this.calculateQualityScore(articleId);

      const processingTime = Date.now() - startTime;

      // Check if auto-approve based on quality
      const settings = await this.getSettings();
      const autoApprove = qualityScore >= settings.minQualityScore;

      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          status: autoApprove ? 'APPROVED' : 'PENDING_APPROVAL',
          approvalStatus: autoApprove ? 'APPROVED' : 'PENDING',
          processingCompletedAt: new Date(),
          processingTimeMs: processingTime,
          updatedAt: new Date()
        }
      });

      await this.logInfo(articleId, 'PIPELINE', `Pipeline completed in ${processingTime}ms with quality score ${qualityScore}`);

      return {
        articleId,
        qualityScore,
        autoApproved: autoApprove,
        processingTimeMs: processingTime
      };

    } catch (error: any) {
      await prisma.automatedArticle.update({
        where: { id: articleId },
        data: {
          errorMessage: error.message,
          retryCount: { increment: 1 },
          updatedAt: new Date()
        }
      });

      await this.logError(articleId, 'PIPELINE', error.message);
      throw error;
    }
  }

  // ===== Batch Processing =====
  
  async processBatch(limit: number = 5): Promise<any> {
    const articles = await prisma.automatedArticle.findMany({
      where: {
        status: 'COLLECTED',
        retryCount: { lt: 3 }
      },
      take: limit,
      orderBy: { createdAt: 'asc' }
    });

    const results = [];

    for (const article of articles) {
      try {
        const result = await this.processArticlePipeline(article.id);
        results.push({ success: true, ...result });
      } catch (error: any) {
        results.push({ success: false, articleId: article.id, error: error.message });
      }
    }

    return {
      total: articles.length,
      results
    };
  }

  // ===== Approval & Publishing =====
  
  async approveArticle(articleId: string, approvedById: string): Promise<any> {
    return prisma.automatedArticle.update({
      where: { id: articleId },
      data: {
        approvalStatus: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
        status: 'APPROVED',
        updatedAt: new Date()
      }
    });
  }

  async rejectArticle(articleId: string, reason: string): Promise<any> {
    return prisma.automatedArticle.update({
      where: { id: articleId },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: reason,
        status: 'REJECTED',
        updatedAt: new Date()
      }
    });
  }

  async publishArticle(articleId: string, authorId: string): Promise<any> {
    const automated = await prisma.automatedArticle.findUnique({
      where: { id: articleId },
      include: { feedSource: true }
    });

    if (!automated || automated.approvalStatus !== 'APPROVED') {
      throw new Error('Article not approved for publishing');
    }

    // Find category
    const category = await prisma.category.findFirst({
      where: { name: automated.suggestedCategory || 'General' }
    });

    if (!category) throw new Error('Category not found');

    // Create slug
    const slug = this.createSlug(automated.rewrittenTitle || automated.originalTitle);

    // Calculate reading time
    const wordCount = (automated.rewrittenContent || '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Create published article
    const article = await prisma.article.create({
      data: {
        id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: automated.optimizedHeadline || automated.rewrittenTitle || automated.originalTitle,
        slug,
        excerpt: automated.rewrittenExcerpt || automated.originalContent.substring(0, 200),
        content: automated.rewrittenContent || automated.originalContent,
        authorId,
        categoryId: category.id,
        tags: automated.suggestedTags,
        status: 'PUBLISHED',
        readingTimeMinutes: readingTime,
        seoTitle: automated.optimizedHeadline || automated.rewrittenTitle,
        seoDescription: automated.rewrittenExcerpt,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update automated article
    await prisma.automatedArticle.update({
      where: { id: articleId },
      data: {
        publishedArticleId: article.id,
        publishedAt: new Date(),
        status: 'PUBLISHED',
        updatedAt: new Date()
      }
    });

    await this.logInfo(articleId, 'PUBLISH', `Published as article ${article.id}`);

    return article;
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .substring(0, 80);
  }

  // ===== Settings Management =====
  
  async getSettings(): Promise<any> {
    let settings = await prisma.contentAutomationSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.contentAutomationSettings.create({
        data: {
          id: 'default',
          isEnabled: true,
          autoPublish: false,
          requireHumanApproval: true,
          minQualityScore: 85,
          minUniquenessScore: 80,
          minReadabilityScore: 70,
          maxArticlesPerDay: 50,
          maxArticlesPerFeed: 10,
          processingBatchSize: 5,
          enableAutoTranslation: true,
          translationLanguages: JSON.stringify(['fr', 'sw', 'pt', 'am', 'zu']),
          aiProvider: 'openai',
          aiModel: 'gpt-4-turbo',
          translationModel: 'gpt-4-turbo',
          notifyOnApprovalNeeded: true,
          notifyOnPublish: true,
          notifyOnErrors: true,
          updatedAt: new Date()
        }
      });
    }

    return settings;
  }

  async updateSettings(updates: any): Promise<any> {
    const settings = await this.getSettings();
    
    return prisma.contentAutomationSettings.update({
      where: { id: settings.id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  // ===== Statistics & Analytics =====
  
  async getStats(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const now = new Date();
    const startDate = new Date();
    
    if (timeRange === 'day') startDate.setDate(now.getDate() - 1);
    else if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
    else startDate.setDate(now.getDate() - 30);

    const [
      totalCollected,
      totalProcessed,
      totalApproved,
      totalPublished,
      totalRejected,
      avgQualityScore,
      avgProcessingTime
    ] = await Promise.all([
      prisma.automatedArticle.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.automatedArticle.count({
        where: {
          status: { in: ['REWRITTEN', 'OPTIMIZED', 'TRANSLATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED'] },
          createdAt: { gte: startDate }
        }
      }),
      prisma.automatedArticle.count({
        where: {
          approvalStatus: 'APPROVED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.automatedArticle.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: startDate }
        }
      }),
      prisma.automatedArticle.count({
        where: {
          approvalStatus: 'REJECTED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.automatedArticle.aggregate({
        where: {
          qualityScore: { gt: 0 },
          createdAt: { gte: startDate }
        },
        _avg: { qualityScore: true }
      }),
      prisma.automatedArticle.aggregate({
        where: {
          processingTimeMs: { gt: 0 },
          createdAt: { gte: startDate }
        },
        _avg: { processingTimeMs: true }
      })
    ]);

    return {
      timeRange,
      totalCollected,
      totalProcessed,
      totalApproved,
      totalPublished,
      totalRejected,
      avgQualityScore: avgQualityScore._avg.qualityScore || 0,
      avgProcessingTime: avgProcessingTime._avg.processingTimeMs || 0,
      pendingApproval: await prisma.automatedArticle.count({
        where: { approvalStatus: 'PENDING' }
      })
    };
  }

  // ===== Logging =====
  
  private async logInfo(articleId: string, action: string, message: string) {
    await prisma.contentAutomationLog.create({
      data: {
        articleId,
        level: 'INFO',
        action,
        message,
        createdAt: new Date()
      }
    });
  }

  private async logError(targetId: string, action: string, message: string) {
    await prisma.contentAutomationLog.create({
      data: {
        articleId: targetId,
        level: 'ERROR',
        action,
        message,
        createdAt: new Date()
      }
    });
  }

  // ===== Cleanup =====
  
  async cleanup() {
    await prisma.$disconnect();
    await redis.quit();
  }
}

export default new ContentAutomationService();
