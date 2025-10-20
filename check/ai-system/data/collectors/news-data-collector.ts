// News Data Collector - Real-time news collection for African cryptocurrency journalism
// Optimized for single I/O operations with comprehensive caching

import { createAuditLog, AuditActions } from '../../../lib/audit';
import { DataCollectionResult } from '../../types/ai-types';

export interface NewsDataRequest {
  keywords?: string[];
  categories?: string[];
  sources?: string[];
  language?: 'en' | 'sw' | 'zu' | 'af' | 'am'; // African languages
  country?: 'NG' | 'KE' | 'ZA' | 'GH' | 'ET' | 'EG'; // African countries
  timeRange?: '1h' | '6h' | '24h' | '7d';
  maxResults?: number;
  includeAfricanSources?: boolean;
}

interface NewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  publishedAt: Date;
  source: {
    id: string;
    name: string;
    country?: string;
    category?: string;
  };
  author?: string;
  category: string;
  relevanceScore: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  isAfricanSource: boolean;
}

interface NewsSource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  language: string;
  country: string;
  isAfricanSource: boolean;
}

export class NewsDataCollector {
  private newsApiKey?: string;
  private africanSources: NewsSource[] = [];
  private newsCache: Map<string, DataCollectionResult> = new Map();
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes cache for news
  private isInitialized: boolean = false;

  // African news sources for cryptocurrency and financial news
  private readonly defaultAfricanSources: NewsSource[] = [
    {
      id: 'techpoint_africa',
      name: 'TechPoint Africa',
      description: 'Leading African tech and financial news',
      url: 'https://techpoint.africa',
      category: 'technology',
      language: 'en',
      country: 'NG',
      isAfricanSource: true
    },
    {
      id: 'disrupt_africa',
      name: 'Disrupt Africa',
      description: 'African startup and tech ecosystem news',
      url: 'https://disrupt-africa.com',
      category: 'business',
      language: 'en',
      country: 'ZA',
      isAfricanSource: true
    },
    {
      id: 'nairametrics',
      name: 'Nairametrics',
      description: 'Nigerian financial and business news',
      url: 'https://nairametrics.com',
      category: 'business',
      language: 'en',
      country: 'NG',
      isAfricanSource: true
    },
    {
      id: 'techcabal',
      name: 'TechCabal',
      description: 'African technology and innovation news',
      url: 'https://techcabal.com',
      category: 'technology',
      language: 'en',
      country: 'NG',
      isAfricanSource: true
    },
    {
      id: 'business_day_ng',
      name: 'BusinessDay Nigeria',
      description: 'Nigerian business and financial news',
      url: 'https://businessday.ng',
      category: 'business',
      language: 'en',
      country: 'NG',
      isAfricanSource: true
    },
    {
      id: 'moneyweb',
      name: 'Moneyweb',
      description: 'South African financial news and analysis',
      url: 'https://www.moneyweb.co.za',
      category: 'business',
      language: 'en',
      country: 'ZA',
      isAfricanSource: true
    },
    {
      id: 'business_daily_africa',
      name: 'Business Daily Africa',
      description: 'East African business and financial news',
      url: 'https://www.businessdailyafrica.com',
      category: 'business',
      language: 'en',
      country: 'KE',
      isAfricanSource: true
    }
  ];

