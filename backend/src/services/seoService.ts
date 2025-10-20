// SEO Meta Tag Generation System
// Comprehensive SEO service with AI-powered optimization and RAO metadata support

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  articleTag?: string[];
  // RAO-specific metadata for LLM indexing
  raometa: {
    canonicalAnswer?: string;
    semanticChunks: string[];
    entityMentions: string[];
    factClaims: string[];
    aiSource: string;
    lastVerified: string;
    confidence: number;
    llmsTxt: string; // Content for llms.txt file
  };
}

export interface SEOAnalysisRequest {
  url: string;
  content: string;
  title?: string;
  description?: string;
  keywords?: string[];
  targetAudience?: string;
  contentType: 'article' | 'page' | 'category' | 'author';
}

export interface SEOAnalysisResult {
  score: number; // 0-100
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
  metadata: SEOMetadata;
  raometa: RAOMetadata;
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'title' | 'description' | 'keywords' | 'content' | 'technical' | 'social';
  message: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
}

export interface SEOSuggestion {
  type: 'title' | 'description' | 'keywords' | 'content' | 'technical';
  suggestion: string;
  expectedImprovement: number; // percentage
  priority: 'high' | 'medium' | 'low';
}

export interface RAOMetadata {
  canonicalAnswer?: string;
  semanticChunks: string[];
  entityMentions: string[];
  factClaims: string[];
  aiSource: string;
  lastVerified: string;
  confidence: number;
  llmsTxt: string; // Content for llms.txt file
}

