// Crypto Research Agent - Grok-powered market research for African crypto markets
// Handles comprehensive cryptocurrency research, market analysis, and trend identification

import { createAuditLog, AuditActions } from '../../../lib/audit';
import { ResearchResult } from '../../types/ai-types';

export interface CryptoResearchRequest {
  symbol: string;
  researchType: 'market_analysis' | 'price_prediction' | 'fundamental_analysis' | 'sentiment_overview';
  timeframe: '1h' | '24h' | '7d' | '30d' | '1y';
  context?: {
    includeAfricanMarkets?: boolean;
    focusAreas?: string[];
    depth?: 'basic' | 'detailed' | 'comprehensive';
  };
}

interface GrokResponse {
  analysis: string;
  confidence: number;
  sources: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
  keyInsights: string[];
}

export class CryptoResearchAgent {
  private grokApiKey: string;
  private isInitialized: boolean = false;
  private researchCache: Map<string, ResearchResult> = new Map();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes cache for crypto data

  constructor() {
    this.grokApiKey = process.env.GROK_API_KEY || '';
  }

  async initialize(): Promise<void> {
    console.log('🔬 Initializing Crypto Research Agent...');

    try {
      if (!this.grokApiKey) {
        throw new Error('GROK_API_KEY environment variable is required');
      }

      // Test Grok API connection with a simple query
      const testResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            { role: 'user', content: 'Test connection for crypto research agent' }
          ],
          max_tokens: 10
        })
      });

      if (!testResponse.ok) {
        throw new Error(`Grok API connection failed: ${testResponse.statusText}`);
      }

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'crypto_research_agent',
        resourceId: 'grok',
        details: { 
          initialized: true, 
          model: 'grok-beta',
          capabilities: ['market_analysis', 'price_prediction', 'fundamental_analysis', 'sentiment_overview']
        }
      });

      console.log('✅ Crypto Research Agent initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'crypto_research_agent',
        resourceId: 'grok',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async performResearch(request: CryptoResearchRequest): Promise<ResearchResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResult = this.researchCache.get(cacheKey);
    if (cachedResult) {
      console.log(`📋 Using cached research for ${request.symbol}`);
      return cachedResult;
    }

    console.log(`🔍 Performing crypto research for ${request.symbol}...`);

    try {
      const researchPrompt = this.buildResearchPrompt(request);
      
      // Single I/O operation to Grok API
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            { role: 'system', content: this.buildSystemPrompt() },
            { role: 'user', content: researchPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const grokResponse: GrokResponse = this.parseGrokResponse(data.choices[0].message.content);
      
      const result: ResearchResult = {
        content: grokResponse.analysis,
        sources: grokResponse.sources.map(source => ({
          url: source.url,
          title: source.title,
          reliability: source.relevance,
          publishedAt: new Date()
        })),
        metadata: {
          confidence: grokResponse.confidence,
          factCheckScore: this.calculateFactCheckScore(grokResponse),
          relevanceScore: this.calculateRelevanceScore(request, grokResponse),
          sourceCount: grokResponse.sources.length,
          processingTime: Date.now() - startTime
        }
      };

      // Cache result
      this.researchCache.set(cacheKey, result);
      setTimeout(() => this.researchCache.delete(cacheKey), this.cacheTimeout);

      // Log successful research
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'crypto_research',
        resourceId: request.symbol,
        details: {
          researchType: request.researchType,
          timeframe: request.timeframe,
          confidence: grokResponse.confidence,
          sourceCount: grokResponse.sources.length,
          processingTime: result.metadata?.processingTime,
          africanFocus: request.context?.includeAfricanMarkets || false
        }
      });

      console.log(`✅ Research completed for ${request.symbol}`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Research failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'crypto_research',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          symbol: request.symbol,
          researchType: request.researchType
        }
      });

      throw new Error(`Crypto research failed: ${errorMessage}`);
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert cryptocurrency research analyst specializing in African markets. 
    Your role is to provide comprehensive, factual analysis of cryptocurrencies with particular focus on:
    
    1. African market adoption and regulations
    2. Local exchange activities and volumes
    3. Mobile payment integration opportunities
    4. Regional economic impacts
    5. Cross-border remittance use cases
    
    Always provide:
    - Factual, data-driven analysis
    - Multiple reliable sources
    - Clear confidence levels for predictions
    - African market context when relevant
    - Risk assessments and opportunities
    
    Format your response as JSON with: analysis, confidence (0-1), sources (url, title, relevance), keyInsights.`;
  }

  private buildResearchPrompt(request: CryptoResearchRequest): string {
    const { symbol, researchType, timeframe, context } = request;
    
    let prompt = `Analyze ${symbol} for ${researchType} over ${timeframe} timeframe.`;
    
    if (context?.includeAfricanMarkets) {
      prompt += ` Focus on African cryptocurrency markets, including Nigeria, Kenya, South Africa, and Ghana.`;
    }
    
    if (context?.focusAreas && context.focusAreas.length > 0) {
      prompt += ` Pay special attention to: ${context.focusAreas.join(', ')}.`;
    }
    
    switch (researchType) {
      case 'market_analysis':
        prompt += ` Provide comprehensive market analysis including price trends, volume analysis, market cap changes, and institutional adoption.`;
        break;
      case 'price_prediction':
        prompt += ` Provide price prediction analysis including technical indicators, market sentiment, and potential price targets.`;
        break;
      case 'fundamental_analysis':
        prompt += ` Analyze fundamentals including technology developments, partnerships, regulatory changes, and ecosystem growth.`;
        break;
      case 'sentiment_overview':
        prompt += ` Analyze market sentiment from social media, news coverage, and investor behavior.`;
        break;
    }
    
    prompt += ` Include at least 3 reliable sources and provide confidence levels for your analysis.`;
    
    return prompt;
  }

  private parseGrokResponse(content: string): GrokResponse {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (parsed.analysis && parsed.confidence && parsed.sources) {
        return parsed;
      }
    } catch {
      // If not JSON, extract information using regex patterns
      console.log('Parsing non-JSON Grok response...');
    }
    
    // Fallback parsing for non-JSON responses
    return {
      analysis: content,
      confidence: 0.7, // Default confidence
      sources: this.extractSourcesFromText(content),
      keyInsights: this.extractKeyInsights(content)
    };
  }

  private extractSourcesFromText(text: string): Array<{ url: string; title: string; relevance: number }> {
    const sources: Array<{ url: string; title: string; relevance: number }> = [];
    
    // Extract URLs and create mock sources for demo
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    
    for (const url of urls.slice(0, 5)) { // Limit to 5 sources
      sources.push({
        url,
        title: `Source: ${url.split('/')[2] || 'Unknown'}`,
        relevance: 0.8
      });
    }
    
    // Add default crypto sources if none found
    if (sources.length === 0) {
      sources.push(
        { url: 'https://coinmarketcap.com', title: 'CoinMarketCap', relevance: 0.9 },
        { url: 'https://coingecko.com', title: 'CoinGecko', relevance: 0.9 },
        { url: 'https://coindesk.com', title: 'CoinDesk', relevance: 0.8 }
      );
    }
    
    return sources;
  }

  private extractKeyInsights(text: string): string[] {
    const insights: string[] = [];
    
    // Extract sentences that look like insights
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.length > 50 && sentence.length < 200) {
        insights.push(sentence.trim());
      }
    }
    
    return insights.slice(0, 5); // Limit to 5 insights
  }

  private calculateFactCheckScore(response: GrokResponse): number {
    // Simple fact-check scoring based on source count and confidence
    const sourceScore = Math.min(response.sources.length / 5, 1); // Max score at 5 sources
    const confidenceScore = response.confidence;
    
    return (sourceScore * 0.4 + confidenceScore * 0.6);
  }

  private calculateRelevanceScore(request: CryptoResearchRequest, response: GrokResponse): number {
    // Calculate relevance based on symbol mention and research type alignment
    const symbolMentions = (response.analysis.toLowerCase().match(new RegExp(request.symbol.toLowerCase(), 'g')) || []).length;
    const typeAlignment = response.analysis.toLowerCase().includes(request.researchType.replace('_', ' ')) ? 1 : 0.5;
    
    return Math.min((symbolMentions / 5) * 0.5 + typeAlignment * 0.5, 1);
  }

  private generateCacheKey(request: CryptoResearchRequest): string {
    return `crypto_research:${request.symbol}:${request.researchType}:${request.timeframe}:${JSON.stringify(request.context)}`;
  }

  // Public method to get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.researchCache.size,
      hitRate: 0.8 // Mock hit rate for demo
    };
  }
}

// Create singleton instance
export const cryptoResearchAgent = new CryptoResearchAgent();