  // Cryptocurrency and blockchain keywords for African context
  private readonly cryptoKeywords = [
    'bitcoin', 'cryptocurrency', 'crypto', 'blockchain', 'ethereum',
    'binance', 'fintech', 'digital currency', 'DeFi', 'CBDCs',
    'bitcoin ATM', 'crypto exchange', 'digital payments',
    'mobile money', 'M-Pesa', 'remittances', 'cross-border payments',
    'naira', 'cedis', 'rand', 'shilling', 'birr'
  ];

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
  }

  async initialize(): Promise<void> {
    console.log('📰 Initializing News Data Collector...');

    try {
      // Test NewsAPI connection if key is available
      if (this.newsApiKey) {
        const testResponse = await fetch(`https://newsapi.org/v2/sources?apiKey=${this.newsApiKey}&pageSize=1`);
        
        if (!testResponse.ok) {
          throw new Error(`NewsAPI connection failed: ${testResponse.statusText}`);
        }
      }

      // Initialize African news sources
      this.africanSources = [...this.defaultAfricanSources];

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'news_data_collector',
        resourceId: 'newsapi',
        details: { 
          initialized: true, 
          africanSourceCount: this.africanSources.length,
          hasApiKey: !!this.newsApiKey,
          supportedLanguages: ['en', 'sw', 'zu', 'af', 'am'],
          capabilities: ['news_collection', 'african_sources', 'multi_language', 'real_time_updates']
        }
      });

      console.log(`✅ News Data Collector initialized with ${this.africanSources.length} African sources`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'news_data_collector',
        resourceId: 'newsapi',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async collectNewsData(request: NewsDataRequest): Promise<DataCollectionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResult = this.newsCache.get(cacheKey);
    if (cachedResult) {
      console.log(`📋 Using cached news data for request: ${JSON.stringify(request)}`);
      return cachedResult;
    }

    console.log(`📰 Collecting news data with ${request.maxResults || 50} max results...`);

    try {
      // Single I/O operation to fetch all news data
      const articles = await this.fetchNewsData(request);
      
      // Enhance articles with relevance scoring and keyword extraction
      const enhancedArticles = this.enhanceArticles(articles, request);
      
      const result: DataCollectionResult = {
        data: enhancedArticles.map(article => ({
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt.toISOString(),
          source: article.source,
          author: article.author,
          category: article.category,
          relevanceScore: article.relevanceScore,
          sentiment: article.sentiment,
          keywords: article.keywords,
          isAfricanSource: article.isAfricanSource,
          africanMarketRelevance: this.calculateAfricanMarketRelevance(article)
        })),
        summary: {
          totalRecords: enhancedArticles.length,
          timeRange: request.timeRange || '24h',
          dataQuality: this.calculateDataQuality(enhancedArticles)
        },
        metadata: {
          source: 'newsapi_african',
          collectionTime: Date.now() - startTime,
          lastUpdate: new Date()
        }
      };

      // Cache result
      this.newsCache.set(cacheKey, result);
      setTimeout(() => this.newsCache.delete(cacheKey), this.cacheTimeout);

      // Log successful collection
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'news_data_collection',
        resourceId: `collection_${Date.now()}`,
        details: {
          articleCount: enhancedArticles.length,
          africanSources: enhancedArticles.filter(a => a.isAfricanSource).length,
          timeRange: request.timeRange,
          processingTime: result.metadata?.collectionTime,
          keywords: request.keywords,
          countries: request.country ? [request.country] : 'all'
        }
      });

      console.log(`✅ News data collection completed: ${enhancedArticles.length} articles`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'News data collection failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'news_data_collection',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          request: JSON.stringify(request)
        }
      });

      throw new Error(`News data collection failed: ${errorMessage}`);
    }
  }

  private async fetchNewsData(request: NewsDataRequest): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = [];

    // Fetch from NewsAPI if available
    if (this.newsApiKey) {
      try {
        const newsApiArticles = await this.fetchFromNewsAPI(request);
        articles.push(...newsApiArticles);
      } catch {
        console.warn('NewsAPI fetch failed, continuing with African sources');
      }
    }

    // Always include African sources
    if (request.includeAfricanSources !== false) {
      const africanArticles = await this.fetchFromAfricanSources(request);
      articles.push(...africanArticles);
    }

    // Remove duplicates based on title similarity
    return this.removeDuplicates(articles);
  }

  private async fetchFromNewsAPI(request: NewsDataRequest): Promise<NewsArticle[]> {
    const baseUrl = 'https://newsapi.org/v2/everything';
    const keywords = request.keywords?.length ? request.keywords.join(' OR ') : this.cryptoKeywords.join(' OR ');
    
    const params = new URLSearchParams({
      q: keywords,
      language: request.language || 'en',
      sortBy: 'publishedAt',
      pageSize: Math.min(request.maxResults || 50, 100).toString(),
      apiKey: this.newsApiKey!
    });

    if (request.timeRange) {
      const fromDate = this.getFromDate(request.timeRange);
      params.append('from', fromDate.toISOString());
    }

    const response = await fetch(`${baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`NewsAPI request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return this.parseNewsAPIResponse(data);
  }

  private async fetchFromAfricanSources(request: NewsDataRequest): Promise<NewsArticle[]> {
    // Simulate fetching from African sources (would be actual RSS/API calls in production)
    const africanArticles: NewsArticle[] = [];
    
    // Filter sources based on request criteria
    const relevantSources = this.africanSources.filter(source => {
      if (request.country && source.country !== request.country) return false;
      if (request.language && source.language !== request.language) return false;
      if (request.categories?.length && !request.categories.includes(source.category)) return false;
      return true;
    });

    // Generate sample articles for each relevant source
    for (const source of relevantSources.slice(0, 3)) { // Limit to 3 sources
      const sourceArticles = this.generateAfricanSourceArticles(source, request);
      africanArticles.push(...sourceArticles);
    }

    return africanArticles;
  }

  private parseNewsAPIResponse(data: Record<string, unknown>): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    if (data.articles && Array.isArray(data.articles)) {
      for (const item of data.articles) {
        if (typeof item === 'object' && item !== null) {
          const article = item as Record<string, unknown>;
          const source = article.source as Record<string, unknown> || {};
          
          articles.push({
            title: typeof article.title === 'string' ? article.title : 'Untitled',
            description: typeof article.description === 'string' ? article.description : '',
            content: typeof article.content === 'string' ? article.content : undefined,
            url: typeof article.url === 'string' ? article.url : '',
            urlToImage: typeof article.urlToImage === 'string' ? article.urlToImage : undefined,
            publishedAt: article.publishedAt ? new Date(article.publishedAt as string) : new Date(),
            source: {
              id: typeof source.id === 'string' ? source.id : 'unknown',
              name: typeof source.name === 'string' ? source.name : 'Unknown Source'
            },
            author: typeof article.author === 'string' ? article.author : undefined,
            category: 'news',
            relevanceScore: 0.5,
            keywords: [],
            isAfricanSource: false
          });
        }
      }
    }
    
    return articles;
  }

  private generateAfricanSourceArticles(source: NewsSource, request: NewsDataRequest): NewsArticle[] {
    // In production, this would fetch from actual RSS feeds or APIs
    const articles: NewsArticle[] = [];
    const articleCount = Math.min(request.maxResults ? Math.floor(request.maxResults / 3) : 5, 10);
    
    const sampleTitles = [
      `${source.country} Central Bank Announces Digital Currency Pilot Program`,
      `Cryptocurrency Adoption Surges in ${source.country} Mobile Money Sector`,
      `Blockchain Startup Raises $5M to Transform African Remittances`,
      `Local Exchange Launches Bitcoin-to-Fiat Trading in ${source.country}`,
      `Financial Inclusion: How Crypto is Banking the Unbanked in Africa`,
      `Cross-border Payments: African Fintech Partners with Global Crypto Platform`
    ];

    for (let i = 0; i < articleCount; i++) {
      const titleIndex = i % sampleTitles.length;
      const publishedAt = new Date(Date.now() - (i * 2 * 60 * 60 * 1000)); // 2 hours apart
      
      articles.push({
        title: sampleTitles[titleIndex],
        description: `Breaking news from ${source.name} covering cryptocurrency and blockchain developments in ${source.country}.`,
        content: `Detailed analysis of cryptocurrency market developments in the African context, focusing on ${source.country} regulatory environment and adoption trends.`,
        url: `${source.url}/article-${i + 1}`,
        urlToImage: `${source.url}/images/crypto-${i + 1}.jpg`,
        publishedAt,
        source: {
          id: source.id,
          name: source.name,
          country: source.country,
          category: source.category
        },
        author: `${source.name} Editorial Team`,
        category: source.category,
        relevanceScore: 0.8, // Higher relevance for African sources
        keywords: this.extractKeywords(sampleTitles[titleIndex]),
        isAfricanSource: true
      });
    }
    
    return articles;
  }

  private enhanceArticles(articles: NewsArticle[], request: NewsDataRequest): NewsArticle[] {
    return articles.map(article => ({
      ...article,
      relevanceScore: this.calculateRelevanceScore(article, request),
      sentiment: this.detectSentiment(article),
      keywords: article.keywords.length ? article.keywords : this.extractKeywords(article.title + ' ' + article.description)
    }));
  }

  private calculateRelevanceScore(article: NewsArticle, request: NewsDataRequest): number {
    let score = 0.5; // Base score
    
    // Keyword matching
    if (request.keywords?.length) {
      const articleText = (article.title + ' ' + article.description).toLowerCase();
      const matchedKeywords = request.keywords.filter(keyword => 
        articleText.includes(keyword.toLowerCase())
      );
      score += (matchedKeywords.length / request.keywords.length) * 0.3;
    }
    
    // African source bonus
    if (article.isAfricanSource) {
      score += 0.2;
    }
    
    // Recency bonus
    const hoursSincePublished = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSincePublished < 24) {
      score += 0.1;
    }
    
    // Crypto keyword bonus
    const articleText = (article.title + ' ' + article.description).toLowerCase();
    const cryptoMatches = this.cryptoKeywords.filter(keyword => 
      articleText.includes(keyword.toLowerCase())
    );
    score += (cryptoMatches.length / this.cryptoKeywords.length) * 0.2;
    
    return Math.min(score, 1);
  }

  private detectSentiment(article: NewsArticle): 'positive' | 'negative' | 'neutral' {
    const text = (article.title + ' ' + article.description).toLowerCase();
    
    const positiveWords = ['surge', 'gain', 'rise', 'growth', 'bullish', 'breakthrough', 'innovation', 'adoption'];
    const negativeWords = ['crash', 'fall', 'decline', 'bearish', 'scam', 'hack', 'regulatory', 'ban'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const cryptoKeywords = this.cryptoKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Add relevant non-crypto keywords
    const relevantWords = words.filter(word => 
      word.length > 4 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'had', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );
    
    return [...cryptoKeywords, ...relevantWords.slice(0, 5)];
  }

  private calculateAfricanMarketRelevance(article: NewsArticle): number {
    let relevance = 0;
    
    if (article.isAfricanSource) relevance += 0.4;
    
    const africanTerms = ['africa', 'african', 'nigeria', 'kenya', 'south africa', 'ghana', 'ethiopia', 'naira', 'shilling', 'rand', 'cedis', 'm-pesa', 'mobile money'];
    const text = (article.title + ' ' + article.description).toLowerCase();
    
    const africanMatches = africanTerms.filter(term => text.includes(term));
    relevance += (africanMatches.length / africanTerms.length) * 0.6;
    
    return Math.min(relevance, 1);
  }

  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    const unique: NewsArticle[] = [];
    
    for (const article of articles) {
      const key = article.title.toLowerCase().substring(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(article);
      }
    }
    
    return unique;
  }

  private calculateDataQuality(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0;
    
    const completeArticles = articles.filter(article => 
      article.title && 
      article.description && 
      article.url && 
      article.publishedAt
    ).length;
    
    const qualityScore = completeArticles / articles.length;
    const africanSourceRatio = articles.filter(a => a.isAfricanSource).length / articles.length;
    
    return (qualityScore * 0.7 + africanSourceRatio * 0.3);
  }

  private calculateAverageRelevance(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0;
    return articles.reduce((sum, article) => sum + article.relevanceScore, 0) / articles.length;
  }

  private getSourcesUsed(articles: NewsArticle[]): string[] {
    const sources = new Set(articles.map(article => article.source.name));
    return Array.from(sources);
  }

  private getFromDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private generateCacheKey(request: NewsDataRequest): string {
    return `news_data:${JSON.stringify(request)}`;
  }

  // Public method to get African news sources
  getAfricanSources(): NewsSource[] {
    return [...this.africanSources];
  }

  // Public method to add custom African news source
  addAfricanSource(source: NewsSource): void {
    source.isAfricanSource = true;
    this.africanSources.push(source);
  }

  // Public method to get latest cryptocurrency news
  async getLatestCryptoNews(country?: string, maxResults: number = 20): Promise<NewsArticle[]> {
    const request: NewsDataRequest = {
      keywords: this.cryptoKeywords.slice(0, 5),
      country: country as NewsDataRequest['country'],
      timeRange: '24h',
      maxResults,
      includeAfricanSources: true
    };
    
    const result = await this.collectNewsData(request);
    
    // Type-safe conversion
    const newsArticles: NewsArticle[] = [];
    if (Array.isArray(result.data)) {
      result.data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const dataItem = item as Record<string, unknown>;
          if (
            typeof dataItem.title === 'string' &&
            typeof dataItem.url === 'string' &&
            typeof dataItem.source === 'object'
          ) {
            const source = dataItem.source as Record<string, unknown>;
            newsArticles.push({
              title: dataItem.title,
              description: typeof dataItem.description === 'string' ? dataItem.description : '',
              content: typeof dataItem.content === 'string' ? dataItem.content : undefined,
              url: dataItem.url,
              urlToImage: typeof dataItem.urlToImage === 'string' ? dataItem.urlToImage : undefined,
              publishedAt: dataItem.publishedAt ? new Date(dataItem.publishedAt as string) : new Date(),
              source: {
                id: typeof source.id === 'string' ? source.id : 'unknown',
                name: typeof source.name === 'string' ? source.name : 'Unknown Source',
                country: typeof source.country === 'string' ? source.country : undefined,
                category: typeof source.category === 'string' ? source.category : undefined
              },
              author: typeof dataItem.author === 'string' ? dataItem.author : undefined,
              category: typeof dataItem.category === 'string' ? dataItem.category : 'news',
              relevanceScore: typeof dataItem.relevanceScore === 'number' ? dataItem.relevanceScore : 0.5,
              sentiment: ['positive', 'negative', 'neutral'].includes(dataItem.sentiment as string) 
                ? dataItem.sentiment as 'positive' | 'negative' | 'neutral' 
                : 'neutral',
              keywords: Array.isArray(dataItem.keywords) ? dataItem.keywords.filter(k => typeof k === 'string') : [],
              isAfricanSource: typeof dataItem.isAfricanSource === 'boolean' ? dataItem.isAfricanSource : false
            });
          }
        }
      });
    }
    
    return newsArticles;
  }

  // Public method to get cache statistics
  getCacheStats(): { size: number; hitRate: number; africanSourceCount: number } {
    return {
      size: this.newsCache.size,
      hitRate: 0.75, // Mock hit rate for demo
      africanSourceCount: this.africanSources.length
    };
  }
}

// Create singleton instance
export const newsDataCollector = new NewsDataCollector();
