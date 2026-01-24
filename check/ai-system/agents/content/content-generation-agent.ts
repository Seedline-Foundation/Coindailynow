// Content Generation Agent - ChatGPT-powered writing for CoinDaily Africa
// Handles article writing, content optimization, and SEO-focused content creation

import { createAuditLog } from '../../../lib/audit';
import { AuditActions } from '../../../lib/audit';

export interface ContentGenerationRequest {
  type: 'article' | 'summary' | 'social_post' | 'headline' | 'meta_description';
  prompt: string;
  context?: {
    marketData?: Record<string, unknown>;
    relatedArticles?: string[];
    targetKeywords?: string[];
    tone?: 'professional' | 'casual' | 'technical' | 'beginner-friendly';
    wordCount?: number;
    africanFocus?: boolean;
  };
  constraints?: {
    maxLength?: number;
    includeKeywords?: string[];
    avoidTopics?: string[];
    requireSources?: boolean;
  };
}

export interface ContentGenerationResult {
  content: string;
  metadata: {
    wordCount: number;
    readabilityScore: number;
    seoScore: number;
    keywordsUsed: string[];
    estimatedReadTime: number;
    language: string;
  };
  suggestions?: {
    improvements?: string[];
    relatedTopics?: string[];
    seoOptimizations?: string[];
  };
}

export class ContentGenerationAgent {
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

