/**
 * Content Recommendation Service - Task 17
 * AI-powered content recommendation engine with African market focus
 * Implements personalized recommendations, user behavior analysis, and content diversity algorithms
 */

import { PrismaClient, Article, User, UserEngagement, Category, Tag } from '@prisma/client';
import { Logger } from 'winston';
import { Redis } from 'ioredis';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { MarketAnalysisAgent } from '../agents/marketAnalysisAgent';
import { HybridSearchService } from './hybridSearchService';

export interface ContentRecommendationConfig {
  openaiApiKey: string;
  model: string; // gpt-4-turbo-preview
  maxTokens: number;
  temperature: number;
  diversityThreshold: number; // 0-1, higher means more diverse
  recencyWeight: number; // 0-1, importance of recent content
  popularityWeight: number; // 0-1, importance of popular content
  personalizedWeight: number; // 0-1, importance of user preferences
  africanContentBoost: number; // 1-2, boost for African-focused content
  maxRecommendations: number;
  cacheTimeoutMs: number;
  enableRealTimeUpdates: boolean;
  minUserInteractions: number; // Minimum interactions before personalization
}

export interface UserBehaviorProfile {
  userId: string;
  preferredCategories: string[];
  readingPatterns: {
    averageReadingTime: number;
    preferredContentLength: 'short' | 'medium' | 'long';
    activeHours: number[]; // Hours of day (0-23)
    devicePreference: string;
  };
  topicInterests: {
    [topic: string]: number; // Interest score 0-1
  };
  africanMarketFocus: {
    preferredCountries: string[];
    preferredExchanges: string[];
    mobileMoneyInterest: boolean;
  };
  engagementScore: number; // Overall user engagement 0-1
  lastUpdated: Date;
}

export interface ContentFeatures {
  articleId: string;
  categoryId: string;
  tags: string[];
  wordCount: number;
  readingTime: number;
  africanRelevanceScore: number;
  sentimentScore: number;
  qualityScore: number;
  publishedAt: Date;
  popularity: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
  };
  marketContext: {
    mentionedTokens: string[];
    mentionedExchanges: string[];
    trendingTopics: string[];
  };
}

export interface RecommendationRequest {
  userId: string;
  contentType?: 'article' | 'mixed';
  limit?: number;
  excludeReadArticles?: boolean;
  includeAfricanFocus?: boolean;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  diversityLevel?: 'low' | 'medium' | 'high';
  realTimeMarketContext?: boolean;
}

export interface RecommendedContent {
  articleId: string;
  title: string;
  excerpt: string;
  categoryName: string;
  tags: string[];
  authorName: string;
  publishedAt: Date;
  readingTime: number;
  recommendationScore: number;
  reasons: RecommendationReason[];
  africanRelevance: {
    score: number;
    countries: string[];
    exchanges: string[];
    culturalContext: string[];
  };
  marketContext?: {
    trendingTokens: string[];
    recentMarketEvents: string[];
    relevantExchanges: string[];
  };
}

export interface RecommendationReason {
  type: 'behavioral' | 'trending' | 'similar_content' | 'african_focus' | 'market_trend';
  description: string;
  confidence: number; // 0-1
  weight: number; // Contribution to final score
}

export interface RecommendationResult {
  recommendations: RecommendedContent[];
  metadata: {
    totalCandidates: number;
    processingTimeMs: number;
    diversityScore: number;
    personalizedScore: number;
    marketContextApplied: boolean;
    cacheHit: boolean;
  };
  userProfile?: UserBehaviorProfile;
}

export class ContentRecommendationService {
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;
  private readonly redis: Redis;
  private readonly openai: OpenAI;
  private readonly config: ContentRecommendationConfig;
  private readonly marketAnalysisAgent: MarketAnalysisAgent;
  private readonly hybridSearchService: HybridSearchService;

  // African cryptocurrency context
  private readonly africanExchanges = [
    'Binance_Africa', 'Luno', 'Quidax', 'BuyCoins', 'Valr', 'Ice3X',
    'Remitano', 'NairaEx', 'KuBitX', 'Paxful', 'Yellow Card', 'Roqqu'
  ];

  private readonly africanCountries = [
    'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Uganda', 'Tanzania',
    'Rwanda', 'Zimbabwe', 'Botswana', 'Zambia', 'Morocco', 'Egypt'
  ];