export class SEOService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate comprehensive SEO metadata for any content
   */
  async generateSEOMetadata(
    content: string,
    options: {
      title?: string;
      type: 'article' | 'page' | 'category' | 'author';
      url: string;
      image?: string;
      author?: string;
      publishedAt?: Date;
      modifiedAt?: Date;
      category?: string;
      tags?: string[];
      targetKeywords?: string[];
    }
  ): Promise<SEOMetadata> {
    const baseTitle = options.title || this.extractTitleFromContent(content);
    const baseDescription = this.generateDescription(content);

    // AI-powered title optimization
    const optimizedTitle = await this.optimizeTitle(baseTitle, options.targetKeywords || []);

    // AI-powered description optimization with A/B testing variants
    const descriptionVariants = await this.generateDescriptionVariants(content, optimizedTitle);

    // Generate keywords
    const keywords = await this.extractKeywords(content, options.targetKeywords);

    // Generate RAO metadata
    const raometa = await this.generateRAOMetadata(content, optimizedTitle);

    const metadata: SEOMetadata = {
      title: optimizedTitle,
      description: descriptionVariants.primary,
      keywords,
      canonicalUrl: options.url,
      ogTitle: optimizedTitle,
      ogDescription: descriptionVariants.primary,
      ogImage: options.image || this.getDefaultImage(options.type),
      ogType: this.getOpenGraphType(options.type),
      twitterCard: 'summary_large_image',
      twitterTitle: optimizedTitle,
      twitterDescription: descriptionVariants.primary,
      twitterImage: options.image || this.getDefaultImage(options.type),
      raometa,
    };

    // Add article-specific metadata
    if (options.type === 'article') {
      if (options.author) metadata.articleAuthor = options.author;
      if (options.publishedAt) metadata.articlePublishedTime = options.publishedAt.toISOString();
      if (options.modifiedAt) metadata.articleModifiedTime = options.modifiedAt.toISOString();
      if (options.category) metadata.articleSection = options.category;
      if (options.tags) metadata.articleTag = options.tags;
    }

    return metadata;
  }

  /**
   * Perform comprehensive SEO analysis
   */
  async analyzeSEO(request: SEOAnalysisRequest): Promise<SEOAnalysisResult> {
    const issues: SEOIssue[] = [];
    const suggestions: SEOSuggestion[] = [];

    // Title analysis
    const titleAnalysis = this.analyzeTitle(request.title || '', request.content);
    issues.push(...titleAnalysis.issues);
    suggestions.push(...titleAnalysis.suggestions);

    // Description analysis
    const descAnalysis = this.analyzeDescription(request.description || '', request.content);
    issues.push(...descAnalysis.issues);
    suggestions.push(...descAnalysis.suggestions);

    // Content analysis
    const contentAnalysis = this.analyzeContent(request.content);
    issues.push(...contentAnalysis.issues);
    suggestions.push(...contentAnalysis.suggestions);

    // Keyword analysis
    const keywordAnalysis = this.analyzeKeywords(request.keywords || [], request.content);
    issues.push(...keywordAnalysis.issues);
    suggestions.push(...keywordAnalysis.suggestions);

    // Generate optimized metadata
    const metadata = await this.generateSEOMetadata(request.content, {
      ...(request.title && { title: request.title }),
      type: request.contentType,
      url: request.url,
      ...(request.keywords && { targetKeywords: request.keywords }),
    });

    // Calculate overall score
    const score = this.calculateSEOScore(issues);

    return {
      score,
      issues,
      suggestions,
      metadata,
      raometa: metadata.raometa,
    };
  }

  /**
   * Generate RAO (Retrieval-Augmented Optimization) metadata for LLM indexing
   */
  private async generateRAOMetadata(content: string, title: string): Promise<RAOMetadata> {
    try {
      const prompt = `Analyze the following content and generate RAO metadata for LLM indexing:

Title: ${title}
Content: ${content.substring(0, 2000)}

Generate:
1. Canonical Answer: A concise, authoritative answer to the main question this content addresses
2. Semantic Chunks: Break down the content into meaningful semantic chunks (3-5 chunks)
3. Entity Mentions: Extract key entities mentioned (people, organizations, cryptocurrencies, etc.)
4. Fact Claims: Extract verifiable factual claims
5. AI Source attribution
6. Confidence score (0-1)

Format as JSON.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices?.[0]?.message?.content || '{}');

      // Generate llms.txt content
      const llmsTxt = this.generateLLMsTxt(title, content, result);

      return {
        canonicalAnswer: result.canonicalAnswer,
        semanticChunks: result.semanticChunks || [],
        entityMentions: result.entityMentions || [],
        factClaims: result.factClaims || [],
        aiSource: 'CoinDaily AI Analysis',
        lastVerified: new Date().toISOString(),
        confidence: result.confidence || 0.85,
        llmsTxt,
      };
    } catch (error) {
      console.error('Error generating RAO metadata:', error);
      return {
        semanticChunks: [],
        entityMentions: [],
        factClaims: [],
        aiSource: 'CoinDaily AI Analysis',
        lastVerified: new Date().toISOString(),
        confidence: 0.5,
        llmsTxt: '',
      };
    }
  }

  /**
   * Generate llms.txt content for AI indexing
   */
  private generateLLMsTxt(title: string, content: string, raoData: any): string {
    return `# CoinDaily - ${title}

## Canonical Answer
${raoData.canonicalAnswer || 'No canonical answer available'}

## Key Facts
${raoData.factClaims?.map((fact: string) => `- ${fact}`).join('\n') || 'No key facts identified'}

## Entities Mentioned
${raoData.entityMentions?.map((entity: string) => `- ${entity}`).join('\n') || 'No entities identified'}

## Content Summary
${content.substring(0, 500)}...

## AI Analysis Confidence: ${(raoData.confidence * 100).toFixed(1)}%

Generated by CoinDaily AI on ${new Date().toISOString()}
`;
  }

  /**
   * AI-powered title optimization
   */
  private async optimizeTitle(baseTitle: string, targetKeywords: string[]): Promise<string> {
    if (!targetKeywords.length) return baseTitle;

    try {
      const prompt = `Optimize this title for SEO while keeping it natural and engaging:

Original Title: "${baseTitle}"
Target Keywords: ${targetKeywords.join(', ')}

Requirements:
- Keep under 60 characters
- Include primary keyword naturally
- Make it compelling for clicks
- Maintain journalistic integrity

Return only the optimized title.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 100,
      });

      return response.choices?.[0]?.message?.content?.trim() || baseTitle;
    } catch (error) {
      console.error('Error optimizing title:', error);
      return baseTitle;
    }
  }

  /**
   * Generate multiple description variants for A/B testing
   */
  private async generateDescriptionVariants(content: string, title: string): Promise<{ primary: string; variants: string[] }> {
    try {
      const prompt = `Generate 3 SEO-optimized meta descriptions for this content:

Title: "${title}"
Content: ${content.substring(0, 1000)}

Requirements:
- Each description under 160 characters
- Include relevant keywords naturally
- Create click-worthy, compelling descriptions
- Focus on benefits and unique value
- Maintain factual accuracy

Return as JSON array of strings.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
      });

      const variants = JSON.parse(response.choices?.[0]?.message?.content || '[]');
      return {
        primary: variants[0] || this.generateDescription(content),
        variants: variants.slice(1),
      };
    } catch (error) {
      console.error('Error generating description variants:', error);
      const desc = this.generateDescription(content);
      return { primary: desc, variants: [] };
    }
  }

  /**
   * Extract and optimize keywords
   */
  public async extractKeywords(content: string, targetKeywords: string[] = []): Promise<string[]> {
    try {
      const prompt = `Extract the most relevant SEO keywords from this content:

Content: ${content.substring(0, 1500)}

Target Keywords (if provided): ${targetKeywords.join(', ')}

Return a JSON array of 5-8 keywords that would rank well for this content.
Focus on:
- Primary topic keywords
- Long-tail keywords
- Related terms
- Search intent alignment

Return only the JSON array.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      const keywords = JSON.parse(response.choices?.[0]?.message?.content || '[]');
      return [...new Set([...targetKeywords, ...keywords])].slice(0, 8);
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return targetKeywords.length > 0 ? targetKeywords : this.extractBasicKeywords(content);
    }
  }

  // Helper methods
  private extractTitleFromContent(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences[0]?.trim().substring(0, 60) || 'CoinDaily Article';
  }

  private generateDescription(content: string): string {
    const words = content.split(/\s+/).filter(word => word.length > 3);
    const desc = words.slice(0, 25).join(' ');
    return desc.length > 10 ? desc + '...' : 'Latest cryptocurrency and blockchain news from CoinDaily.';
  }

  private extractBasicKeywords(content: string): string[] {
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};

    words.forEach(word => {
      if (!['that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  private getDefaultImage(type: string): string {
    const images = {
      article: '/images/default-article.jpg',
      page: '/images/default-page.jpg',
      category: '/images/default-category.jpg',
      author: '/images/default-author.jpg',
    };
    return images[type as keyof typeof images] || '/images/default.jpg';
  }

  private getOpenGraphType(type: string): string {
    const types = {
      article: 'article',
      page: 'website',
      category: 'website',
      author: 'profile',
    };
    return types[type as keyof typeof types] || 'website';
  }

  // Analysis methods
  private analyzeTitle(title: string, content: string): { issues: SEOIssue[]; suggestions: SEOSuggestion[] } {
    const issues: SEOIssue[] = [];
    const suggestions: SEOSuggestion[] = [];

    if (!title) {
      issues.push({
        type: 'error',
        category: 'title',
        message: 'Missing title tag',
        impact: 'high',
        fix: 'Add a descriptive title tag',
      });
    } else if (title.length < 30) {
      issues.push({
        type: 'warning',
        category: 'title',
        message: 'Title too short',
        impact: 'medium',
        fix: 'Expand title to 30-60 characters',
      });
    } else if (title.length > 60) {
      issues.push({
        type: 'warning',
        category: 'title',
        message: 'Title too long',
        impact: 'medium',
        fix: 'Shorten title to under 60 characters',
      });
    }

    return { issues, suggestions };
  }

  private analyzeDescription(description: string, content: string): { issues: SEOIssue[]; suggestions: SEOSuggestion[] } {
    const issues: SEOIssue[] = [];
    const suggestions: SEOSuggestion[] = [];

    if (!description) {
      issues.push({
        type: 'error',
        category: 'description',
        message: 'Missing meta description',
        impact: 'high',
        fix: 'Add a compelling meta description',
      });
    } else if (description.length < 120) {
      issues.push({
        type: 'warning',
        category: 'description',
        message: 'Meta description too short',
        impact: 'medium',
        fix: 'Expand description to 120-160 characters',
      });
    } else if (description.length > 160) {
      issues.push({
        type: 'warning',
        category: 'description',
        message: 'Meta description too long',
        impact: 'medium',
        fix: 'Shorten description to under 160 characters',
      });
    }

    return { issues, suggestions };
  }

  private analyzeContent(content: string): { issues: SEOIssue[]; suggestions: SEOSuggestion[] } {
    const issues: SEOIssue[] = [];
    const suggestions: SEOSuggestion[] = [];

    const wordCount = content.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Content too short for SEO',
        impact: 'medium',
        fix: 'Aim for at least 300 words',
      });
    }

    const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    if (headings.length === 0) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'No heading structure found',
        impact: 'medium',
        fix: 'Add H1, H2, H3 headings for better structure',
      });
    }

    return { issues, suggestions };
  }

  private analyzeKeywords(keywords: string[], content: string): { issues: SEOIssue[]; suggestions: SEOSuggestion[] } {
    const issues: SEOIssue[] = [];
    const suggestions: SEOSuggestion[] = [];

    if (keywords.length === 0) {
      issues.push({
        type: 'warning',
        category: 'keywords',
        message: 'No target keywords specified',
        impact: 'medium',
        fix: 'Define target keywords for optimization',
      });
    } else if (keywords.length > 8) {
      issues.push({
        type: 'info',
        category: 'keywords',
        message: 'Too many keywords targeted',
        impact: 'low',
        fix: 'Focus on 3-5 primary keywords',
      });
    }

    return { issues, suggestions };
  }

  private calculateSEOScore(issues: SEOIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
      const penalty = issue.type === 'error' ? 20 :
                     issue.type === 'warning' ? 10 : 5;
      const multiplier = issue.impact === 'high' ? 1.5 :
                        issue.impact === 'medium' ? 1 : 0.5;
      score -= penalty * multiplier;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Save SEO metadata to database
   */
  async saveSEOMetadata(contentId: string, contentType: string, metadata: SEOMetadata): Promise<void> {
    await prisma.sEOMetadata.upsert({
      where: {
        contentId_contentType: {
          contentId,
          contentType,
        },
      },
      update: {
        metadata: JSON.stringify(metadata),
        raometa: JSON.stringify(metadata.raometa),
        updatedAt: new Date(),
      },
      create: {
        contentId,
        contentType,
        metadata: JSON.stringify(metadata),
        raometa: JSON.stringify(metadata.raometa),
      },
    });
  }

  /**
   * Get SEO metadata from database
   */
  async getSEOMetadata(contentId: string, contentType: string): Promise<SEOMetadata | null> {
    const record = await prisma.sEOMetadata.findUnique({
      where: {
        contentId_contentType: {
          contentId,
          contentType,
        },
      },
    });

    if (!record) return null;

    return {
      ...JSON.parse(record.metadata),
      raometa: JSON.parse(record.raometa),
    };
  }

  /**
   * Generate llms.txt file content for the entire site
   */
  async generateSiteLLMsTxt(): Promise<string> {
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, seoTitle: true, seoDescription: true },
      take: 100,
      orderBy: { publishedAt: 'desc' },
    });

    let content = `# CoinDaily - Africa's Premier Cryptocurrency News Platform

## About
CoinDaily provides comprehensive cryptocurrency and blockchain news coverage with a focus on African markets, memecoins, and emerging trends.

## Content Index
`;

    articles.forEach(article => {
      content += `\n### ${article.seoTitle || article.title}\n`;
      content += `${article.seoDescription || 'Latest cryptocurrency news and analysis'}\n`;
      content += `/article/${article.id}\n`;
    });

    content += `\n## AI-Generated Content Notice
This content index is maintained by CoinDaily's AI systems for improved discoverability by language models and AI assistants.

Last updated: ${new Date().toISOString()}
`;

    return content;
  }
}

export const seoService = new SEOService();