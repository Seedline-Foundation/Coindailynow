// Imo-Enhanced Content Generation Agent
// Uses Writer-Editor pattern for SEO-optimized article generation

/// <reference types="node" />
// Audit logging (stubbed for standalone usage)
const createAuditLog = async (action: string, data: any) => { /* stub */ };
const AuditActions = { IMO_CONTENT_GENERATED: 'imo_content_generated' };
import { imoService } from './imo-service';
import { ragService } from './rag-service';

export interface EnhancedContentRequest {
  type: 'article' | 'summary' | 'social' | 'seo';
  topic: string;
  keywords?: string[];
  targetAudience?: 'beginner' | 'intermediate' | 'expert' | 'general';
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
  africanFocus?: boolean;
  useRAG?: boolean;  // Enable real-time web research
  competitorUrls?: string[];
}

export interface EnhancedContentResult {
  content: string;
  metadata: {
    wordCount: number;
    readabilityScore: number;
    seoScore: number;
    keywordsUsed: string[];
    processingTime: number;
    imoEnhanced: boolean;
    ragEnhanced: boolean;
    promptStrategy: string;
  };
  outline?: {
    title: string;
    sections: string[];
    targetKeywords: string[];
  };
  ragSources?: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
}

/**
 * Imo-Enhanced Content Generation Agent
 * Uses Writer-Editor pattern for high-quality SEO content
 */
export class ImoContentGenerationAgent {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private model: string = 'gpt-4-turbo-preview';
  private isInitialized: boolean = false;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    await imoService.initialize();
    await ragService.initialize();
    
    this.isInitialized = true;