    // Test API connection
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API connection failed: ${response.statusText}`);
      }

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'content_generation_agent',
        resourceId: 'chatgpt',
        details: { initialized: true, model: this.model }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'content_generation_agent',
        resourceId: 'chatgpt',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Build system prompt for African crypto news context
      const systemPrompt = this.buildSystemPrompt(request);
      
      // Build user prompt with context
      const userPrompt = this.buildUserPrompt(request);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: this.getMaxTokens(request),
          temperature: this.getTemperature(request),
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content;

      if (!generatedContent) {
        throw new Error('No content generated from OpenAI API');
      }

      // Analyze and process the generated content
      const result = await this.processGeneratedContent(generatedContent, request);

      const processingTime = Date.now() - startTime;

      // Log successful generation
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'content_generation',
        resourceId: `content_${Date.now()}`,
        details: {
          type: request.type,
          wordCount: result.metadata.wordCount,
          processingTime,
          seoScore: result.metadata.seoScore
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Content generation failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'content_generation',
        resourceId: 'error',
        details: { error: errorMessage, processingTime, requestType: request.type }
      });

      throw new Error(`Content generation failed: ${errorMessage}`);
    }
  }

  private buildSystemPrompt(request: ContentGenerationRequest): string {
    const basePrompt = `You are an expert cryptocurrency and financial journalist specializing in African markets. You write for CoinDaily Africa, the continent's largest AI-driven crypto news platform.

Key Guidelines:
- Focus on African cryptocurrency markets, adoption, and regulatory developments
- Write in clear, engaging, and SEO-optimized language
- Include relevant African context and local market implications
- Maintain professional credibility while being accessible to all skill levels
- Always fact-check and provide accurate, up-to-date information
- Optimize for search engines while prioritizing readability`;

    const typeSpecificGuidelines = {
      article: `
- Write comprehensive, well-structured articles with clear headlines
- Include introduction, body with subheadings, and conclusion
- Target 800-1500 words for optimal SEO performance
- Include relevant statistics and market data when available`,
      
      summary: `
- Create concise, informative summaries
- Highlight key points and main takeaways
- Target 150-300 words
- Focus on actionable insights`,
      
      social_post: `
- Write engaging, shareable social media content
- Include relevant hashtags and call-to-action
- Target 100-200 words
- Optimize for engagement and virality`,
      
      headline: `
- Create compelling, click-worthy headlines
- Include target keywords naturally
- Keep under 60 characters for SEO
- Focus on African angle when relevant`,
      
      meta_description: `
- Write compelling meta descriptions for SEO
- Include primary keywords naturally
- Stay within 150-160 characters
- Include call-to-action when appropriate`
    };

    let prompt = basePrompt;
    
    if (request.type in typeSpecificGuidelines) {
      prompt += typeSpecificGuidelines[request.type as keyof typeof typeSpecificGuidelines];
    }

    if (request.context?.africanFocus) {
      prompt += `
- Emphasize African market perspectives and implications
- Include relevant African cryptocurrency exchanges and projects
- Consider regulatory landscape across African countries`;
    }

    if (request.context?.tone) {
      const toneGuides = {
        professional: '- Use formal, authoritative tone suitable for financial publications',
        casual: '- Use conversational, approachable tone while maintaining credibility',
        technical: '- Use precise technical language for experienced crypto users',
        'beginner-friendly': '- Explain complex concepts in simple terms for newcomers'
      };
      prompt += `
${toneGuides[request.context.tone]}`;
    }

    return prompt;
  }

  private buildUserPrompt(request: ContentGenerationRequest): string {
    let prompt = `Content Request: ${request.prompt}`;

    if (request.context) {
      if (request.context.targetKeywords) {
        prompt += `\n\nTarget Keywords: ${request.context.targetKeywords.join(', ')}`;
      }
      
      if (request.context.wordCount) {
        prompt += `\n\nTarget Word Count: ${request.context.wordCount} words`;
      }

      if (request.context.marketData) {
        prompt += `\n\nRelevant Market Data: ${JSON.stringify(request.context.marketData, null, 2)}`;
      }
    }

    if (request.constraints) {
      if (request.constraints.maxLength) {
        prompt += `\n\nMaximum Length: ${request.constraints.maxLength} characters`;
      }
      
      if (request.constraints.includeKeywords) {
        prompt += `\n\nRequired Keywords: ${request.constraints.includeKeywords.join(', ')}`;
      }
      
      if (request.constraints.avoidTopics) {
        prompt += `\n\nAvoid Topics: ${request.constraints.avoidTopics.join(', ')}`;
      }
    }

    return prompt;
  }

  private getMaxTokens(request: ContentGenerationRequest): number {
    const tokenLimits = {
      article: 2000,
      summary: 400,
      social_post: 300,
      headline: 50,
      meta_description: 100
    };

    return tokenLimits[request.type] || 1000;
  }

  private getTemperature(request: ContentGenerationRequest): number {
    const temperatures = {
      article: 0.7,
      summary: 0.5,
      social_post: 0.8,
      headline: 0.9,
      meta_description: 0.6
    };

    return temperatures[request.type] || 0.7;
  }

  private async processGeneratedContent(
    content: string, 
    request: ContentGenerationRequest
  ): Promise<ContentGenerationResult> {
    // Calculate basic metrics
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Simple readability score (Flesch-Kincaid approximation)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore = Math.max(0, Math.min(100, 100 - avgWordsPerSentence * 2));

    // Basic SEO score calculation
    let seoScore = 50; // Base score
    
    if (request.context?.targetKeywords) {
      const keywordsFound = request.context.targetKeywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      seoScore += (keywordsFound.length / request.context.targetKeywords.length) * 30;
    }

    // Content length optimization
    if (request.type === 'article' && wordCount >= 800 && wordCount <= 1500) {
      seoScore += 10;
    } else if (request.type === 'meta_description' && content.length <= 160) {
      seoScore += 15;
    }

    // Extract used keywords (simple approach)
    const keywordsUsed = request.context?.targetKeywords?.filter(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    ) || [];

    return {
      content,
      metadata: {
        wordCount,
        readabilityScore: Math.round(readabilityScore),
        seoScore: Math.round(seoScore),
        keywordsUsed,
        estimatedReadTime: readingTime,
        language: 'en'
      },
      suggestions: {
        improvements: this.generateImprovementSuggestions(content, request),
        relatedTopics: this.generateRelatedTopics(request),
        seoOptimizations: this.generateSEOSuggestions(content, request)
      }
    };
  }

  private generateImprovementSuggestions(content: string, request: ContentGenerationRequest): string[] {
    const suggestions: string[] = [];
    
    const wordCount = content.split(/\s+/).length;
    
    if (request.type === 'article' && wordCount < 800) {
      suggestions.push('Consider expanding the article to reach the optimal 800-1500 word range for SEO');
    }
    
    if (!content.includes('Africa') && request.context?.africanFocus) {
      suggestions.push('Add more African market context and regional perspectives');
    }
    
    if (request.context?.targetKeywords) {
      const missingKeywords = request.context.targetKeywords.filter(keyword =>
        !content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (missingKeywords.length > 0) {
        suggestions.push(`Consider incorporating these target keywords: ${missingKeywords.join(', ')}`);
      }
    }

    return suggestions;
  }

  private generateRelatedTopics(request: ContentGenerationRequest): string[] {
    const baseTopics = [
      'African cryptocurrency regulations',
      'Bitcoin adoption in Africa',
      'African crypto exchanges',
      'Blockchain technology in Africa',
      'Digital currency trends'
    ];

    // Add context-specific topics
    if (request.prompt.toLowerCase().includes('bitcoin')) {
      baseTopics.push('Bitcoin mining in Africa', 'Bitcoin remittances');
    }
    
    if (request.prompt.toLowerCase().includes('regulation')) {
      baseTopics.push('Central Bank Digital Currencies (CBDCs)', 'Cryptocurrency legal framework');
    }

    return baseTopics.slice(0, 5);
  }

  private generateSEOSuggestions(content: string, request: ContentGenerationRequest): string[] {
    const suggestions: string[] = [];
    
    if (request.type === 'article') {
      if (!content.includes('<h2>') && !content.includes('##')) {
        suggestions.push('Add subheadings (H2, H3) to improve content structure');
      }
      
      if (content.length < 1000) {
        suggestions.push('Consider expanding content length for better SEO performance');
      }
    }
    
    if (request.type === 'meta_description' && content.length > 160) {
      suggestions.push('Meta description should be under 160 characters for optimal display');
    }
    
    if (!content.toLowerCase().includes('africa') && request.context?.africanFocus) {
      suggestions.push('Include "Africa" or regional keywords for better local SEO');
    }

    return suggestions;
  }

  async healthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          details: { apiKey: !!this.apiKey, model: this.model }
        };
      }

      // Quick API test
      const testResponse = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        status: testResponse.ok ? 'healthy' : 'api_error',
        details: {
          apiKey: !!this.apiKey,
          model: this.model,
          initialized: this.isInitialized,
          apiStatus: testResponse.status
        }
      };

    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          initialized: this.isInitialized
        }
      };
    }
  }
}

// Export singleton instance
export const contentGenerationAgent = new ContentGenerationAgent();
