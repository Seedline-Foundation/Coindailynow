// Trend Analysis Agent - Advanced trend detection and prediction for African cryptocurrency markets
// Optimized for single I/O operations with comprehensive trend analysis

import { createAuditLog, AuditActions } from '../../../lib/audit';
import { TrendAnalysisResult } from '../../types/ai-types';

export interface TrendAnalysisRequest {
  dataType: 'price' | 'news' | 'social' | 'search' | 'adoption';
  symbol?: string;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  region?: 'NG' | 'KE' | 'ZA' | 'GH' | 'ET' | 'all';
  indicators?: string[];
  predictionLength?: number; // Hours to predict ahead
  includeAfricanContext?: boolean;
}

interface TrendDataPoint {
  timestamp: Date;
  value: number;
  volume?: number;
  sentiment?: number;
  source: string;
  region?: string;
}

interface TrendIndicator {
  name: string;
  value: number;
  change: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
}

interface PredictionModel {
  name: string;
  accuracy: number;
  timeframe: string;
  confidence: number;
}

export class TrendAnalysisAgent {
  private isInitialized: boolean = false;
  private trendCache: Map<string, TrendAnalysisResult> = new Map();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes cache for trends
  private modelAccuracy: Map<string, number> = new Map();

  // African market-specific trend indicators
  private readonly africanTrendIndicators = {
    economic: ['inflation', 'gdp_growth', 'currency_stability', 'remittances'],
    crypto: ['adoption_rate', 'exchange_volume', 'mobile_money_integration', 'regulatory_sentiment'],
    social: ['social_mentions', 'search_volume', 'news_sentiment', 'influencer_activity'],
    technical: ['rsi', 'macd', 'bollinger_bands', 'support_resistance']
  };

  // Prediction models with African market focus
  private readonly predictionModels: PredictionModel[] = [
    {
      name: 'african_momentum',
      accuracy: 0.75,
      timeframe: '1h-6h',
      confidence: 0.8
    },
    {
      name: 'mobile_money_correlation',
      accuracy: 0.68,
      timeframe: '6h-24h',
      confidence: 0.7
    },
    {
      name: 'cross_border_flow',
      accuracy: 0.72,
      timeframe: '24h-7d',
      confidence: 0.75
    },
    {
      name: 'regulatory_impact',
      accuracy: 0.65,
      timeframe: '7d-30d',
      confidence: 0.6
    }
  ];

  constructor() {}

  async initialize(): Promise<void> {
    console.log('📈 Initializing Trend Analysis Agent...');

    try {
      // Initialize model accuracies
      this.predictionModels.forEach(model => {
        this.modelAccuracy.set(model.name, model.accuracy);
      });

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'trend_analysis_agent',
        resourceId: 'trend_analyzer',
        details: { 
          initialized: true, 
          supportedDataTypes: ['price', 'news', 'social', 'search', 'adoption'],
          predictionModels: this.predictionModels.length,
          africanRegions: ['NG', 'KE', 'ZA', 'GH', 'ET'],
          capabilities: ['trend_detection', 'prediction', 'african_market_analysis', 'multi_timeframe']
        }
      });

      console.log('✅ Trend Analysis Agent initialized with African market models');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'trend_analysis_agent',
        resourceId: 'trend_analyzer',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async analyzeTrend(request: TrendAnalysisRequest): Promise<TrendAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResult = this.trendCache.get(cacheKey);
    if (cachedResult) {
      console.log(`📋 Using cached trend analysis for ${request.dataType} - ${request.symbol || 'market'}`);
      return cachedResult;
    }

    console.log(`📈 Analyzing trend for ${request.dataType} - ${request.timeRange} timeframe...`);