  private readonly africanCryptoTopics = [
    'mobile money', 'cross-border payments', 'remittances', 'financial inclusion',
    'inflation hedge', 'currency devaluation', 'peer-to-peer trading',
    'unbanked population', 'diaspora payments', 'economic instability'
  ];

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    redis: Redis,
    config: ContentRecommendationConfig,
    marketAnalysisAgent: MarketAnalysisAgent,
    hybridSearchService: HybridSearchService
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.redis = redis;
    this.config = config;
    this.marketAnalysisAgent = marketAnalysisAgent;
    this.hybridSearchService = hybridSearchService;

    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  /**
   * Get personalized content recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = Date.now();
    this.logger.info('Getting content recommendations', { userId: request.userId, request });

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = await this.getCachedRecommendations(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true
          }
        };
      }

      // Build user behavior profile
      const userProfile = await this.buildUserBehaviorProfile(request.userId);

      // Get candidate content
      const candidates = await this.getCandidateContent(request, userProfile);

      // Extract content features
      const contentFeatures = await this.extractContentFeatures(candidates);

      // Apply AI-powered scoring
      const scoredContent = await this.scoreContentWithAI(
        contentFeatures, 
        userProfile, 
        request
      );

      // Apply diversity algorithms
      const diversifiedContent = this.applyDiversityAlgorithms(
        scoredContent, 
        request.diversityLevel || 'medium'
      );

      // Get market context if requested
      let marketContext = undefined;
      if (request.realTimeMarketContext) {
        marketContext = await this.getMarketContext(diversifiedContent);
      }

      // Build final recommendations
      const recommendations = await this.buildRecommendations(
        diversifiedContent.slice(0, request.limit || this.config.maxRecommendations),
        userProfile,
        marketContext
      );

      const result: RecommendationResult = {
        recommendations,
        metadata: {
          totalCandidates: candidates.length,
          processingTimeMs: Date.now() - startTime,
          diversityScore: this.calculateDiversityScore(recommendations),
          personalizedScore: this.calculatePersonalizedScore(recommendations, userProfile),
          marketContextApplied: !!marketContext,
          cacheHit: false
        },
        userProfile
      };

      // Cache the results
      await this.cacheRecommendations(cacheKey, result);

      this.logger.info('Content recommendations generated', {
        userId: request.userId,
        recommendationCount: recommendations.length,
        processingTimeMs: result.metadata.processingTimeMs
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to get content recommendations', {
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Build comprehensive user behavior profile
   */
  private async buildUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    this.logger.debug('Building user behavior profile', { userId });

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user engagements separately
    const userEngagements = await this.prisma.userEngagement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Last 1000 interactions
      include: {
        Article: {
          include: {
            Category: true
          }
        }
      }
    });

    // Analyze reading patterns
    const readingPatterns = this.analyzeReadingPatterns(userEngagements);

    // Extract topic interests
    const topicInterests = this.extractTopicInterests(userEngagements);

    // Analyze African market focus
    const africanMarketFocus = this.analyzeAfricanMarketFocus(userEngagements);

    // Calculate engagement score
    const engagementScore = this.calculateUserEngagementScore(userEngagements);

    // Extract preferred categories
    const categoryStats = this.analyzeCategoryPreferences(userEngagements);
    const preferredCategories = Object.keys(categoryStats)
      .sort((a, b) => (categoryStats[b] || 0) - (categoryStats[a] || 0))
      .slice(0, 5);

    const profile: UserBehaviorProfile = {
      userId,
      preferredCategories,
      readingPatterns,
      topicInterests,
      africanMarketFocus,
      engagementScore,
      lastUpdated: new Date()
    };

    // Cache the profile
    await this.cacheUserProfile(userId, profile);

    return profile;
  }

  /**
   * Analyze user reading patterns
   */
  private analyzeReadingPatterns(engagements: any[]): UserBehaviorProfile['readingPatterns'] {
    const readingEngagements = engagements.filter(e => e.actionType === 'VIEW' && e.durationSeconds);
    
    if (readingEngagements.length === 0) {
      return {
        averageReadingTime: 0,
        preferredContentLength: 'medium',
        activeHours: [],
        devicePreference: 'mobile'
      };
    }

    const averageReadingTime = readingEngagements.reduce((sum, e) => sum + (e.durationSeconds || 0), 0) / readingEngagements.length;

    // Determine preferred content length based on reading time vs article reading time
    const lengthPreferences = readingEngagements.reduce((acc, e) => {
      if (e.article?.readingTime) {
        const completionRatio = (e.durationSeconds || 0) / (e.article.readingTime * 60);
        if (completionRatio > 0.7) {
          if (e.article.readingTime <= 3) acc.short++;
          else if (e.article.readingTime <= 8) acc.medium++;
          else acc.long++;
        }
      }
      return acc;
    }, { short: 0, medium: 0, long: 0 });

    const preferredContentLength = Object.keys(lengthPreferences)
      .reduce((a, b) => lengthPreferences[a as keyof typeof lengthPreferences] > lengthPreferences[b as keyof typeof lengthPreferences] ? a : b) as 'short' | 'medium' | 'long';

    // Extract active hours
    const hourCounts: { [hour: number]: number } = {};
    engagements.forEach(e => {
      const hour = new Date(e.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const activeHours = Object.keys(hourCounts)
      .sort((a, b) => (hourCounts[parseInt(b)] || 0) - (hourCounts[parseInt(a)] || 0))
      .slice(0, 6)
      .map(h => parseInt(h));

    // Device preference
    const deviceCounts = engagements.reduce((acc, e) => {
      acc[e.deviceType] = (acc[e.deviceType] || 0) + 1;
      return acc;
    }, {} as { [device: string]: number });

    const devicePreference = Object.keys(deviceCounts)
      .reduce((a, b) => deviceCounts[a] > deviceCounts[b] ? a : b, 'mobile');

    return {
      averageReadingTime,
      preferredContentLength,
      activeHours,
      devicePreference
    };
  }

  /**
   * Extract topic interests from user engagements
   */
  private extractTopicInterests(engagements: any[]): { [topic: string]: number } {
    const topicScores: { [topic: string]: number } = {};

    engagements.forEach(engagement => {
      if (engagement.article && engagement.article.tags) {
        try {
          // Parse tags JSON string
          const tags = typeof engagement.article.tags === 'string' 
            ? JSON.parse(engagement.article.tags) 
            : engagement.article.tags;
          
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              const topicName = tag.toLowerCase();
              
              // Weight based on engagement type
              let weight = 1;
              switch (engagement.actionType) {
                case 'LIKE': weight = 3; break;
                case 'SHARE': weight = 4; break;
                case 'COMMENT': weight = 5; break;
                case 'BOOKMARK': weight = 6; break;
                case 'VIEW': weight = engagement.durationSeconds ? Math.min(engagement.durationSeconds / 60, 3) : 1; break;
              }

              topicScores[topicName] = (topicScores[topicName] || 0) + weight;
            });
          }
        } catch (error) {
          // Skip invalid JSON tags
        }
      }
    });

    // Normalize scores to 0-1 range
    const maxScore = Math.max(...Object.values(topicScores));
    if (maxScore > 0) {
      Object.keys(topicScores).forEach(topic => {
        topicScores[topic] = (topicScores[topic] || 0) / maxScore;
      });
    }

    return topicScores;
  }

  /**
   * Analyze African market focus from user behavior
   */
  private analyzeAfricanMarketFocus(engagements: any[]): UserBehaviorProfile['africanMarketFocus'] {
    const countryMentions: { [country: string]: number } = {};
    const exchangeMentions: { [exchange: string]: number } = {};
    let mobileMoneyInteractions = 0;
    let totalInteractions = 0;

    engagements.forEach(engagement => {
      if (engagement.article) {
        totalInteractions++;
        const content = `${engagement.article.title} ${engagement.article.content || ''} ${engagement.article.excerpt || ''}`.toLowerCase();

        // Count country mentions
        this.africanCountries.forEach(country => {
          if (content.includes(country.toLowerCase())) {
            countryMentions[country] = (countryMentions[country] || 0) + 1;
          }
        });

        // Count exchange mentions
        this.africanExchanges.forEach(exchange => {
          if (content.includes(exchange.toLowerCase().replace('_', ' '))) {
            exchangeMentions[exchange] = (exchangeMentions[exchange] || 0) + 1;
          }
        });

        // Count mobile money interest
        if (content.includes('mobile money') || content.includes('m-pesa') || 
            content.includes('orange money') || content.includes('mtn money')) {
          mobileMoneyInteractions++;
        }
      }
    });

    const preferredCountries = Object.keys(countryMentions)
      .sort((a, b) => (countryMentions[b] || 0) - (countryMentions[a] || 0))
      .slice(0, 3);

    const preferredExchanges = Object.keys(exchangeMentions)
      .sort((a, b) => (exchangeMentions[b] || 0) - (exchangeMentions[a] || 0))
      .slice(0, 3);

    return {
      preferredCountries,
      preferredExchanges,
      mobileMoneyInterest: totalInteractions > 0 ? (mobileMoneyInteractions / totalInteractions) > 0.1 : false
    };
  }

  /**
   * Calculate overall user engagement score
   */
  private calculateUserEngagementScore(engagements: any[]): number {
    if (engagements.length === 0) return 0;

    const weights = {
      VIEW: 1,
      LIKE: 3,
      SHARE: 4,
      COMMENT: 5,
      BOOKMARK: 6,
      SUBSCRIBE: 2,
      DOWNLOAD: 3
    };

    const totalScore = engagements.reduce((sum, engagement) => {
      const weight = weights[engagement.actionType as keyof typeof weights] || 1;
      return sum + weight;
    }, 0);

    const maxPossibleScore = engagements.length * 6; // Maximum weight per engagement
    return maxPossibleScore > 0 ? Math.min(totalScore / maxPossibleScore, 1) : 0;
  }

  /**
   * Analyze category preferences
   */
  private analyzeCategoryPreferences(engagements: any[]): { [category: string]: number } {
    const categoryStats: { [category: string]: number } = {};

    engagements.forEach(engagement => {
      if (engagement.article && engagement.article.category) {
        const categoryName = engagement.article.category.name;
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
      }
    });

    return categoryStats;
  }

  /**
   * Get candidate content for recommendations
   */
  private async getCandidateContent(
    request: RecommendationRequest,
    userProfile: UserBehaviorProfile
  ): Promise<Article[]> {
    const limit = Math.max((request.limit || this.config.maxRecommendations) * 3, 100);
    
    // Build filters based on user preferences and request
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date()
      }
    };

    // Time range filter
    if (request.timeRange && request.timeRange !== 'all') {
      const timeRanges = {
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };
      where.publishedAt.gte = timeRanges[request.timeRange];
    }

    // Exclude already read articles
    if (request.excludeReadArticles) {
      const readArticleIds = await this.getReadArticleIds(request.userId);
      if (readArticleIds.length > 0) {
        where.id = {
          notIn: readArticleIds
        };
      }
    }

    // Get articles with comprehensive includes
    const articles = await this.prisma.article.findMany({
      where,
      include: {
        User: true,
        Category: true,
        UserEngagement: {
          select: {
            actionType: true,
            userId: true
          }
        },
        _count: {
          select: {
            UserEngagement: true
          }
        }
      },
      orderBy: [
        { publishedAt: 'desc' },
        { viewCount: 'desc' }
      ],
      take: limit
    });

    return articles;
  }

  /**
   * Get list of articles already read by user
   */
  private async getReadArticleIds(userId: string): Promise<string[]> {
    const readEngagements = await this.prisma.userEngagement.findMany({
      where: {
        userId,
        actionType: 'VIEW'
      },
      select: {
        articleId: true
      },
      distinct: ['articleId']
    });

    return readEngagements
      .map(e => e.articleId)
      .filter((id): id is string => id !== null);
  }

  /**
   * Extract features from content for AI analysis
   */
  private async extractContentFeatures(articles: Article[]): Promise<ContentFeatures[]> {
    return Promise.all(articles.map(async (article: any) => {
      // Calculate popularity metrics
      const engagements = article.userEngagements || [];
      const views = engagements.filter((e: any) => e.actionType === 'VIEW').length;
      const likes = engagements.filter((e: any) => e.actionType === 'LIKE').length;
      const shares = engagements.filter((e: any) => e.actionType === 'SHARE').length;
      const comments = engagements.filter((e: any) => e.actionType === 'COMMENT').length;
      
      const totalEngagements = likes + shares + comments;
      const engagementRate = views > 0 ? totalEngagements / views : 0;

      // Calculate African relevance score
      const africanRelevanceScore = this.calculateAfricanRelevanceScore(article);

      // Extract market context
      const marketContext = this.extractMarketContext(article);

      const features: ContentFeatures = {
        articleId: article.id,
        categoryId: article.categoryId,
        tags: article.tags?.map((tag: any) => tag.name) || [],
        wordCount: article.wordCount || 0,
        readingTime: article.readingTime || 0,
        africanRelevanceScore,
        sentimentScore: article.sentimentScore || 0.5,
        qualityScore: article.qualityScore || 0.5,
        publishedAt: article.publishedAt,
        popularity: {
          views,
          likes,
          shares,
          comments,
          engagementRate
        },
        marketContext
      };

      return features;
    }));
  }

  /**
   * Calculate African relevance score for content
   */
  private calculateAfricanRelevanceScore(article: any): number {
    const content = `${article.title} ${article.content || ''} ${article.excerpt || ''}`.toLowerCase();
    let score = 0;
    let totalPossible = 0;

    // Check for African country mentions
    this.africanCountries.forEach(country => {
      totalPossible += 1;
      if (content.includes(country.toLowerCase())) {
        score += 1;
      }
    });

    // Check for African exchange mentions
    this.africanExchanges.forEach(exchange => {
      totalPossible += 1;
      if (content.includes(exchange.toLowerCase().replace('_', ' '))) {
        score += 1;
      }
    });

    // Check for African crypto topics
    this.africanCryptoTopics.forEach(topic => {
      totalPossible += 1;
      if (content.includes(topic)) {
        score += 1;
      }
    });

    return totalPossible > 0 ? score / totalPossible : 0;
  }

  /**
   * Extract market context from article content
   */
  private extractMarketContext(article: any): ContentFeatures['marketContext'] {
    const content = `${article.title} ${article.content || ''} ${article.excerpt || ''}`.toLowerCase();
    
    // Extract mentioned tokens (simplified - could use NLP)
    const tokenPatterns = /\b(btc|bitcoin|eth|ethereum|bnb|ada|cardano|dot|polkadot|link|chainlink|uni|uniswap|aave|comp|compound)\b/g;
    const mentionedTokens = Array.from(new Set((content.match(tokenPatterns) || []).map(t => t.toUpperCase())));

    // Extract mentioned exchanges
    const mentionedExchanges = this.africanExchanges.filter(exchange => 
      content.includes(exchange.toLowerCase().replace('_', ' '))
    );

    // Extract trending topics (simplified)
    const trendingPatterns = /\b(defi|nft|dao|web3|metaverse|staking|yield|farming|governance)\b/g;
    const trendingTopics = Array.from(new Set(content.match(trendingPatterns) || []));

    return {
      mentionedTokens,
      mentionedExchanges,
      trendingTopics
    };
  }

  /**
   * Score content using AI analysis
   */
  private async scoreContentWithAI(
    contentFeatures: ContentFeatures[],
    userProfile: UserBehaviorProfile,
    request: RecommendationRequest
  ): Promise<Array<ContentFeatures & { aiScore: number; reasons: RecommendationReason[] }>> {
    this.logger.debug('Scoring content with AI', { contentCount: contentFeatures.length });

    const prompt = this.buildScoringPrompt(contentFeatures, userProfile, request);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an AI expert in African cryptocurrency content recommendation. 
                     Analyze content features and user profiles to generate personalized recommendation scores.
                     Focus on African market relevance, user behavior patterns, and content diversity.
                     Return scores as JSON with explanation of reasoning.`
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
        throw new Error('No response from OpenAI');
      }

      const aiAnalysis = JSON.parse(response);
      
      return contentFeatures.map((features, index) => {
        const analysis = aiAnalysis.recommendations?.[index] || {};
        return {
          ...features,
          aiScore: analysis.score || 0.5,
          reasons: analysis.reasons || []
        };
      });

    } catch (error) {
      this.logger.warn('AI scoring failed, using fallback', { error: error instanceof Error ? error.message : 'Unknown' });
      
      // Fallback to rule-based scoring
      return contentFeatures.map(features => ({
        ...features,
        aiScore: this.calculateFallbackScore(features, userProfile),
        reasons: this.generateFallbackReasons(features, userProfile)
      }));
    }
  }

  /**
   * Build AI scoring prompt
   */
  private buildScoringPrompt(
    contentFeatures: ContentFeatures[],
    userProfile: UserBehaviorProfile,
    request: RecommendationRequest
  ): string {
    return `
Analyze these ${contentFeatures.length} articles for personalized recommendations.

User Profile:
- Preferred Categories: ${userProfile.preferredCategories.join(', ')}
- Reading Patterns: ${JSON.stringify(userProfile.readingPatterns)}
- Topic Interests: ${JSON.stringify(userProfile.topicInterests)}
- African Market Focus: ${JSON.stringify(userProfile.africanMarketFocus)}
- Engagement Score: ${userProfile.engagementScore}

Request Context:
- Include African Focus: ${request.includeAfricanFocus}
- Diversity Level: ${request.diversityLevel || 'medium'}
- Real-time Market Context: ${request.realTimeMarketContext}

Content Features:
${contentFeatures.slice(0, 20).map((features, index) => `
Article ${index + 1}:
- Category: ${features.categoryId}
- Tags: ${features.tags.join(', ')}
- Reading Time: ${features.readingTime} minutes
- African Relevance: ${features.africanRelevanceScore}
- Quality Score: ${features.qualityScore}
- Engagement Rate: ${features.popularity.engagementRate}
- Market Context: ${JSON.stringify(features.marketContext)}
`).join('\n')}

Generate recommendation scores (0-1) and reasons for each article. Focus on:
1. User preference alignment
2. African market relevance
3. Content quality and engagement
4. Market timing and trends
5. Content diversity considerations

Return JSON format:
{
  "recommendations": [
    {
      "score": 0.85,
      "reasons": [
        {
          "type": "behavioral",
          "description": "Matches user's preferred DeFi topics",
          "confidence": 0.9,
          "weight": 0.3
        }
      ]
    }
  ]
}`;
  }

  /**
   * Calculate fallback score when AI is unavailable
   */
  private calculateFallbackScore(
    features: ContentFeatures,
    userProfile: UserBehaviorProfile
  ): number {
    let score = 0;

    // Category preference match
    if (userProfile.preferredCategories.includes(features.categoryId)) {
      score += 0.3;
    }

    // Topic interest alignment
    const topicScore = features.tags.reduce((sum, tag) => {
      const interest = userProfile.topicInterests[tag.toLowerCase()] || 0;
      return sum + interest;
    }, 0) / Math.max(features.tags.length, 1);
    score += topicScore * 0.25;

    // African relevance boost
    score += features.africanRelevanceScore * this.config.africanContentBoost * 0.2;

    // Quality and engagement
    score += features.qualityScore * 0.15;
    score += Math.min(features.popularity.engagementRate, 1) * 0.1;

    return Math.min(score, 1);
  }

  /**
   * Generate fallback recommendation reasons
   */
  private generateFallbackReasons(
    features: ContentFeatures,
    userProfile: UserBehaviorProfile
  ): RecommendationReason[] {
    const reasons: RecommendationReason[] = [];

    if (userProfile.preferredCategories.includes(features.categoryId)) {
      reasons.push({
        type: 'behavioral',
        description: 'Matches your preferred content category',
        confidence: 0.8,
        weight: 0.3
      });
    }

    if (features.africanRelevanceScore > 0.5) {
      reasons.push({
        type: 'african_focus',
        description: 'Relevant to African cryptocurrency markets',
        confidence: features.africanRelevanceScore,
        weight: 0.2
      });
    }

    if (features.popularity.engagementRate > 0.1) {
      reasons.push({
        type: 'trending',
        description: 'High community engagement',
        confidence: 0.7,
        weight: 0.15
      });
    }

    return reasons;
  }

  /**
   * Apply diversity algorithms to prevent recommendation bubbles
   */
  private applyDiversityAlgorithms<T extends { categoryId: string; tags: string[] }>(
    scoredContent: T[],
    diversityLevel: 'low' | 'medium' | 'high'
  ): T[] {
    const diversityThresholds = {
      low: 0.2,
      medium: 0.4,
      high: 0.6
    };

    const threshold = diversityThresholds[diversityLevel];
    const selectedContent: T[] = [];
    const categoryCount: { [category: string]: number } = {};
    const tagCount: { [tag: string]: number } = {};

    // Sort by AI score first
    const sortedContent = [...scoredContent].sort((a, b) => 
      (b as any).aiScore - (a as any).aiScore
    );

    for (const content of sortedContent) {
      // Calculate diversity penalty
      const categoryPenalty = (categoryCount[content.categoryId] || 0) * threshold;
      const tagPenalty = content.tags.reduce((sum, tag) => 
        sum + ((tagCount[tag] || 0) * threshold), 0) / Math.max(content.tags.length, 1);

      const diversityPenalty = Math.min(categoryPenalty + tagPenalty, 0.5);
      
      // Apply penalty to score
      (content as any).finalScore = Math.max((content as any).aiScore - diversityPenalty, 0);

      selectedContent.push(content);

      // Update counters
      categoryCount[content.categoryId] = (categoryCount[content.categoryId] || 0) + 1;
      content.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }

    // Re-sort by final score
    return selectedContent.sort((a, b) => (b as any).finalScore - (a as any).finalScore);
  }

  /**
   * Get real-time market context
   */
  private async getMarketContext(content: any[]): Promise<any> {
    try {
      // Extract mentioned tokens from content
      const mentionedTokens = Array.from(new Set(
        content.flatMap(c => c.marketContext?.mentionedTokens || [])
      ));

      if (mentionedTokens.length === 0) {
        return null;
      }

      // Simple market context for now - in production would integrate with market analysis agent
      return {
        trendingTokens: mentionedTokens.slice(0, 5),
        recent_events: [
          'African crypto adoption increasing',
          'Mobile money integration expanding',
          'Regulatory clarity improving'
        ],
        relevantExchanges: this.africanExchanges.slice(0, 3)
      };

    } catch (error) {
      this.logger.warn('Failed to get market context', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      return null;
    }
  }

  /**
   * Build final recommendation objects
   */
  private async buildRecommendations(
    scoredContent: any[],
    userProfile: UserBehaviorProfile,
    marketContext?: any
  ): Promise<RecommendedContent[]> {
    const articleIds = scoredContent.map(c => c.articleId);

    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: {
        User: true,
        Category: true
      }
    });

    const articleMap = new Map(articles.map(a => [a.id, a]));

    return scoredContent.map(scored => {
      const article = articleMap.get(scored.articleId);
      if (!article) return null;

      const africanRelevance = {
        score: scored.africanRelevanceScore,
        countries: this.africanCountries.filter(country =>
          `${article.title} ${article.content || ''}`.toLowerCase()
            .includes(country.toLowerCase())
        ),
        exchanges: scored.marketContext.mentionedExchanges,
        culturalContext: this.africanCryptoTopics.filter(topic =>
          `${article.title} ${article.content || ''}`.toLowerCase().includes(topic)
        )
      };

      return {
        articleId: article.id,
        title: article.title,
        excerpt: article.excerpt || '',
        categoryName: article.Category?.name || '',
        tags: this.parseTags(article.tags),
        authorName: article.User?.username || 'Anonymous',
        publishedAt: article.publishedAt || new Date(),
        readingTime: article.readingTimeMinutes || 0,
        recommendationScore: scored.finalScore || scored.aiScore,
        reasons: scored.reasons || [],
        africanRelevance,
        marketContext: marketContext ? {
          trendingTokens: scored.marketContext.mentionedTokens,
          recentMarketEvents: marketContext.recent_events || [],
          relevantExchanges: scored.marketContext.mentionedExchanges
        } : undefined
      } as RecommendedContent;
    }).filter((rec): rec is RecommendedContent => rec !== null);
  }

  /**
   * Calculate diversity score for recommendations
   */
  private calculateDiversityScore(recommendations: RecommendedContent[]): number {
    if (recommendations.length === 0) return 0;

    const categories = new Set(recommendations.map(r => r.categoryName));
    const tags = new Set(recommendations.flatMap(r => r.tags));
    
    const categoryDiversity = categories.size / recommendations.length;
    const tagDiversity = Math.min(tags.size / (recommendations.length * 3), 1);
    
    return (categoryDiversity + tagDiversity) / 2;
  }

  /**
   * Calculate personalized score
   */
  private calculatePersonalizedScore(
    recommendations: RecommendedContent[],
    userProfile: UserBehaviorProfile
  ): number {
    if (recommendations.length === 0) return 0;

    return recommendations.reduce((sum, rec) => {
      const behavioralReasons = rec.reasons.filter(r => r.type === 'behavioral');
      const personalizedWeight = behavioralReasons.reduce((w, r) => w + r.weight, 0);
      return sum + personalizedWeight;
    }, 0) / recommendations.length;
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(request: RecommendationRequest): string {
    const keyData = {
      userId: request.userId,
      contentType: request.contentType,
      limit: request.limit,
      excludeRead: request.excludeReadArticles,
      africanFocus: request.includeAfricanFocus,
      timeRange: request.timeRange,
      diversity: request.diversityLevel
    };
    
    return `recommendations:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  private async getCachedRecommendations(cacheKey: string): Promise<RecommendationResult | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Failed to get cached recommendations', { error });
    }
    return null;
  }

  private async cacheRecommendations(cacheKey: string, result: RecommendationResult): Promise<void> {
    try {
      await this.redis.setex(
        cacheKey,
        Math.floor(this.config.cacheTimeoutMs / 1000),
        JSON.stringify(result)
      );
    } catch (error) {
      this.logger.warn('Failed to cache recommendations', { error });
    }
  }

  private async cacheUserProfile(userId: string, profile: UserBehaviorProfile): Promise<void> {
    try {
      await this.redis.setex(
        `user_profile:${userId}`,
        3600, // 1 hour
        JSON.stringify(profile)
      );
    } catch (error) {
      this.logger.warn('Failed to cache user profile', { error });
    }
  }

  /**
   * Parse tags from JSON string or return empty array
   */
  private parseTags(tags: string | null): string[] {
    if (!tags) return [];
    
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Update user behavior in real-time
   */
  async updateUserBehavior(userId: string, engagement: {
    articleId: string;
    actionType: string;
    durationSeconds?: number;
    deviceType?: string;
  }): Promise<void> {
    this.logger.debug('Updating user behavior', { userId, engagement });

    try {
      // Record engagement
      await this.prisma.userEngagement.create({
        data: {
          id: randomUUID(),
          userId,
          articleId: engagement.articleId,
          actionType: engagement.actionType,
          durationSeconds: engagement.durationSeconds || null,
          deviceType: engagement.deviceType || 'unknown',
          userAgent: 'system',
          ipAddress: '0.0.0.0'
        }
      });

      // Invalidate user profile cache
      await this.redis.del(`user_profile:${userId}`);

      // Invalidate recommendation caches for this user
      const pattern = `recommendations:*${userId}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      this.logger.debug('User behavior updated', { userId, engagement });

    } catch (error) {
      this.logger.error('Failed to update user behavior', {
        userId,
        engagement,
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  }

  /**
   * Get trending content for African markets
   */
  async getTrendingAfricanContent(limit: number = 10): Promise<RecommendedContent[]> {
    this.logger.info('Getting trending African content', { limit });

    try {
      const articles = await this.prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          User: true,
          Category: true,
          UserEngagement: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        },
        orderBy: {
          viewCount: 'desc'
        },
        take: limit * 2
      });

      // Filter for African relevance and calculate trending scores
      const africanContent = articles
        .map(article => {
          const africanScore = this.calculateAfricanRelevanceScore(article);
          const engagementScore = article.UserEngagement.length / Math.max(article.viewCount || 1, 1);
          
          return {
            article,
            africanScore,
            trendingScore: africanScore * 0.6 + engagementScore * 0.4
          };
        })
        .filter(item => item.africanScore > 0.3)
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      return africanContent.map(item => ({
        articleId: item.article.id,
        title: item.article.title,
        excerpt: item.article.excerpt || '',
        categoryName: item.article.Category?.name || '',
        tags: this.parseTags(item.article.tags),
        authorName: item.article.User?.username || 'Anonymous',
        publishedAt: item.article.publishedAt || new Date(),
        readingTime: item.article.readingTimeMinutes || 0,
        recommendationScore: item.trendingScore,
        reasons: [
          {
            type: 'trending',
            description: 'Trending in African cryptocurrency markets',
            confidence: item.africanScore,
            weight: 0.8
          }
        ],
        africanRelevance: {
          score: item.africanScore,
          countries: [],
          exchanges: [],
          culturalContext: []
        }
      } as RecommendedContent));

    } catch (error) {
      this.logger.error('Failed to get trending African content', { error });
      return [];
    }
  }

  /**
   * Get recommendation metrics
   */
  getMetrics() {
    return {
      name: 'Content Recommendation Service',
      version: '1.0.0',
      dependencies: ['Market Analysis Agent', 'Hybrid Search Service'],
      africanFocus: true,
      realTimeUpdates: this.config.enableRealTimeUpdates
    };
  }
}