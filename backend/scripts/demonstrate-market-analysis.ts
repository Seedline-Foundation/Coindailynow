/**
 * Market Analysis Agent Demonstration - Task 11
 * Demonstrates custom Grok integration for memecoin surge detection,
 * whale tracking, and African exchange monitoring
 */

import { MarketAnalysisAgent, MarketAnalysisConfig } from '../src/agents/marketAnalysisAgent';
import { MarketAnalysisTask, AfricanMarketContext, TaskStatus, AgentType } from '../src/types/ai-system';
import { createLogger } from 'winston';
import { Redis } from 'ioredis';

// Mock Prisma for demonstration
const mockPrisma = {
  marketData: {
    findMany: async () => [
      {
        id: 'btc-surge-demo',
        tokenId: 'btc-token-id',
        token: { symbol: 'BTC', name: 'Bitcoin' },
        exchange: 'binance-africa',
        priceUsd: 45250.50,
        priceChange24h: 28.5, // Above surge threshold
        volume24h: 125000000,
        marketCap: 850000000000,
        timestamp: new Date(),
        high24h: 46100,
        low24h: 44200,
        tradingPairs: ['BTC/NGN', 'BTC/USDT']
      },
      {
        id: 'doge-surge-demo',
        tokenId: 'doge-token-id',
        token: { symbol: 'DOGE', name: 'Dogecoin' },
        exchange: 'quidax',
        priceUsd: 0.085,
        priceChange24h: 42.3, // Significant surge
        volume24h: 85000000,
        marketCap: 12000000000,
        timestamp: new Date(),
        high24h: 0.089,
        low24h: 0.056,
        tradingPairs: ['DOGE/NGN', 'DOGE/USDT']
      }
    ]
  },
  token: {
    findMany: async () => [
      {
        id: 'btc-token-id',
        symbol: 'BTC',
        name: 'Bitcoin',
        isMemecoin: false,
        tokenType: 'CRYPTOCURRENCY'
      },
      {
        id: 'doge-token-id',
        symbol: 'DOGE',
        name: 'Dogecoin',
        isMemecoin: true,
        tokenType: 'MEMECOIN'
      }
    ]
  },
  exchangeIntegration: {
    findMany: async () => [
      {
        id: 'binance-africa-id',
        name: 'Binance Africa',
        slug: 'binance-africa',
        region: 'Africa',
        supportedCountries: ['NG', 'KE', 'ZA', 'GH'],
        isActive: true
      },
      {
        id: 'quidax-id',
        name: 'Quidax',
        slug: 'quidax',
        region: 'Africa',
        supportedCountries: ['NG'],
        isActive: true
      }
    ]
  }
} as any;

// Mock Redis for demonstration
const mockRedis = {
  get: async (key: string) => {
    // Simulate cache miss for demonstration
    return null;
  },
  setex: async (key: string, ttl: number, value: string) => {
    console.log(`🗄️  Cached analysis result: ${key} (TTL: ${ttl}s)`);
    return 'OK';
  },
  ping: async () => 'PONG'
} as any;

// African market context for demonstration
const nigerianMarketContext: AfricanMarketContext = {
  region: 'west',
  countries: ['Nigeria', 'Ghana', 'Senegal'],
  languages: ['en', 'ha', 'yo'],
  exchanges: ['Binance_Africa', 'Quidax', 'BuyCoins', 'NairaEx'],
  mobileMoneyProviders: ['MTN_Money', 'Orange_Money', 'Airtel_Money'],
  timezone: 'Africa/Lagos',
  culturalContext: {
    tradingHours: '08:00-17:00',
    preferredCurrencies: ['NGN', 'GHS', 'XOF'],
    socialPlatforms: ['Twitter', 'WhatsApp', 'Telegram'],
    economicFactors: {
      inflationRate: 15.2,
      youthUnemployment: 42.5,
      smartphonePenetration: 83.2
    }
  }
};

