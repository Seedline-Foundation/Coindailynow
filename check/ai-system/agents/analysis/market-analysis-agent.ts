// Market Analysis Agent - Specialized AI agent for cryptocurrency market analysis
// Powered by Grok for real-time market insights and trend prediction

import { createAuditLog, AuditActions } from '@/lib/audit';

export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  marketCap: number;
  timestamp: Date;
}

export interface MarketAnalysisRequest {
  symbols: string[];
  analysisType: 'trend' | 'sentiment' | 'correlation' | 'prediction' | 'comprehensive';
  timeframe: '1h' | '4h' | '24h' | '7d' | '30d';
  includeAfricanMarkets?: boolean;
  focusOn?: 'memecoins' | 'defi' | 'nft' | 'all';
}

export interface MarketAnalysisResult {
  success: boolean;
  analysisType: string;
  data: {
    marketOverview: {
      totalMarketCap: number;
      marketCapChange24h: number;
      btcDominance: number;
      fearGreedIndex: number;
    };
    topMovers: {
      gainers: Array<{ symbol: string; price: number; change: number }>;
      losers: Array<{ symbol: string; price: number; change: number }>;
    };
    trends: {
      bullishSignals: string[];
      bearishSignals: string[];
      neutralFactors: string[];
    };
    predictions: {
      shortTerm: string; // 24h outlook
      mediumTerm: string; // 7d outlook
      confidence: number; // 0-1 scale
    };
    africanMarketInsights?: {
      topAfricanCoins: Array<{ symbol: string; country: string; performance: number }>;
      regulatoryUpdates: string[];
      adoptionMetrics: string[];
    };
  };
  processingTime: number;
  timestamp: Date;
  error?: string;
}

export class MarketAnalysisAgent {
  private agentId: string;
  private isInitialized = false;
  private cache = new Map<string, { result: MarketAnalysisResult; timestamp: number }>();

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Verify Grok API availability
    if (!process.env.GROK_API_KEY) {
      throw new Error('Grok API key not configured for market analysis');
    }

    this.isInitialized = true;

