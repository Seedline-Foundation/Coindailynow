// AI-Enhanced Twitter Integration - Combining AI analysis with existing Twitter automation
// This shows how the AI system integrates with your existing social media distribution

import { TwitterAutomation } from '@/distribution/social/twitter-automation';
import { aiOrchestrator } from '../orchestrator/central-ai-orchestrator-simple';

export interface AIEnhancedArticleData {
  id: string;
  title: string;
  summary: string;
  slug: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  content: string;
}

export interface EnhancedTweetResult {
  success: boolean;
  tweetId?: string;
  marketAnalysis?: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    shouldBoost: boolean;
  };
  aiProcessingTime: number;
  twitterProcessingTime: number;
  error?: string;
}

export class AIEnhancedTwitterAutomation {
  private twitterAutomation: TwitterAutomation;

  constructor() {
    this.twitterAutomation = new TwitterAutomation();
  }

  // Enhanced article posting with AI market analysis
  async postArticleWithAI(article: AIEnhancedArticleData): Promise<EnhancedTweetResult> {
    let aiProcessingTime = 0;
    let twitterProcessingTime = 0;

    try {
      // Step 1: AI Market Analysis (if crypto-related)
      let marketAnalysis;
      const cryptoSymbols = this.extractCryptoSymbols(article);
      
      if (cryptoSymbols.length > 0) {
        console.log(`🤖 Analyzing market sentiment for: ${cryptoSymbols.join(', ')}`);
        
        const aiStartTime = Date.now();
        
        const analysisResult = await aiOrchestrator.executeTask({
          type: 'analysis.sentiment',
          priority: article.category === 'breaking' ? 'critical' : 'high',
          payload: {
            symbols: cryptoSymbols.slice(0, 5), // Limit for speed
            analysisType: 'sentiment',
            timeframe: '1h',
            includeAfricanMarkets: true
          },
          metadata: {
            articleId: article.id,
            requestedAt: new Date(),
            source: 'enhanced_twitter_automation'
          }
        });

        aiProcessingTime = Date.now() - aiStartTime;

        if (analysisResult.success && analysisResult.result) {
          const analysisData = analysisResult.result as {
            data?: {
              marketOverview?: { fearGreedIndex?: number };
              predictions?: { confidence?: number };
            };
          };

          const fearGreedIndex = analysisData.data?.marketOverview?.fearGreedIndex || 50;
          const confidence = analysisData.data?.predictions?.confidence || 0.5;

          marketAnalysis = {
            sentiment: fearGreedIndex > 60 ? 'bullish' as const : fearGreedIndex < 40 ? 'bearish' as const : 'neutral' as const,
            confidence,
            shouldBoost: confidence > 0.7 && fearGreedIndex > 50
          };

          console.log(`📊 Market Analysis: ${marketAnalysis.sentiment} (${(confidence * 100).toFixed(1)}% confidence)`);
        }
      }

      // Step 2: Enhance tweet content based on AI analysis
      const enhancedArticle = this.enhanceArticleForTweet(article, marketAnalysis);

      // Step 3: Post to Twitter using existing automation
      console.log('🐦 Posting to Twitter...');
      const twitterStartTime = Date.now();
      
      const twitterResult = await this.twitterAutomation.postArticle(enhancedArticle);
      
      twitterProcessingTime = Date.now() - twitterStartTime;

      if (twitterResult.success) {
        console.log(`✅ Tweet posted successfully: ${twitterResult.tweetId}`);
        
        // Log enhanced posting result
        if (marketAnalysis?.shouldBoost) {
          console.log('🚀 Tweet marked for potential boosting based on positive market sentiment');
        }
      }

      return {
        success: twitterResult.success,
        tweetId: twitterResult.tweetId,
        marketAnalysis,
        aiProcessingTime,
        twitterProcessingTime,
        error: twitterResult.error
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ AI-enhanced Twitter posting failed:', errorMessage);

      return {
        success: false,
        aiProcessingTime,
        twitterProcessingTime,
        error: errorMessage
      };
    }
  }

  // Batch posting with AI analysis for multiple articles
  async postArticleBatch(articles: AIEnhancedArticleData[]): Promise<EnhancedTweetResult[]> {
    console.log(`🔄 Processing batch of ${articles.length} articles with AI enhancement...`);

    const results: EnhancedTweetResult[] = [];

    // Process in smaller batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(article => this.postArticleWithAI(article))
      );
      
      results.push(...batchResults);
      
      // Brief pause between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const avgAITime = results.reduce((sum, r) => sum + r.aiProcessingTime, 0) / results.length;
    const avgTwitterTime = results.reduce((sum, r) => sum + r.twitterProcessingTime, 0) / results.length;

    console.log(`✅ Batch completed: ${successful}/${articles.length} successful`);
    console.log(`📊 Average AI processing: ${Math.round(avgAITime)}ms`);
    console.log(`🐦 Average Twitter posting: ${Math.round(avgTwitterTime)}ms`);

    return results;
  }

