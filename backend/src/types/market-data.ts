/**
 * Market Data Aggregator Types
 * Task 13: Market Data Aggregator Implementation
 * 
 * Comprehensive type definitions for African exchanges and global market data
 */

// ========== Core Market Data Types ==========

export interface MarketDataPoint {
  id: string;
  tokenId: string;
  symbol: string;
  exchange: string;
  priceUsd: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  tradingPairs: TradingPair[];
  timestamp: Date;
  source: DataSource;
  quality: DataQuality;
}

export interface TradingPair {
  base: string;
  quote: string;
  price: number;
  volume24h: number;
  lastTraded: Date;
}

export interface HistoricalDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  exchange: string;
  interval: TimeInterval;
}

// ========== African Exchange Types ==========

export interface AfricanExchangeData extends MarketDataPoint {
  localCurrency?: {
    code: string; // ZAR, NGN, KES, GHS, etc.
    rate: number;
    priceLocal: number;
  };
  mobileMoneyIntegration?: {
    providers: MobileMoneyProvider[];
    depositMethods: string[];
    withdrawMethods: string[];
  };
  regulations?: {
    country: string;
    compliance: ComplianceLevel;
    restrictions?: string[];
  };
}

export enum MobileMoneyProvider {
  MPESA = 'MPESA',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MONEY = 'MTN_MONEY',
  ECOCASH = 'ECOCASH',
  AIRTEL_MONEY = 'AIRTEL_MONEY'
}

export enum ComplianceLevel {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
  NON_COMPLIANT = 'NON_COMPLIANT'
}

// ========== Exchange Integration Types ==========

export interface ExchangeIntegration {
  id: string;
  name: string;
  slug: string;
  type: ExchangeType;
  region: ExchangeRegion;
  apiEndpoint: string;
  websocketEndpoint?: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  rateLimitPerMinute: number;
  isActive: boolean;
  lastSyncAt?: Date;
  health: ExchangeHealth;
  authentication: ExchangeAuth;
}

export enum ExchangeType {
  AFRICAN = 'AFRICAN',
  GLOBAL = 'GLOBAL',
  REGIONAL = 'REGIONAL'
}

export enum ExchangeRegion {
  SOUTH_AFRICA = 'SOUTH_AFRICA',
  NIGERIA = 'NIGERIA',
  KENYA = 'KENYA',
  GHANA = 'GHANA',
  GLOBAL = 'GLOBAL',
  AFRICA_WIDE = 'AFRICA_WIDE'
}

export interface ExchangeHealth {
  status: HealthStatus;
  uptime: number; // percentage
  avgResponseTime: number; // milliseconds
  lastCheck: Date;
  consecutiveFailures: number;
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  MAINTENANCE = 'MAINTENANCE'
}

export interface ExchangeAuth {
  type: AuthType;
  apiKey?: string;
  secret?: string;
  passphrase?: string;
  testnet: boolean;
}

export enum AuthType {
  PUBLIC = 'PUBLIC',
  API_KEY = 'API_KEY',
  OAUTH = 'OAUTH',
  JWT = 'JWT'
}

// ========== Data Processing Types ==========

export interface DataSource {
  exchange: string;
  endpoint: string;
  method: 'REST' | 'WEBSOCKET' | 'GRAPHQL';
  reliability: number; // 0-1 score
  latency: number; // milliseconds
}

export enum DataQuality {
  HIGH = 'HIGH',         // < 1% deviation, < 30s old
  MEDIUM = 'MEDIUM',     // < 5% deviation, < 60s old  
  LOW = 'LOW',           // > 5% deviation or > 60s old
  SUSPECT = 'SUSPECT'    // Major anomalies detected
}

export enum TimeInterval {
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  FOUR_HOURS = '4h',
  ONE_DAY = '1d',
  ONE_WEEK = '1w'
}

// ========== Aggregator Service Types ==========

export interface MarketDataAggregatorConfig {
  exchanges: ExchangeConfig[];
  caching: CachingConfig;
  validation: ValidationConfig;
  performance: PerformanceConfig;
  africanOptimizations: AfricanConfig;
}

export interface ExchangeConfig {
  integration: ExchangeIntegration;
  priority: number; // Higher = preferred source
  timeout: number; // milliseconds
  retryPolicy: RetryPolicy;
  circuitBreaker: CircuitBreakerConfig;
}

export interface CachingConfig {
  hotDataTtl: number;    // Memory cache TTL (seconds)
  warmDataTtl: number;   // Redis cache TTL (seconds)
  coldDataTtl: number;   // Database TTL (seconds)
  maxHotItems: number;   // Max items in memory
  compressionEnabled: boolean;
}

export interface ValidationConfig {
  maxPriceDeviation: number;    // Percentage
  maxVolumeDeviation: number;   // Percentage
  minDataAge: number;           // Seconds
  crossExchangeValidation: boolean;
  anomalyDetection: boolean;
}

export interface PerformanceConfig {
  maxResponseTime: number;      // Milliseconds
  concurrentRequests: number;
  batchSize: number;
  memoryLimit: number;          // MB
  compressionThreshold: number; // Bytes
}

