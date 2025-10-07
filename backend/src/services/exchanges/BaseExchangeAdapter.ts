/**
 * Base Exchange Adapter
 * Task 13: Market Data Aggregator Implementation
 * 
 * Abstract base class for all exchange integrations with common functionality
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import {
  MarketDataPoint,
  ExchangeIntegration,
  ExchangeHealth,
  HealthStatus,
  TradingPair,
  DataSource,
  DataQuality,
  ErrorCode,
  RetryPolicy
} from '../../types/market-data';
import { logger } from '../../utils/logger';

export abstract class BaseExchangeAdapter extends EventEmitter {
  protected integration: ExchangeIntegration;
  protected httpClient!: AxiosInstance;
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;
  protected errorCount: number = 0;

  constructor(integration: ExchangeIntegration) {
    super();
    this.integration = integration;
    this.initializeHttpClient();
  }

  // ========== Abstract Methods ==========
  
  abstract fetchMarketData(symbols: string[]): Promise<MarketDataPoint[]>;
  abstract fetchTradingPairs(): Promise<TradingPair[]>;
  abstract normalizeSymbol(symbol: string): string;
  abstract denormalizeSymbol(exchangeSymbol: string): string;

  // ========== Common Methods ==========

  /**
   * Perform health check for the exchange
   */
  async healthCheck(): Promise<ExchangeHealth> {
    const startTime = Date.now();
    
    try {
      // Try a simple API call
      await this.makeRequest('/ping', 'GET', {}, { timeout: 5000 });
      
      const responseTime = Date.now() - startTime;
      const uptime = this.calculateUptime();
      
      return {
        status: HealthStatus.HEALTHY,
        uptime,
        avgResponseTime: responseTime,
        lastCheck: new Date(),
        consecutiveFailures: 0
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.errorCount++;
      
      return {
        status: this.determineHealthStatus(error),
        uptime: this.calculateUptime(),
        avgResponseTime: responseTime,
        lastCheck: new Date(),
        consecutiveFailures: this.errorCount
      };
    }
  }

  /**
   * Get exchange information
   */
  getIntegration(): ExchangeIntegration {
    return this.integration;
  }

  /**
   * Update integration configuration
   */
  updateIntegration(updates: Partial<ExchangeIntegration>): void {
    this.integration = { ...this.integration, ...updates };
    this.initializeHttpClient(); // Reinitialize with new config
  }

  // ========== Protected Methods ==========

  protected async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<any> {
    // Rate limiting check
    await this.enforceRateLimit();
    
    try {
      const fullUrl = `${this.integration.apiEndpoint}${endpoint}`;
      const requestConfig: AxiosRequestConfig = {
        method,
        url: fullUrl,
        data,
        timeout: 10000,
        ...config
      };

      // Add authentication if required
      if (this.integration.authentication.type !== 'PUBLIC') {
        this.addAuthentication(requestConfig);
      }

      const startTime = Date.now();
      const response = await this.httpClient.request(requestConfig);
      const responseTime = Date.now() - startTime;

      this.recordSuccessfulRequest(responseTime);
      
      return response.data;
      
    } catch (error: any) {
      this.recordFailedRequest(error);
      
      if (this.shouldRetry(error)) {
        return this.retryRequest(endpoint, method, data, config);
      }
      
      throw this.createMarketDataError(error, endpoint);
    }
  }

  protected createDataSource(endpoint: string, latency: number): DataSource {
    return {
      exchange: this.integration.name,
      endpoint,
      method: 'REST',
      reliability: this.calculateReliability(),
      latency
    };
  }

  protected createMarketDataPoint(
    rawData: any,
    symbol: string,
    source: DataSource
  ): MarketDataPoint {
    return {
      id: `${this.integration.slug}_${symbol}_${Date.now()}`,
      tokenId: '', // Will be resolved by aggregator
      symbol: this.denormalizeSymbol(symbol),
      exchange: this.integration.name,
      priceUsd: this.parsePrice(rawData.price),
      priceChange24h: this.parsePrice(rawData.priceChange24h || rawData.change24h),
      priceChangePercent24h: this.parsePercentage(rawData.priceChangePercent24h || rawData.changePercent24h),
      volume24h: this.parseVolume(rawData.volume24h || rawData.volume),
      volumeChange24h: this.parseVolume(rawData.volumeChange24h || 0),
      marketCap: this.parseVolume(rawData.marketCap || 0),
      high24h: this.parsePrice(rawData.high24h || rawData.high),
      low24h: this.parsePrice(rawData.low24h || rawData.low),
      tradingPairs: this.parseTradingPairs(rawData.pairs || []),
      timestamp: new Date(),
      source,
      quality: this.assessDataQuality(rawData)
    };
  }

  protected parsePrice(value: any): number {
    const price = parseFloat(value);
    return isNaN(price) ? 0 : price;
  }

  protected parseVolume(value: any): number {
    const volume = parseFloat(value);
    return isNaN(volume) ? 0 : volume;
  }

  protected parsePercentage(value: any): number {
    const percentage = parseFloat(value);
    return isNaN(percentage) ? 0 : percentage;
  }

  protected parseTradingPairs(pairs: any[]): TradingPair[] {
    return pairs.map(pair => ({
      base: pair.base || '',
      quote: pair.quote || '',
      price: this.parsePrice(pair.price),
      volume24h: this.parseVolume(pair.volume24h),
      lastTraded: new Date(pair.lastTraded || Date.now())
    }));
  }

  protected assessDataQuality(rawData: any): DataQuality {
    let score = 0;
    
    // Check required fields
    if (rawData.price && rawData.volume24h) score += 2;
    if (rawData.high24h && rawData.low24h) score += 1;
    if (rawData.priceChange24h) score += 1;
    if (rawData.marketCap) score += 1;
    
    // Assess data age
    if (rawData.timestamp) {
      const age = Date.now() - new Date(rawData.timestamp).getTime();
      if (age < 30000) score += 2; // Less than 30 seconds
      else if (age < 60000) score += 1; // Less than 1 minute
    }

    if (score >= 6) return DataQuality.HIGH;
    if (score >= 4) return DataQuality.MEDIUM;
    return DataQuality.LOW;
  }

  // ========== Private Methods ==========

  private initializeHttpClient(): void {
    this.httpClient = axios.create({
      baseURL: this.integration.apiEndpoint,
      timeout: 10000,
      headers: {
        'User-Agent': 'CoinDaily-Africa/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      response => response,
      error => {
        logger.error(`HTTP request failed for ${this.integration.name}`, {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  private addAuthentication(config: AxiosRequestConfig): void {
    const auth = this.integration.authentication;
    
    switch (auth.type) {
      case 'API_KEY':
        config.headers = {
          ...config.headers,
          'X-API-Key': auth.apiKey
        };
        break;
        
      case 'JWT':
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${auth.apiKey}`
        };
        break;
        
      case 'OAUTH':
        // Implement OAuth flow
        break;
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / this.integration.rateLimitPerMinute; // ms per request
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private recordSuccessfulRequest(responseTime: number): void {
    this.emit('requestSuccess', {
      exchange: this.integration.name,
      responseTime,
      timestamp: new Date()
    });
  }

  private recordFailedRequest(error: any): void {
    this.errorCount++;
    this.emit('requestError', {
      exchange: this.integration.name,
      error: error.message,
      status: error.response?.status,
      timestamp: new Date()
    });
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || 
           error.response.status >= 500 || 
           error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT';
  }

  private async retryRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    config?: AxiosRequestConfig,
    retryCount: number = 0
  ): Promise<any> {
    const maxRetries = 3;
    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    if (retryCount >= maxRetries) {
      throw new Error(`Max retries (${maxRetries}) exceeded for ${endpoint}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    try {
      return await this.makeRequest(endpoint, method, data, config);
    } catch (error) {
      if (this.shouldRetry(error)) {
        return this.retryRequest(endpoint, method, data, config, retryCount + 1);
      }
      throw error;
    }
  }

  private createMarketDataError(error: any, endpoint: string): MarketDataError {
    let errorCode = ErrorCode.EXCHANGE_UNAVAILABLE;
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorCode = ErrorCode.INSUFFICIENT_PERMISSIONS;
          break;
        case 429:
          errorCode = ErrorCode.RATE_LIMITED;
          break;
        case 404:
          errorCode = ErrorCode.INVALID_SYMBOL;
          break;
      }
    } else if (error.code === 'ETIMEDOUT') {
      errorCode = ErrorCode.NETWORK_TIMEOUT;
    } else if (error.code === 'ECONNREFUSED') {
      errorCode = ErrorCode.CONNECTION_FAILED;
    }

    return new MarketDataError(
      `${this.integration.name} API error: ${error.message}`,
      errorCode,
      this.shouldRetry(error),
      new Date(),
      { endpoint, status: error.response?.status }
    );
  }

  private determineHealthStatus(error: any): HealthStatus {
    if (error.response?.status === 503) {
      return HealthStatus.MAINTENANCE;
    } else if (this.errorCount > 5) {
      return HealthStatus.UNHEALTHY;
    } else {
      return HealthStatus.DEGRADED;
    }
  }

  private calculateUptime(): number {
    if (this.requestCount === 0) return 100;
    return ((this.requestCount - this.errorCount) / this.requestCount) * 100;
  }

  private calculateReliability(): number {
    if (this.requestCount === 0) return 1.0;
    return (this.requestCount - this.errorCount) / this.requestCount;
  }
}

// Custom error class for market data operations
export class MarketDataError extends Error {
  code: ErrorCode;
  exchange?: string;
  symbol?: string;
  retryable: boolean;
  timestamp: Date;
  details?: Record<string, any> | undefined;

  constructor(
    message: string,
    code: ErrorCode,
    retryable: boolean,
    timestamp: Date,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MarketDataError';
    this.code = code;
    this.retryable = retryable;
    this.timestamp = timestamp;
    this.details = details;
  }
}