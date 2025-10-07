/**
 * Content Generation Agent - Task 10
 * OpenAI GPT-4 Turbo integration for African-focused cryptocurrency content generation
 * Implements content quality validation, plagiarism detection, and multi-format generation
 */

import OpenAI from 'openai';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { 
  ContentGenerationTask, 
  AfricanMarketContext,
  TaskStatus,
  AITask
} from '../types/ai-system';

export interface ContentGenerationConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enablePlagiarismCheck: boolean;
  qualityThreshold: number;
  africanContextWeight: number;
  plagiarismThreshold?: number;
  similarityThreshold?: number;
}

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  keywords: string[];
  qualityScore: number;
  wordCount: number;
  readingTime: number;
  format: 'article' | 'summary' | 'social_post' | 'newsletter';
  sources?: string[];
  plagiarismRisk?: number;
  africanRelevance?: {
    score: number;
    mentionedCountries: string[];
    mentionedExchanges: string[];
    mobileMoneyIntegration: boolean;
    localCurrencyMention: boolean;
  };
  marketDataIntegration?: {
    realTimeData: boolean;
    exchanges: string[];
    pricePoints: number[];
    volumeData: boolean;
  };
  culturalSensitivity?: {
    score: number;
    religiousContext: boolean;
    culturalReferences: string[];
    sensitiveTopics: string[];
    appropriateLanguage: boolean;
  };
  socialOptimization?: {
    hashtags: string[];
    emojis: boolean;
    characterCount: number;
    platform: string;
  };
}

export interface ContentGenerationResult {
  success: boolean;
  content?: GeneratedContent;
  error?: string;
  processingTime?: number;
  retryCount?: number;
  similarityCheck?: {
    similarArticles: Array<{
      id: string;
      title: string;
      similarityScore: number;
    }>;
    maxSimilarity: number;
  };
}

export interface MarketData {
  symbol: string;
  exchange: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: Date;
}

export interface AfricanExchange {
  id: string;
  name: string;
  country: string;
  supportedCurrencies: string[];
  isActive: boolean;
}

export class ContentGenerationAgent {
  private readonly openai: OpenAI;
  private readonly config: ContentGenerationConfig;
  private readonly logger: Logger;
  private readonly prisma: PrismaClient;

  // African exchange mappings
  private readonly africanExchanges = [
    'Binance_Africa', 'Luno', 'Quidax', 'BuyCoins', 'Valr', 'Ice3X',
    'Remitano', 'NairaEx', 'KuBitX', 'Paxful'
  ];

  // African mobile money providers
  private readonly mobileMoneyProviders = [
    'M-Pesa', 'Orange_Money', 'MTN_Money', 'EcoCash', 'Airtel_Money',
    'Tigo_Pesa', 'Vodafone_Cash', 'GCash'
  ];

