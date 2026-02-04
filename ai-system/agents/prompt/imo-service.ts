// Imo Service - Integration layer for Imo Prompt Agent
// Provides easy-to-use methods for different use cases

import { 
  ImoPromptAgent, 
  ImoPromptRequest, 
  ImoPromptResult,
  ContentType,
  PromptStrategy 
} from './imo-prompt-agent';

/**
 * Web scraping result for RAG
 */
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

/**
 * Imo Service - High-level API for prompt generation
 */
export class ImoService {
  private agent: ImoPromptAgent;
  private ragCache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private readonly RAG_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

  constructor() {
    this.agent = new ImoPromptAgent();
  }

  async initialize(): Promise<void> {
    await this.agent.initialize();
  }

  // ============================================
  // IMAGE GENERATION PROMPTS
  // ============================================

  /**
   * Generate optimized prompt for article hero images
   */
  async generateHeroImagePrompt(params: {
    articleTitle: string;
    category: string;
    keywords?: string[];
    africanFocus?: boolean;
    aspectRatio?: '16:9' | '4:3' | '1:1';
  }): Promise<ImoPromptResult> {
    const request: ImoPromptRequest = {
      contentType: 'image',
      strategy: 'negative', // Always use negative prompting for images
      context: {
        articleTitle: params.articleTitle,
        topic: params.category,
        keywords: params.keywords,
        africanFocus: params.africanFocus ?? true,
        aspectRatio: params.aspectRatio || '16:9',
        visualStyle: 'modern professional cryptocurrency illustration'
      },
      options: {
        includeNegativePrompt: true,
        optimizeForModel: 'dalle'
      }
    };

    return this.agent.generatePrompt(request);
  }

  /**
   * Generate prompt for social media images
   */
  async generateSocialImagePrompt(params: {
    platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
    topic: string;
    style?: 'professional' | 'vibrant' | 'minimalist';
  }): Promise<ImoPromptResult> {
    const aspectRatios: Record<string, string> = {
      twitter: '16:9',
      facebook: '1.91:1',
      instagram: '1:1',
      linkedin: '1.91:1'
    };

    return this.agent.generatePrompt({
      contentType: 'image',
      strategy: 'negative',
      context: {
        topic: params.topic,
        aspectRatio: aspectRatios[params.platform],
        visualStyle: params.style || 'professional',
        africanFocus: true
      },
      options: {
        includeNegativePrompt: true,
        optimizeForModel: 'dalle'
      }
    });
  }

  // ============================================
  // VIDEO GENERATION PROMPTS
  // ============================================

  /**
   * Generate prompt for video content with CPU-optimized negative prompts
   */
  async generateVideoPrompt(params: {
    topic: string;
    duration?: 'short' | 'medium' | 'long';
    style?: string;
  }): Promise<ImoPromptResult> {
    return this.agent.generatePrompt({
      contentType: 'video',
      strategy: 'negative',
      context: {
        topic: params.topic,
        visualStyle: params.style || 'professional crypto animation',
        quality: 'hd',
        customInstructions: `Duration: ${params.duration || 'short'} form video`
      },
      options: {
        includeNegativePrompt: true,
        optimizeForModel: 'stable-diffusion'
      }
    });
  }

  // ============================================
  // ARTICLE & SEO PROMPTS (Writer-Editor Pattern)
  // ============================================

  /**
   * Generate SEO-optimized article prompts using Writer-Editor pattern
   */
  async generateArticlePrompt(params: {
    topic: string;
    keywords: string[];
    targetAudience?: 'beginner' | 'intermediate' | 'expert';
    wordCount?: number;
    africanFocus?: boolean;
  }): Promise<ImoPromptResult> {
    return this.agent.generatePrompt({
      contentType: 'seo',
      strategy: 'writer_editor',
      context: {
        topic: params.topic,
        targetKeywords: params.keywords,
        targetAudience: params.targetAudience || 'general',
        wordCount: params.wordCount || 1200,
        africanFocus: params.africanFocus ?? true,
        tone: 'professional'
      },
      options: {
        maxSteps: 2,
        returnIntermediateSteps: true
      }
    });
  }

  /**
   * Generate research-backed article with outline
   */
  async generateResearchArticlePrompt(params: {
    topic: string;
    keywords: string[];
    competitorUrls?: string[];
  }): Promise<ImoPromptResult> {
    // First, if competitor URLs provided, fetch RAG context
    let contextDocs: ImoPromptRequest['context']['contextDocs'] = [];

    if (params.competitorUrls && params.competitorUrls.length > 0) {
      const ragResults = await this.fetchRAGContext(params.topic);
      contextDocs = ragResults.map(r => ({
        title: r.title,
        content: r.content || r.snippet,
        url: r.url,
        relevance: 0.8
      }));
    }

    return this.agent.generatePrompt({
      contentType: 'article',
      strategy: 'hybrid',
      context: {
        topic: params.topic,
        targetKeywords: params.keywords,
        competitorUrls: params.competitorUrls,
        contextDocs,
        africanFocus: true
      },
      options: {
        enableRAG: contextDocs.length > 0,
        returnIntermediateSteps: true
      }
    });
  }

  // ============================================
  // TRANSLATION PROMPTS (2-Step Chaining)
  // ============================================

  /**
   * Generate translation prompts with terminology preservation
   */
  async generateTranslationPrompt(params: {
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
    contentType?: 'article' | 'headline' | 'social_post' | 'meta_description';
    preserveTerms?: string[];
  }): Promise<ImoPromptResult & { sourceText: string }> {
    const result = await this.agent.generatePrompt({
      contentType: 'translation',
      strategy: 'chain',
      context: {
        sourceLanguage: params.sourceLanguage,
        targetLanguage: params.targetLanguage,
        keywords: params.preserveTerms,
        tone: 'professional',
        customInstructions: `Content type: ${params.contentType || 'article'}`
      },
      options: {
        maxSteps: 2,
        returnIntermediateSteps: true
      }
    });

    return {
      ...result,
      sourceText: params.sourceText
    };
  }

