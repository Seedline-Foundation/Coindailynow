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
   * Re-research a topic (for edit requests from admin).
   * Fetches fresh data from the backend news API, merges with original
   * research, deduplicates sources, and falls back to original on failure.
   */
  async reResearch(originalResearch: ResearchOutcome, instructions: string): Promise<ResearchOutcome> {
    this.logger.info('[ResearchAgent] Re-researching with instructions:', instructions);

    const apiBase = process.env.BACKEND_API_URL || process.env.API_URL || 'http://localhost:4000';

    try {
      const keyword = this.extractKeyword(instructions, originalResearch.topic);
      const queryParams = new URLSearchParams({
        limit: '10',
        region: 'africa',
        ...(keyword ? { q: keyword } : {}),
      });

      const res = await fetch(`${apiBase}/api/news?${queryParams}`);
      if (!res.ok) {
        this.logger.warn(`[ResearchAgent] Re-research API returned ${res.status}, falling back to original`);
        return this.fallbackReResearch(originalResearch, instructions);
      }

      const json = (await res.json()) as { articles?: any[]; data?: any[] };
      const freshArticles = json.articles || json.data || [];

      if (freshArticles.length === 0) {
        this.logger.warn('[ResearchAgent] Re-research returned no articles, falling back to original');
        return this.fallbackReResearch(originalResearch, instructions);
      }

      const freshSources: Source[] = freshArticles.slice(0, 8).map((a: any) => ({
        url: a.url || a.link || `https://coindaily.online/news/${a.id || 'item'}`,
        title: a.title || 'Untitled',
        published_at: new Date(a.publishedAt || a.published_at || Date.now()),
        credibility_score: Math.min(99, 70 + (a.sourceCredibility || 0) * 30),
        domain: (a.source || a.sourceName || 'coindaily').toString(),
      }));

      const mergedSources = this.deduplicateSources([...freshSources, ...originalResearch.sources]);

      const freshFacts = freshArticles.slice(0, 5).map(
        (a: any) => `${a.source || 'Source'}: ${(a.summary || a.title || '').slice(0, 200)}`,
      );
      const mergedFacts = this.deduplicateFacts([...freshFacts, ...originalResearch.facts]);

      const topFresh = freshArticles[0];
      const topic = topFresh.title || originalResearch.topic;
      const coreMessage =
        topFresh.summary || topFresh.description || originalResearch.core_message;

      return {
        id: `research_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        topic,
        sources: mergedSources,
        facts: mergedFacts,
        core_message: coreMessage,
        word_count: originalResearch.word_count,
        sentiment: originalResearch.sentiment,
        urgency: topFresh.urgency === 'breaking' ? 'breaking' : originalResearch.urgency,
        trending_score: Math.min(99, Math.max(originalResearch.trending_score, 60 + freshArticles.length * 4)),
        timestamp: new Date(),
        raw_data: {
          source: 'backend_news_api_reresearch',
          original_research_id: originalResearch.id,
          edit_instructions: instructions,
          fresh_article_count: freshArticles.length,
          merged_source_count: mergedSources.length,
        },
      };
    } catch (err: any) {
      this.logger.warn('[ResearchAgent] Re-research failed, falling back to original', { error: err.message });
      return this.fallbackReResearch(originalResearch, instructions);
    }
  }

  private fallbackReResearch(originalResearch: ResearchOutcome, instructions: string): ResearchOutcome {
    return {
      ...originalResearch,
      id: `research_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      raw_data: {
        ...originalResearch.raw_data,
        edit_requested: true,
        edit_instructions: instructions,
        fallback: true,
      },
    };
  }

  private extractKeyword(instructions: string, fallbackTopic: string): string {
    const lower = instructions.toLowerCase();
    const focusMatch = lower.match(/focus(?:\s+(?:on|more on))?\s+["']?([^"'.,:;!?]+)/);
    if (focusMatch) return focusMatch[1].trim();
    const aboutMatch = lower.match(/about\s+["']?([^"'.,:;!?]+)/);
    if (aboutMatch) return aboutMatch[1].trim();
    const topicWords = fallbackTopic.split(/\s+/).filter((w) => w.length > 3).slice(0, 3);
    return topicWords.join(' ');
  }

  private deduplicateSources(sources: Source[]): Source[] {
    const seen = new Map<string, Source>();
    for (const src of sources) {
      const key = src.url.replace(/\/+$/, '').toLowerCase();
      const existing = seen.get(key);
      if (!existing || src.credibility_score > existing.credibility_score) {
        seen.set(key, src);
      }
    }
    return Array.from(seen.values());
  }

  private deduplicateFacts(facts: string[]): string[] {
    const unique: string[] = [];
    const normalized = new Set<string>();
    for (const fact of facts) {
      const key = fact.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!normalized.has(key)) {
        normalized.add(key);
        unique.push(fact);
      }
    }
    return unique;
  }
}

export default ResearchAgent;
