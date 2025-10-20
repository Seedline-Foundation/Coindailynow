// Sentiment Analysis Agent - Advanced sentiment tracking for African crypto markets
// Handles real-time sentiment analysis with focus on African financial contexts

import { createAuditLog, AuditActions } from '../../../lib/audit';
import { SentimentAnalysisResult } from '../../types/ai-types';

export interface SentimentAnalysisRequest {
  text: string;
  context?: {
    source?: 'article' | 'social_media' | 'news' | 'comment';
    language?: string;
    region?: 'africa' | 'nigeria' | 'kenya' | 'south_africa' | 'ghana' | 'global';
    cryptoSymbols?: string[];
  };
  options?: {
    includeKeywords?: boolean;
    includeEmotions?: boolean;
    financialContext?: boolean;
  };
}

interface HuggingFaceResult {
  label: string;
  score: number;
}

interface SentimentKeyword {
  word: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: number;
  category: 'price' | 'adoption' | 'regulation' | 'technology' | 'general';
}

export class SentimentAnalysisAgent {
  private huggingfaceApiKey: string;
  private isInitialized: boolean = false;
  private sentimentCache: Map<string, SentimentAnalysisResult> = new Map();
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes cache

  // African financial sentiment keywords
  private readonly africanFinancialKeywords = {
    positive: {
      adoption: ['mpesa', 'mobile_money', 'financial_inclusion', 'banked', 'remittance'],
      growth: ['naira', 'rand', 'shilling', 'economy', 'gdp', 'investment'],
      technology: ['fintech', 'innovation', 'digital', 'blockchain', 'crypto']
    },
    negative: {
      barriers: ['unbanked', 'inflation', 'devaluation', 'restriction', 'ban'],
      risks: ['volatility', 'scam', 'fraud', 'regulation', 'uncertainty'],
      economic: ['poverty', 'unemployment', 'debt', 'crisis', 'corruption']
    }
  };