  /**
   * Batch translation prompts for multiple languages
   */
  async generateBatchTranslationPrompts(params: {
    sourceText: string;
    sourceLanguage: string;
    targetLanguages: string[];
  }): Promise<Map<string, ImoPromptResult>> {
    const results = new Map<string, ImoPromptResult>();

    // Generate prompts for all languages in parallel
    const promises = params.targetLanguages.map(async (lang) => {
      const result = await this.generateTranslationPrompt({
        sourceText: params.sourceText,
        sourceLanguage: params.sourceLanguage,
        targetLanguage: lang
      });
      return { lang, result };
    });

    const resolved = await Promise.all(promises);
    resolved.forEach(({ lang, result }) => results.set(lang, result));

    return results;
  }

  // ============================================
  // SEARCH/RAG PROMPTS
  // ============================================

  /**
   * Generate RAG-enhanced search response prompt
   */
  async generateSearchResponsePrompt(params: {
    userQuery: string;
    maxSources?: number;
  }): Promise<ImoPromptResult> {
    // Fetch real-time context from web
    const ragResults = await this.fetchRAGContext(params.userQuery);
    
    const contextDocs = ragResults
      .slice(0, params.maxSources || 5)
      .map((r, idx) => ({
        title: r.title,
        content: r.content || r.snippet,
        url: r.url,
        relevance: 1 - (idx * 0.1) // Decreasing relevance by rank
      }));

    return this.agent.generatePrompt({
      contentType: 'analysis',
      strategy: 'rag_enhanced',
      context: {
        searchQuery: params.userQuery,
        contextDocs,
        africanFocus: true
      },
      options: {
        enableRAG: true
      }
    });
  }

  /**
   * Fetch RAG context from web search
   * In production, this would integrate with actual search APIs
   */
  private async fetchRAGContext(query: string): Promise<SearchResult[]> {
    // Check cache first
    const cached = this.ragCache.get(query);
    if (cached && Date.now() - cached.timestamp < this.RAG_CACHE_TTL) {
      return cached.results;
    }

    // In production, this would call:
    // 1. Google Custom Search API
    // 2. Bing Search API
    // 3. Or scrape top results
    
    // For now, return placeholder structure
    // The actual implementation would be in a separate RAG service
    const results: SearchResult[] = [];
    
    try {
      // Placeholder for actual RAG implementation
      // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      // results = await response.json();
      
      // Cache results
      this.ragCache.set(query, { results, timestamp: Date.now() });
    } catch (error) {
      console.error('RAG fetch error:', error);
    }

    return results;
  }

  // ============================================
  // SOCIAL MEDIA PROMPTS
  // ============================================

  /**
   * Generate social media post prompts
   */
  async generateSocialPostPrompt(params: {
    topic: string;
    platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
    articleUrl?: string;
    hashtags?: string[];
  }): Promise<ImoPromptResult> {
    const platformLimits: Record<string, number> = {
      twitter: 280,
      facebook: 500,
      linkedin: 700,
      instagram: 2200
    };

    return this.agent.generatePrompt({
      contentType: 'social',
      strategy: 'simple',
      context: {
        topic: params.topic,
        africanFocus: true,
        keywords: params.hashtags,
        customInstructions: `
Platform: ${params.platform}
Character limit: ${platformLimits[params.platform]}
${params.articleUrl ? `Include link: ${params.articleUrl}` : ''}
${params.hashtags?.length ? `Include hashtags: ${params.hashtags.join(' ')}` : ''}
Optimize for engagement on ${params.platform}`
      }
    });
  }

  // ============================================
  // SUMMARY PROMPTS
  // ============================================

  /**
   * Generate article summary prompt
   */
  async generateSummaryPrompt(params: {
    articleContent: string;
    summaryType: 'tldr' | 'executive' | 'bullet_points';
    maxLength?: number;
  }): Promise<ImoPromptResult> {
    const lengthGuides: Record<string, number> = {
      tldr: 50,
      executive: 200,
      bullet_points: 300
    };

    return this.agent.generatePrompt({
      contentType: 'summary',
      strategy: 'simple',
      context: {
        topic: 'article summary',
        wordCount: params.maxLength || lengthGuides[params.summaryType],
        customInstructions: `
Summary type: ${params.summaryType}
${params.summaryType === 'tldr' ? 'Create a one-sentence summary' : ''}
${params.summaryType === 'executive' ? 'Create a professional executive summary' : ''}
${params.summaryType === 'bullet_points' ? 'Create 5-7 key bullet points' : ''}

Article to summarize:
${params.articleContent.substring(0, 3000)}...`
      }
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get agent metrics
   */
  getMetrics() {
    return this.agent.getMetrics();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.agent.healthCheck();
  }

  /**
   * Clear RAG cache
   */
  clearRAGCache(): void {
    this.ragCache.clear();
  }
}

// Export singleton instance
export const imoService = new ImoService();

// Export convenience functions
export const generateHeroImagePrompt = imoService.generateHeroImagePrompt.bind(imoService);
export const generateArticlePrompt = imoService.generateArticlePrompt.bind(imoService);
export const generateTranslationPrompt = imoService.generateTranslationPrompt.bind(imoService);
export const generateSearchResponsePrompt = imoService.generateSearchResponsePrompt.bind(imoService);
