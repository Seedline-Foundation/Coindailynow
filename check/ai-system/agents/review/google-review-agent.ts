// Google Review Agent - Powered by Google Gemini for comprehensive content review
// Handles research verification, content quality assessment, and translation review
/* eslint-disable @typescript-eslint/no-unused-vars */

import { createAuditLog, AuditActions } from '../../../lib/audit';

export interface ReviewRequest {
  reviewType: 'research' | 'content' | 'translation' | 'quality' | 'factcheck' | 'sentiment';
  content: unknown;
  metadata?: {
    originalLanguage?: string;
    targetLanguage?: string;
    expectedQuality?: number;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    source?: string;
    keywords?: string[];
    context?: Record<string, unknown>;
  };
  qualityThreshold?: number;
}

export interface ReviewResult {
  approved: boolean;
  qualityScore: number;
  confidence: number;
  feedback: string;
  suggestions?: string[];
  issues?: Array<{
    type: 'accuracy' | 'quality' | 'language' | 'structure' | 'factual' | 'seo';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion?: string;
  }>;
  metadata: {
    reviewType: string;
    processingTime: number;
    model: string;
    timestamp: Date;
  };
  nextStageApproved?: boolean;
  revisionsNeeded?: boolean;
}

export class GoogleReviewAgent {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1/models';
  private model: string = 'gemini-pro';
  private isInitialized: boolean = false;
  private reviewCache: Map<string, ReviewResult> = new Map();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  async initialize(): Promise<void> {
    console.log('🔍 Initializing Google Review Agent...');

    if (!this.apiKey) {
      throw new Error('Google AI API key not configured. Set GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable.');
    }

    try {
      // Test API connection
      const response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection'
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Google AI API connection failed: ${response.statusText}`);
      }

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'google_review_agent',
        resourceId: 'gemini_reviewer',
        details: { 
          initialized: true, 
          model: this.model,
          capabilities: [
            'research_verification',
            'content_quality_assessment', 
            'translation_review',
            'fact_checking',
            'sentiment_analysis',
            'quality_assurance'
          ]
        }
      });

      console.log('✅ Google Review Agent initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'google_review_agent',
        resourceId: 'gemini_reviewer',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async reviewContent(request: ReviewRequest): Promise<ReviewResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache for recent reviews
    const cachedResult = this.reviewCache.get(cacheKey);
    if (cachedResult && !this.isUrgentReview(request)) {
      console.log(`📋 Using cached review for ${request.reviewType}`);
      return cachedResult;
    }

    console.log(`🔍 Performing ${request.reviewType} review with Google Gemini...`);

    try {
      const reviewPrompt = this.buildReviewPrompt(request);
      const response = await this.callGeminiAPI(reviewPrompt);
      
      const result = this.processReviewResponse(response, request, startTime);

      // Cache result if not urgent
      if (!this.isUrgentReview(request)) {
        this.reviewCache.set(cacheKey, result);
        setTimeout(() => this.reviewCache.delete(cacheKey), this.cacheTimeout);
      }

      // Log successful review
      await createAuditLog({
        action: AuditActions.ARTICLE_UPDATE,
        resource: 'content_review',
        resourceId: `review_${Date.now()}`,
        details: {
          reviewType: request.reviewType,
          approved: result.approved,
          qualityScore: result.qualityScore,
          confidence: result.confidence,
          processingTime: result.metadata.processingTime,
          issuesFound: result.issues?.length || 0,
          nextStageApproved: result.nextStageApproved
        }
      });

      console.log(`✅ Review completed: ${result.approved ? 'APPROVED' : 'REJECTED'} (Score: ${result.qualityScore.toFixed(2)})`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Review failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'content_review',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          reviewType: request.reviewType
        }
      });

      throw new Error(`Google review failed: ${errorMessage}`);
    }
  }

  private buildReviewPrompt(request: ReviewRequest): string {
    const basePrompt = `You are an expert content reviewer for CoinDaily Africa, the continent's largest AI-driven crypto news platform. Your role is to provide thorough, objective content review.

Review Guidelines:
- Maintain high editorial standards while being fair and constructive
- Focus on accuracy, clarity, and relevance to African crypto markets
- Provide specific, actionable feedback
- Consider SEO optimization and reader engagement
- Ensure factual accuracy and source credibility

`;

    const typeSpecificPrompts = {
      research: `
Review Type: RESEARCH VERIFICATION
Task: Evaluate the quality and accuracy of research data.

Evaluation Criteria:
- Source credibility and reliability
- Data accuracy and recency
- Completeness of information
- Relevance to African crypto markets
- Factual consistency

Please provide:
1. Quality score (0-100)
2. Approval recommendation (approve/reject)
3. Specific feedback on strengths and weaknesses
4. Suggestions for improvement
5. Any factual inaccuracies identified`,

      content: `
Review Type: CONTENT QUALITY ASSESSMENT  
Task: Evaluate written content quality and readability.

Evaluation Criteria:
- Writing quality and clarity
- SEO optimization
- African market relevance
- Engagement potential
- Structure and flow
- Grammar and style

Please provide:
1. Quality score (0-100)
2. Approval recommendation (approve/reject)
3. Writing quality assessment
4. SEO optimization suggestions
5. Readability improvements`,

      translation: `
Review Type: TRANSLATION REVIEW
Task: Evaluate translation quality and cultural adaptation.

Evaluation Criteria:
- Translation accuracy
- Cultural appropriateness for African markets
- Language fluency and naturalness
- Technical term consistency
- Meaning preservation

Original Language: ${request.metadata?.originalLanguage || 'English'}
Target Language: ${request.metadata?.targetLanguage || 'Unknown'}

Please provide:
1. Quality score (0-100)
2. Approval recommendation (approve/reject)
3. Translation accuracy assessment
4. Cultural adaptation feedback
5. Language improvement suggestions`,

      quality: `
Review Type: FINAL QUALITY ASSURANCE
Task: Comprehensive quality check before human editor review.

Evaluation Criteria:
- Overall content quality
- Editorial standards compliance
- Brand voice consistency
- Legal and regulatory compliance
- Publication readiness

Please provide:
1. Quality score (0-100)
2. Publication readiness (ready/needs_work)
3. Final quality assessment
4. Editorial compliance check
5. Recommendations for publication`,

      factcheck: `
Review Type: FACT CHECKING
Task: Verify factual accuracy and source credibility.

Evaluation Criteria:
- Factual accuracy of claims
- Source credibility verification
- Data currency and relevance
- Cross-reference validation
- Bias detection

Please provide:
1. Accuracy score (0-100)
2. Fact check status (verified/questionable/false)
3. Source credibility assessment
4. Factual inaccuracies identified
5. Additional verification needed`,

      sentiment: `
Review Type: SENTIMENT ANALYSIS
Task: Evaluate content sentiment and social media readiness.

Evaluation Criteria:
- Sentiment appropriateness
- Social media virality potential
- Community reaction prediction
- Brand alignment
- Engagement optimization

Please provide:
1. Sentiment score (0-100)
2. Social readiness (ready/needs_adjustment)
3. Sentiment analysis summary
4. Virality potential assessment
5. Community engagement predictions`
    };

    let prompt = basePrompt + (typeSpecificPrompts[request.reviewType as keyof typeof typeSpecificPrompts] || typeSpecificPrompts.quality);

    // Add content to review
    prompt += `\n\nCONTENT TO REVIEW:\n${JSON.stringify(request.content, null, 2)}`;

    // Add metadata context
    if (request.metadata) {
      prompt += `\n\nADDITIONAL CONTEXT:\n${JSON.stringify(request.metadata, null, 2)}`;
    }

    prompt += `\n\nPlease provide your review in the following JSON format:
{
  "approved": boolean,
  "qualityScore": number (0-100),
  "confidence": number (0-1),
  "feedback": "detailed feedback string",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "issues": [
    {
      "type": "accuracy|quality|language|structure|factual|seo",
      "severity": "low|medium|high|critical", 
      "description": "issue description",
      "suggestion": "how to fix"
    }
  ]
}`;

    return prompt;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent reviews
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Google AI API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private processReviewResponse(response: string, request: ReviewRequest, startTime: number): ReviewResult {
    const processingTime = Date.now() - startTime;
    
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const result: ReviewResult = {
          approved: Boolean(parsed.approved),
          qualityScore: Math.max(0, Math.min(100, Number(parsed.qualityScore) || 0)),
          confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
          feedback: String(parsed.feedback || 'Review completed'),
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          metadata: {
            reviewType: request.reviewType,
            processingTime,
            model: this.model,
            timestamp: new Date()
          },
          nextStageApproved: false,
          revisionsNeeded: false
        };

        // Determine if content can proceed to next stage
        const threshold = request.qualityThreshold || this.getDefaultThreshold(request.reviewType);
        result.nextStageApproved = result.approved && result.qualityScore >= threshold;
        result.revisionsNeeded = !result.approved || result.qualityScore < threshold;

        return result;
      }
    } catch (error) {
      console.warn('Failed to parse structured review response, using fallback');
    }

    // Fallback for unstructured responses
    return this.createFallbackResult(response, request, processingTime);
  }

  private createFallbackResult(response: string, request: ReviewRequest, processingTime: number): ReviewResult {
    // Simple heuristic analysis for fallback
    const positiveWords = ['good', 'excellent', 'approved', 'quality', 'accurate', 'well-written'];
    const negativeWords = ['poor', 'incorrect', 'rejected', 'inaccurate', 'needs work', 'unclear'];
    
    const lowerResponse = response.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerResponse.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerResponse.includes(word)).length;
    
    const qualityScore = Math.max(30, Math.min(95, 50 + (positiveCount - negativeCount) * 10));
    const approved = qualityScore >= (request.qualityThreshold || this.getDefaultThreshold(request.reviewType));

    return {
      approved,
      qualityScore,
      confidence: 0.6, // Lower confidence for fallback
      feedback: response.slice(0, 500), // Truncate if too long
      suggestions: [],
      issues: [],
      metadata: {
        reviewType: request.reviewType,
        processingTime,
        model: `${this.model}_fallback`,
        timestamp: new Date()
      },
      nextStageApproved: approved,
      revisionsNeeded: !approved
    };
  }

  private getDefaultThreshold(reviewType: string): number {
    const thresholds = {
      research: 75,
      content: 70,
      translation: 80,
      quality: 85,
      factcheck: 85,
      sentiment: 65
    };
    return thresholds[reviewType as keyof typeof thresholds] || 75;
  }

  private isUrgentReview(request: ReviewRequest): boolean {
    return request.metadata?.urgency === 'critical' || request.metadata?.urgency === 'high';
  }

  private generateCacheKey(request: ReviewRequest): string {
    const contentHash = this.hashContent(request.content);
    return `google_review:${request.reviewType}:${contentHash}:${request.qualityThreshold || 'default'}`;
  }

  private hashContent(content: unknown): string {
    // Simple hash function for caching
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Specialized review methods for different types
  async reviewResearch(content: unknown, metadata?: Record<string, unknown>): Promise<ReviewResult> {
    return this.reviewContent({
      reviewType: 'research',
      content,
      metadata,
      qualityThreshold: 75
    });
  }

  async reviewContentQuality(content: unknown, metadata?: Record<string, unknown>): Promise<ReviewResult> {
    return this.reviewContent({
      reviewType: 'content',
      content,
      metadata,
      qualityThreshold: 70
    });
  }

  async reviewTranslation(content: unknown, originalLanguage: string, targetLanguage: string, metadata?: Record<string, unknown>): Promise<ReviewResult> {
    return this.reviewContent({
      reviewType: 'translation',
      content,
      metadata: {
        ...metadata,
        originalLanguage,
        targetLanguage
      },
      qualityThreshold: 80
    });
  }

  async performFactCheck(content: unknown, metadata?: Record<string, unknown>): Promise<ReviewResult> {
    return this.reviewContent({
      reviewType: 'factcheck',
      content,
      metadata,
      qualityThreshold: 85
    });
  }

  async analyzeSentiment(content: unknown, metadata?: Record<string, unknown>): Promise<ReviewResult> {
    return this.reviewContent({
      reviewType: 'sentiment',
      content,
      metadata,
      qualityThreshold: 65
    });
  }

  async performQualityAssurance(content: unknown, metadata?: Record<string, unknown>): Promise<ReviewResult> {
    return this.reviewContent({
      reviewType: 'quality',
      content,
      metadata,
      qualityThreshold: 85
    });
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          details: { 
            apiKey: !!this.apiKey, 
            model: this.model,
            cacheSize: this.reviewCache.size
          }
        };
      }

      // Quick API test
      const testResponse = await this.callGeminiAPI('Health check test');
      
      return {
        status: 'healthy',
        details: {
          apiKey: !!this.apiKey,
          model: this.model,
          initialized: this.isInitialized,
          cacheSize: this.reviewCache.size,
          testResponse: !!testResponse
        }
      };

    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          initialized: this.isInitialized,
          apiKey: !!this.apiKey
        }
      };
    }
  }

  // Clear cache method
  clearCache(): void {
    this.reviewCache.clear();
    console.log('🧹 Google Review Agent cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.reviewCache.size,
      keys: Array.from(this.reviewCache.keys())
    };
  }
}

// Create singleton instance
export const googleReviewAgent = new GoogleReviewAgent();
