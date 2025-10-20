// AI System Usage Examples - Phase 1 Implementation
// Demonstrates how to use the Central AI Orchestrator with Market Analysis

import { aiOrchestrator } from '../orchestrator/central-ai-orchestrator';
import { AITask } from '../types/ai-types';
import { MarketAnalysisAgent, MarketAnalysisRequest } from '../agents/analysis/market-analysis-agent';

// Example 1: Basic Market Analysis for News Article
export async function analyzeMarketForArticle(articleData: {
  title: string;
  content: string;
  tags: string[];
  category: string;
}): Promise<void> {
  console.log('🤖 Starting AI market analysis for article...');

  try {
    // Create market analysis task
    const analysisTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'analysis.market',
      priority: 'high',
      payload: {
        symbols: ['BTC', 'ETH', 'DOGE', 'SHIB'], // Extract from article tags
        analysisType: 'comprehensive',
        timeframe: '24h',
        includeAfricanMarkets: true,
        focusOn: articleData.category.includes('meme') ? 'memecoins' : 'all'
      } as MarketAnalysisRequest,
      metadata: {
        articleId: `article_${Date.now()}`,
        requestedAt: new Date(),
        source: 'content_pipeline',
        deadline: Date.now() + 10000 // 10 seconds deadline
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    // Execute through AI orchestrator
    const result = await aiOrchestrator.executeTask(analysisTask);

    if (result.success) {
      console.log('✅ Market analysis completed:', {
        taskId: result.taskId,
        processingTime: result.processingTime,
        agentUsed: result.agentUsed,
        cached: result.cached
      });

      // Use the analysis result to enhance article
      console.log('📊 Analysis data available for article enhancement');
    } else {
      console.error('❌ Market analysis failed:', result.error);
    }

  } catch (error) {
    console.error('🚨 AI system error:', error);
  }
}

// Example 2: Breaking News Market Sentiment Check
export async function checkMarketSentimentForBreakingNews(
  symbols: string[]
): Promise<{
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  shouldPublishImmediately: boolean;
}> {
  console.log('⚡ Checking market sentiment for breaking news...');

  try {
    const sentimentTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'analysis.sentiment',
      priority: 'critical', // Breaking news = critical priority
      payload: {
        symbols: symbols.slice(0, 5), // Limit for speed
        analysisType: 'sentiment',
        timeframe: '1h'
      } as MarketAnalysisRequest,
      metadata: {
        requestedAt: new Date(),
        source: 'breaking_news_pipeline',
        deadline: Date.now() + 5000 // 5 seconds for breaking news
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 2
    };

    const result = await aiOrchestrator.executeTask(sentimentTask);

    if (result.success && result.result) {
      const analysisData = result.result as {
        overall?: 'bullish' | 'bearish' | 'neutral';
        confidence?: number;
      };
      
      return {
        sentiment: analysisData.overall || 'neutral',
        confidence: analysisData.confidence || 0.5,
        shouldPublishImmediately: analysisData.confidence ? analysisData.confidence > 0.7 : false
      };
    }

    // Fallback for failed analysis
    return {
      sentiment: 'neutral',
      confidence: 0,
      shouldPublishImmediately: true // Don't block breaking news
    };

  } catch (error) {
    console.error('🚨 Sentiment analysis error:', error);
    return {
      sentiment: 'neutral',
      confidence: 0,
      shouldPublishImmediately: true
    };
  }
}

// Example 3: Daily Market Summary Generation
export async function generateDailyMarketSummary(): Promise<{
  summary: string;
  keyMetrics: Record<string, number>;
  processingTime: number;
}> {
  console.log('📈 Generating daily market summary...');

  try {
    const summaryTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'analysis.market',
      priority: 'medium',
      payload: {
        symbols: ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOGE', 'SHIB'],
        analysisType: 'comprehensive',
        timeframe: '24h',
        includeAfricanMarkets: true,
        focusOn: 'all'
      } as MarketAnalysisRequest,
      metadata: {
        requestedAt: new Date(),
        source: 'daily_summary_generator'
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    const result = await aiOrchestrator.executeTask(summaryTask);

    if (result.success && result.result) {
      const analysisData = result.result as {
        data?: {
          marketOverview?: {
            totalMarketCap?: number;
            btcDominance?: number;
            fearGreedIndex?: number;
            marketCapChange24h?: number;
          };
          predictions?: {
            shortTerm?: string;
          };
        };
      };
      
      return {
        summary: `Market showed ${analysisData.data?.predictions?.shortTerm || 'mixed'} sentiment with ${analysisData.data?.marketOverview?.marketCapChange24h || 0}% overall change`,
        keyMetrics: {
          totalMarketCap: analysisData.data?.marketOverview?.totalMarketCap || 0,
          btcDominance: analysisData.data?.marketOverview?.btcDominance || 45,
          fearGreedIndex: analysisData.data?.marketOverview?.fearGreedIndex || 50
        },
        processingTime: result.processingTime
      };
    }

    throw new Error('Analysis failed');

  } catch (error) {
    console.error('🚨 Daily summary generation error:', error);
    return {
      summary: 'Market analysis unavailable',
      keyMetrics: {},
      processingTime: 0
    };
  }
}

// Example 4: Batch Processing for Multiple Articles
export async function processArticleBatch(articles: Array<{
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
}>): Promise<void> {
  console.log(`🔄 Processing batch of ${articles.length} articles...`);

  try {
    // Create tasks for each article
    const tasks = articles.map(article => ({
      type: 'analysis.market' as const,
      priority: 'medium' as const,
      payload: {
        symbols: article.tags.filter(tag => 
          ['BTC', 'ETH', 'DOGE', 'SHIB', 'ADA', 'SOL'].includes(tag.toUpperCase())
        ),
        analysisType: 'trend',
        timeframe: '24h',
        includeAfricanMarkets: true
      } as MarketAnalysisRequest,
      metadata: {
        articleId: article.id,
        requestedAt: new Date(),
        source: 'batch_processor'
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    }));

    // Execute batch processing
    const results = await aiOrchestrator.executeBatch(tasks);
    
    const successful = results.filter(r => r.success).length;
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    console.log('✅ Batch processing completed:', {
      totalArticles: articles.length,
      successful,
      failed: articles.length - successful,
      averageProcessingTime: Math.round(avgProcessingTime),
      totalTime: Math.max(...results.map(r => r.processingTime))
    });

  } catch (error) {
    console.error('🚨 Batch processing error:', error);
  }
}

// Example 5: System Health Check
export async function checkAISystemHealth(): Promise<void> {
  console.log('🏥 Checking AI system health...');

  try {
    const health = await aiOrchestrator.healthCheck();
    const metrics = aiOrchestrator.getMetrics();

    console.log('📊 AI System Status:', {
      status: health.status,
      details: health.details,
      metrics: {
        totalTasksProcessed: metrics.totalTasksProcessed,
        successRate: `${(metrics.successRate * 100).toFixed(1)}%`,
        averageProcessingTime: `${metrics.averageProcessingTime}ms`,
        activeAgents: metrics.activeAgents,
        queueLength: metrics.queueLength
      }
    });

    if (health.status === 'critical') {
      console.error('🚨 AI system requires immediate attention!');
    } else if (health.status === 'degraded') {
      console.warn('⚠️ AI system performance is degraded');
    } else {
      console.log('✅ AI system is healthy');
    }

  } catch (error) {
    console.error('🚨 Health check failed:', error);
  }
}

// Example 6: Direct Market Analysis Agent Usage
export async function useMarketAnalysisAgentDirectly(): Promise<void> {
  console.log('🎯 Using Market Analysis Agent directly...');

  try {
    const agent = new MarketAnalysisAgent('direct_test_agent');
    await agent.initialize();

    // Quick sentiment check
    const sentiment = await agent.getMarketSentiment(['BTC', 'ETH', 'DOGE']);
    console.log('💭 Market Sentiment:', sentiment);

    // Trending memecoins
    const trending = await agent.getTrendingMemecoins();
    console.log('🚀 Trending Memecoins:', trending);

    // Full market analysis
    const analysis = await agent.analyzeMarket({
      symbols: ['BTC', 'ETH', 'DOGE', 'SHIB'],
      analysisType: 'comprehensive',
      timeframe: '24h',
      includeAfricanMarkets: true,
      focusOn: 'all'
    });

    console.log('📊 Full Analysis:', {
      success: analysis.success,
      processingTime: analysis.processingTime,
      marketOverview: analysis.data.marketOverview,
      predictions: analysis.data.predictions
    });

  } catch (error) {
    console.error('🚨 Direct agent usage error:', error);
  }
}

// Export all examples for easy testing
export const aiExamples = {
  analyzeMarketForArticle,
  checkMarketSentimentForBreakingNews,
  generateDailyMarketSummary,
  processArticleBatch,
  checkAISystemHealth,
  useMarketAnalysisAgentDirectly
};
