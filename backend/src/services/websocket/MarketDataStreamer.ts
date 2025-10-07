/**
 * Market Data Streamer
 * Task 14: WebSocket Real-Time System
 * 
 * Streams real-time market data updates with rate limiting and data validation
 */

import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export interface MarketDataUpdate {
  symbol: string;
  exchange: string;
  price: number;
  priceChange24h?: number;
  priceChangePercent24h?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  timestamp: Date;
  source: string;
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StreamingStats {
  totalUpdates: number;
  updatesPerSecond: number;
  symbolsStreaming: number;
  exchangesActive: number;
  averageLatency: number;
  errorRate: number;
}

export class MarketDataStreamer {
  private redis: Redis;
  private readonly STREAM_PREFIX = 'ws:stream:';
  private readonly STATS_PREFIX = 'ws:stream_stats:';
  private readonly RATE_LIMIT_PREFIX = 'ws:rate_limit:';
  private readonly MAX_UPDATES_PER_SECOND = 100; // Rate limit per symbol
  private readonly DATA_RETENTION_SECONDS = 300; // 5 minutes

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Stream market data update with rate limiting
   */
  public async streamMarketData(update: MarketDataUpdate): Promise<boolean> {
    try {
      // Validate update data
      if (!this.validateMarketData(update)) {
        logger.warn('Invalid market data update received:', update);
        return false;
      }

      // Check rate limit
      const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${update.symbol}`;
      const currentCount = await this.redis.incr(rateLimitKey);
      
      if (currentCount === 1) {
        await this.redis.expire(rateLimitKey, 1); // 1 second window
      }

      if (currentCount > this.MAX_UPDATES_PER_SECOND) {
        logger.warn(`Rate limit exceeded for symbol ${update.symbol}: ${currentCount} updates/second`);
        return false;
      }

      // Store the update in Redis stream
      const streamKey = `${this.STREAM_PREFIX}${update.symbol}`;
      const fields = this.serializeMarketData(update);

      await this.redis.xadd(
        streamKey,
        'MAXLEN', '~', '1000', // Keep approximately 1000 entries
        '*', // Auto-generate ID
        ...fields
      );

      // Update streaming statistics
      await this.updateStreamingStats(update);

      // Set TTL for the stream
      await this.redis.expire(streamKey, this.DATA_RETENTION_SECONDS);

      logger.debug(`Streamed market data for ${update.symbol} from ${update.exchange}`);
      return true;
    } catch (error) {
      logger.error('Error streaming market data:', error);
      await this.incrementErrorCount(update.symbol);
      return false;
    }
  }

  /**
   * Get latest market data for a symbol
   */
  public async getLatestMarketData(symbol: string): Promise<MarketDataUpdate | null> {
    try {
      const streamKey = `${this.STREAM_PREFIX}${symbol}`;
      
      // Get the latest entry from the stream
      const entries = await this.redis.xrevrange(streamKey, '+', '-', 'COUNT', 1);
      
      if (entries.length === 0) {
        return null;
      }

      const entry = entries[0];
      if (!entry || entry.length < 2) {
        return null;
      }
      
      const [, fields] = entry;
      return this.deserializeMarketData(fields);
    } catch (error) {
      logger.error(`Error getting latest market data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical market data for a symbol
   */
  public async getHistoricalMarketData(
    symbol: string, 
    fromTimestamp?: number, 
    toTimestamp?: number, 
    limit: number = 100
  ): Promise<MarketDataUpdate[]> {
    try {
      const streamKey = `${this.STREAM_PREFIX}${symbol}`;
      
      const startId = fromTimestamp ? `${fromTimestamp}-0` : '-';
      const endId = toTimestamp ? `${toTimestamp}-0` : '+';
      
      const entries = await this.redis.xrevrange(streamKey, endId, startId, 'COUNT', limit);
      
      return entries.map(([, fields]) => this.deserializeMarketData(fields));
    } catch (error) {
      logger.error(`Error getting historical market data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get streaming statistics
   */
  public async getStreamingStats(): Promise<StreamingStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = `${this.STATS_PREFIX}${today}`;

      const stats = await this.redis.hmget(
        statsKey,
        'totalUpdates',
        'uniqueSymbols',
        'uniqueExchanges',
        'totalLatency',
        'updateCount',
        'errorCount'
      );

      const [
        totalUpdates = '0',
        uniqueSymbols = '0',
        uniqueExchanges = '0',
        totalLatency = '0',
        updateCount = '0',
        errorCount = '0'
      ] = stats;

      const parsedUpdateCount = parseInt(updateCount || '0');
      const parsedTotalLatency = parseFloat(totalLatency || '0');
      const parsedErrorCount = parseInt(errorCount || '0');
      const parsedTotalUpdates = parseInt(totalUpdates || '0');

      const updatesPerSecond = await this.calculateUpdatesPerSecond();

      return {
        totalUpdates: parsedTotalUpdates,
        updatesPerSecond,
        symbolsStreaming: parseInt(uniqueSymbols || '0'),
        exchangesActive: parseInt(uniqueExchanges || '0'),
        averageLatency: parsedUpdateCount > 0 ? parsedTotalLatency / parsedUpdateCount : 0,
        errorRate: parsedTotalUpdates > 0 ? (parsedErrorCount / parsedTotalUpdates) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting streaming statistics:', error);
      return {
        totalUpdates: 0,
        updatesPerSecond: 0,
        symbolsStreaming: 0,
        exchangesActive: 0,
        averageLatency: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Clean up old streaming data
   */
  public async cleanupOldData(): Promise<void> {
    try {
      const streamKeys = await this.redis.keys(`${this.STREAM_PREFIX}*`);
      const cutoffTime = Date.now() - (this.DATA_RETENTION_SECONDS * 1000);

      for (const streamKey of streamKeys) {
        // Remove entries older than cutoff time
        await this.redis.xtrim(streamKey, 'MINID', `${cutoffTime}-0`);
      }

      logger.info(`Cleaned up streaming data older than ${this.DATA_RETENTION_SECONDS} seconds`);
    } catch (error) {
      logger.error('Error cleaning up old streaming data:', error);
    }
  }

  /**
   * Get active symbols being streamed
   */
  public async getActiveSymbols(): Promise<string[]> {
    try {
      const streamKeys = await this.redis.keys(`${this.STREAM_PREFIX}*`);
      return streamKeys.map(key => key.replace(this.STREAM_PREFIX, ''));
    } catch (error) {
      logger.error('Error getting active symbols:', error);
      return [];
    }
  }

  private validateMarketData(update: MarketDataUpdate): boolean {
    // Basic validation
    if (!update.symbol || !update.exchange || typeof update.price !== 'number') {
      return false;
    }

    // Price validation
    if (update.price <= 0 || !isFinite(update.price)) {
      return false;
    }

    // Volume validation (if provided)
    if (update.volume24h !== undefined && (update.volume24h < 0 || !isFinite(update.volume24h))) {
      return false;
    }

    // Timestamp validation
    if (!update.timestamp || isNaN(update.timestamp.getTime())) {
      return false;
    }

    // Quality validation
    if (!['HIGH', 'MEDIUM', 'LOW'].includes(update.quality)) {
      return false;
    }

    return true;
  }

  private serializeMarketData(update: MarketDataUpdate): string[] {
    const fields: string[] = [];
    
    fields.push('symbol', update.symbol);
    fields.push('exchange', update.exchange);
    fields.push('price', update.price.toString());
    fields.push('timestamp', update.timestamp.getTime().toString());
    fields.push('source', update.source);
    fields.push('quality', update.quality);

    if (update.priceChange24h !== undefined) {
      fields.push('priceChange24h', update.priceChange24h.toString());
    }
    if (update.priceChangePercent24h !== undefined) {
      fields.push('priceChangePercent24h', update.priceChangePercent24h.toString());
    }
    if (update.volume24h !== undefined) {
      fields.push('volume24h', update.volume24h.toString());
    }
    if (update.high24h !== undefined) {
      fields.push('high24h', update.high24h.toString());
    }
    if (update.low24h !== undefined) {
      fields.push('low24h', update.low24h.toString());
    }

    return fields;
  }

  private deserializeMarketData(fields: string[]): MarketDataUpdate {
    const data: any = {};
    
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      if (!key || value === undefined) continue;
      
      switch (key) {
        case 'symbol':
        case 'exchange':
        case 'source':
        case 'quality':
          data[key] = value;
          break;
        case 'timestamp':
          data[key] = new Date(parseInt(value || '0'));
          break;
        case 'price':
        case 'priceChange24h':
        case 'priceChangePercent24h':
        case 'volume24h':
        case 'high24h':
        case 'low24h':
          data[key] = parseFloat(value || '0');
          break;
      }
    }

    return data as MarketDataUpdate;
  }

  private async updateStreamingStats(update: MarketDataUpdate): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = `${this.STATS_PREFIX}${today}`;
      
      const latency = Date.now() - update.timestamp.getTime();

      const pipeline = this.redis.pipeline();
      pipeline.hincrby(statsKey, 'totalUpdates', 1);
      pipeline.hincrby(statsKey, 'updateCount', 1);
      pipeline.hincrbyfloat(statsKey, 'totalLatency', latency);
      pipeline.sadd(`${this.STATS_PREFIX}symbols:${today}`, update.symbol);
      pipeline.sadd(`${this.STATS_PREFIX}exchanges:${today}`, update.exchange);
      pipeline.expire(statsKey, 30 * 24 * 60 * 60); // 30 days

      await pipeline.exec();

      // Update unique counts
      const uniqueSymbols = await this.redis.scard(`${this.STATS_PREFIX}symbols:${today}`);
      const uniqueExchanges = await this.redis.scard(`${this.STATS_PREFIX}exchanges:${today}`);

      const updatePipeline = this.redis.pipeline();
      updatePipeline.hset(statsKey, 'uniqueSymbols', uniqueSymbols);
      updatePipeline.hset(statsKey, 'uniqueExchanges', uniqueExchanges);
      
      await updatePipeline.exec();
    } catch (error) {
      logger.error('Error updating streaming statistics:', error);
    }
  }

  private async incrementErrorCount(symbol: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = `${this.STATS_PREFIX}${today}`;
      
      await this.redis.hincrby(statsKey, 'errorCount', 1);
    } catch (error) {
      logger.error('Error incrementing error count:', error);
    }
  }

  private async calculateUpdatesPerSecond(): Promise<number> {
    try {
      // Get update count from the last minute
      const oneMinuteAgo = Date.now() - 60000;
      const rateLimitKeys = await this.redis.keys(`${this.RATE_LIMIT_PREFIX}*`);
      
      let totalUpdates = 0;
      for (const key of rateLimitKeys) {
        const count = await this.redis.get(key);
        if (count) {
          totalUpdates += parseInt(count);
        }
      }

      return totalUpdates / 60; // Average per second over the last minute
    } catch (error) {
      logger.error('Error calculating updates per second:', error);
      return 0;
    }
  }
}