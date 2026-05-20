/**
 * Narrative Intelligence Engine
 * Layer 1 — Fast rule-based story decomposition.
 * Extracts topic, category, sentiment, entities, urgency, and symbolic archetypes
 * from headlines and article metadata WITHOUT requiring an LLM call.
 */

import {
  NarrativeAnalysis,
  StoryType,
  UrgencyLevel,
} from '../types';
import { detectStoryType } from '../visual-bible/storytypes';

// ─── Keyword Maps ────────────────────────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning network', 'halving'],
  ethereum: ['ethereum', 'eth', 'vitalik', 'erc-20', 'layer 2', 'rollup'],
  defi: ['defi', 'dex', 'amm', 'yield', 'liquidity', 'tvl', 'aave', 'uniswap', 'compound'],
  nft: ['nft', 'opensea', 'collectible', 'digital art', 'metaverse'],
  stablecoin: ['stablecoin', 'usdt', 'usdc', 'tether', 'dai', 'cbdc'],
  regulation: ['sec', 'regulation', 'compliance', 'ban', 'lawsuit', 'legal', 'court', 'judge', 'enforcement', 'license', 'cbdc', 'policy'],
  exchange: ['binance', 'coinbase', 'kraken', 'exchange', 'cex', 'listing', 'delist'],
  security: ['hack', 'breach', 'exploit', 'vulnerability', 'rug pull', 'scam', 'phishing', 'drain'],
  ai: ['ai', 'artificial intelligence', 'machine learning', 'gpt', 'llm', 'neural', 'deepfake', 'openai', 'anthropic'],
  macro: ['fed', 'inflation', 'interest rate', 'recession', 'gdp', 'treasury', 'bond'],
  africa: ['africa', 'nigeria', 'kenya', 'lagos', 'nairobi', 'mpesa', 'south africa', 'ghana', 'african'],
  etf: ['etf', 'spot etf', 'blackrock', 'fidelity', 'grayscale', 'ark invest'],
  mining: ['mining', 'miner', 'hashrate', 'asic', 'proof of work'],
  memecoin: ['memecoin', 'meme', 'doge', 'shib', 'pepe', 'bonk', 'wif'],
  startup: ['startup', 'funding', 'venture', 'seed round', 'series a', 'series b', 'raise', 'unicorn'],
};

const SENTIMENT_KEYWORDS: Record<string, string[]> = {
  bullish: ['surge', 'rally', 'soar', 'breakout', 'all-time high', 'ath', 'moon', 'pump', 'bullish', 'gain', 'record', 'milestone', 'approval', 'adopt', 'partnership'],
  bearish: ['crash', 'plunge', 'dump', 'collapse', 'plummet', 'liquidat', 'bearish', 'loss', 'sell-off', 'decline', 'drop', 'slump', 'fear'],
  neutral: ['report', 'announce', 'update', 'launch', 'release', 'plan', 'consider', 'explore'],
};

const URGENCY_KEYWORDS: Record<UrgencyLevel, string[]> = {
  critical: ['breaking', 'urgent', 'emergency', 'flash', 'just in', 'alert', 'crash', 'hack'],
  high: ['exclusive', 'major', 'significant', 'massive', 'billion', 'unprecedented'],
  medium: ['report', 'announce', 'update', 'launch', 'new'],
  low: ['analysis', 'opinion', 'review', 'history', 'explained', 'guide'],
};

const INSTITUTIONAL_KEYWORDS = ['blackrock', 'fidelity', 'jpmorgan', 'goldman', 'institution', 'bank', 'hedge fund', 'etf', 'sovereign', 'pension'];
const RETAIL_KEYWORDS = ['retail', 'trader', 'community', 'memecoin', 'degen', 'airdrop', 'discord', 'telegram'];

const SYMBOLIC_ARCHETYPES: Record<string, string[]> = {
  'institutional dominance': ['blackrock', 'fidelity', 'etf', 'institutional', 'jpmorgan'],
  'market volatility': ['crash', 'surge', 'volatile', 'liquidat', 'flash'],
  'digital revolution': ['adoption', 'mainstream', 'billion users', 'milestone'],
  'regulatory confrontation': ['sec', 'lawsuit', 'ban', 'enforcement', 'fine'],
  'technological breakthrough': ['launch', 'upgrade', 'breakthrough', 'innovation', 'deploy'],
  'security crisis': ['hack', 'exploit', 'breach', 'drain', 'rug pull'],
  'african emergence': ['africa', 'nigeria', 'kenya', 'mpesa', 'fintech hub'],
  'ai convergence': ['ai', 'gpt', 'machine learning', 'neural', 'autonomous'],
};

// ─── Core Engine ─────────────────────────────────────────────────────────────