  constructor() {
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  async initialize(): Promise<void> {
    console.log('🎭 Initializing Sentiment Analysis Agent...');

    try {
      if (!this.huggingfaceApiKey) {
        throw new Error('HUGGINGFACE_API_KEY environment variable is required');
      }

      // Test HuggingFace API connection
      const testResponse = await fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.huggingfaceApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'Test sentiment analysis connection'
        })
      });

      if (!testResponse.ok) {
        throw new Error(`HuggingFace API connection failed: ${testResponse.statusText}`);
      }

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'sentiment_analysis_agent',
        resourceId: 'huggingface',
        details: { 
          initialized: true, 
          model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
          africanContexts: Object.keys(this.africanFinancialKeywords).length,
          capabilities: ['sentiment_classification', 'keyword_extraction', 'emotion_analysis', 'financial_context']
        }
      });

      console.log('✅ Sentiment Analysis Agent initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'sentiment_analysis_agent',
        resourceId: 'huggingface',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResult = this.sentimentCache.get(cacheKey);
    if (cachedResult) {
      console.log('📋 Using cached sentiment analysis');
      return cachedResult;
    }

    console.log('🎭 Analyzing sentiment...');

    try {
      // Single I/O operation to HuggingFace API
      const sentimentResponse = await this.performSentimentAnalysis(request.text);
      
      // Extract keywords and analyze context
      const keywords = this.extractSentimentKeywords(request.text, request.context);
      const contextualAnalysis = this.analyzeAfricanContext(request.text, request.context);
      
      const result: SentimentAnalysisResult = {
        sentiment: sentimentResponse.label as 'positive' | 'negative' | 'neutral',
        confidence: sentimentResponse.score,
        scores: {
          positive: sentimentResponse.label === 'positive' ? sentimentResponse.score : 1 - sentimentResponse.score,
          negative: sentimentResponse.label === 'negative' ? sentimentResponse.score : 0,
          neutral: sentimentResponse.label === 'neutral' ? sentimentResponse.score : 0
        },
        keywords: keywords,
        metadata: {
          textLength: request.text.length,
          languageDetected: this.detectLanguage(request.text),
          processingTime: Date.now() - startTime,
          ...contextualAnalysis
        }
      };

      // Apply African financial context adjustments
      this.applyAfricanContextAdjustments(result, request.context);

      // Cache result
      this.sentimentCache.set(cacheKey, result);
      setTimeout(() => this.sentimentCache.delete(cacheKey), this.cacheTimeout);

      // Log successful analysis
      await createAuditLog({
        action: AuditActions.ARTICLE_UPDATE,
        resource: 'sentiment_analysis',
        resourceId: `analysis_${Date.now()}`,
        details: {
          sentiment: result.sentiment,
          confidence: result.confidence,
          textLength: request.text.length,
          keywordCount: keywords.length,
          processingTime: result.metadata?.processingTime,
          region: request.context?.region,
          source: request.context?.source
        }
      });

      console.log(`✅ Sentiment analysis completed: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sentiment analysis failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'sentiment_analysis',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          textLength: request.text.length,
          source: request.context?.source
        }
      });

      throw new Error(`Sentiment analysis failed: ${errorMessage}`);
    }
  }

  private async performSentimentAnalysis(text: string): Promise<{ label: string; score: number }> {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.huggingfaceApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text.substring(0, 500) // Limit to 500 chars for API efficiency
        })
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API request failed: ${response.statusText}`);
      }

      const results = await response.json();
      
      if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
        // Get the highest scoring result
        const bestResult = results[0].reduce((best: HuggingFaceResult, current: HuggingFaceResult) => 
          current.score > best.score ? current : best
        );
        
        return {
          label: this.normalizeSentimentLabel(bestResult.label),
          score: bestResult.score
        };
      }
      
      // Fallback analysis
      return this.performFallbackSentimentAnalysis(text);

    } catch {
      // Use fallback analysis if API fails
      return this.performFallbackSentimentAnalysis(text);
    }
  }

  private performFallbackSentimentAnalysis(text: string): { label: string; score: number } {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'bull', 'growth', 'increase', 'adoption', 'success', 'profit', 'gain'];
    const negativeWords = ['bad', 'terrible', 'negative', 'bear', 'decline', 'decrease', 'loss', 'crash', 'scam', 'fraud', 'concern'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      return { label: 'positive', score: 0.6 + (positiveCount / (positiveCount + negativeCount)) * 0.3 };
    } else if (negativeCount > positiveCount) {
      return { label: 'negative', score: 0.6 + (negativeCount / (positiveCount + negativeCount)) * 0.3 };
    } else {
      return { label: 'neutral', score: 0.7 };
    }
  }

  private extractSentimentKeywords(text: string, context?: SentimentAnalysisRequest['context']): SentimentKeyword[] {
    const words: string[] = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const keywords: SentimentKeyword[] = [];
    
    // Check against African financial keywords
    for (const [sentiment, categories] of Object.entries(this.africanFinancialKeywords)) {
      for (const [category, keywordList] of Object.entries(categories)) {
        for (const keyword of keywordList) {
          if (words.some((word: string) => word.includes(keyword.toLowerCase()))) {
            keywords.push({
              word: keyword,
              sentiment: sentiment as 'positive' | 'negative',
              impact: this.calculateKeywordImpact(keyword, text),
              category: this.mapCategoryToType(category)
            });
          }
        }
      }
    }
    
    // Add crypto-specific keywords if symbols provided
    if (context?.cryptoSymbols) {
      for (const symbol of context.cryptoSymbols) {
        if (text.toLowerCase().includes(symbol.toLowerCase())) {
          keywords.push({
            word: symbol,
            sentiment: 'neutral',
            impact: 0.5,
            category: 'price'
          });
        }
      }
    }
    
    // Add general sentiment keywords
    const generalKeywords = this.extractGeneralSentimentKeywords(text);
    keywords.push(...generalKeywords);
    
    return keywords.slice(0, 10); // Limit to top 10 keywords
  }

  private extractGeneralSentimentKeywords(text: string): SentimentKeyword[] {
    const sentimentWords = {
      positive: ['growth', 'increase', 'bull', 'profit', 'gain', 'success', 'adoption', 'innovation'],
      negative: ['decline', 'bear', 'loss', 'crash', 'fear', 'concern', 'risk', 'volatility'],
      neutral: ['stable', 'steady', 'maintain', 'analysis', 'report', 'update', 'news']
    };
    
    const keywords: SentimentKeyword[] = [];
    const lowerText = text.toLowerCase();
    
    for (const [sentiment, words] of Object.entries(sentimentWords)) {
      for (const word of words) {
        if (lowerText.includes(word)) {
          keywords.push({
            word,
            sentiment: sentiment === 'mixed' ? 'neutral' : sentiment as 'positive' | 'negative' | 'neutral',
            impact: this.calculateKeywordImpact(word, text),
            category: 'general'
          });
        }
      }
    }
    
    return keywords;
  }

  private calculateKeywordImpact(keyword: string, text: string): number {
    const occurrences = (text.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    const textLength = text.split(' ').length;
    
    // Impact based on frequency and text length
    const frequency = occurrences / textLength;
    return Math.min(frequency * 10, 1); // Normalize to 0-1
  }

  private analyzeAfricanContext(text: string, context?: SentimentAnalysisRequest['context']): Record<string, unknown> {
    const lowerText = text.toLowerCase();
    const africanContext: Record<string, unknown> = {};
    
    // Check for African countries/regions
    const africanRegions = ['nigeria', 'kenya', 'south africa', 'ghana', 'uganda', 'tanzania', 'rwanda'];
    const mentionedRegions = africanRegions.filter(region => lowerText.includes(region));
    africanContext.mentionedRegions = mentionedRegions;
    
    // Check for African financial terms
    const africanFinTerms = ['mpesa', 'naira', 'rand', 'shilling', 'cedi', 'mobile money', 'financial inclusion'];
    const africanFinancialTerms = africanFinTerms.filter(term => lowerText.includes(term));
    africanContext.africanFinancialTerms = africanFinancialTerms;
    
    // Regional sentiment modifier
    if (context?.region && context.region !== 'global') {
      africanContext.regionalFocus = context.region;
      africanContext.hasAfricanContext = true;
    } else {
      africanContext.hasAfricanContext = mentionedRegions.length > 0 || africanFinancialTerms.length > 0;
    }
    
    return africanContext;
  }

  private mapCategoryToType(category: string): 'price' | 'adoption' | 'regulation' | 'technology' | 'general' {
    switch (category) {
      case 'growth':
      case 'economic':
        return 'price';
      case 'adoption':
      case 'barriers':
        return 'adoption';
      case 'risks':
      case 'regulatory':
        return 'regulation';
      case 'technology':
        return 'technology';
      default:
        return 'general';
    }
  }

  private applyAfricanContextAdjustments(result: SentimentAnalysisResult, context?: SentimentAnalysisRequest['context']): void {
    // Adjust confidence based on African context
    if (context?.region && context.region !== 'global') {
      // Increase confidence for region-specific analysis
      result.confidence = Math.min(result.confidence * 1.1, 1);
    }
    
    // Adjust for financial context
    if (context?.cryptoSymbols && context.cryptoSymbols.length > 0) {
      // Financial content tends to be more volatile in sentiment
      const volatilityAdjustment = 0.95;
      result.confidence *= volatilityAdjustment;
    }
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const lowerText = text.toLowerCase();
    
    const englishCount = englishWords.filter(word => lowerText.includes(` ${word} `)).length;
    
    if (englishCount > 2) {
      return 'en';
    }
    
    // Add more language detection logic as needed
    return 'unknown';
  }

  private normalizeSentimentLabel(label: string): string {
    const labelMap: Record<string, string> = {
      'LABEL_0': 'negative',
      'LABEL_1': 'neutral', 
      'LABEL_2': 'positive',
      'negative': 'negative',
      'neutral': 'neutral',
      'positive': 'positive'
    };
    
    return labelMap[label] || 'neutral';
  }

  private generateCacheKey(request: SentimentAnalysisRequest): string {
    const textHash = this.simpleHash(request.text);
    return `sentiment_analysis:${textHash}:${JSON.stringify(request.context)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Batch analysis for multiple texts
  async analyzeBatch(requests: SentimentAnalysisRequest[]): Promise<SentimentAnalysisResult[]> {
    console.log(`🎭 Analyzing batch of ${requests.length} texts...`);
    
    const results = await Promise.allSettled(
      requests.map(request => this.analyzeSentiment(request))
    );
    
    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            sentiment: 'neutral' as const,
            confidence: 0,
            scores: { positive: 0, negative: 0, neutral: 1 },
            keywords: [],
            metadata: { textLength: 0, languageDetected: 'unknown', processingTime: 0 }
          }
    );
  }

  // Public method to get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.sentimentCache.size,
      hitRate: 0.85 // Mock hit rate for demo
    };
  }
}

// Create singleton instance
export const sentimentAnalysisAgent = new SentimentAnalysisAgent();