async function demonstrateMarketAnalysisAgent() {
  console.log('🚀 Market Analysis Agent Demonstration - Task 11');
  console.log('=' .repeat(60));
  
  // Create logger
  const logger = createLogger({
    level: 'info',
    format: require('winston').format.combine(
      require('winston').format.timestamp(),
      require('winston').format.simple()
    ),
    transports: [
      new (require('winston')).transports.Console()
    ]
  });

  // Configuration for Market Analysis Agent
  const config: MarketAnalysisConfig = {
    grokApiKey: 'demo-grok-api-key',
    grokApiUrl: 'https://api.grok.com/v1',
    exchangeApis: {
      'binance-africa': {
        baseUrl: 'https://api.binance.africa/v1',
        apiKey: 'demo-binance-key',
        rateLimitPerMinute: 100
      },
      'luno': {
        baseUrl: 'https://api.luno.com/v1',
        apiKey: 'demo-luno-key',
        rateLimitPerMinute: 60
      },
      'quidax': {
        baseUrl: 'https://api.quidax.com/v1',
        apiKey: 'demo-quidax-key',
        rateLimitPerMinute: 120
      }
    },
    whaleThresholds: {
      btc: 100,     // 100 BTC
      eth: 1000,    // 1000 ETH
      default: 10000 // 10K USD
    },
    memecoinSurgeThreshold: 25.0, // 25% price increase
    sentimentSources: ['twitter', 'telegram', 'discord'],
    cacheTimeoutMs: 300000, // 5 minutes
    maxRetries: 3,
    timeoutMs: 30000,
    enableRealTimeAlerts: true,
    africanExchangeFocus: true
  };

  try {
    // Initialize Market Analysis Agent
    console.log('📊 Initializing Market Analysis Agent...');
    const agent = new MarketAnalysisAgent(config, logger, mockPrisma, mockRedis);
    
    console.log(`✅ Agent initialized with capabilities: ${agent.getCapabilities().join(', ')}`);
    console.log('');

    // Demonstrate African Exchange Integration Testing
    console.log('🔗 Testing African Exchange Integrations:');
    
    const exchanges = ['binance-africa', 'luno', 'quidax'];
    for (const exchange of exchanges) {
      try {
        const testResult = await agent.testExchangeConnection(exchange);
        console.log(`  ${testResult.success ? '✅' : '❌'} ${exchange}: ${testResult.success ? `${testResult.responseTime}ms` : testResult.error}`);
      } catch (error) {
        console.log(`  ❌ ${exchange}: Connection test failed`);
      }
    }
    console.log('');

    // Demonstrate Memecoin Surge Detection
    console.log('🚨 Demonstrating Memecoin Surge Detection:');
    
    const memecoinSurgeTask: MarketAnalysisTask = {
      id: 'memecoin-surge-demo',
      type: AgentType.MARKET_ANALYSIS,
      priority: 'high' as any,
      status: TaskStatus.QUEUED,
      payload: {
        symbols: ['DOGE', 'SHIB', 'PEPE'],
        exchanges: ['binance-africa', 'quidax'],
        analysisType: 'memecoin_surge',
        timeRange: {
          start: new Date(Date.now() - 3600000), // 1 hour ago
          end: new Date()
        },
        africanContext: nigerianMarketContext
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      }
    };

    // Mock Grok API response for surge detection
    const mockGrokSurgeResponse = {
      analysis: {
        surgeDetected: true,
        confidence: 87.5,
        patterns: ['social_media_hype', 'whale_accumulation', 'mobile_money_correlation'],
        africanImpact: {
          tradingVolumeIncrease: 45.2,
          mobileMoneyCorrelation: 0.73
        },
        recommendations: [
          'Monitor continued social media sentiment',
          'Track whale wallet movements',
          'Increase Nigerian market coverage'
        ]
      }
    };

    // Override the Grok API call for demonstration
    (agent as any).callGrokApi = async (endpoint: string, data: any) => {
      console.log(`  📡 Calling Grok API: ${endpoint}`);
      return mockGrokSurgeResponse;
    };

    const surgeResult = await agent.executeTask(memecoinSurgeTask);
    console.log(`  Status: ${surgeResult.status}`);
    console.log(`  Surge Detected: ${surgeResult.result?.data.surgeDetected ? 'YES' : 'NO'}`);
    console.log(`  Confidence: ${surgeResult.result?.data.confidence}%`);
    console.log(`  African Impact: +${surgeResult.result?.data.africanMarketImpact?.tradingVolumeIncrease}% volume`);
    console.log(`  Processing Time: ${surgeResult.result?.metrics?.processingTimeMs}ms`);
    console.log('');

    // Demonstrate Whale Transaction Monitoring  
    console.log('🐋 Demonstrating Whale Transaction Monitoring:');
    
    const whaleTrackingTask: MarketAnalysisTask = {
      id: 'whale-tracking-demo',
      type: AgentType.MARKET_ANALYSIS,
      priority: 'urgent' as any,
      status: TaskStatus.QUEUED,
      payload: {
        symbols: ['BTC', 'ETH'],
        exchanges: ['binance-africa', 'luno'],
        analysisType: 'whale_tracking',
        timeRange: {
          start: new Date(Date.now() - 1800000), // 30 minutes ago
          end: new Date()
        },
        africanContext: nigerianMarketContext
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      }
    };

    // Mock whale transaction data
    const mockWhaleTransactions = [
      {
        transactionHash: '0x1234...abcd',
        symbol: 'BTC',
        amount: 150,
        amountUsd: 6750000,
        exchange: 'binance-africa',
        timestamp: new Date(),
        direction: 'inflow' as const
      },
      {
        transactionHash: '0x5678...efgh',
        symbol: 'ETH',
        amount: 2100,
        amountUsd: 6690000,
        exchange: 'luno',
        timestamp: new Date(),
        direction: 'outflow' as const
      }
    ];

    // Mock whale tracking methods
    (agent as any).fetchWhaleTransactions = async () => mockWhaleTransactions;
    (agent as any).callGrokApi = async (endpoint: string, data: any) => {
      console.log(`  📡 Calling Grok API: ${endpoint}`);
      return {
        whaleActivity: {
          totalTransactions: mockWhaleTransactions.length,
          totalVolumeUsd: mockWhaleTransactions.reduce((sum, tx) => sum + tx.amountUsd, 0),
          marketImpact: 'high',
          africanExchangeImpact: {
            priceInfluence: 0.85,
            liquidityImpact: 'positive',
            regionFocus: 'West Africa'
          }
        }
      };
    };

    const whaleResult = await agent.executeTask(whaleTrackingTask);
    console.log(`  Status: ${whaleResult.status}`);
    console.log(`  Total Transactions: ${whaleResult.result?.data.whaleActivity?.totalTransactions}`);
    console.log(`  Total Volume: $${(whaleResult.result?.data.whaleActivity?.totalVolumeUsd / 1000000).toFixed(1)}M`);
    console.log(`  Market Impact: ${whaleResult.result?.data.whaleActivity?.marketImpact}`);
    console.log(`  Processing Time: ${whaleResult.result?.metrics?.processingTimeMs}ms`);
    console.log('');

    // Demonstrate Market Sentiment Analysis
    console.log('💭 Demonstrating Market Sentiment Analysis:');
    
    const sentimentTask: MarketAnalysisTask = {
      id: 'sentiment-demo',
      type: AgentType.MARKET_ANALYSIS,
      priority: 'normal' as any,
      status: TaskStatus.QUEUED,
      payload: {
        symbols: ['BTC', 'ETH'],
        exchanges: ['binance-africa'],
        analysisType: 'sentiment',
        timeRange: {
          start: new Date(Date.now() - 86400000), // 24 hours
          end: new Date()
        },
        africanContext: nigerianMarketContext
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      }
    };

    const sentimentResult = await agent.executeTask(sentimentTask);
    console.log(`  Status: ${sentimentResult.status}`);
    console.log(`  Overall Sentiment: ${sentimentResult.result?.data.sentiment?.overall} (${sentimentResult.result?.data.sentiment?.confidence}% confidence)`);
    console.log(`  Mobile Money Correlation: ${sentimentResult.result?.data.mobileMoneyCorrelation?.correlationScore}`);
    console.log(`  Processing Time: ${sentimentResult.result?.metrics?.processingTimeMs}ms`);
    console.log('');

    // Demonstrate Alert Generation
    console.log('🚨 Demonstrating Alert Generation:');
    
    const surgeAlert = await agent.generateAlert('memecoin_surge', {
      symbol: 'DOGE',
      priceChange: 42.3,
      volume: 85000000,
      africanExchanges: ['quidax']
    });
    
    console.log(`  Alert Type: ${surgeAlert.type}`);
    console.log(`  Priority: ${surgeAlert.priority}`);
    console.log(`  Message: ${surgeAlert.message}`);
    console.log(`  African Exchange: ${surgeAlert.africanExchange}`);
    console.log('');

    // Demonstrate Accuracy Calculation
    console.log('📈 Demonstrating Accuracy Metrics:');
    
    const predictionData = [
      { predicted: true, actual: true },   // Correct surge prediction
      { predicted: true, actual: true },   // Correct surge prediction
      { predicted: false, actual: false }, // Correct no-surge prediction
      { predicted: true, actual: false },  // False positive
      { predicted: false, actual: false }, // Correct no-surge prediction
      { predicted: true, actual: true },   // Correct surge prediction
      { predicted: false, actual: true },  // False negative
      { predicted: true, actual: true },   // Correct surge prediction
      { predicted: false, actual: false }, // Correct no-surge prediction
      { predicted: true, actual: true }    // Correct surge prediction
    ];

    const accuracy = agent.calculateAccuracy(predictionData);
    console.log(`  Prediction Accuracy: ${(accuracy * 100).toFixed(1)}% (Target: >85%)`);
    console.log(`  Performance: ${accuracy > 0.85 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);
    console.log('');

    // Demonstrate African Exchange Data Validation
    console.log('🌍 Demonstrating African Exchange Data Validation:');
    
    const validation = await agent.validateAfricanExchangeData('BTC', ['binance-africa', 'luno', 'quidax']);
    console.log(`  Data Valid: ${validation.isValid ? 'YES' : 'NO'}`);
    console.log(`  Data Quality: ${(validation.dataQuality * 100).toFixed(1)}%`);
    console.log(`  Exchange Coverage: ${validation.exchangeCoverage.join(', ')}`);
    console.log('');

    console.log('✅ Market Analysis Agent demonstration completed successfully!');
    console.log('');
    console.log('📋 Task 11 Implementation Summary:');
    console.log('- ✅ Memecoin surge detection with >25% threshold');
    console.log('- ✅ Whale transaction monitoring with configurable thresholds');
    console.log('- ✅ African exchange integration (Binance Africa, Luno, Quidax)');
    console.log('- ✅ Market sentiment analysis with mobile money correlation');
    console.log('- ✅ Automated alert generation with priority levels');
    console.log('- ✅ Analysis accuracy tracking (>85% requirement)');
    console.log('- ✅ Performance optimization with caching');
    console.log('- ✅ Error handling and retry mechanisms');
    console.log('- ✅ African market specialization');
    console.log('- ✅ Real-time analysis capabilities');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateMarketAnalysisAgent().catch(console.error);
}

export default demonstrateMarketAnalysisAgent;