  // Check if a breaking news article should be posted immediately based on market conditions
  async shouldPostBreakingNews(article: AIEnhancedArticleData): Promise<{
    shouldPost: boolean;
    reason: string;
    marketSentiment?: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  }> {
    const cryptoSymbols = this.extractCryptoSymbols(article);
    
    if (cryptoSymbols.length === 0) {
      return {
        shouldPost: true,
        reason: 'Non-crypto news - post immediately',
        confidence: 1.0
      };
    }

    try {
      const analysisResult = await aiOrchestrator.executeTask({
        type: 'analysis.market',
        priority: 'critical',
        payload: {
          symbols: cryptoSymbols.slice(0, 3), // Limit for speed
          analysisType: 'sentiment',
          timeframe: '1h'
        },
        metadata: {
          articleId: article.id,
          requestedAt: new Date(),
          source: 'breaking_news_filter'
        }
      });

      if (analysisResult.success && analysisResult.result) {
        const analysisData = analysisResult.result as {
          data?: {
            marketOverview?: { fearGreedIndex?: number };
            predictions?: { confidence?: number };
          };
        };

        const fearGreedIndex = analysisData.data?.marketOverview?.fearGreedIndex || 50;
        const confidence = analysisData.data?.predictions?.confidence || 0.5;
        
        const sentiment = fearGreedIndex > 60 ? 'bullish' : fearGreedIndex < 40 ? 'bearish' : 'neutral';

        // Breaking news should always be posted, but we provide context
        return {
          shouldPost: true,
          reason: `Market sentiment: ${sentiment} (${(confidence * 100).toFixed(1)}% confidence)`,
          marketSentiment: sentiment,
          confidence
        };
      }

      return {
        shouldPost: true,
        reason: 'Market analysis unavailable - post immediately',
        confidence: 0.5
      };

    } catch (error) {
      console.error('Market analysis failed for breaking news:', error);
      return {
        shouldPost: true,
        reason: 'Analysis failed - post immediately to avoid delays',
        confidence: 0
      };
    }
  }

  // Get AI system health for monitoring
  async getSystemHealth(): Promise<{
    aiSystem: { status: string; details: Record<string, unknown> };
    twitterIntegration: boolean;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  }> {
    try {
      const aiHealth = await aiOrchestrator.healthCheck();
      const twitterIntegration = this.twitterAutomation !== null;

      let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
      
      if (aiHealth.status === 'critical' || !twitterIntegration) {
        overallHealth = 'critical';
      } else if (aiHealth.status === 'degraded') {
        overallHealth = 'degraded';
      }

      return {
        aiSystem: aiHealth,
        twitterIntegration,
        overallHealth
      };

    } catch (error) {
      return {
        aiSystem: { status: 'error', details: error },
        twitterIntegration: false,
        overallHealth: 'critical'
      };
    }
  }