export class NarrativeEngine {
  /**
   * Analyze headline + metadata to produce a structured narrative analysis.
   * This is Layer 1: fast, rule-based, no LLM dependency.
   */
  analyze(
    headline: string,
    excerpt?: string,
    category?: string,
    tags?: string[]
  ): NarrativeAnalysis {
    const text = `${headline} ${excerpt || ''} ${category || ''} ${(tags || []).join(' ')}`.toLowerCase();

    const topic = this.detectTopic(text);
    const storyType = detectStoryType(headline, category, tags);
    const entities = this.extractEntities(text);
    const keywords = this.extractKeywords(headline, text);
    const sentiment = this.detectSentiment(text);
    const urgency = this.detectUrgency(text);
    const geopoliticalTension = this.scoreGeopoliticalTension(text);
    const marketEmotion = this.detectMarketEmotion(text, sentiment);
    const institutionalRetail = this.detectInstitutionalRetail(text);
    const archetypes = this.detectArchetypes(text);

    return {
      topic,
      category: category || topic,
      story_type: storyType,
      entities,
      keywords,
      sentiment,
      geopolitical_tension: geopoliticalTension,
      market_emotion: marketEmotion,
      institutional_vs_retail: institutionalRetail,
      urgency,
      symbolic_archetypes: archetypes,
    };
  }

  private detectTopic(text: string): string {
    let bestTopic = 'crypto';
    let bestScore = 0;

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topic;
      }
    }

    return bestTopic;
  }

  private extractEntities(text: string): string[] {
    const entities: string[] = [];

    const knownEntities = [
      'bitcoin', 'ethereum', 'binance', 'coinbase', 'sec', 'blackrock',
      'fidelity', 'jpmorgan', 'tether', 'usdc', 'solana', 'cardano',
      'ripple', 'xrp', 'dogecoin', 'polygon', 'avalanche', 'chainlink',
      'openai', 'google', 'apple', 'tesla', 'microstrategy', 'grayscale',
      'nigeria', 'kenya', 'south africa', 'fed', 'ecb', 'imf',
    ];

    for (const entity of knownEntities) {
      if (text.includes(entity)) {
        entities.push(entity);
      }
    }

    return entities.slice(0, 8);
  }

  private extractKeywords(headline: string, text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'it', 'its', 'as',
      'not', 'no', 'so', 'up', 'if', 'about', 'into', 'than', 'then',
      'out', 'also', 'after', 'before', 'new', 'more', 'over',
    ]);

    const words = headline
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    return [...new Set(words)].slice(0, 8);
  }

  private detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' | 'mixed' {
    let bullishScore = 0;
    let bearishScore = 0;

    for (const kw of SENTIMENT_KEYWORDS.bullish) {
      if (text.includes(kw)) bullishScore++;
    }
    for (const kw of SENTIMENT_KEYWORDS.bearish) {
      if (text.includes(kw)) bearishScore++;
    }

    if (bullishScore > 0 && bearishScore > 0) return 'mixed';
    if (bullishScore > bearishScore) return 'bullish';
    if (bearishScore > bullishScore) return 'bearish';
    return 'neutral';
  }

  private detectUrgency(text: string): UrgencyLevel {
    for (const level of ['critical', 'high', 'medium', 'low'] as UrgencyLevel[]) {
      for (const kw of URGENCY_KEYWORDS[level]) {
        if (text.includes(kw)) return level;
      }
    }
    return 'medium';
  }

  private scoreGeopoliticalTension(text: string): number {
    const tensionKeywords = [
      'ban', 'sanction', 'war', 'conflict', 'embargo', 'crisis',
      'enforcement', 'lawsuit', 'investigation', 'seizure', 'arrest',
    ];

    let score = 0;
    for (const kw of tensionKeywords) {
      if (text.includes(kw)) score += 0.15;
    }
    return Math.min(score, 1);
  }

  private detectMarketEmotion(text: string, sentiment: string): string {
    if (sentiment === 'bullish') {
      if (text.includes('all-time') || text.includes('record')) return 'euphoria';
      if (text.includes('rally') || text.includes('surge')) return 'excitement';
      return 'optimism';
    }
    if (sentiment === 'bearish') {
      if (text.includes('crash') || text.includes('collapse')) return 'panic';
      if (text.includes('liquidat') || text.includes('sell-off')) return 'fear';
      return 'uncertainty';
    }
    if (text.includes('wait') || text.includes('delay')) return 'anticipation';
    if (text.includes('stable') || text.includes('steady')) return 'stability';
    return 'measured observation';
  }

  private detectInstitutionalRetail(text: string): 'institutional' | 'retail' | 'mixed' {
    let instScore = 0;
    let retailScore = 0;

    for (const kw of INSTITUTIONAL_KEYWORDS) {
      if (text.includes(kw)) instScore++;
    }
    for (const kw of RETAIL_KEYWORDS) {
      if (text.includes(kw)) retailScore++;
    }

    if (instScore > 0 && retailScore > 0) return 'mixed';
    if (instScore > retailScore) return 'institutional';
    if (retailScore > instScore) return 'retail';
    return 'mixed';
  }

  private detectArchetypes(text: string): string[] {
    const matched: string[] = [];

    for (const [archetype, keywords] of Object.entries(SYMBOLIC_ARCHETYPES)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          matched.push(archetype);
          break;
        }
      }
    }

    return matched.slice(0, 3);
  }
}

export default NarrativeEngine;