    // Log initialization using existing audit actions
    await createAuditLog({
      action: AuditActions.SETTINGS_UPDATE, // Using existing action
      resource: 'ai_agent',
      resourceId: this.agentId,
      details: {
        action: 'market_agent_initialized',
        agentType: 'market-analysis',
        status: 'initialized'
      }
    });
  }

  async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketAnalysisResult> {
    const startTime = Date.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check cache first (for performance optimization)
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Collect market data
      const marketData = await this.collectMarketData(request.symbols);
      
      // Perform analysis using Grok
      const analysis = await this.performGrokAnalysis(marketData, request);
      
      const result: MarketAnalysisResult = {
        success: true,
        analysisType: request.analysisType,
        data: analysis,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };

      // Cache result (5 minutes for market data)
      this.setCache(cacheKey, result);

      // Log successful analysis using existing audit actions
      await createAuditLog({
        action: AuditActions.ARTICLE_PUBLISH, // Using existing action
        resource: 'ai_agent',
        resourceId: this.agentId,
        details: {
          action: 'market_analysis_completed',
          analysisType: request.analysisType,
          symbolsAnalyzed: request.symbols.length,
          processingTime: result.processingTime,
          success: true
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Market analysis failed';
      
      const result: MarketAnalysisResult = {
        success: false,
        analysisType: request.analysisType,
        data: this.getEmptyAnalysisData(),
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
        error: errorMessage
      };

      // Log failed analysis using existing audit actions
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE, // Using existing action
        resource: 'ai_agent',
        resourceId: this.agentId,
        details: {
          action: 'market_analysis_failed',
          analysisType: request.analysisType,
          error: errorMessage,
          processingTime: result.processingTime
        }
      });

      return result;
    }
  }

  // Quick market sentiment analysis (optimized for breaking news)
  async getMarketSentiment(symbols: string[]): Promise<{
    overall: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    keyFactors: string[];
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      const marketData = await this.collectMarketData(symbols.slice(0, 10)); // Limit for speed
      const sentiment = await this.analyzeSentiment(marketData);

      return {
        overall: sentiment.trend,
        confidence: sentiment.confidence,
        keyFactors: sentiment.factors,
        processingTime: Date.now() - startTime
      };
    } catch {
      return {
        overall: 'neutral',
        confidence: 0,
        keyFactors: ['Analysis unavailable'],
        processingTime: Date.now() - startTime
      };
    }
  }

  // Get trending memecoins for African market
  async getTrendingMemecoins(): Promise<{
    trending: Array<{ symbol: string; momentum: number; africanRelevance: number }>;
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Focus on popular memecoins with African community interest
      const memecoins = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'];
      const data = await this.collectMarketData(memecoins);
      
      const trending = data.map(coin => ({
        symbol: coin.symbol,
        momentum: this.calculateMomentum(coin),
        africanRelevance: this.assessAfricanRelevance(coin.symbol)
      })).sort((a, b) => b.momentum - a.momentum);

      return {
        trending: trending.slice(0, 5),
        processingTime: Date.now() - startTime
      };
    } catch {
      return {
        trending: [],
        processingTime: Date.now() - startTime
      };
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded'; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      // Simple health check - get BTC price
      await this.collectMarketData(['BTC']);
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime
      };
    }
  }

  // Private helper methods
  private async collectMarketData(symbols: string[]): Promise<MarketData[]> {
    // Simulate API call to crypto data provider (CoinGecko, CoinMarketCap, etc.)
    // In production, this would make actual API calls
    
    const mockData: MarketData[] = symbols.map(symbol => ({
      symbol,
      price: Math.random() * 50000, // Mock price
      volume24h: Math.random() * 1000000000,
      priceChange24h: (Math.random() - 0.5) * 20, // -10% to +10%
      marketCap: Math.random() * 1000000000000,
      timestamp: new Date()
    }));

    return mockData;
  }

  private async performGrokAnalysis(marketData: MarketData[], request: MarketAnalysisRequest): Promise<MarketAnalysisResult['data']> {
    // This would make actual API call to Grok
    // For now, returning structured mock analysis
    
    const analysis: MarketAnalysisResult['data'] = {
      marketOverview: {
        totalMarketCap: marketData.reduce((sum, coin) => sum + coin.marketCap, 0),
        marketCapChange24h: Math.random() * 10 - 5, // -5% to +5%
        btcDominance: 45 + Math.random() * 10, // 45-55%
        fearGreedIndex: Math.floor(Math.random() * 100)
      },
      topMovers: {
        gainers: marketData
          .filter(coin => coin.priceChange24h > 0)
          .sort((a, b) => b.priceChange24h - a.priceChange24h)
          .slice(0, 3)
          .map(coin => ({
            symbol: coin.symbol,
            price: coin.price,
            change: coin.priceChange24h
          })),
        losers: marketData
          .filter(coin => coin.priceChange24h < 0)
          .sort((a, b) => a.priceChange24h - b.priceChange24h)
          .slice(0, 3)
          .map(coin => ({
            symbol: coin.symbol,
            price: coin.price,
            change: coin.priceChange24h
          }))
      },
      trends: {
        bullishSignals: ['Strong institutional adoption', 'Positive regulatory developments'],
        bearishSignals: ['Market uncertainty', 'High volatility'],
        neutralFactors: ['Mixed technical indicators', 'Sideways price action']
      },
      predictions: {
        shortTerm: 'Cautiously optimistic with potential for 3-5% upward movement',
        mediumTerm: 'Consolidation expected with bullish bias for quality projects',
        confidence: 0.75
      }
    };

    // Add African market insights if requested
    if (request.includeAfricanMarkets) {
      analysis.africanMarketInsights = {
        topAfricanCoins: [
          { symbol: 'AKOIN', country: 'Kenya', performance: 5.2 },
          { symbol: 'CELO', country: 'Nigeria', performance: 3.8 }
        ],
        regulatoryUpdates: ['Nigeria considering CBDC pilot', 'South Africa crypto tax clarity'],
        adoptionMetrics: ['Mobile crypto payments up 15%', 'Youth adoption rate 67%']
      };
    }

    return analysis;
  }

  private async analyzeSentiment(marketData: MarketData[]): Promise<{
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    factors: string[];
  }> {
    const positiveChanges = marketData.filter(coin => coin.priceChange24h > 0).length;
    const totalCoins = marketData.length;
    const positiveRatio = positiveChanges / totalCoins;

    let trend: 'bullish' | 'bearish' | 'neutral';
    let confidence: number;

    if (positiveRatio > 0.7) {
      trend = 'bullish';
      confidence = positiveRatio;
    } else if (positiveRatio < 0.3) {
      trend = 'bearish';
      confidence = 1 - positiveRatio;
    } else {
      trend = 'neutral';
      confidence = 0.5;
    }

    return {
      trend,
      confidence,
      factors: [`${Math.round(positiveRatio * 100)}% of tracked assets are positive`]
    };
  }

  private calculateMomentum(coin: MarketData): number {
    // Simple momentum calculation based on price change and volume
    return (coin.priceChange24h / 100) * Math.log10(coin.volume24h / 1000000);
  }

  private assessAfricanRelevance(symbol: string): number {
    // Mock relevance scoring for African markets
    const africanRelevantCoins: Record<string, number> = {
      'BTC': 0.9,
      'ETH': 0.8,
      'DOGE': 0.7,
      'SHIB': 0.6,
      'CELO': 0.95,
      'AKOIN': 0.98
    };

    return africanRelevantCoins[symbol] || 0.3;
  }

  private generateCacheKey(request: MarketAnalysisRequest): string {
    const keyData = {
      symbols: request.symbols.sort(),
      analysisType: request.analysisType,
      timeframe: request.timeframe,
      includeAfricanMarkets: request.includeAfricanMarkets,
      focusOn: request.focusOn
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getFromCache(key: string): MarketAnalysisResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid (5 minutes for market data)
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  private setCache(key: string, result: MarketAnalysisResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (this.cache.size > 100) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, 20);
      oldestKeys.forEach(k => this.cache.delete(k));
    }
  }

  private getEmptyAnalysisData(): MarketAnalysisResult['data'] {
    return {
      marketOverview: {
        totalMarketCap: 0,
        marketCapChange24h: 0,
        btcDominance: 0,
        fearGreedIndex: 50
      },
      topMovers: {
        gainers: [],
        losers: []
      },
      trends: {
        bullishSignals: [],
        bearishSignals: [],
        neutralFactors: ['Analysis unavailable']
      },
      predictions: {
        shortTerm: 'Analysis unavailable',
        mediumTerm: 'Analysis unavailable',
        confidence: 0
      }
    };
  }
}