    await createAuditLog({
      action: AuditActions.SETTINGS_UPDATE,
      resource: 'imo_content_agent',
      resourceId: 'imo-gpt4',
      details: { 
        initialized: true, 
        imoEnhanced: true,
        ragEnabled: true,
        strategy: 'writer_editor'
      }
    });
  }

  /**
   * Generate SEO-optimized article using Writer-Editor pattern
   */
  async generateArticle(request: EnhancedContentRequest): Promise<EnhancedContentResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let ragSources: EnhancedContentResult['ragSources'] = [];

    try {
      // STEP 0: Fetch RAG context if enabled
      let ragContext = '';
      if (request.useRAG) {
        const ragResult = await ragService.fetchContext(request.topic, {
          maxResults: 10,
          includeContent: true,
          dateRange: 'week'
        });
        
        ragContext = ragResult.synthesizedContext;
        ragSources = ragResult.results.map(r => ({
          title: r.title,
          url: r.url,
          relevance: r.relevanceScore || 0
        }));
      }

      // STEP 1: Generate optimized prompts using Imo (Writer-Editor pattern)
      const imoResult = await imoService.generateArticlePrompt({
        topic: request.topic,
        keywords: request.keywords || [],
        targetAudience: request.targetAudience,
        wordCount: request.wordCount || 1200,
        africanFocus: request.africanFocus ?? true
      });

      // Get the two-step prompts (reasoning + writing)
      const prompts = Array.isArray(imoResult.prompt) 
        ? imoResult.prompt 
        : [imoResult.prompt];

      // STEP 2: Execute reasoning phase (research & outline)
      const reasoningPrompt = prompts[0] + (ragContext ? `\n\n${ragContext}` : '');
      
      const reasoningResponse = await this.callLLM(reasoningPrompt, {
        temperature: 0.5,
        maxTokens: 1000
      });

      const outline = this.extractOutline(reasoningResponse);

      // STEP 3: Execute writing phase
      const writingPrompt = prompts[1] 
        ? `${prompts[1]}\n\nOUTLINE FROM STEP 1:\n${reasoningResponse}`
        : `Based on this outline, write a complete article:\n\n${reasoningResponse}`;

      const content = await this.callLLM(writingPrompt, {
        temperature: 0.7,
        maxTokens: 2500
      });

      // STEP 4: Analyze content quality
      const analysis = this.analyzeContent(content, request.keywords || []);

      const result: EnhancedContentResult = {
        content,
        metadata: {
          ...analysis,
          processingTime: Date.now() - startTime,
          imoEnhanced: true,
          ragEnhanced: request.useRAG || false,
          promptStrategy: 'writer_editor'
        },
        outline,
        ragSources: ragSources.length > 0 ? ragSources : undefined
      };

      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'imo_content',
        resourceId: `content-${Date.now()}`,
        details: {
          topic: request.topic.substring(0, 100),
          wordCount: analysis.wordCount,
          seoScore: analysis.seoScore,
          ragSourcesUsed: ragSources.length
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'imo_content',
        resourceId: 'error',
        details: { error: errorMessage }
      });

      throw error;
    }
  }

  /**
   * Generate summary using Imo
   */
  async generateSummary(
    content: string,
    type: 'tldr' | 'executive' | 'bullet_points' = 'executive'
  ): Promise<{ summary: string; processingTime: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    const imoResult = await imoService.generateSummaryPrompt({
      articleContent: content,
      summaryType: type
    });

    const prompt = Array.isArray(imoResult.prompt) 
      ? imoResult.prompt.join('\n') 
      : imoResult.prompt;

    const summary = await this.callLLM(prompt, {
      temperature: 0.4,
      maxTokens: 500
    });

    return {
      summary,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Generate social media content
   */
  async generateSocialPost(
    topic: string,
    platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram',
    articleUrl?: string
  ): Promise<{ post: string; hashtags: string[]; processingTime: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    const imoResult = await imoService.generateSocialPostPrompt({
      topic,
      platform,
      articleUrl
    });

    const prompt = Array.isArray(imoResult.prompt) 
      ? imoResult.prompt.join('\n') 
      : imoResult.prompt;

    const content = await this.callLLM(prompt, {
      temperature: 0.8,
      maxTokens: 300
    });

    // Extract hashtags
    const hashtagMatch = content.match(/#\w+/g) || [];

    return {
      post: content,
      hashtags: hashtagMatch,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Call LLM with prompt
   */
  private async callLLM(
    prompt: string,
    config: { temperature: number; maxTokens: number }
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert cryptocurrency journalist for CoinDaily Africa, specializing in African crypto markets.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`LLM call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Extract outline from reasoning response
   */
  private extractOutline(reasoningResponse: string): EnhancedContentResult['outline'] {
    // Simple extraction - in production, use more sophisticated parsing
    const lines = reasoningResponse.split('\n');
    const sections: string[] = [];
    let title = '';

    for (const line of lines) {
      if (line.match(/^#\s/)) {
        title = line.replace(/^#\s*/, '').trim();
      } else if (line.match(/^##\s|^-\s|^\d+\./)) {
        sections.push(line.replace(/^##\s*|^-\s*|^\d+\.\s*/, '').trim());
      }
    }

    return {
      title: title || 'Article Outline',
      sections: sections.slice(0, 7),
      targetKeywords: []
    };
  }

  /**
   * Analyze content quality
   */
  private analyzeContent(content: string, keywords: string[]): {
    wordCount: number;
    readabilityScore: number;
    seoScore: number;
    keywordsUsed: string[];
  } {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Calculate readability (simplified Flesch-Kincaid approximation)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
    const readabilityScore = Math.max(0, Math.min(100, 
      100 - (avgWordsPerSentence - 15) * 2
    ));

    // Calculate SEO score
    const contentLower = content.toLowerCase();
    const keywordsUsed = keywords.filter(k => contentLower.includes(k.toLowerCase()));
    const keywordDensity = keywordsUsed.length / Math.max(keywords.length, 1);
    
    const hasHeadings = content.includes('##') || content.includes('**');
    const hasGoodLength = wordCount >= 800 && wordCount <= 2000;
    
    const seoScore = Math.round(
      (keywordDensity * 40) +
      (hasHeadings ? 20 : 0) +
      (hasGoodLength ? 20 : 0) +
      Math.min(20, readabilityScore / 5)
    );

    return {
      wordCount,
      readabilityScore: Math.round(readabilityScore),
      seoScore: Math.min(100, seoScore),
      keywordsUsed
    };
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && await imoService.healthCheck();
  }
}

export const imoContentAgent = new ImoContentGenerationAgent();