  // African crypto-related keywords
  private readonly africanCryptoKeywords = [
    'mobile money', 'remittance', 'financial inclusion', 'unbanked',
    'cross-border payments', 'inflation hedge', 'currency devaluation',
    'economic instability', 'diaspora', 'peer-to-peer trading'
  ];

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    config: ContentGenerationConfig
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.config = {
      plagiarismThreshold: 80,
      similarityThreshold: 70,
      ...config
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });

    this.logger.info('Content Generation Agent initialized', { 
      model: this.config.model,
      qualityThreshold: this.config.qualityThreshold
    });
  }

  /**
   * Process a content generation task
   */
  async processTask(task: ContentGenerationTask): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Processing content generation task', { 
        taskId: task.id, 
        topic: task.payload.topic,
        contentType: task.payload.contentType
      });

      // Validate task payload
      this.validateTask(task);

      // Gather African market context data
      const marketContext = await this.gatherMarketContext(task.payload.africanContext);

      // Generate content using OpenAI GPT-4 Turbo
      const generatedContent = await this.generateContent(task, marketContext);

      // Validate content quality
      if (!this.validateContentQuality(generatedContent)) {
        return {
          success: false,
          error: `Generated content quality score (${generatedContent.qualityScore}) below threshold (${this.config.qualityThreshold})`,
          processingTime: Date.now() - startTime
        };
      }

      // Check for plagiarism if enabled
      if (this.config.enablePlagiarismCheck) {
        const plagiarismCheck = await this.checkPlagiarism(generatedContent);
        if (!plagiarismCheck.passed) {
          return {
            success: false,
            error: `High plagiarism risk detected: ${plagiarismCheck.risk}%`,
            processingTime: Date.now() - startTime
          };
        }
      }

      // Check similarity with existing articles
      const similarityCheck = await this.checkContentSimilarity(generatedContent);

      const processingTime = Date.now() - startTime;

      this.logger.info('Content generation completed successfully', {
        taskId: task.id,
        processingTime,
        qualityScore: generatedContent.qualityScore,
        wordCount: generatedContent.wordCount
      });

      return {
        success: true,
        content: generatedContent,
        processingTime,
        similarityCheck
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Content generation failed', {
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime,
        retryCount: task.metadata.retryCount
      };
    }
  }

  /**
   * Validate task payload
   */
  private validateTask(task: ContentGenerationTask): void {
    const { payload } = task;
    
    if (!payload.topic || payload.topic.trim().length === 0) {
      throw new Error('Task topic is required');
    }

    if (!payload.targetLanguages || payload.targetLanguages.length === 0) {
      throw new Error('Target languages are required');
    }

    if (!payload.africanContext) {
      throw new Error('African context is required');
    }

    if (!payload.contentType) {
      throw new Error('Content type is required');
    }

    const validContentTypes = ['article', 'summary', 'social_post', 'newsletter'];
    if (!validContentTypes.includes(payload.contentType)) {
      throw new Error(`Invalid content type: ${payload.contentType}`);
    }
  }

  /**
   * Gather real-time African market context
   */
  private async gatherMarketContext(africanContext: AfricanMarketContext) {
    try {
      // Fetch real-time market data for African exchanges
      const marketData = await this.prisma.marketData.findMany({
        where: {
          exchange: {
            in: africanContext.exchanges
          },
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      });

      // Get trending African crypto topics
      const recentArticles = await this.prisma.article.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          },
          status: 'PUBLISHED'
        },
        select: {
          title: true,
          tags: true,
          viewCount: true,
        },
        orderBy: {
          viewCount: 'desc'
        },
        take: 10
      });

      return {
        marketData,
        recentArticles,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.warn('Failed to gather market context', { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      return {
        marketData: [],
        recentArticles: [],
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate content using OpenAI GPT-4 Turbo
   */
  private async generateContent(
    task: ContentGenerationTask, 
    marketContext: any
  ): Promise<GeneratedContent> {
    const { payload } = task;
    
    // Build comprehensive prompt with African context
    const prompt = this.buildAfricanContextPrompt(payload, marketContext);

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(payload.contentType)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI API');
    }

    let generatedContent: GeneratedContent;
    try {
      generatedContent = JSON.parse(response);
    } catch (error) {
      throw new Error('Invalid JSON response from OpenAI API');
    }

    // Validate content structure
    this.validateGeneratedContent(generatedContent);

    // Calculate additional metrics
    generatedContent.wordCount = this.countWords(generatedContent.content);
    generatedContent.readingTime = Math.ceil(generatedContent.wordCount / 200); // 200 words per minute
    
    // Enhance with African context analysis
    generatedContent.africanRelevance = this.analyzeAfricanRelevance(
      generatedContent, 
      payload.africanContext
    );

    // Add market data integration info if applicable
    if (marketContext.marketData.length > 0) {
      const exchanges = marketContext.marketData
        .map((d: MarketData) => d.exchange)
        .filter((e: any): e is string => typeof e === 'string');
      
      generatedContent.marketDataIntegration = {
        realTimeData: true,
        exchanges: Array.from(new Set(exchanges)),
        pricePoints: marketContext.marketData.map((d: MarketData) => d.price),
        volumeData: true
      };
    }

    return generatedContent;
  }

  /**
   * Build African-focused content prompt
   */
  private buildAfricanContextPrompt(payload: any, marketContext: any): string {
    const { topic, africanContext, contentType, keywords } = payload;

    let prompt = `Generate ${contentType} content about: "${topic}"

AFRICAN CONTEXT REQUIREMENTS:
- Focus on ${africanContext.region} Africa, specifically: ${africanContext.countries.join(', ')}
- Include relevant African exchanges: ${africanContext.exchanges.join(', ')}
- Consider mobile money integration: ${africanContext.mobileMoneyProviders.join(', ')}
- Timezone: ${africanContext.timezone}
- Target languages: ${payload.targetLanguages.join(', ')}

CONTENT REQUIREMENTS:
- High quality, original content
- Include specific African market data and examples
- Address local economic conditions and challenges
- Mention relevant regulatory environment
- Include cultural sensitivity and context
- Use appropriate local examples and case studies

TARGET KEYWORDS: ${keywords.join(', ')}

`;

    if (marketContext.marketData.length > 0) {
      prompt += `REAL-TIME MARKET DATA:
${marketContext.marketData.slice(0, 5).map((data: MarketData) => 
  `- ${data.symbol}: $${data.price} on ${data.exchange} (${data.change24h}% 24h change)`
).join('\n')}

`;
    }

    if (africanContext.culturalContext) {
      prompt += `CULTURAL CONTEXT:
- Trading hours: ${africanContext.culturalContext.tradingHours || 'Standard business hours'}
- Preferred currencies: ${africanContext.culturalContext.preferredCurrencies?.join(', ') || 'Local currencies'}
- Social platforms: ${africanContext.culturalContext.socialPlatforms?.join(', ') || 'Major social platforms'}

`;
    }

    prompt += this.getContentTypeSpecificPrompt(contentType);

    return prompt;
  }

  /**
   * Get system prompt based on content type
   */
  private getSystemPrompt(contentType: string): string {
    const basePrompt = `You are an expert cryptocurrency journalist specializing in African markets. You have deep knowledge of:
- African cryptocurrency exchanges and trading patterns
- Mobile money integration with crypto services
- Regulatory environments across African countries
- Cultural and economic factors affecting crypto adoption
- Local languages and cultural sensitivities

Generate high-quality, accurate, and culturally appropriate content that serves African cryptocurrency communities.

CRITICAL: Respond only with valid JSON in this exact format:`;

    const jsonStructure = {
      article: `{
        "title": "string",
        "content": "string (detailed article content)",
        "excerpt": "string (2-3 sentence summary)",
        "keywords": ["string array"],
        "qualityScore": number,
        "wordCount": number,
        "readingTime": number,
        "format": "article",
        "sources": ["optional string array"],
        "plagiarismRisk": number,
        "africanRelevance": {
          "score": number,
          "mentionedCountries": ["string array"],
          "mentionedExchanges": ["string array"],
          "mobileMoneyIntegration": boolean,
          "localCurrencyMention": boolean
        },
        "culturalSensitivity": {
          "score": number,
          "religiousContext": boolean,
          "culturalReferences": ["string array"],
          "sensitiveTopics": ["string array"],
          "appropriateLanguage": boolean
        }
      }`,
      summary: `{
        "title": "string",
        "content": "string (brief summary content)",
        "excerpt": "string (1-2 sentence overview)",
        "keywords": ["string array"],
        "qualityScore": number,
        "wordCount": number,
        "readingTime": number,
        "format": "summary"
      }`,
      social_post: `{
        "title": "string (social media friendly)",
        "content": "string (social media post content)",
        "excerpt": "string (post description)",
        "keywords": ["string array"],
        "qualityScore": number,
        "wordCount": number,
        "format": "social_post",
        "socialOptimization": {
          "hashtags": ["string array"],
          "emojis": boolean,
          "characterCount": number,
          "platform": "string"
        }
      }`,
      newsletter: `{
        "title": "string",
        "content": "string (newsletter section content)",
        "excerpt": "string (newsletter summary)",
        "keywords": ["string array"],
        "qualityScore": number,
        "wordCount": number,
        "readingTime": number,
        "format": "newsletter"
      }`
    };

    return basePrompt + '\n\n' + jsonStructure[contentType as keyof typeof jsonStructure];
  }

  /**
   * Get content type specific prompt requirements
   */
  private getContentTypeSpecificPrompt(contentType: string): string {
    const prompts = {
      article: `
ARTICLE REQUIREMENTS:
- 800-2000 words
- Professional journalistic style
- Multiple sections with clear structure
- Include data, statistics, and expert quotes where relevant
- Call-to-action or conclusion
- SEO-optimized structure`,
      
      summary: `
SUMMARY REQUIREMENTS:
- 200-400 words
- Concise and informative
- Highlight key points and takeaways
- Easy to scan format
- Include essential statistics`,
      
      social_post: `
SOCIAL POST REQUIREMENTS:
- 20-100 words
- Engaging and shareable
- Include relevant hashtags
- Use appropriate emojis
- Platform-optimized formatting
- Call-to-action or engagement hook`,
      
      newsletter: `
NEWSLETTER REQUIREMENTS:
- 300-800 words
- Newsletter-friendly format
- Sections and bullet points
- Personalized tone
- Clear value proposition
- Actionable insights`
    };

    return prompts[contentType as keyof typeof prompts] || '';
  }

  /**
   * Validate generated content structure and quality
   */
  private validateGeneratedContent(content: any): void {
    const requiredFields = ['title', 'content', 'excerpt', 'qualityScore'];
    
    for (const field of requiredFields) {
      if (!content[field]) {
        throw new Error(`Invalid content structure: missing ${field}`);
      }
    }

    if (typeof content.qualityScore !== 'number' || content.qualityScore < 0 || content.qualityScore > 100) {
      throw new Error('Invalid quality score: must be a number between 0 and 100');
    }
  }

  /**
   * Validate content quality against threshold
   */
  private validateContentQuality(content: GeneratedContent): boolean {
    return content.qualityScore >= this.config.qualityThreshold;
  }

  /**
   * Check content for plagiarism
   */
  private async checkPlagiarism(content: GeneratedContent): Promise<{ passed: boolean; risk: number }> {
    // Simulate plagiarism check - in production, integrate with plagiarism detection service
    const plagiarismRisk = content.plagiarismRisk || 0;
    
    if (plagiarismRisk > (this.config.plagiarismThreshold || 80)) {
      this.logger.warn('High plagiarism risk detected', {
        title: content.title,
        risk: plagiarismRisk
      });
      
      return { passed: false, risk: plagiarismRisk };
    }

    return { passed: true, risk: plagiarismRisk };
  }

  /**
   * Check similarity with existing articles
   */
  private async checkContentSimilarity(content: GeneratedContent) {
    try {
      // Fetch recent articles for similarity comparison
      const existingArticles = await this.prisma.article.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: {
          id: true,
          title: true,
          content: true,
          excerpt: true
        },
        take: 100
      });

      const similarities = existingArticles.map(article => {
        const similarity = this.calculateTextSimilarity(content.content, article.content);
        return {
          id: article.id,
          title: article.title,
          similarityScore: similarity
        };
      });

      const maxSimilarity = Math.max(...similarities.map(s => s.similarityScore), 0);
      const similarArticles = similarities
        .filter(s => s.similarityScore > 50)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 5);

      return {
        similarArticles,
        maxSimilarity
      };

    } catch (error) {
      this.logger.warn('Similarity check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      return {
        similarArticles: [],
        maxSimilarity: 0
      };
    }
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const words1Array = Array.from(words1);
    const words2Array = Array.from(words2);
    
    const intersection = new Set(words1Array.filter(word => words2.has(word)));
    const union = new Set([...words1Array, ...words2Array]);
    
    return (intersection.size / union.size) * 100;
  }

  /**
   * Analyze African relevance of content
   */
  private analyzeAfricanRelevance(
    content: GeneratedContent, 
    context: AfricanMarketContext
  ) {
    const text = (content.title + ' ' + content.content + ' ' + content.excerpt).toLowerCase();
    
    const mentionedCountries = context.countries.filter(country => 
      text.includes(country.toLowerCase())
    );
    
    const mentionedExchanges = context.exchanges.filter(exchange => 
      text.includes(exchange.toLowerCase().replace('_', ' '))
    );
    
    const hasMobileMoneyMention = this.mobileMoneyProviders.some(provider =>
      text.includes(provider.toLowerCase().replace('_', ' '))
    );
    
    const hasLocalCurrencyMention = context.culturalContext?.preferredCurrencies?.some((currency: string) =>
      text.includes(currency.toLowerCase())
    ) || false;
    
    const africanKeywordMatches = this.africanCryptoKeywords.filter(keyword =>
      text.includes(keyword.toLowerCase())
    ).length;
    
    // Calculate relevance score
    let score = 0;
    score += mentionedCountries.length * 15; // Max 60 points for 4 countries
    score += mentionedExchanges.length * 10; // Max 30 points for 3 exchanges
    score += hasMobileMoneyMention ? 20 : 0;
    score += hasLocalCurrencyMention ? 15 : 0;
    score += africanKeywordMatches * 2; // Max 20 points for 10 keywords
    
    score = Math.min(score, 100); // Cap at 100
    
    return {
      score,
      mentionedCountries,
      mentionedExchanges,
      mobileMoneyIntegration: hasMobileMoneyMention,
      localCurrencyMention: hasLocalCurrencyMention
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Get agent metrics
   */
  getMetrics() {
    return {
      totalTasksProcessed: 0, // Track in production
      successRate: 0,
      averageQualityScore: 0,
      averageProcessingTime: 0,
      africanContextScore: 0
    };
  }
}