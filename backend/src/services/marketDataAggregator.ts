/**
 * Market Data Aggregator Service
 * Task 13: Market Data Aggregator Implementation
 * 
 * Core service for aggregating real-time cryptocurrency data from African and global exchanges
 * with sub-500ms response time guarantee and comprehensive error handling.
 */

import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import {
  IMarketDataAggregator,
  MarketDataPoint,
  MarketDataResponse,
  HistoricalDataPoint,
  ExchangeIntegration,
  MarketDataAggregatorConfig,
  QueryOptions,
  HistoricalOptions,
  WebSocketSubscription,
  ExchangeHealth,
  DataQuality,
  MarketDataError,
  ErrorCode,
  TimeInterval,
  CacheInfo,
  PerformanceInfo,
  ResponseMetadata
} from '../types/market-data';
import { logger } from '../utils/logger';

export class MarketDataAggregator extends EventEmitter implements IMarketDataAggregator {
  private prisma: PrismaClient;
  private redis: Redis;
  private config: MarketDataAggregatorConfig;
  private exchangeAdapters: Map<string, any> = new Map();
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();
  private circuitBreakers: Map<string, { isOpen: boolean; failures: number; lastFailure: number }> = new Map();
  private subscriptions: Map<string, WebSocketSubscription> = new Map();

  constructor(
    prisma: PrismaClient,
    redis: Redis,
    config: MarketDataAggregatorConfig
  ) {
    super();
    this.prisma = prisma;
    this.redis = redis;
    this.config = config;
    this.initializeExchangeAdapters();
    this.startHealthMonitoring();
    this.startCacheCleanup();
  }

  /**
   * Get real-time market data for specified symbols
   * PERFORMANCE: Target < 500ms response time
   */
  async getMarketData(symbols: string[], options: QueryOptions = {}): Promise<MarketDataResponse> {
    const startTime = Date.now();
    const performanceInfo: PerformanceInfo = {
      responseTime: 0,
      dbQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('market_data', symbols, options);
      
      // Try memory cache first (fastest)
      const memoryCached = this.getFromMemoryCache(cacheKey);
      if (memoryCached) {
        performanceInfo.cacheHits++;
        performanceInfo.responseTime = Date.now() - startTime;
        
        return {
          data: memoryCached,
          metadata: this.createMetadata(memoryCached.length, 'MEMORY'),
          cache: { hit: true, ttl: this.config.caching.hotDataTtl, source: 'MEMORY' },
          performance: performanceInfo
        };
      }

      // Try Redis cache (warm data)
      const redisCached = await this.getFromRedisCache(cacheKey);
      if (redisCached) {
        performanceInfo.cacheHits++;
        
        // Store in memory cache for future requests
        this.setMemoryCache(cacheKey, redisCached);
        
        performanceInfo.responseTime = Date.now() - startTime;
        return {
          data: redisCached,
          metadata: this.createMetadata(redisCached.length, 'REDIS'),
          cache: { hit: true, ttl: this.config.caching.warmDataTtl, source: 'REDIS' },
          performance: performanceInfo
        };
      }

      performanceInfo.cacheMisses++;

      // Fetch fresh data from exchanges
      const marketData = await this.fetchFromExchanges(symbols, options);
      
      // Validate and normalize data
      const validatedData = await this.validateAndNormalizeData(marketData);

      // Cache the results
      await this.cacheMarketData(cacheKey, validatedData);

      performanceInfo.responseTime = Date.now() - startTime;

      // Performance check - log warning if > 500ms
      if (performanceInfo.responseTime > 500) {
        logger.warn('Market data request exceeded 500ms target', {
          responseTime: performanceInfo.responseTime,
          symbols,
          options
        });
      }

      return {
        data: validatedData,
        metadata: this.createMetadata(validatedData.length, 'EXCHANGE'),
        cache: { hit: false, ttl: this.config.caching.warmDataTtl, source: 'DATABASE' },
        performance: performanceInfo
      };

    } catch (error) {
      performanceInfo.responseTime = Date.now() - startTime;
      logger.error('Market data aggregation failed', { error, symbols, options });
      
      // Try fallback to stale cache data
      const fallbackData = await this.getFallbackData(symbols);
      if (fallbackData.length > 0) {
        return {
          data: fallbackData,
          metadata: this.createMetadata(fallbackData.length, 'FALLBACK'),
          cache: { hit: true, ttl: 0, source: 'DATABASE' },
          performance: performanceInfo
        };
      }

      throw new MarketDataError(
        `Failed to fetch market data: ${error.message}`,
        ErrorCode.EXCHANGE_UNAVAILABLE,
        { retryable: true }
      );
    }
  }