  // Private helper methods
  private extractCryptoSymbols(article: AIEnhancedArticleData): string[] {
    const cryptoKeywords = ['BTC', 'ETH', 'DOGE', 'SHIB', 'ADA', 'SOL', 'MATIC', 'AVAX', 'DOT', 'LINK'];
    const symbols = new Set<string>();

    // Extract from tags
    article.tags.forEach(tag => {
      const upperTag = tag.toUpperCase();
      if (cryptoKeywords.includes(upperTag)) {
        symbols.add(upperTag);
      }
    });

    // Extract from title and content
    const content = `${article.title} ${article.content}`.toUpperCase();
    cryptoKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        symbols.add(keyword);
      }
    });

    return Array.from(symbols);
  }

  private enhanceArticleForTweet(
    article: AIEnhancedArticleData, 
    marketAnalysis?: { sentiment: 'bullish' | 'bearish' | 'neutral'; confidence: number; shouldBoost: boolean }
  ): {
    id: string;
    title: string;
    summary: string;
    slug: string;
    category: string;
    tags: string[];
    imageUrl?: string;
    aiEnhanced: boolean;
    marketSentiment?: string;
  } {
    // Convert to format expected by TwitterAutomation
    const baseArticle = {
      id: article.id,
      title: article.title,
      summary: article.summary,
      slug: article.slug,
      category: article.category,
      tags: article.tags,
      imageUrl: article.imageUrl
    };

    // Enhance title based on market sentiment
    if (marketAnalysis && marketAnalysis.confidence > 0.7) {
      const sentimentEmoji = {
        bullish: '🚀',
        bearish: '📉',
        neutral: '📊'
      };

      baseArticle.title = `${sentimentEmoji[marketAnalysis.sentiment]} ${baseArticle.title}`;
      
      // Add market sentiment to tags for better hashtag generation
      baseArticle.tags.push(marketAnalysis.sentiment);
    }

    return {
      ...baseArticle,
      aiEnhanced: true,
      marketSentiment: marketAnalysis?.sentiment
    };
  }
}

// Usage examples
export const examples = {
  // Basic AI-enhanced posting
  basic: async () => {
    const enhancedTwitter = new AIEnhancedTwitterAutomation();
    
    const article: AIEnhancedArticleData = {
      id: 'btc-surge-123',
      title: 'Bitcoin Reaches New All-Time High',
      summary: 'Bitcoin surged past $100,000 in African markets...',
      slug: 'bitcoin-ath-africa',
      category: 'market',
      tags: ['BTC', 'bitcoin', 'africa', 'ath'],
      imageUrl: 'https://example.com/btc-chart.jpg',
      content: 'Full article content here...'
    };

    const result = await enhancedTwitter.postArticleWithAI(article);
    console.log('Posting result:', result);
  },

  // Breaking news check
  breakingNews: async () => {
    const enhancedTwitter = new AIEnhancedTwitterAutomation();
    
    const breakingArticle: AIEnhancedArticleData = {
      id: 'breaking-123',
      title: 'BREAKING: Major Exchange Announces African Expansion',
      summary: 'Leading crypto exchange expanding to 10 African countries...',
      slug: 'exchange-africa-expansion',
      category: 'breaking',
      tags: ['exchange', 'africa', 'expansion'],
      content: 'Breaking news content...'
    };

    const decision = await enhancedTwitter.shouldPostBreakingNews(breakingArticle);
    console.log('Breaking news decision:', decision);

    if (decision.shouldPost) {
      const result = await enhancedTwitter.postArticleWithAI(breakingArticle);
      console.log('Posted breaking news:', result);
    }
  },

  // Health monitoring
  healthCheck: async () => {
    const enhancedTwitter = new AIEnhancedTwitterAutomation();
    const health = await enhancedTwitter.getSystemHealth();
    console.log('System health:', health);
  }
};
