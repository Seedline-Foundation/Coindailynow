/**
 * Research Agent Wrapper for Review Agent Integration
 * Combines existing agents (NewsAggregation, TrendAnalysis, CryptoResearch)
 * to produce ResearchOutcome for Review Agent
 */

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { ResearchOutcome, Source } from '../../types/admin-types';

export interface TrendingTopic {
  keyword: string;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'breaking';
  sources: Array<{
    url: string;
    title: string;
    publishedAt: Date;
    domain: string;
  }>;
}

export class ResearchAgent {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {}

  /**
   * Fetch trending topics from various sources (Twitter, Reddit, News APIs)
   * Returns research outcome ready for Review Agent validation
   */
  async fetchTrendingTopics(): Promise<ResearchOutcome> {
    this.logger.info('[ResearchAgent] Fetching trending topics from news API...');

    const apiBase = process.env.BACKEND_API_URL || process.env.API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${apiBase}/api/news?limit=8&region=africa`);
      if (res.ok) {
        const json = (await res.json()) as { articles?: any[]; data?: any[] };
        const articles = json.articles || json.data || [];
        if (articles.length > 0) {
          const top = articles[0];
          const sources: Source[] = articles.slice(0, 6).map((a: any) => ({
            url: a.url || a.link || `https://coindaily.online/news/${a.id || 'item'}`,
            title: a.title || 'Untitled',
            published_at: new Date(a.publishedAt || a.published_at || Date.now()),
            credibility_score: Math.min(99, 70 + (a.sourceCredibility || 0) * 30),
            domain: (a.source || a.sourceName || 'coindaily').toString(),
          }));

          const topic = top.title || 'African crypto markets update';
          const facts = articles.slice(0, 5).map(
            (a: any) => `${a.source || 'Source'}: ${(a.summary || a.title || '').slice(0, 200)}`,
          );
          const coreMessage =
            top.summary ||
            top.description ||
            `Breaking coverage: ${topic}`;

          return {
            id: `research_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            topic,
            sources,
            facts,
            core_message: coreMessage,
            word_count: 1200,
            sentiment: 'neutral',
            urgency: top.urgency === 'breaking' ? 'breaking' : 'high',
            trending_score: Math.min(99, 60 + articles.length * 4),
            timestamp: new Date(),
            raw_data: { source: 'backend_news_api', article_count: articles.length },
          };
        }
      }
    } catch (err: any) {
      this.logger.warn('[ResearchAgent] News API fallback', { error: err.message });
    }

    const { NewsAggregationAgent } = await import('./NewsAggregationAgent');
    const aggregator = new NewsAggregationAgent();
    const aggTask = await aggregator.execute(
      { taskType: 'aggregate', region: 'africa', limit: 8 },
      'normal',
    );

    const feedArticles = (aggTask as any)?.output?.feed?.articles || [];
    const topic = feedArticles[0]?.title || 'African crypto market developments';
    const sources: Source[] = feedArticles.slice(0, 5).map((a: any) => ({
      url: a.url || '#',
      title: a.title,
      published_at: new Date(a.publishedAt || Date.now()),
      credibility_score: Math.round((a.sourceCredibility || 0.8) * 100),
      domain: a.source || 'aggregated',
    }));

    return {
      id: `research_${Date.now()}`,
      topic,
      sources,
      facts: feedArticles.slice(0, 4).map((a: any) => a.summary || a.title),
      core_message: feedArticles[0]?.summary || topic,
      word_count: 1200,
      sentiment: 'neutral',
      urgency: 'medium',
      trending_score: 75,
      timestamp: new Date(),
      raw_data: { source: 'news_aggregation_agent' },
    };
  }

  /**
   * Re-research a topic (for edit requests from admin)
   */
  async reResearch(originalResearch: ResearchOutcome, instructions: string): Promise<ResearchOutcome> {
    this.logger.info('[ResearchAgent] Re-researching with instructions:', instructions);

    // TODO: Implement re-research logic based on edit instructions
    // For now, return updated research
    
    return {
      ...originalResearch,
      timestamp: new Date(),
      raw_data: {
        ...originalResearch.raw_data,
        edit_requested: true,
        edit_instructions: instructions
      }
    };
  }
}

export default ResearchAgent;
