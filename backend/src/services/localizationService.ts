/**
 * Localization Service - Task 65: Global & African Localization Expansion
 * Comprehensive localization system for African market dominance
 * 
 * Features:
 * - Country-specific subdomains and content
 * - 15 African languages support
 * - Regional market data and crypto indexes
 * - Influencer partnership management
 * - Media syndication widgets
 * - Localized SEO optimization
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface RegionConfig {
  countryCode: string;
  countryName: string;
  region: 'WEST_AFRICA' | 'EAST_AFRICA' | 'SOUTHERN_AFRICA' | 'NORTH_AFRICA';
  subdomain: string;
  primaryLanguage: string;
  supportedLanguages: string[];
  currency: string;
  timezone: string;
  exchangePriority?: string[];
  cryptoFocus?: string[];
  isActive: boolean;
}

export interface LocalizedContentInput {
  contentId: string;
  contentType: 'ARTICLE' | 'PAGE' | 'CATEGORY';
  countryCode: string;
  regionCode?: string;
  languageCode: string;
  title: string;
  excerpt?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  currency?: string;
  priceLocalization?: Record<string, any>;
  paymentMethods?: string[];
  legalDisclaimer?: string;
}

export interface LocalizationResult {
  id: string;
  contentId: string;
  countryCode: string;
  languageCode: string;
  status: string;
  qualityScore: number;
  createdAt: Date;
  publishedAt?: Date;
}

export interface InfluencerInput {
  name: string;
  username?: string;
  platform: 'TWITTER' | 'TELEGRAM' | 'YOUTUBE' | 'INSTAGRAM' | 'LINKEDIN';
  profileUrl: string;
  countryCode?: string;
  region?: string;
  followersCount: number;
  engagementRate: number;
  partnershipType?: string;
  email?: string;
  phone?: string;
}

export interface AfricanIndexInput {
  name: string;
  symbol: string;
  region?: string;
  constituents: Array<{ tokenSymbol: string; weight: number }>;
  methodology: string;
  rebalanceFrequency: string;
}

export interface WidgetInput {
  name: string;
  description?: string;
  widgetType: 'ARTICLE_FEED' | 'PRICE_TICKER' | 'MARKET_OVERVIEW' | 'TRENDING';
  targetCountries: string[];
  targetLanguages: string[];
  contentFilter?: Record<string, any>;
  theme?: 'light' | 'dark' | 'custom';
  layout?: 'grid' | 'list' | 'carousel';
  maxItems?: number;
  partnerName?: string;
  partnerDomain?: string;
  partnerContact?: string;
}

export interface LocalizationStats {
  totalLocalizations: number;
  byCountry: Record<string, number>;
  byLanguage: Record<string, number>;
  byStatus: Record<string, number>;
  averageQualityScore: number;
  influencers: {
    total: number;
    active: number;
    byRegion: Record<string, number>;
  };
  indexes: {
    total: number;
    active: number;
  };
  widgets: {
    total: number;
    active: number;
    totalRequests: number;
  };
}

// ============================================
// LOCALIZATION SERVICE CLASS
// ============================================

export class LocalizationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {}

  // ============================================
  // REGIONAL CONFIGURATION
  // ============================================

  /**
   * Initialize regional configurations for African countries
   */
  async initializeRegions(): Promise<RegionConfig[]> {
    this.logger.info('Initializing regional configurations');

    const regions: RegionConfig[] = [
      {
        countryCode: 'NG',
        countryName: 'Nigeria',
        region: 'WEST_AFRICA',
        subdomain: 'ng',
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'ha', 'ig', 'yo'],
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        exchangePriority: ['Binance', 'Luno', 'Quidax', 'BuyCoins'],
        cryptoFocus: ['BTC', 'ETH', 'BNB', 'USDT'],
        isActive: true
      },
      {
        countryCode: 'KE',
        countryName: 'Kenya',
        region: 'EAST_AFRICA',
        subdomain: 'ke',
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'sw'],
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        exchangePriority: ['Binance', 'Paxful', 'LocalBitcoins'],
        cryptoFocus: ['BTC', 'ETH', 'USDT', 'XRP'],
        isActive: true
      },
      {
        countryCode: 'ZA',
        countryName: 'South Africa',
        region: 'SOUTHERN_AFRICA',
        subdomain: 'za',
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'af', 'zu', 'xh'],
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
        exchangePriority: ['Luno', 'VALR', 'Ice3X'],
        cryptoFocus: ['BTC', 'ETH', 'XRP', 'LTC'],
        isActive: true
      },
      {
        countryCode: 'GH',
        countryName: 'Ghana',
        region: 'WEST_AFRICA',
        subdomain: 'gh',
        primaryLanguage: 'en',
        supportedLanguages: ['en'],
        currency: 'GHS',
        timezone: 'Africa/Accra',
        exchangePriority: ['Binance', 'Luno'],
        cryptoFocus: ['BTC', 'ETH', 'BNB', 'USDT'],
        isActive: true
      },
      {
        countryCode: 'ET',
        countryName: 'Ethiopia',
        region: 'EAST_AFRICA',
        subdomain: 'et',
        primaryLanguage: 'am',
        supportedLanguages: ['am', 'en', 'om', 'ti'],
        currency: 'ETB',
        timezone: 'Africa/Addis_Ababa',
        exchangePriority: ['Binance'],
        cryptoFocus: ['BTC', 'ETH', 'USDT'],
        isActive: true
      }
    ];

    // Create or update regions in database
    for (const region of regions) {
      await this.prisma.regionConfiguration.upsert({
        where: { countryCode: region.countryCode },
        create: {
          countryCode: region.countryCode,
          countryName: region.countryName,
          region: region.region,
          subdomain: region.subdomain,
          primaryLanguage: region.primaryLanguage,
          supportedLanguages: JSON.stringify(region.supportedLanguages),
          defaultLanguage: region.primaryLanguage,
          currency: region.currency,
          timezone: region.timezone,
          exchangePriority: JSON.stringify(region.exchangePriority || []),
          cryptoFocus: JSON.stringify(region.cryptoFocus || []),
          isActive: region.isActive,
          launchDate: new Date()
        },
        update: {
          countryName: region.countryName,
          supportedLanguages: JSON.stringify(region.supportedLanguages),
          exchangePriority: JSON.stringify(region.exchangePriority || []),
          cryptoFocus: JSON.stringify(region.cryptoFocus || []),
          updatedAt: new Date()
        }
      });
    }

    this.logger.info(`Initialized ${regions.length} regional configurations`);
    return regions;
  }

  /**
   * Get region configuration by country code or subdomain
   */
  async getRegionConfig(identifier: string): Promise<RegionConfig | null> {
    const region = await this.prisma.regionConfiguration.findFirst({
      where: {
        OR: [
          { countryCode: identifier.toUpperCase() },
          { subdomain: identifier.toLowerCase() }
        ]
      }
    });

    if (!region) return null;

    return {
      countryCode: region.countryCode,
      countryName: region.countryName,
      region: region.region as any,
      subdomain: region.subdomain,
      primaryLanguage: region.primaryLanguage,
      supportedLanguages: JSON.parse(region.supportedLanguages),
      currency: region.currency,
      timezone: region.timezone,
      exchangePriority: region.exchangePriority ? JSON.parse(region.exchangePriority) : undefined,
      cryptoFocus: region.cryptoFocus ? JSON.parse(region.cryptoFocus) : undefined,
      isActive: region.isActive
    };
  }

  /**
   * List all active regions
   */
  async listActiveRegions(): Promise<RegionConfig[]> {
    const regions = await this.prisma.regionConfiguration.findMany({
      where: { isActive: true },
      orderBy: { countryName: 'asc' }
    });

    return regions.map((region: any) => ({
      countryCode: region.countryCode,
      countryName: region.countryName,
      region: region.region as any,
      subdomain: region.subdomain,
      primaryLanguage: region.primaryLanguage,
      supportedLanguages: JSON.parse(region.supportedLanguages),
      currency: region.currency,
      timezone: region.timezone,
      exchangePriority: region.exchangePriority ? JSON.parse(region.exchangePriority) : undefined,
      cryptoFocus: region.cryptoFocus ? JSON.parse(region.cryptoFocus) : undefined,
      isActive: region.isActive
    }));
  }

  // ============================================
  // LOCALIZED CONTENT MANAGEMENT
  // ============================================

  /**
   * Create localized content for a specific country and language
   */
  async createLocalizedContent(input: LocalizedContentInput): Promise<LocalizationResult> {
    this.logger.info(`Creating localized content for ${input.countryCode}-${input.languageCode}`);

    // Validate region exists
    const region = await this.getRegionConfig(input.countryCode);
    if (!region) {
      throw new Error(`Region ${input.countryCode} not found or inactive`);
    }

    // Check if language is supported
    if (!region.supportedLanguages.includes(input.languageCode)) {
      throw new Error(`Language ${input.languageCode} not supported for ${input.countryCode}`);
    }

    // Calculate quality score (simplified)
    const qualityScore = this.calculateQualityScore({
      title: input.title,
      content: input.content,
      hasKeywords: !!(input.keywords && input.keywords.length > 0),
      hasSEO: !!(input.seoTitle && input.seoDescription)
    });

    const localizedContent = await this.prisma.localizedContent.create({
      data: {
        contentId: input.contentId,
        contentType: input.contentType,
        countryCode: input.countryCode,
        regionCode: input.regionCode || region.region,
        languageCode: input.languageCode,
        title: input.title,
        excerpt: input.excerpt || null,
        content: input.content,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        keywords: input.keywords ? JSON.stringify(input.keywords) : null,
        currency: input.currency || region.currency,
        priceLocalization: input.priceLocalization ? JSON.stringify(input.priceLocalization) : null,
        paymentMethods: input.paymentMethods ? JSON.stringify(input.paymentMethods) : null,
        legalDisclaimer: input.legalDisclaimer || null,
        status: qualityScore >= 85 ? 'PUBLISHED' : 'DRAFT',
        qualityScore,
        publishedAt: qualityScore >= 85 ? new Date() : null
      }
    });

    return {
      id: localizedContent.id,
      contentId: localizedContent.contentId,
      countryCode: localizedContent.countryCode,
      languageCode: localizedContent.languageCode,
      status: localizedContent.status,
      qualityScore: localizedContent.qualityScore,
      createdAt: localizedContent.createdAt,
      publishedAt: localizedContent.publishedAt || new Date()
    };
  }

  /**
   * Get localized content for specific region and language
   */
  async getLocalizedContent(
    contentId: string,
    countryCode: string,
    languageCode?: string
  ): Promise<any> {
    const where: any = {
      contentId,
      countryCode,
      status: 'PUBLISHED'
    };

    if (languageCode) {
      where.languageCode = languageCode;
    }

    return await this.prisma.localizedContent.findFirst({
      where,
      orderBy: { qualityScore: 'desc' }
    });
  }

  /**
   * Batch localize content for multiple regions
   */
  async batchLocalizeContent(
    contentId: string,
    contentType: string,
    targetCountries: string[],
    sourceContent: {
      title: string;
      excerpt: string;
      content: string;
      seoTitle?: string;
      seoDescription?: string;
    }
  ): Promise<LocalizationResult[]> {
    this.logger.info(`Batch localizing content ${contentId} for ${targetCountries.length} countries`);

    const results: LocalizationResult[] = [];

    for (const countryCode of targetCountries) {
      const region = await this.getRegionConfig(countryCode);
      if (!region) continue;

      // Create localization for primary language
      const result = await this.createLocalizedContent({
        contentId,
        contentType: contentType as any,
        countryCode,
        languageCode: region.primaryLanguage,
        ...sourceContent
      });

      results.push(result);
    }

    this.logger.info(`Created ${results.length} localizations`);
    return results;
  }

  // ============================================
  // AFRICAN INFLUENCER MANAGEMENT
  // ============================================

  /**
   * Add African crypto influencer
   */
  async addInfluencer(input: InfluencerInput): Promise<any> {
    this.logger.info(`Adding influencer: ${input.name}`);

    return await this.prisma.africanInfluencer.create({
      data: {
        name: input.name,
        username: input.username || null,
        platform: input.platform,
        profileUrl: input.profileUrl,
        countryCode: input.countryCode || null,
        region: input.region || null,
        followersCount: input.followersCount,
        engagementRate: input.engagementRate,
        partnershipStatus: 'PROSPECTIVE',
        partnershipType: input.partnershipType || null,
        email: input.email || null,
        phone: input.phone || null
      }
    });
  }

  /**
   * Update influencer partnership status
   */
  async updateInfluencerPartnership(
    influencerId: string,
    status: string,
    details?: {
      partnershipType?: string;
      contractStart?: Date;
      contractEnd?: Date;
      paymentTerms?: Record<string, any>;
    }
  ): Promise<any> {
    return await this.prisma.africanInfluencer.update({
      where: { id: influencerId },
      data: {
        partnershipStatus: status,
        partnershipType: details?.partnershipType || null,
        contractStart: details?.contractStart || null,
        contractEnd: details?.contractEnd || null,
        paymentTerms: details?.paymentTerms ? JSON.stringify(details.paymentTerms) : null,
        lastContactDate: new Date()
      }
    });
  }

  /**
   * Get influencers by country/region
   */
  async getInfluencers(filters: {
    countryCode?: string;
    region?: string;
    platform?: string;
    partnershipStatus?: string;
    minEngagement?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.countryCode) where.countryCode = filters.countryCode;
    if (filters.region) where.region = filters.region;
    if (filters.platform) where.platform = filters.platform;
    if (filters.partnershipStatus) where.partnershipStatus = filters.partnershipStatus;
    if (filters.minEngagement) where.engagementRate = { gte: filters.minEngagement };

    return await this.prisma.africanInfluencer.findMany({
      where,
      orderBy: { engagementRate: 'desc' }
    });
  }

  /**
   * Track influencer post performance
   */
  async trackInfluencerPost(
    influencerId: string,
    postData: {
      platform: string;
      postUrl: string;
      postType: string;
      articleId?: string;
      likes: number;
      comments: number;
      shares: number;
      views: number;
      clicks: number;
      publishedAt: Date;
    }
  ): Promise<any> {
    const engagementRate = ((postData.likes + postData.comments + postData.shares) / postData.views) * 100;

    return await this.prisma.influencerPost.create({
      data: {
        influencerId,
        articleId: postData.articleId || null,
        platform: postData.platform,
        postUrl: postData.postUrl,
        postType: postData.postType,
        likes: postData.likes,
        comments: postData.comments,
        shares: postData.shares,
        views: postData.views,
        clicks: postData.clicks,
        engagementRate,
        publishedAt: postData.publishedAt
      }
    });
  }

  // ============================================
  // AFRICAN CRYPTO INDEX
  // ============================================

  /**
   * Create African Crypto Index
   */
  async createAfricanIndex(input: AfricanIndexInput): Promise<any> {
    this.logger.info(`Creating African Crypto Index: ${input.name}`);

    return await this.prisma.africanCryptoIndex.create({
      data: {
        name: input.name,
        symbol: input.symbol,
        region: input.region || null,
        constituents: JSON.stringify(input.constituents),
        methodology: input.methodology,
        rebalanceFrequency: input.rebalanceFrequency,
        currentValue: 100,
        previousValue: 100,
        isActive: true,
        isPublished: false
      }
    });
  }

  /**
   * Update index value and market metrics
   */
  async updateIndexValue(
    indexId: string,
    value: number,
    marketMetrics: {
      marketCap: number;
      volume24h: number;
      change: number;
      changePercent: number;
    }
  ): Promise<any> {
    const index = await this.prisma.africanCryptoIndex.findUnique({
      where: { id: indexId }
    });

    if (!index) {
      throw new Error('Index not found');
    }

    // Update index
    const updated = await this.prisma.africanCryptoIndex.update({
      where: { id: indexId },
      data: {
        previousValue: index.currentValue,
        currentValue: value,
        change24h: marketMetrics.change,
        changePercent24h: marketMetrics.changePercent,
        totalMarketCap: marketMetrics.marketCap,
        totalVolume24h: marketMetrics.volume24h,
        allTimeHigh: Math.max(index.allTimeHigh, value),
        allTimeLow: index.allTimeLow === 100 ? value : Math.min(index.allTimeLow, value),
        lastUpdated: new Date()
      }
    });

    // Store historical data
    await this.prisma.indexHistoricalData.create({
      data: {
        indexId,
        value,
        marketCap: marketMetrics.marketCap,
        volume24h: marketMetrics.volume24h,
        change: marketMetrics.change,
        changePercent: marketMetrics.changePercent,
        timestamp: new Date()
      }
    });

    return updated;
  }

  /**
   * Get African indexes
   */
  async getAfricanIndexes(filters?: {
    region?: string;
    isActive?: boolean;
  }): Promise<any[]> {
    const where: any = {};

    if (filters?.region) where.region = filters.region;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return await this.prisma.africanCryptoIndex.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  // ============================================
  // MEDIA SYNDICATION WIDGETS
  // ============================================

  /**
   * Create media syndication widget
   */
  async createWidget(input: WidgetInput): Promise<any> {
    this.logger.info(`Creating syndication widget: ${input.name}`);

    const embedCode = this.generateEmbedCode();
    const apiKey = this.generateApiKey();

    return await this.prisma.mediaSyndicationWidget.create({
      data: {
        name: input.name,
        description: input.description || null,
        widgetType: input.widgetType,
        targetCountries: JSON.stringify(input.targetCountries),
        targetLanguages: JSON.stringify(input.targetLanguages),
        contentFilter: input.contentFilter ? JSON.stringify(input.contentFilter) : null,
        theme: input.theme || 'light',
        layout: input.layout || 'grid',
        maxItems: input.maxItems || 10,
        embedCode,
        iframeUrl: `https://coindaily.africa/widgets/${embedCode}`,
        apiKey,
        apiEndpoint: `https://api.coindaily.africa/v1/widgets/${apiKey}`,
        partnerName: input.partnerName || null,
        partnerDomain: input.partnerDomain || null,
        partnerContact: input.partnerContact || null,
        status: 'ACTIVE'
      }
    });
  }

  /**
   * Track widget request
   */
  async trackWidgetRequest(
    widgetId: string,
    requestDetails: {
      requestType: string;
      contentReturned?: string[];
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      country?: string;
      responseTime: number;
      cacheHit: boolean;
    }
  ): Promise<void> {
    await this.prisma.widgetRequest.create({
      data: {
        widgetId,
        requestType: requestDetails.requestType,
        contentReturned: requestDetails.contentReturned ? JSON.stringify(requestDetails.contentReturned) : null,
        ipAddress: requestDetails.ipAddress || null,
        userAgent: requestDetails.userAgent || null,
        referrer: requestDetails.referrer || null,
        country: requestDetails.country || null,
        responseTime: requestDetails.responseTime,
        cacheHit: requestDetails.cacheHit
      }
    });

    // Update widget usage stats
    await this.prisma.mediaSyndicationWidget.update({
      where: { id: widgetId },
      data: {
        totalRequests: { increment: 1 },
        lastAccessAt: new Date()
      }
    });
  }

  /**
   * Get widget by API key or embed code
   */
  async getWidget(identifier: string): Promise<any | null> {
    return await this.prisma.mediaSyndicationWidget.findFirst({
      where: {
        OR: [
          { apiKey: identifier },
          { embedCode: identifier }
        ],
        status: 'ACTIVE'
      }
    });
  }

  // ============================================
  // REGIONAL SEO CONFIGURATION
  // ============================================

  /**
   * Create or update regional SEO configuration
   */
  async updateRegionalSEO(
    countryCode: string,
    seoData: {
      primaryKeywords: string[];
      secondaryKeywords?: string[];
      longTailKeywords?: string[];
      targetSearchEngines?: string[];
      localDirectories?: string[];
    }
  ): Promise<any> {
    return await this.prisma.regionalSEOConfig.upsert({
      where: { countryCode },
      create: {
        countryCode,
        primaryKeywords: JSON.stringify(seoData.primaryKeywords),
        secondaryKeywords: seoData.secondaryKeywords ? JSON.stringify(seoData.secondaryKeywords) : null,
        longTailKeywords: seoData.longTailKeywords ? JSON.stringify(seoData.longTailKeywords) : null,
        targetSearchEngines: seoData.targetSearchEngines ? JSON.stringify(seoData.targetSearchEngines) : JSON.stringify(['Google', 'Bing']),
        localDirectories: seoData.localDirectories ? JSON.stringify(seoData.localDirectories) : null
      },
      update: {
        primaryKeywords: JSON.stringify(seoData.primaryKeywords),
        secondaryKeywords: seoData.secondaryKeywords ? JSON.stringify(seoData.secondaryKeywords) : null,
        longTailKeywords: seoData.longTailKeywords ? JSON.stringify(seoData.longTailKeywords) : null,
        localDirectories: seoData.localDirectories ? JSON.stringify(seoData.localDirectories) : null,
        lastUpdated: new Date()
      }
    });
  }

  /**
   * Update regional market data
   */
  async updateRegionalMarketData(
    countryCode: string,
    marketData: {
      totalMarketCap: number;
      tradingVolume24h: number;
      activeTraders: number;
      popularExchanges?: string[];
      topGainers?: any[];
      topLosers?: any[];
      trendingTokens?: string[];
      dataSource: string;
    }
  ): Promise<any> {
    return await this.prisma.regionalMarketData.create({
      data: {
        countryCode,
        totalMarketCap: marketData.totalMarketCap,
        tradingVolume24h: marketData.tradingVolume24h,
        activeTraders: marketData.activeTraders,
        popularExchanges: marketData.popularExchanges ? JSON.stringify(marketData.popularExchanges) : null,
        topGainers: marketData.topGainers ? JSON.stringify(marketData.topGainers) : null,
        topLosers: marketData.topLosers ? JSON.stringify(marketData.topLosers) : null,
        trendingTokens: marketData.trendingTokens ? JSON.stringify(marketData.trendingTokens) : null,
        dataSource: marketData.dataSource,
        lastUpdated: new Date()
      }
    });
  }

  // ============================================
  // ANALYTICS & STATISTICS
  // ============================================

  /**
   * Get comprehensive localization statistics
   */
  async getLocalizationStats(): Promise<LocalizationStats> {
    const [
      totalLocalizations,
      localizedByCountry,
      localizedByLanguage,
      localizedByStatus,
      avgQuality,
      totalInfluencers,
      activeInfluencers,
      influencersByRegion,
      totalIndexes,
      activeIndexes,
      totalWidgets,
      activeWidgets,
      widgetRequests
    ] = await Promise.all([
      this.prisma.localizedContent.count(),
      this.prisma.localizedContent.groupBy({
        by: ['countryCode'],
        _count: true
      }),
      this.prisma.localizedContent.groupBy({
        by: ['languageCode'],
        _count: true
      }),
      this.prisma.localizedContent.groupBy({
        by: ['status'],
        _count: true
      }),
      this.prisma.localizedContent.aggregate({
        _avg: { qualityScore: true }
      }),
      this.prisma.africanInfluencer.count(),
      this.prisma.africanInfluencer.count({
        where: { partnershipStatus: 'ACTIVE' }
      }),
      this.prisma.africanInfluencer.groupBy({
        by: ['region'],
        _count: true
      }),
      this.prisma.africanCryptoIndex.count(),
      this.prisma.africanCryptoIndex.count({
        where: { isActive: true }
      }),
      this.prisma.mediaSyndicationWidget.count(),
      this.prisma.mediaSyndicationWidget.count({
        where: { status: 'ACTIVE' }
      }),
      this.prisma.widgetRequest.count()
    ]);

    const byCountry: Record<string, number> = {};
    localizedByCountry.forEach((item: any) => {
      byCountry[item.countryCode] = item._count;
    });

    const byLanguage: Record<string, number> = {};
    localizedByLanguage.forEach((item: any) => {
      byLanguage[item.languageCode] = item._count;
    });

    const byStatus: Record<string, number> = {};
    localizedByStatus.forEach((item: any) => {
      byStatus[item.status] = item._count;
    });

    const byRegion: Record<string, number> = {};
    influencersByRegion.forEach((item: any) => {
      if (item.region) byRegion[item.region] = item._count;
    });

    return {
      totalLocalizations,
      byCountry,
      byLanguage,
      byStatus,
      averageQualityScore: avgQuality._avg.qualityScore || 0,
      influencers: {
        total: totalInfluencers,
        active: activeInfluencers,
        byRegion
      },
      indexes: {
        total: totalIndexes,
        active: activeIndexes
      },
      widgets: {
        total: totalWidgets,
        active: activeWidgets,
        totalRequests: widgetRequests
      }
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private calculateQualityScore(content: {
    title: string;
    content: string;
    hasKeywords: boolean;
    hasSEO: boolean;
  }): number {
    let score = 0;

    // Title quality (20 points)
    if (content.title.length >= 30 && content.title.length <= 80) score += 20;
    else if (content.title.length >= 20) score += 10;

    // Content length (30 points)
    const wordCount = content.content.split(/\s+/).length;
    if (wordCount >= 800) score += 30;
    else if (wordCount >= 500) score += 20;
    else if (wordCount >= 300) score += 10;

    // Keywords (25 points)
    if (content.hasKeywords) score += 25;

    // SEO optimization (25 points)
    if (content.hasSEO) score += 25;

    return Math.min(score, 100);
  }

  private generateEmbedCode(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateApiKey(): string {
    return `coindaily_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}
