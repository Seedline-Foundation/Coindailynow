/**
 * AI Market Insights GraphQL Schema
 * 
 * GraphQL types, queries, mutations, and subscriptions for market insights
 * 
 * @module aiMarketInsightsSchema
 */

export const aiMarketInsightsTypeDefs = `
  # ============================================================================
  # TYPES
  # ============================================================================

  """
  AI-powered sentiment analysis for a cryptocurrency
  """
  type SentimentAnalysis {
    symbol: String!
    sentiment: SentimentLabel!
    score: Float!
    confidence: Float!
    sources: SentimentSources!
    prediction: MarketPrediction!
    last_updated: DateTime!
    metadata: SentimentMetadata!
  }

  """
  Sentiment label classification
  """
  enum SentimentLabel {
    bullish
    bearish
    neutral
  }

  """
  Sentiment data sources with individual scores
  """
  type SentimentSources {
    social_media: Float!
    news: Float!
    whale_activity: Float!
    technical: Float!
  }

  """
  AI market prediction
  """
  type MarketPrediction {
    direction: PredictionDirection!
    confidence: Float!
    timeframe: PredictionTimeframe!
    target_price: Float
  }

  """
  Prediction direction
  """
  enum PredictionDirection {
    up
    down
    stable
  }

  """
  Prediction timeframe
  """
  enum PredictionTimeframe {
    ONE_HOUR
    FOUR_HOURS
    TWENTY_FOUR_HOURS
    SEVEN_DAYS
  }

  """
  Sentiment metadata
  """
  type SentimentMetadata {
    volume_24h: Float!
    price_change_24h: Float!
    social_mentions: Int!
    trending_rank: Int
  }

  """
  Trending memecoin with AI analysis
  """
  type TrendingMemecoin {
    symbol: String!
    name: String!
    rank: Int!
    trend_score: Float!
    price_change_1h: Float!
    price_change_24h: Float!
    volume_change_24h: Float!
    social_volume_change: Float!
    sentiment_shift: Float!
    african_exchange_volume: AfricanExchangeVolume
    reasons: [String!]!
    predicted_trajectory: TrendTrajectory!
    risk_level: RiskLevel!
  }

  """
  Trend trajectory prediction
  """
  enum TrendTrajectory {
    rising
    peaking
    declining
  }

  """
  Risk level assessment
  """
  enum RiskLevel {
    low
    medium
    high
    extreme
  }

  """
  African exchange volume data
  """
  type AfricanExchangeVolume {
    binance_africa: Float
    luno: Float
    quidax: Float
    valr: Float
  }

  """
  Whale activity transaction
  """
  type WhaleActivity {
    id: ID!
    symbol: String!
    transaction_type: TransactionType!
    amount: Float!
    value_usd: Float!
    wallet_address: String!
    exchange: String
    timestamp: DateTime!
    impact_score: Float!
    alert_level: AlertLevel!
  }

  """
  Transaction type
  """
  enum TransactionType {
    buy
    sell
    transfer
  }

  """
  Alert level for whale activity
  """
  enum AlertLevel {
    low
    medium
    high
    critical
  }

  """
  Comprehensive market insights
  """
  type MarketInsights {
    overall_sentiment: SentimentLabel!
    market_fear_greed_index: Int!
    trending_topics: [String!]!
    african_market_highlights: AfricanMarketHighlights!
    key_insights: [KeyInsight!]!
    generated_at: DateTime!
  }

  """
  African market-specific highlights
  """
  type AfricanMarketHighlights {
    most_traded_pairs: [String!]!
    mobile_money_correlation: Float!
    regional_sentiment: RegionalSentiment!
  }

  """
  Regional sentiment breakdown
  """
  type RegionalSentiment {
    nigeria: String
    kenya: String
    south_africa: String
    ghana: String
  }

  """
  Key market insight
  """
  type KeyInsight {
    title: String!
    description: String!
    impact: InsightImpact!
    timeframe: String!
  }

  """
  Insight impact type
  """
  enum InsightImpact {
    positive
    negative
    neutral
  }

  """
  Cache information
  """
  type CacheInfo {
    hit: Boolean!
    expires_at: DateTime!
  }

  """
  Cache statistics
  """
  type CacheStats {
    total_keys: Int!
    sentiment_keys: Int!
    trending_keys: Int!
    whale_keys: Int!
    insights_keys: Int!
  }

  # ============================================================================
  # INPUT TYPES
  # ============================================================================

  """
  Input for getting sentiment analysis
  """
  input GetSentimentInput {
    symbol: String!
    includeHistory: Boolean
    timeframe: String
  }

  """
  Input for batch sentiment analysis
  """
  input BatchSentimentInput {
    symbols: [String!]!
  }

  """
  Input for getting trending memecoins
  """
  input GetTrendingInput {
    limit: Int
    region: String
    minTrendScore: Int
  }

  """
  Input for getting whale activity
  """
  input GetWhaleActivityInput {
    symbol: String
    minImpactScore: Int
    limit: Int
    since: DateTime
  }

  """
  Input for invalidating cache
  """
  input InvalidateCacheInput {
    symbol: String
  }

  # ============================================================================
  # QUERIES
  # ============================================================================

  type Query {
    """
    Get AI-powered sentiment analysis for a token
    Cache TTL: 30 seconds
    """
    marketSentiment(input: GetSentimentInput!): SentimentAnalysisResponse!

    """
    Get sentiment analysis for multiple tokens
    """
    batchMarketSentiment(input: BatchSentimentInput!): BatchSentimentResponse!

    """
    Get trending memecoins with AI analysis
    Cache TTL: 5 minutes
    """
    trendingMemecoins(input: GetTrendingInput): TrendingMemecoinResponse!

    """
    Get whale activity alerts
    Cache TTL: 1 minute
    """
    whaleActivity(input: GetWhaleActivityInput): WhaleActivityResponse!

    """
    Get comprehensive AI market insights
    Cache TTL: 3 minutes
    """
    marketInsights: MarketInsightsResponse!

    """
    Get cache statistics
    """
    marketCacheStats: CacheStatsResponse!
  }

  # ============================================================================
  # MUTATIONS
  # ============================================================================

  type Mutation {
    """
    Invalidate cache for a specific symbol or all market data
    Requires: Admin authentication
    """
    invalidateMarketCache(input: InvalidateCacheInput): InvalidateCacheResponse!
  }

  # ============================================================================
  # SUBSCRIPTIONS
  # ============================================================================

  type Subscription {
    """
    Subscribe to sentiment updates for a symbol
    Updates every 30 seconds
    """
    sentimentUpdated(symbol: String!): SentimentAnalysis!

    """
    Subscribe to trending memecoin updates
    Updates every 5 minutes
    """
    trendingUpdated(region: String): [TrendingMemecoin!]!

    """
    Subscribe to whale activity alerts
    Real-time updates
    """
    whaleActivityAlert(symbol: String, minImpactScore: Int): WhaleActivity!

    """
    Subscribe to market insights updates
    Updates every 3 minutes
    """
    marketInsightsUpdated: MarketInsights!
  }

  # ============================================================================
  # RESPONSE TYPES
  # ============================================================================

  type SentimentAnalysisResponse {
    data: SentimentAnalysis
    cache: CacheInfo
    error: ErrorResponse
  }

  type BatchSentimentResponse {
    data: [SentimentAnalysis!]
    metadata: BatchMetadata
    error: ErrorResponse
  }

  type BatchMetadata {
    total: Int!
    successful: Int!
    failed: Int!
  }

  type TrendingMemecoinResponse {
    data: [TrendingMemecoin!]
    metadata: TrendingMetadata
    cache: CacheInfo
    error: ErrorResponse
  }

  type TrendingMetadata {
    count: Int!
    region: String!
    generated_at: DateTime!
  }

  type WhaleActivityResponse {
    data: [WhaleActivity!]
    metadata: WhaleActivityMetadata
    cache: CacheInfo
    error: ErrorResponse
  }

  type WhaleActivityMetadata {
    count: Int!
    symbol: String!
    critical_alerts: Int!
    high_alerts: Int!
  }

  type MarketInsightsResponse {
    data: MarketInsights
    cache: CacheInfo
    error: ErrorResponse
  }

  type CacheStatsResponse {
    data: CacheStats
    timestamp: DateTime!
    error: ErrorResponse
  }

  type InvalidateCacheResponse {
    success: Boolean!
    message: String!
    timestamp: DateTime!
    error: ErrorResponse
  }

  type ErrorResponse {
    code: String!
    message: String!
    details: String
  }

  # ============================================================================
  # SCALAR TYPES
  # ============================================================================

  scalar DateTime
`;

export default aiMarketInsightsTypeDefs;