    try {
      // Step 1: Collect trend data
      const trendData = await this.collectTrendData(request);
      
      // Step 2: Calculate trend direction and strength
      const trendAnalysis = this.calculateTrendDirection(trendData);
      
      // Step 3: Generate technical indicators
      const indicators = this.calculateIndicators(trendData, request);
      
      // Step 4: Generate predictions
      const predictions = await this.generatePredictions(trendData, request);
      
      // Step 5: Add African market context
      const africanContext = request.includeAfricanContext !== false 
        ? this.addAfricanMarketContext(trendAnalysis, indicators, request)
        : undefined;

      const result: TrendAnalysisResult = {
        trend: trendAnalysis.direction,
        trendScore: trendAnalysis.strength,
        predictions,
        indicators,
        metadata: {
          dataPoints: trendData.length,
          timeRange: request.timeRange,
          accuracy: this.calculateOverallAccuracy(request),
          processingTime: Date.now() - startTime,
          africanContext
        }
      };

      // Cache result
      this.trendCache.set(cacheKey, result);
      setTimeout(() => this.trendCache.delete(cacheKey), this.cacheTimeout);

      // Log successful analysis
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'trend_analysis',
        resourceId: `trend_${Date.now()}`,
        details: {
          dataType: request.dataType,
          symbol: request.symbol,
          timeRange: request.timeRange,
          trend: result.trend,
          trendScore: result.trendScore,
          predictionsCount: result.predictions.length,
          indicatorsCount: result.indicators.length,
          processingTime: result.metadata?.processingTime,
          region: request.region
        }
      });

      console.log(`✅ Trend analysis completed: ${result.trend} trend with score ${result.trendScore.toFixed(2)}`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Trend analysis failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'trend_analysis',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          dataType: request.dataType,
          timeRange: request.timeRange
        }
      });

      throw new Error(`Trend analysis failed: ${errorMessage}`);
    }
  }

  private async collectTrendData(request: TrendAnalysisRequest): Promise<TrendDataPoint[]> {
    // Simulate data collection from various sources
    const dataPoints: TrendDataPoint[] = [];
    const hoursBack = this.getHoursFromTimeRange(request.timeRange);
    const pointCount = Math.min(hoursBack, 168); // Max 1 week of hourly data
    
    const now = new Date();
    const baseValue = this.getBaseValue(request.dataType);
    
    // Generate simulated trend data with African market characteristics
    for (let i = pointCount; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const africanSessionMultiplier = this.getAfricanSessionMultiplier(timestamp);
      const volatility = this.getAfricanMarketVolatility(request.region);
      
      // Simulate trend patterns
      const trend = Math.sin((pointCount - i) / pointCount * Math.PI * 2) * 0.1;
      const noise = (Math.random() - 0.5) * volatility;
      const sessionAdjustment = (africanSessionMultiplier - 1) * 0.05;
      
      const value = baseValue * (1 + trend + noise + sessionAdjustment);
      
      dataPoints.push({
        timestamp,
        value,
        volume: Math.random() * 1000000 + 100000,
        sentiment: Math.random() * 2 - 1, // -1 to 1
        source: this.getDataSource(request.dataType),
        region: request.region
      });
    }
    
    return dataPoints;
  }

  private calculateTrendDirection(data: TrendDataPoint[]): { direction: 'rising' | 'falling' | 'stable' | 'volatile'; strength: number } {
    if (data.length < 2) {
      return { direction: 'stable', strength: 0 };
    }
    
    // Calculate simple moving averages for trend detection
    const shortPeriod = Math.min(5, Math.floor(data.length / 4));
    const longPeriod = Math.min(20, Math.floor(data.length / 2));
    
    const shortMA = this.calculateMovingAverage(data.slice(-shortPeriod));
    const longMA = this.calculateMovingAverage(data.slice(-longPeriod));
    
    // Calculate trend strength
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    
    // Calculate volatility
    const volatility = this.calculateVolatility(data);
    
    // Determine trend direction
    let direction: 'rising' | 'falling' | 'stable' | 'volatile';
    let strength: number;
    
    if (volatility > 0.15) { // High volatility threshold
      direction = 'volatile';
      strength = Math.min(volatility, 1);
    } else if (shortMA > longMA * 1.02) { // 2% threshold
      direction = 'rising';
      strength = Math.min(Math.abs(percentChange) / 10, 1); // Normalize to 0-1
    } else if (shortMA < longMA * 0.98) { // 2% threshold
      direction = 'falling';
      strength = Math.min(Math.abs(percentChange) / 10, 1);
    } else {
      direction = 'stable';
      strength = 1 - Math.min(Math.abs(percentChange) / 5, 1); // Inverse of change
    }
    
    return { direction, strength };
  }

  private calculateIndicators(data: TrendDataPoint[], request: TrendAnalysisRequest): TrendIndicator[] {
    const indicators: TrendIndicator[] = [];
    
    // RSI (Relative Strength Index)
    const rsi = this.calculateRSI(data);
    indicators.push({
      name: 'RSI',
      value: rsi,
      change: 0, // Simplified for demo
      signal: rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral',
      confidence: 0.8,
      description: `RSI at ${rsi.toFixed(1)} indicates ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions`
    });
    
    // Moving Average Convergence Divergence (MACD)
    const macd = this.calculateMACD(data);
    indicators.push({
      name: 'MACD',
      value: macd.macd,
      change: macd.signal,
      signal: macd.macd > macd.signal ? 'bullish' : 'bearish',
      confidence: 0.75,
      description: `MACD ${macd.macd > macd.signal ? 'above' : 'below'} signal line indicates ${macd.macd > macd.signal ? 'bullish' : 'bearish'} momentum`
    });
    
    // Volume indicator
    const volumeTrend = this.calculateVolumeTrend(data);
    indicators.push({
      name: 'Volume Trend',
      value: volumeTrend.current,
      change: volumeTrend.change,
      signal: volumeTrend.change > 0.1 ? 'bullish' : volumeTrend.change < -0.1 ? 'bearish' : 'neutral',
      confidence: 0.6,
      description: `Volume ${volumeTrend.change > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(volumeTrend.change * 100).toFixed(1)}%`
    });
    
    // African market specific indicators
    if (request.includeAfricanContext !== false) {
      const africanIndicators = this.calculateAfricanMarketIndicators(data, request);
      indicators.push(...africanIndicators);
    }
    
    return indicators;
  }

  private async generatePredictions(data: TrendDataPoint[], request: TrendAnalysisRequest): Promise<Array<{ timeframe: string; prediction: string; confidence: number }>> {
    const predictions: Array<{ timeframe: string; prediction: string; confidence: number }> = [];
    const predictionLength = request.predictionLength || 24; // Default 24 hours
    
    // Get suitable models for timeframe
    const suitableModels = this.predictionModels.filter(model => 
      this.isModelSuitableForTimeframe(model, request.timeRange)
    );
    
    for (const model of suitableModels.slice(0, 3)) { // Limit to 3 predictions
      const prediction = await this.generateSinglePrediction(data, model, predictionLength, request);
      predictions.push(prediction);
    }
    
    return predictions;
  }

  private async generateSinglePrediction(
    data: TrendDataPoint[], 
    model: PredictionModel, 
    hours: number, 
    request: TrendAnalysisRequest
  ): Promise<{ timeframe: string; prediction: string; confidence: number }> {
    // Simplified prediction logic (would be actual ML model in production)
    const trend = this.calculateTrendDirection(data);
    const recentVolatility = this.calculateVolatility(data.slice(-10));
    const africanFactors = this.calculateAfricanMarketFactors(request);
    
    let predictionText: string;
    let confidence = model.confidence;
    
    // Adjust confidence based on volatility and African market factors
    confidence *= (1 - recentVolatility * 0.5); // Reduce confidence with high volatility
    confidence *= africanFactors.stabilityFactor;
    
    // Generate prediction based on model type
    switch (model.name) {
      case 'african_momentum':
        predictionText = this.generateMomentumPrediction(trend, africanFactors);
        break;
      case 'mobile_money_correlation':
        predictionText = this.generateMobileMoneyPrediction(trend, request);
        break;
      case 'cross_border_flow':
        predictionText = this.generateCrossBorderPrediction(trend);
        break;
      case 'regulatory_impact':
        predictionText = this.generateRegulatoryPrediction(trend, request);
        break;
      default:
        predictionText = `${trend.direction} trend expected to continue`;
    }
    
    return {
      timeframe: `${hours}h`,
      prediction: predictionText,
      confidence: Math.max(0.1, Math.min(0.95, confidence))
    };
  }

  private addAfricanMarketContext(
    trendAnalysis: { direction: string; strength: number },
    indicators: TrendIndicator[],
    request: TrendAnalysisRequest
  ): Record<string, unknown> {
    return {
      marketSession: this.getCurrentAfricanMarketSession(),
      regionalFactors: this.getRegionalFactors(request.region),
      mobileMoneyImpact: this.calculateMobileMoneyImpact(request),
      crossBorderFlows: this.estimateCrossBorderFlows(request),
      regulatoryEnvironment: this.assessRegulatoryEnvironment(request.region),
      adoptionMetrics: this.getAdoptionMetrics(request.region)
    };
  }

  // Helper methods
  private getHoursFromTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 1;
      case '6h': return 6;
      case '24h': return 24;
      case '7d': return 168;
      case '30d': return 720;
      default: return 24;
    }
  }

  private getBaseValue(dataType: string): number {
    switch (dataType) {
      case 'price': return 45000; // BTC base price
      case 'news': return 100; // News mentions
      case 'social': return 1000; // Social mentions
      case 'search': return 75; // Search volume index
      case 'adoption': return 0.15; // Adoption percentage
      default: return 1;
    }
  }

  private getAfricanSessionMultiplier(timestamp: Date): number {
    const hour = timestamp.getUTCHours();
    // African markets are most active 6-14 UTC (8AM-4PM WAT)
    if (hour >= 6 && hour <= 14) {
      return 1.2; // 20% more activity
    } else if (hour >= 15 && hour <= 21) {
      return 1.1; // 10% more activity
    }
    return 0.9; // 10% less activity during night
  }

  private getAfricanMarketVolatility(region?: string): number {
    const baseVolatility = 0.08; // 8% base volatility
    
    switch (region) {
      case 'NG': return baseVolatility * 1.3; // Higher volatility in Nigeria
      case 'ZA': return baseVolatility * 0.9; // Lower volatility in South Africa
      case 'KE': return baseVolatility * 1.1; // Moderate volatility in Kenya
      case 'GH': return baseVolatility * 1.2;
      case 'ET': return baseVolatility * 1.4;
      default: return baseVolatility;
    }
  }

  private getDataSource(dataType: string): string {
    switch (dataType) {
      case 'price': return 'african_exchanges';
      case 'news': return 'african_news_feeds';
      case 'social': return 'african_social_media';
      case 'search': return 'african_search_trends';
      case 'adoption': return 'african_adoption_surveys';
      default: return 'unknown';
    }
  }

  private calculateMovingAverage(data: TrendDataPoint[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, point) => acc + point.value, 0);
    return sum / data.length;
  }

  private calculateVolatility(data: TrendDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateRSI(data: TrendDataPoint[]): number {
    if (data.length < 14) return 50; // Default neutral RSI
    
    const changes = data.slice(1).map((point, i) => point.value - data[i].value);
    const gains = changes.filter(change => change > 0);
    const losses = changes.filter(change => change < 0).map(Math.abs);
    
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b) / gains.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b) / losses.length : 0.01;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(data: TrendDataPoint[]): { macd: number; signal: number } {
    if (data.length < 26) return { macd: 0, signal: 0 };
    
    // Simplified MACD calculation
    const ema12 = this.calculateEMA(data.slice(-12).map(d => d.value), 12);
    const ema26 = this.calculateEMA(data.slice(-26).map(d => d.value), 26);
    const macd = ema12 - ema26;
    const signal = macd * 0.9; // Simplified signal line
    
    return { macd, signal };
  }

  private calculateEMA(values: number[], period: number): number {
    if (values.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = values[0];
    
    for (let i = 1; i < values.length; i++) {
      ema = (values[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateVolumeTrend(data: TrendDataPoint[]): { current: number; change: number } {
    if (data.length < 2) return { current: 0, change: 0 };
    
    const recentVolume = data.slice(-5).reduce((sum, d) => sum + (d.volume || 0), 0) / 5;
    const olderVolume = data.slice(-10, -5).reduce((sum, d) => sum + (d.volume || 0), 0) / 5;
    
    const change = olderVolume > 0 ? (recentVolume - olderVolume) / olderVolume : 0;
    
    return { current: recentVolume, change };
  }

  private calculateAfricanMarketIndicators(data: TrendDataPoint[], request: TrendAnalysisRequest): TrendIndicator[] {
    const indicators: TrendIndicator[] = [];
    
    // Mobile money correlation indicator
    const mobileMoneyCorrelation = this.calculateMobileMoneyCorrelation(data, request);
    indicators.push({
      name: 'Mobile Money Correlation',
      value: mobileMoneyCorrelation,
      change: 0,
      signal: mobileMoneyCorrelation > 0.6 ? 'bullish' : mobileMoneyCorrelation < 0.4 ? 'bearish' : 'neutral',
      confidence: 0.7,
      description: `${(mobileMoneyCorrelation * 100).toFixed(1)}% correlation with mobile money usage`
    });
    
    // Regional adoption indicator
    const adoptionRate = this.getRegionalAdoptionRate(request.region);
    indicators.push({
      name: 'Regional Adoption',
      value: adoptionRate,
      change: 0.05, // Assumed 5% monthly growth
      signal: adoptionRate > 0.1 ? 'bullish' : 'neutral',
      confidence: 0.6,
      description: `${(adoptionRate * 100).toFixed(1)}% crypto adoption rate in region`
    });
    
    return indicators;
  }

  private calculateAfricanMarketFactors(request: TrendAnalysisRequest): { stabilityFactor: number; growthFactor: number } {
    const regionFactors = this.getRegionalFactors(request.region);
    
    return {
      stabilityFactor: regionFactors.economicStability,
      growthFactor: regionFactors.cryptoGrowth
    };
  }

  private generateMomentumPrediction(trend: { direction: string; strength: number }, factors: { stabilityFactor: number; growthFactor: number }): string {
    const strength = trend.strength > 0.7 ? 'strong' : trend.strength > 0.4 ? 'moderate' : 'weak';
    return `${strength} ${trend.direction} momentum expected with ${(factors.growthFactor * 100).toFixed(0)}% growth factor`;
  }

  private generateMobileMoneyPrediction(trend: { direction: string; strength: number }, request: TrendAnalysisRequest): string {
    const correlation = this.calculateMobileMoneyCorrelation([], request);
    return `Mobile money integration driving ${correlation > 0.6 ? 'positive' : 'neutral'} crypto adoption trends`;
  }

  private generateCrossBorderPrediction(trend: { direction: string; strength: number }): string {
    return `Cross-border payment demand supporting ${trend.direction} trend in African markets`;
  }

  private generateRegulatoryPrediction(trend: { direction: string; strength: number }, request: TrendAnalysisRequest): string {
    const environment = this.assessRegulatoryEnvironment(request.region);
    return `Regulatory environment ${environment.sentiment} likely to ${environment.impact} current trend`;
  }

  private isModelSuitableForTimeframe(model: PredictionModel, timeRange: string): boolean {
    const modelTimeframes = model.timeframe.split('-');
    const currentHours = this.getHoursFromTimeRange(timeRange);
    
    // Simple matching logic
    return modelTimeframes.some(tf => {
      const hours = this.getHoursFromTimeRange(tf as TrendAnalysisRequest['timeRange']);
      return Math.abs(hours - currentHours) <= currentHours * 0.5;
    });
  }

  private getCurrentAfricanMarketSession(): string {
    const hour = new Date().getUTCHours();
    if (hour >= 6 && hour < 12) return 'african_morning';
    if (hour >= 12 && hour < 18) return 'african_afternoon';
    if (hour >= 18 && hour < 24) return 'african_evening';
    return 'african_night';
  }

  private getRegionalFactors(region?: string): { economicStability: number; cryptoGrowth: number } {
    switch (region) {
      case 'NG': return { economicStability: 0.7, cryptoGrowth: 0.9 };
      case 'KE': return { economicStability: 0.8, cryptoGrowth: 0.85 };
      case 'ZA': return { economicStability: 0.75, cryptoGrowth: 0.7 };
      case 'GH': return { economicStability: 0.72, cryptoGrowth: 0.8 };
      case 'ET': return { economicStability: 0.65, cryptoGrowth: 0.75 };
      default: return { economicStability: 0.75, cryptoGrowth: 0.8 };
    }
  }

  private calculateMobileMoneyCorrelation(data: TrendDataPoint[], request: TrendAnalysisRequest): number {
    // Simplified correlation calculation
    switch (request.region) {
      case 'KE': return 0.85; // High M-Pesa correlation
      case 'NG': return 0.75; // Multiple mobile money systems
      case 'GH': return 0.7;
      case 'ZA': return 0.6;
      case 'ET': return 0.65;
      default: return 0.7;
    }
  }

  private calculateMobileMoneyImpact(request: TrendAnalysisRequest): { strength: string; direction: string } {
    const correlation = this.calculateMobileMoneyCorrelation([], request);
    return {
      strength: correlation > 0.8 ? 'high' : correlation > 0.6 ? 'medium' : 'low',
      direction: 'positive'
    };
  }

  private estimateCrossBorderFlows(request: TrendAnalysisRequest): { volume: string; trend: string } {
    return {
      volume: request.region === 'NG' ? 'high' : request.region === 'KE' ? 'medium' : 'low',
      trend: 'increasing'
    };
  }

  private assessRegulatoryEnvironment(region?: string): { sentiment: string; impact: string } {
    switch (region) {
      case 'NG':
        return { sentiment: 'cautious', impact: 'stabilize' };
      case 'KE':
        return { sentiment: 'supportive', impact: 'enhance' };
      case 'ZA':
        return { sentiment: 'progressive', impact: 'support' };
      case 'GH':
        return { sentiment: 'developing', impact: 'stabilize' };
      case 'ET':
        return { sentiment: 'restrictive', impact: 'limit' };
      default:
        return { sentiment: 'mixed', impact: 'stabilize' };
    }
  }

  private getAdoptionMetrics(region?: string): { rate: number; growth: number } {
    switch (region) {
      case 'NG': return { rate: 0.18, growth: 0.12 };
      case 'KE': return { rate: 0.15, growth: 0.10 };
      case 'ZA': return { rate: 0.12, growth: 0.08 };
      case 'GH': return { rate: 0.10, growth: 0.09 };
      case 'ET': return { rate: 0.08, growth: 0.07 };
      default: return { rate: 0.12, growth: 0.09 };
    }
  }

  private getRegionalAdoptionRate(region?: string): number {
    return this.getAdoptionMetrics(region).rate;
  }

  private calculateOverallAccuracy(request: TrendAnalysisRequest): number {
    const suitableModels = this.predictionModels.filter(model => 
      this.isModelSuitableForTimeframe(model, request.timeRange)
    );
    
    if (suitableModels.length === 0) return 0.5;
    
    const totalAccuracy = suitableModels.reduce((sum, model) => sum + model.accuracy, 0);
    return totalAccuracy / suitableModels.length;
  }

  private generateCacheKey(request: TrendAnalysisRequest): string {
    return `trend:${request.dataType}:${request.symbol || 'market'}:${request.timeRange}:${request.region || 'all'}:${Date.now() - (Date.now() % (5 * 60 * 1000))}`; // 5-minute cache buckets
  }

  // Public methods
  async getMarketTrend(symbol: string, timeRange: string = '24h', region?: string): Promise<TrendAnalysisResult> {
    const request: TrendAnalysisRequest = {
      dataType: 'price',
      symbol,
      timeRange: timeRange as TrendAnalysisRequest['timeRange'],
      region: region as TrendAnalysisRequest['region'],
      includeAfricanContext: true
    };
    
    return this.analyzeTrend(request);
  }

  async getNewsTrend(timeRange: string = '24h', region?: string): Promise<TrendAnalysisResult> {
    const request: TrendAnalysisRequest = {
      dataType: 'news',
      timeRange: timeRange as TrendAnalysisRequest['timeRange'],
      region: region as TrendAnalysisRequest['region'],
      includeAfricanContext: true
    };
    
    return this.analyzeTrend(request);
  }

  async getSocialTrend(timeRange: string = '24h', region?: string): Promise<TrendAnalysisResult> {
    const request: TrendAnalysisRequest = {
      dataType: 'social',
      timeRange: timeRange as TrendAnalysisRequest['timeRange'],
      region: region as TrendAnalysisRequest['region'],
      includeAfricanContext: true
    };
    
    return this.analyzeTrend(request);
  }

  // Public method to get trend statistics
  getTrendStats(): { cacheSize: number; modelCount: number; supportedRegions: string[] } {
    return {
      cacheSize: this.trendCache.size,
      modelCount: this.predictionModels.length,
      supportedRegions: ['NG', 'KE', 'ZA', 'GH', 'ET']
    };
  }
}

// Create singleton instance
export const trendAnalysisAgent = new TrendAnalysisAgent();
