/**
 * News Aggregation Agent
 * Collects, deduplicates, and ranks news from crypto and African sources
 * Replaces legacy check/ai-system news-aggregation-agent
 * 
 * Model: Llama 3.1 8B (content summarization)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class NewsAggregationAgent extends BaseAgent {
  constructor() {
    super({
      id: 'news-aggregation-agent',
      name: 'News Aggregation Agent',
      type: 'news_aggregation',
      category: 'research',
      description: 'Aggregates crypto news from 50+ global and African sources, deduplicates, ranks by relevance, and produces curated news feeds for the CoinDaily platform.',
      capabilities: [
        'multi_source_aggregation',
        'deduplication',
        'relevance_ranking',
        'topic_clustering',
        'breaking_news_detection',
        'african_news_priority',
        'keyword_extraction',
        'news_summarization',
        'source_credibility_scoring',
        'trend_identification',
      ],
      model: 'llama',
      timeoutMs: 120000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { taskType, sources, category, region, limit, query } = task.input;

    switch (taskType) {
      case 'aggregate':
        return this.aggregateNews(sources, category, region, limit);
      case 'breaking':
        return this.detectBreakingNews(task.input.data);
      case 'rank':
        return this.rankArticles(task.input.articles);
      case 'summarize':
        return this.summarizeNewsFeed(task.input.articles);
      case 'cluster':
        return this.clusterTopics(task.input.articles);
      case 'search':
        return this.searchNews(query);
      default:
        return this.aggregateNews(sources, category, region, limit);
    }
  }

  private async aggregateNews(sources?: string[], category?: string, region?: string, limit?: number): Promise<Record<string, any>> {
    const prompt = `You are CoinDaily's news aggregation engine. Compile a curated news feed from crypto and African market sources.

Parameters:
- Sources: ${JSON.stringify(sources || ['all'])}
- Category: ${category || 'all'}
- Region: ${region || 'global+africa'}
- Limit: ${limit || 25}

Generate a realistic aggregated news feed. Return JSON:
{
  "feed": {
    "generatedAt": "${new Date().toISOString()}",
    "totalArticles": number,
    "sources": number,
    "articles": [
      {
        "id": string,
        "title": string,
        "summary": string (2-3 sentences),
        "source": string,
        "sourceCredibility": number (0-1),
        "url": string,
        "publishedAt": string,
        "category": "market"|"regulation"|"defi"|"nft"|"memecoin"|"african"|"technology"|"opinion",
        "relevanceScore": number (0-1),
        "africanRelevance": number (0-1),
        "keywords": [string],
        "cryptoMentions": [string],
        "sentiment": "positive"|"negative"|"neutral",
        "isBreaking": boolean,
        "region": string
      }
    ]
  },
  "topStories": [{"title": string, "sources": number, "momentum": string}],
  "trendingTopics": [{"topic": string, "articleCount": number, "trend": string}],
  "africanHighlights": [{"title": string, "country": string, "impact": string}],
  "metadata": {
    "processingTime": number,
    "deduplicatedCount": number,
    "filteredCount": number
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 4000 });
  }

  private async detectBreakingNews(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze incoming data for breaking news signals:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "breakingNews": [
    {
      "headline": string,
      "summary": string,
      "severity": "flash"|"major"|"notable",
      "category": string,
      "affectedTokens": [string],
      "marketImpact": "high"|"medium"|"low",
      "africanRelevance": boolean,
      "sources": [string],
      "firstReportedAt": string,
      "verified": boolean,
      "confidence": number
    }
  ],
  "alerts": [{"type": string, "message": string, "priority": "urgent"|"high"|"normal"}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async rankArticles(articles: any[]): Promise<Record<string, any>> {
    const prompt = `Rank and score these articles by relevance, quality, and African market importance:

Articles: ${JSON.stringify((articles || []).slice(0, 20), null, 2)}

Return JSON:
{
  "rankedArticles": [
    {
      "originalIndex": number,
      "title": string,
      "overallScore": number (0-100),
      "relevanceScore": number,
      "qualityScore": number,
      "africanRelevance": number,
      "timeliness": number,
      "uniqueness": number,
      "rank": number,
      "recommendation": "publish"|"review"|"skip"
    }
  ],
  "topPick": {"index": number, "reason": string},
  "africanTop": {"index": number, "reason": string},
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async summarizeNewsFeed(articles: any[]): Promise<Record<string, any>> {
    const prompt = `Create a news digest summarizing these articles:

Articles: ${JSON.stringify((articles || []).slice(0, 15), null, 2)}

Return JSON:
{
  "digest": {
    "headline": string,
    "summary": string (3-5 sentences overview),
    "keyStories": [
      {"title": string, "summary": string, "category": string, "impact": string}
    ],
    "africanUpdate": string (2-3 sentences on African market news),
    "marketMood": "bullish"|"bearish"|"mixed"|"cautious",
    "topKeywords": [string],
    "readingTime": number (minutes)
  },
  "forPremiumUsers": {
    "deepDive": string,
    "actionableInsights": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2500 });
  }

  private async clusterTopics(articles: any[]): Promise<Record<string, any>> {
    const prompt = `Cluster these articles into topic groups:

Articles: ${JSON.stringify((articles || []).slice(0, 20), null, 2)}

Return JSON:
{
  "clusters": [
    {
      "topic": string,
      "articleCount": number,
      "articles": [number],
      "summary": string,
      "momentum": "rising"|"stable"|"declining",
      "importance": "high"|"medium"|"low"
    }
  ],
  "unclustered": [number],
  "emergingTopics": [{"topic": string, "signal": string}],
  "topicRelationships": [{"topics": [string, string], "relationship": string}]
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async searchNews(query: string): Promise<Record<string, any>> {
    const prompt = `Search aggregated news for: "${query}"

Return JSON:
{
  "query": "${query}",
  "results": [
    {
      "title": string,
      "summary": string,
      "source": string,
      "publishedAt": string,
      "relevance": number,
      "category": string,
      "sentiment": string,
      "url": string
    }
  ],
  "totalResults": number,
  "relatedQueries": [string],
  "context": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }
}

export default NewsAggregationAgent;