export interface AfricanConfig {
  prioritizeAfricanExchanges: boolean;
  localCurrencySupport: string[];
  mobileMoneyIntegration: boolean;
  regionalFailover: boolean;
  complianceMode: ComplianceLevel;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;     // milliseconds
  maxDelay: number;         // milliseconds
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;  // milliseconds
  monitoringWindow: number; // milliseconds
}

// ========== API Response Types ==========

export interface MarketDataResponse {
  data: MarketDataPoint[];
  metadata: ResponseMetadata;
  cache: CacheInfo;
  performance: PerformanceInfo;
}

export interface ResponseMetadata {
  total: number;
  page?: number;
  pageSize?: number;
  source: string;
  timestamp: Date;
  dataAge: number; // seconds
}

export interface CacheInfo {
  hit: boolean;
  ttl: number; // seconds remaining
  source: 'MEMORY' | 'REDIS' | 'DATABASE';
}

export interface PerformanceInfo {
  responseTime: number; // milliseconds
  dbQueries: number;
  cacheHits: number;
  cacheMisses: number;
  exchangeLatency?: number;
}

// ========== WebSocket Types ==========

export interface WebSocketMessage {
  type: WebSocketMessageType;
  channel: string;
  data: any;
  timestamp: Date;
  exchange?: string;
}

export enum WebSocketMessageType {
  PRICE_UPDATE = 'PRICE_UPDATE',
  VOLUME_UPDATE = 'VOLUME_UPDATE', 
  TRADE = 'TRADE',
  ORDER_BOOK = 'ORDER_BOOK',
  HEARTBEAT = 'HEARTBEAT',
  ERROR = 'ERROR',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE'
}

export interface WebSocketSubscription {
  userId?: string;
  channels: string[];
  symbols: string[];
  exchanges: string[];
  filters?: SubscriptionFilter[];
  createdAt: Date;
}

export interface SubscriptionFilter {
  type: 'PRICE_THRESHOLD' | 'VOLUME_THRESHOLD' | 'CHANGE_PERCENTAGE';
  operator: '>' | '<' | '>=' | '<=' | '=';
  value: number;
}

// ========== Error Types ==========

export interface MarketDataErrorInfo {
  code: ErrorCode;
  exchange?: string;
  symbol?: string;
  retryable: boolean;
  timestamp: Date;
  details?: Record<string, any>;
}

export class MarketDataError extends Error {
  public code: ErrorCode;
  public exchange?: string;
  public symbol?: string;
  public retryable: boolean;
  public timestamp: Date;
  public details?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    options: {
      exchange?: string;
      symbol?: string;
      retryable?: boolean;
      details?: Record<string, any>;
    } = {}
  ) {
    super(message);
    this.name = 'MarketDataError';
    this.code = code;
    this.exchange = options.exchange || '';
    this.symbol = options.symbol || '';
    this.retryable = options.retryable || false;
    this.timestamp = new Date();
    this.details = options.details || {};

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MarketDataError);
    }
  }
}

export enum ErrorCode {
  // Network Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Exchange Errors
  EXCHANGE_UNAVAILABLE = 'EXCHANGE_UNAVAILABLE',
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Data Errors
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
  STALE_DATA = 'STALE_DATA',
  
  // System Errors
  CACHE_FAILURE = 'CACHE_FAILURE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  
  // African Specific
  REGULATORY_RESTRICTION = 'REGULATORY_RESTRICTION',
  MOBILE_MONEY_UNAVAILABLE = 'MOBILE_MONEY_UNAVAILABLE',
  LOCAL_CURRENCY_UNSUPPORTED = 'LOCAL_CURRENCY_UNSUPPORTED'
}

// ========== Monitoring Types ==========

export interface MarketDataMetrics {
  timestamp: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  cacheHitRate: number;
  exchangeHealthScores: Record<string, number>;
  dataQualityScore: number;
  africanUserPercentage: number;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '=';
  duration: number; // seconds
  severity: AlertSeverity;
  channels: string[];
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// ========== Service Interfaces ==========

export interface IMarketDataAggregator {
  getMarketData(symbols: string[], options?: QueryOptions): Promise<MarketDataResponse>;
  getHistoricalData(symbol: string, interval: TimeInterval, options?: HistoricalOptions): Promise<HistoricalDataPoint[]>;
  subscribeToUpdates(subscription: WebSocketSubscription): Promise<string>;
  unsubscribeFromUpdates(subscriptionId: string): Promise<void>;
  getExchangeHealth(): Promise<Record<string, ExchangeHealth>>;
  validateData(data: MarketDataPoint): Promise<DataQuality>;
}

export interface QueryOptions {
  exchanges?: string[];
  maxAge?: number; // seconds
  includeAfricanData?: boolean;
  localCurrency?: string;
  sortBy?: 'price' | 'volume' | 'market_cap' | 'change';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface HistoricalOptions {
  startTime?: Date;
  endTime?: Date;
  exchanges?: string[];
  includeVolume?: boolean;
  granularity?: TimeInterval;
}