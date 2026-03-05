/**
 * Sentiment Analysis Agent
 * Analyzes market sentiment from news, social media, and community data
 * Replaces legacy check/ai-system sentiment agent
 * 
 * Model: DeepSeek R1 8B (reasoning/analysis)
 * Capabilities: News sentiment, social media mining, sentiment scoring, trend detection
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class SentimentAnalysisAgent extends BaseAgent {
  constructor() {
    super({
      id: 'sentiment-analysis-agent',
      name: 'Sentiment Analysis Agent',
      type: 'sentiment_analysis',
      category: 'analysis',
      description: 'Analyzes market sentiment from news articles, social media posts, community discussions, and African crypto influencer activity. Produces sentiment scores and trend signals.',
      capabilities: [
        'news_sentiment_analysis',
        'social_media_mining',
        'influencer_tracking',
        'sentiment_scoring',
        'trend_detection',
        'african_market_sentiment',
        'community_mood_analysis',
        'real_time_alerts',
      ],
      model: 'deepseek',
      timeoutMs: 60000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { analysisType, data, context } = task.input;

    switch (analysisType) {
      case 'news_sentiment':
        return this.analyzeNewsSentiment(data);
      case 'social_sentiment':
        return this.analyzeSocialSentiment(data);
      case 'overall_market':
        return this.analyzeOverallMarket(data, context);
      case 'influencer_impact':
        return this.analyzeInfluencerImpact(data);
      case 'community_mood':
        return this.analyzeCommunityMood(data);
      default:
        return this.analyzeOverallMarket(data, context);
    }
  }

  private async analyzeNewsSentiment(articles: any[]): Promise<Record<string, any>> {
    const prompt = `You are a crypto market sentiment analyst specializing in African markets.

Analyze the following news articles and provide sentiment analysis:

${JSON.stringify(articles.slice(0, 10), null, 2)}

Return a JSON object with:
{
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": number (-1 to 1, where 1 is most bullish),
  "confidence": number (0-1),
  "keyThemes": [{"theme": string, "sentiment": string, "impact": "high"|"medium"|"low"}],
  "africanMarketImpact": {"score": number, "regions": [string], "notes": string},
  "alerts": [{"type": string, "message": string, "severity": "low"|"medium"|"high"}],
  "summary": string
}`;

    return this.callModelJSON(prompt, {
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompt: 'You are a professional crypto market sentiment analyst. Return only valid JSON.',
    });
  }

  private async analyzeSocialSentiment(posts: any[]): Promise<Record<string, any>> {
    const prompt = `Analyze social media sentiment for crypto markets, focusing on African crypto community:

Posts data: ${JSON.stringify(posts.slice(0, 20), null, 2)}

Return JSON:
{
  "platformBreakdown": {"twitter": number, "reddit": number, "telegram": number},
  "overallSentiment": "bullish"|"bearish"|"neutral",
  "sentimentScore": number (-1 to 1),
  "trendingTopics": [{"topic": string, "mentions": number, "sentiment": string}],
  "influencerSentiment": [{"name": string, "stance": string, "followers": number}],
  "memecoins": [{"name": string, "sentiment": string, "volume": number}],
  "africanCommunity": {"sentiment": string, "concerns": [string], "opportunities": [string]},
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async analyzeOverallMarket(data: any, context?: any): Promise<Record<string, any>> {
    const prompt = `Provide comprehensive crypto market sentiment analysis for African markets:

Market data: ${JSON.stringify(data || {}, null, 2)}
Context: ${JSON.stringify(context || {}, null, 2)}

Return JSON:
{
  "marketSentiment": "bullish"|"bearish"|"neutral"|"fear"|"greed",
  "fearGreedIndex": number (0-100),
  "sentimentScore": number (-1 to 1),
  "confidence": number (0-1),
  "signals": [{"signal": string, "type": "bullish"|"bearish"|"neutral", "strength": number}],
  "africanMarket": {
    "sentiment": string,
    "topExchanges": [{"name": string, "volume": string, "sentiment": string}],
    "mobileMoneyCorrelation": string,
    "regions": {"nigeria": string, "kenya": string, "south_africa": string, "ghana": string}
  },
  "recommendations": [string],
  "riskLevel": "low"|"medium"|"high"|"extreme",
  "summary": string,
  "timestamp": "${new Date().toISOString()}"
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 3000 });
  }

  private async analyzeInfluencerImpact(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze the impact of crypto influencers on African market sentiment:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "topInfluencers": [{"name": string, "platform": string, "reach": number, "sentiment": string, "impact": string}],
  "sentimentShift": number,
  "africanInfluencers": [{"name": string, "region": string, "impact": string}],
  "narratives": [{"narrative": string, "source": string, "spread": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async analyzeCommunityMood(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze crypto community mood across platforms with African market focus:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "overallMood": "euphoric"|"optimistic"|"neutral"|"anxious"|"fearful"|"panic",
  "moodScore": number (0-100),
  "communityBreakdown": [{"community": string, "mood": string, "activity": string}],
  "emergingConcerns": [string],
  "positiveSignals": [string],
  "africanCommunity": {"mood": string, "activeTopics": [string]},
  "prediction": string,
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }
}

export default SentimentAnalysisAgent;