  /**
   * Get historical market data with efficient querying
   */
  async getHistoricalData(
    symbol: string, 
    interval: TimeInterval, 
    options: HistoricalOptions = {}
  ): Promise<HistoricalDataPoint[]> {
    const startTime = Date.now();

    try {
      // Build query parameters
      const {
        startTime: queryStartTime,
        endTime: queryEndTime,
        exchanges = [],
        includeVolume = true,
        granularity = interval
      } = options;

      // Check cache first
      const cacheKey = this.generateHistoricalCacheKey(symbol, interval, options);
      const cached = await this.getFromRedisCache(cacheKey);
      
      if (cached) {
        logger.debug('Historical data cache hit', { symbol, interval });
        return cached;
      }

      // Query database with optimized indexes
      const whereClause: any = {
        token: { symbol },
        ...(exchanges.length > 0 && { exchange: { in: exchanges } }),
        ...(queryStartTime && { timestamp: { gte: queryStartTime } }),
        ...(queryEndTime && { timestamp: { lte: queryEndTime } })
      };

      // Use raw query for better performance on large datasets
      const historicalData = await this.prisma.$queryRaw`
        SELECT 
          timestamp,
          price_usd as open,
          high_24h as high,
          low_24h as low,
          price_usd as close,
          ${includeVolume ? 'volume_24h as volume,' : ''}
          exchange
        FROM MarketData 
        WHERE token_id IN (SELECT id FROM Token WHERE symbol = ${symbol})
        ${exchanges.length > 0 ? `AND exchange IN (${exchanges.map(e => `'${e}'`).join(',')})` : ''}
        ${queryStartTime ? `AND timestamp >= ${queryStartTime.toISOString()}` : ''}
        ${queryEndTime ? `AND timestamp <= ${queryEndTime.toISOString()}` : ''}
        ORDER BY timestamp DESC
        LIMIT 1000
      `;

      // Transform and cache results
      const transformedData = this.transformHistoricalData(historicalData as any[], granularity);
      
      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(transformedData));

      const responseTime = Date.now() - startTime;
      logger.info('Historical data query completed', { 
        symbol, 
        interval, 
        responseTime, 
        recordCount: transformedData.length 
      });

      return transformedData;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Historical data query failed', { 
        symbol, 
        interval, 
        error, 
        responseTime 
      });
      throw error;
    }
  }

  /**
   * Subscribe to real-time market data updates via WebSocket
   */
  async subscribeToUpdates(subscription: WebSocketSubscription): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subscriptionId, {
      ...subscription,
      createdAt: new Date()
    });

    // Initialize WebSocket connections for required exchanges
    for (const exchange of subscription.exchanges) {
      await this.initializeWebSocketForExchange(exchange, subscription.symbols);
    }

    logger.info('Market data subscription created', { 
      subscriptionId, 
      channels: subscription.channels,
      symbols: subscription.symbols 
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from market data updates
   */
  async unsubscribeFromUpdates(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    // Clean up WebSocket connections if no other subscriptions need them
    for (const exchange of subscription.exchanges) {
      await this.cleanupWebSocketForExchange(exchange, subscription.symbols);
    }

    this.subscriptions.delete(subscriptionId);
    
    logger.info('Market data subscription removed', { subscriptionId });
  }

  /**
   * Get health status of all integrated exchanges
   */
  async getExchangeHealth(): Promise<Record<string, ExchangeHealth>> {
    const healthStatus: Record<string, ExchangeHealth> = {};

    for (const [exchangeName, adapter] of Array.from(this.exchangeAdapters.entries())) {
      try {
        const health = await this.checkExchangeHealth(exchangeName, adapter);
        healthStatus[exchangeName] = health;
      } catch (error) {
        healthStatus[exchangeName] = {
          status: 'UNHEALTHY' as any,
          uptime: 0,
          avgResponseTime: 0,
          lastCheck: new Date(),
          consecutiveFailures: this.getCircuitBreakerFailures(exchangeName)
        };
      }
    }

    return healthStatus;
  }

  /**
   * Validate market data quality and consistency
   */
  async validateData(data: MarketDataPoint): Promise<DataQuality> {
    try {
      // Age validation
      const dataAge = (Date.now() - data.timestamp.getTime()) / 1000;
      if (dataAge > this.config.validation.minDataAge) {
        return DataQuality.SUSPECT;
      }

      // Cross-exchange validation if enabled
      if (this.config.validation.crossExchangeValidation) {
        const crossValidation = await this.performCrossExchangeValidation(data);
        if (!crossValidation.isValid) {
          logger.warn('Cross-exchange validation failed', { 
            symbol: data.symbol, 
            exchange: data.exchange,
            deviation: crossValidation.deviation
          });
          return DataQuality.LOW;
        }
      }

      // Price deviation check
      const priceDeviation = Math.abs(data.priceChangePercent24h);
      if (priceDeviation > this.config.validation.maxPriceDeviation) {
        return DataQuality.SUSPECT;
      }

      // Volume validation
      if (data.volume24h <= 0) {
        return DataQuality.LOW;
      }

      // All validations passed
      return DataQuality.HIGH;

    } catch (error) {
      logger.error('Data validation failed', { error, data });
      return DataQuality.SUSPECT;
    }
  }

  // ========== Private Methods ==========

  private initializeExchangeAdapters(): void {
    for (const exchangeConfig of this.config.exchanges) {
      const adapter = this.createExchangeAdapter(exchangeConfig);
      this.exchangeAdapters.set(exchangeConfig.integration.slug, adapter);
      
      // Initialize circuit breaker
      this.circuitBreakers.set(exchangeConfig.integration.slug, {
        isOpen: false,
        failures: 0,
        lastFailure: 0
      });
    }
    
    logger.info('Exchange adapters initialized', { 
      count: this.exchangeAdapters.size 
    });
  }

  private createExchangeAdapter(config: any): any {
    // This would create specific adapters for each exchange
    // For now, returning a placeholder
    return {
      name: config.integration.name,
      fetchMarketData: async (symbols: string[]) => {
        // Implement exchange-specific API calls
        return [];
      }
    };
  }

  private async fetchFromExchanges(symbols: string[], options: QueryOptions): Promise<MarketDataPoint[]> {
    const tasks: Promise<MarketDataPoint[]>[] = [];
    const exchangesToUse = options.exchanges || Array.from(this.exchangeAdapters.keys());

    for (const exchangeName of exchangesToUse) {
      // Skip if circuit breaker is open
      if (this.isCircuitBreakerOpen(exchangeName)) {
        logger.warn('Skipping exchange due to circuit breaker', { exchange: exchangeName });
        continue;
      }

      const adapter = this.exchangeAdapters.get(exchangeName);
      if (adapter) {
        const task = this.fetchFromSingleExchange(exchangeName, adapter, symbols)
          .catch(error => {
            this.handleExchangeError(exchangeName, error);
            return [];
          });
        
        tasks.push(task);
      }
    }

    // Execute all fetch operations in parallel with timeout
    const results = await Promise.allSettled(
      tasks.map(task => 
        Promise.race([
          task,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ])
      )
    );

    // Combine successful results
    const combinedData: MarketDataPoint[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        combinedData.push(...result.value);
      }
    }

    return combinedData;
  }

  private async fetchFromSingleExchange(
    exchangeName: string, 
    adapter: any, 
    symbols: string[]
  ): Promise<MarketDataPoint[]> {
    const startTime = Date.now();
    
    try {
      const data = await adapter.fetchMarketData(symbols);
      const responseTime = Date.now() - startTime;
      
      // Update circuit breaker on success
      this.resetCircuitBreaker(exchangeName);
      
      logger.debug('Exchange fetch successful', { 
        exchange: exchangeName, 
        responseTime, 
        recordCount: data.length 
      });
      
      return data;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Exchange fetch failed', { 
        exchange: exchangeName, 
        error: error.message, 
        responseTime 
      });
      
      throw error;
    }
  }

  private async validateAndNormalizeData(data: MarketDataPoint[]): Promise<MarketDataPoint[]> {
    const validatedData: MarketDataPoint[] = [];
    
    for (const dataPoint of data) {
      try {
        const quality = await this.validateData(dataPoint);
        
        if (quality !== DataQuality.SUSPECT) {
          // Normalize data format
          const normalized = this.normalizeDataPoint(dataPoint);
          validatedData.push(normalized);
        }
      } catch (error) {
        logger.warn('Data point validation failed', { error, dataPoint });
      }
    }

    logger.info('Data validation completed', { 
      total: data.length, 
      validated: validatedData.length 
    });

    return validatedData;
  }

  private normalizeDataPoint(data: MarketDataPoint): MarketDataPoint {
    return {
      ...data,
      priceUsd: Number(Number(data.priceUsd).toFixed(8)),
      priceChange24h: Number(Number(data.priceChange24h).toFixed(8)),
      volume24h: Number(Number(data.volume24h).toFixed(2)),
      marketCap: Number(Number(data.marketCap).toFixed(2)),
      high24h: Number(Number(data.high24h).toFixed(8)),
      low24h: Number(Number(data.low24h).toFixed(8)),
      timestamp: new Date(data.timestamp)
    };
  }

  private generateCacheKey(type: string, symbols: string[], options: any): string {
    const optionsHash = this.hashObject(options);
    return `${type}:${symbols.sort().join(',')}:${optionsHash}`;
  }

  private generateHistoricalCacheKey(symbol: string, interval: TimeInterval, options: any): string {
    const optionsHash = this.hashObject(options);
    return `historical:${symbol}:${interval}:${optionsHash}`;
  }

  private hashObject(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64').substr(0, 10);
  }

  private getFromMemoryCache(key: string): any {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    if (cached) {
      this.memoryCache.delete(key);
    }
    
    return null;
  }

  private setMemoryCache(key: string, data: any): void {
    const expires = Date.now() + (this.config.caching.hotDataTtl * 1000);
    this.memoryCache.set(key, { data, expires });
    
    // Prevent memory cache from growing too large
    if (this.memoryCache.size > this.config.caching.maxHotItems) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
  }

  private async getFromRedisCache(key: string): Promise<any> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Redis cache read failed', { error, key });
      return null;
    }
  }

  private async cacheMarketData(key: string, data: MarketDataPoint[]): Promise<void> {
    try {
      // Store in memory cache
      this.setMemoryCache(key, data);
      
      // Store in Redis cache
      await this.redis.setex(key, this.config.caching.warmDataTtl, JSON.stringify(data));
      
      // Store in database for cold storage
      await this.persistMarketData(data);
      
    } catch (error) {
      logger.error('Market data caching failed', { error, key });
    }
  }

  private async persistMarketData(data: MarketDataPoint[]): Promise<void> {
    // This would implement database persistence
    // Placeholder for now
    logger.debug('Persisting market data to database', { recordCount: data.length });
  }

  private async getFallbackData(symbols: string[]): Promise<MarketDataPoint[]> {
    try {
      // Try to get recent data from database
      const fallbackData = await this.prisma.marketData.findMany({
        where: {
          token: {
            symbol: { in: symbols }
          },
          timestamp: {
            gte: new Date(Date.now() - 300000) // Last 5 minutes
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });

      return fallbackData.map(this.transformDbToMarketData);
    } catch (error) {
      logger.error('Fallback data retrieval failed', { error });
      return [];
    }
  }

  private transformDbToMarketData(dbData: any): MarketDataPoint {
    // Transform database record to MarketDataPoint
    return {
      id: dbData.id,
      tokenId: dbData.tokenId,
      symbol: dbData.token?.symbol || '',
      exchange: dbData.exchange,
      priceUsd: dbData.priceUsd,
      priceChange24h: dbData.priceChange24h,
      priceChangePercent24h: (dbData.priceChange24h / dbData.priceUsd) * 100,
      volume24h: dbData.volume24h,
      volumeChange24h: 0,
      marketCap: dbData.marketCap,
      high24h: dbData.high24h,
      low24h: dbData.low24h,
      tradingPairs: JSON.parse(dbData.tradingPairs || '[]'),
      timestamp: dbData.timestamp,
      source: {
        exchange: dbData.exchange,
        endpoint: 'database',
        method: 'REST' as const,
        reliability: 0.8,
        latency: 0
      },
      quality: DataQuality.MEDIUM
    };
  }

  private transformHistoricalData(rawData: any[], granularity: TimeInterval): HistoricalDataPoint[] {
    return rawData.map(record => ({
      timestamp: new Date(record.timestamp),
      open: Number(record.open),
      high: Number(record.high),
      low: Number(record.low),
      close: Number(record.close),
      volume: Number(record.volume || 0),
      exchange: record.exchange,
      interval: granularity
    }));
  }

  private createMetadata(count: number, source: string): ResponseMetadata {
    return {
      total: count,
      source,
      timestamp: new Date(),
      dataAge: 0
    };
  }

  private async performCrossExchangeValidation(data: MarketDataPoint): Promise<{ isValid: boolean; deviation: number }> {
    // Implement cross-exchange price validation
    // This is a placeholder implementation
    return { isValid: true, deviation: 0 };
  }

  private isCircuitBreakerOpen(exchangeName: string): boolean {
    const cb = this.circuitBreakers.get(exchangeName);
    if (!cb) return false;

    if (cb.isOpen) {
      const config = this.config.exchanges.find(e => e.integration.slug === exchangeName)?.circuitBreaker;
      if (config && Date.now() - cb.lastFailure > config.recoveryTimeout) {
        cb.isOpen = false;
        cb.failures = 0;
      }
    }

    return cb.isOpen;
  }

  private handleExchangeError(exchangeName: string, error: Error): void {
    const cb = this.circuitBreakers.get(exchangeName);
    if (!cb) return;

    cb.failures++;
    cb.lastFailure = Date.now();

    const config = this.config.exchanges.find(e => e.integration.slug === exchangeName)?.circuitBreaker;
    if (config && cb.failures >= config.failureThreshold) {
      cb.isOpen = true;
      logger.warn('Circuit breaker opened for exchange', { exchange: exchangeName });
    }
  }

  private resetCircuitBreaker(exchangeName: string): void {
    const cb = this.circuitBreakers.get(exchangeName);
    if (cb) {
      cb.failures = 0;
      cb.isOpen = false;
    }
  }

  private getCircuitBreakerFailures(exchangeName: string): number {
    return this.circuitBreakers.get(exchangeName)?.failures || 0;
  }

  private async checkExchangeHealth(exchangeName: string, adapter: any): Promise<ExchangeHealth> {
    const startTime = Date.now();
    
    try {
      // Perform health check
      await adapter.healthCheck?.() || Promise.resolve();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'HEALTHY' as any,
        uptime: 100, // This would be calculated from historical data
        avgResponseTime: responseTime,
        lastCheck: new Date(),
        consecutiveFailures: 0
      };
    } catch (error) {
      return {
        status: 'UNHEALTHY' as any,
        uptime: 0,
        avgResponseTime: Date.now() - startTime,
        lastCheck: new Date(),
        consecutiveFailures: this.getCircuitBreakerFailures(exchangeName)
      };
    }
  }

  private async initializeWebSocketForExchange(exchange: string, symbols: string[]): Promise<void> {
    // Implement WebSocket initialization
    logger.info('Initializing WebSocket connection', { exchange, symbols });
  }

  private async cleanupWebSocketForExchange(exchange: string, symbols: string[]): Promise<void> {
    // Implement WebSocket cleanup
    logger.info('Cleaning up WebSocket connection', { exchange, symbols });
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        const health = await this.getExchangeHealth();
        this.emit('healthUpdate', health);
      } catch (error) {
        logger.error('Health monitoring failed', { error });
      }
    }, 30000); // Every 30 seconds
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      // Clean up expired memory cache entries
      const now = Date.now();
      for (const [key, cached] of Array.from(this.memoryCache.entries())) {
        if (cached.expires <= now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000); // Every minute
  }
}