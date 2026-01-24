/**
 * Quality Review Agent - Task 12
 * Google Gemini integration for content quality review and bias detection
 * Implements automated content quality scoring, bias detection, African cultural sensitivity review,
 * fact-checking integration, and content improvement suggestions
 */

import { VertexAI } from '@google-cloud/vertexai';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { 
  QualityReviewTask, 
  AfricanMarketContext,
  TaskStatus,
  AITask
} from '../types/ai-system';

export interface QualityReviewConfig {
  projectId: string;
  location: string;
  modelName: string;
  qualityThreshold: number;
  biasThreshold: number;
  culturalSensitivityThreshold: number;
  maxTokens: number;
  temperature: number;
  timeoutMs?: number;
}

export interface QualityDimensions {
  accuracy: number;
  clarity: number;
  engagement: number;
  structure: number;
  grammar: number;
  factualConsistency: number;
  africanRelevance: number;
  culturalSensitivity: number;
}

export interface BiasAnalysis {
  overallBias: number;
  types: string[];
  concerns: string[];
  details?: {
    culturalBias: number;
    geographicBias: number;
    economicBias: number;
    genderBias: number;
    ageBias: number;
    religiousBias?: number;
  };
}

export interface CulturalAnalysis {
  religiousContext: {
    score: number;
    considerations: string[];
  };
  languageUsage: {
    score: number;
    localTerms: string[];
    appropriateness: 'low' | 'medium' | 'high';
    issues?: string[];
  };
  socialContext: {
    score: number;
    communityAspects: string[];
    economicRealities: string;
  };
}

export interface FactCheck {
  score: number;
  verifiedClaims: string[];
  questionableClaims: string[];
  falseClaims: string[];
  sources: string[];
}

export interface ImprovementSuggestion {
  category: 'structure' | 'engagement' | 'accuracy' | 'african_context' | 'cultural_sensitivity' | 'clarity';
  priority: 'low' | 'medium' | 'high';
  suggestion: string;
  specificChanges: string[];
}

export interface QualityReview {
  overallQuality: number;
  dimensions: QualityDimensions;
  biasAnalysis: BiasAnalysis;
  culturalAnalysis?: CulturalAnalysis;
  factCheck?: FactCheck;
  improvementSuggestions?: ImprovementSuggestion[];
  recommendations: string[];
  requiresHumanReview: boolean;
}

export interface QualityReviewResult {
  success: boolean;
  review?: QualityReview;
  error?: string;
  processingTime: number;
}

export interface QualityAgentMetrics {
  totalTasksProcessed: number;
  successRate: number;
  averageQualityScore: number;
  averageProcessingTime: number;
  biasDetectionRate: number;
  culturalSensitivityScore: number;
  factCheckAccuracy: number;
  lastError?: {
    message: string;
    timestamp: Date;
    taskId: string;
  };
}

export class QualityReviewAgent {
  private prisma: PrismaClient;
  private logger: Logger;
  private config: QualityReviewConfig;
  private vertexAI: VertexAI;
  private model: any;
  private metrics: QualityAgentMetrics;

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    config: QualityReviewConfig
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.config = {
      timeoutMs: 30000,
      ...config
    };

    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: this.config.projectId,
      location: this.config.location
    });

    this.model = this.vertexAI.getGenerativeModel({
      model: this.config.modelName,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        topP: 0.8,
        topK: 40
      }
    });

    // Initialize metrics
    this.metrics = {
      totalTasksProcessed: 0,
      successRate: 0,
      averageQualityScore: 0,
      averageProcessingTime: 0,
      biasDetectionRate: 0,
      culturalSensitivityScore: 0,
      factCheckAccuracy: 0
    };

    this.logger.info('Quality Review Agent initialized', { 
      model: this.config.modelName,
      qualityThreshold: this.config.qualityThreshold,
      biasThreshold: this.config.biasThreshold
    });
  }

  /**
   * Process a quality review task
   */
  async processTask(task: QualityReviewTask): Promise<QualityReviewResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Processing quality review task', { 
        taskId: task.id, 
        contentId: task.payload.contentId,
        contentType: task.payload.contentType,
        reviewCriteria: task.payload.reviewCriteria
      });

      // Validate task payload
      this.validateTask(task);

      // Set timeout if specified
      const timeoutMs = task.metadata.timeoutMs || this.config.timeoutMs!;
      const reviewPromise = this.performQualityReview(task);
      
      let review: QualityReview;
      if (timeoutMs > 0) {
        review = await this.withTimeout(reviewPromise, timeoutMs);
      } else {
        review = await reviewPromise;
      }

      const processingTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(true, processingTime, review.overallQuality, review.biasAnalysis);

      // Determine if review passes threshold
      const passesQualityThreshold = review.overallQuality >= this.config.qualityThreshold;
      const passesBiasThreshold = review.biasAnalysis.overallBias <= this.config.biasThreshold;
      const passesCulturalThreshold = !review.culturalAnalysis || 
        review.dimensions.culturalSensitivity >= this.config.culturalSensitivityThreshold;

      const success = passesQualityThreshold && passesBiasThreshold && passesCulturalThreshold;

      if (!success) {
        this.logger.warn('Content failed quality review', {
          taskId: task.id,
          qualityScore: review.overallQuality,
          biasScore: review.biasAnalysis.overallBias,
          culturalScore: review.dimensions.culturalSensitivity,
          thresholds: {
            quality: this.config.qualityThreshold,
            bias: this.config.biasThreshold,
            cultural: this.config.culturalSensitivityThreshold
          }
        });
      }

      return {
        success,
        review,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.updateMetrics(false, processingTime, 0, { overallBias: 0, types: [], concerns: [] });
      this.metrics.lastError = {
        message: errorMessage,
        timestamp: new Date(),
        taskId: task.id
      };

      this.logger.error('Quality review task failed', { 
        taskId: task.id,
        error: errorMessage,
        processingTime
      });

      return {
        success: false,
        error: errorMessage,
        processingTime
      };
    }
  }

  /**
   * Perform comprehensive quality review using Google Gemini
   */
  private async performQualityReview(task: QualityReviewTask): Promise<QualityReview> {
    const { content, contentType, reviewCriteria, africanContext, requiresFactCheck } = task.payload;

    // Gather additional context for fact-checking
    let factCheckContext = '';
    if (requiresFactCheck) {
      factCheckContext = await this.gatherFactCheckContext(content);
    }

    // Build comprehensive prompt
    const prompt = this.buildReviewPrompt(
      content,
      contentType,
      reviewCriteria,
      africanContext,
      requiresFactCheck,
      factCheckContext
    );

    // Call Gemini API
    const response = await this.model.generateContent(prompt);
    const responseText = response.response.text();

    // Parse and validate response
    let reviewData;
    try {
      reviewData = JSON.parse(responseText);
    } catch (error) {
      throw new Error(`Failed to parse Gemini response as JSON: ${error}`);
    }

    // Validate and normalize response structure
    return this.validateAndNormalizeReview(reviewData, reviewCriteria);
  }

  /**
   * Build comprehensive review prompt for Gemini
   */
  private buildReviewPrompt(
    content: string,
    contentType: string,
    reviewCriteria: string[],
    africanContext: AfricanMarketContext,
    requiresFactCheck: boolean,
    factCheckContext: string
  ): string {
    const africanContextStr = JSON.stringify(africanContext, null, 2);
    
    return `You are an expert content quality reviewer specializing in African cryptocurrency and blockchain content. 
    Analyze the following ${contentType} content and provide a comprehensive quality assessment.

    CONTENT TO REVIEW:
    "${content}"

    AFRICAN MARKET CONTEXT:
    ${africanContextStr}

    REVIEW CRITERIA: ${reviewCriteria.join(', ')}

    ${requiresFactCheck ? `
    FACT-CHECK CONTEXT (Recent related content for verification):
    ${factCheckContext}
    ` : ''}

    ANALYSIS REQUIREMENTS:
    1. Evaluate quality across these dimensions (0-100 scale):
       - accuracy: Factual correctness and reliability
       - clarity: Readability and comprehension
       - engagement: Reader interest and value
       - structure: Organization and flow
       - grammar: Language correctness
       - factualConsistency: Internal consistency and logic
       - africanRelevance: Relevance to African crypto markets
       - culturalSensitivity: Appropriate for African audiences

    2. Bias Analysis (0-100 scale, where 0 = no bias, 100 = extreme bias):
       - Identify bias types: cultural, geographic, economic, gender, age, religious
       - List specific concerns
       - Provide overall bias score

    3. African Cultural Context Analysis:
       - Religious considerations (Islamic finance, Christian values)
       - Language usage and local terminology
       - Social and economic realities
       - Community aspects and family considerations

    ${requiresFactCheck ? `
    4. Fact-checking Analysis:
       - Verify claims against available data
       - Identify questionable or false statements
       - Score factual accuracy (0-100)
       - List sources used for verification
    ` : ''}

    5. Improvement Suggestions:
       - Specific, actionable recommendations
       - Priority levels: low, medium, high
       - Category classification
       - Detailed change suggestions

    AFRICAN-SPECIFIC CONSIDERATIONS:
    - Mobile money integration context (${africanContext.mobileMoneyProviders.join(', ')})
    - Local exchanges relevance (${africanContext.exchanges.join(', ')})
    - Regional languages and cultural nuances (${africanContext.languages.join(', ')})
    - Economic conditions and remittance patterns
    - Regulatory landscape across African countries
    - Religious and cultural sensitivities

    RESPONSE FORMAT (JSON only):
    {
      "overallQuality": number,
      "dimensions": {
        "accuracy": number,
        "clarity": number,
        "engagement": number,
        "structure": number,
        "grammar": number,
        "factualConsistency": number,
        "africanRelevance": number,
        "culturalSensitivity": number
      },
      "biasAnalysis": {
        "overallBias": number,
        "types": ["array of bias types found"],
        "concerns": ["array of specific bias concerns"],
        "details": {
          "culturalBias": number,
          "geographicBias": number,
          "economicBias": number,
          "genderBias": number,
          "ageBias": number,
          "religiousBias": number
        }
      },
      "culturalAnalysis": {
        "religiousContext": {
          "score": number,
          "considerations": ["array of religious considerations"]
        },
        "languageUsage": {
          "score": number,
          "localTerms": ["array of local terms used"],
          "appropriateness": "low|medium|high",
          "issues": ["array of language issues if any"]
        },
        "socialContext": {
          "score": number,
          "communityAspects": ["array of community aspects addressed"],
          "economicRealities": "string describing how well economic realities are addressed"
        }
      },
      ${requiresFactCheck ? `
      "factCheck": {
        "score": number,
        "verifiedClaims": ["array of verified statements"],
        "questionableClaims": ["array of questionable statements"],
        "falseClaims": ["array of false statements"],
        "sources": ["array of sources used for verification"]
      },
      ` : ''}
      "improvementSuggestions": [
        {
          "category": "structure|engagement|accuracy|african_context|cultural_sensitivity|clarity",
          "priority": "low|medium|high",
          "suggestion": "string describing the improvement",
          "specificChanges": ["array of specific changes to make"]
        }
      ],
      "recommendations": ["array of overall recommendations"],
      "requiresHumanReview": boolean
    }`;
  }

  /**
   * Gather context for fact-checking from recent articles
   */
  private async gatherFactCheckContext(content: string): Promise<string> {
    try {
      // Extract key topics/entities for context search
      const keywords = this.extractKeywords(content);
      
      // Find recent related articles for context
      const recentArticles = await this.prisma.article.findMany({
        where: {
          OR: keywords.map(keyword => ({
            title: { contains: keyword, mode: 'insensitive' }
          })),
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        take: 5,
        orderBy: { publishedAt: 'desc' },
        select: {
          title: true,
          excerpt: true,
          publishedAt: true
        }
      });

      return recentArticles.length > 0 
        ? `Recent related content:\n${recentArticles.map(a => 
            `- ${a.title} (${a.publishedAt?.toISOString().split('T')[0] || 'Unknown date'}): ${a.excerpt || 'No excerpt'}`
          ).join('\n')}`
        : 'No recent related content found for fact-checking context.';

    } catch (error) {
      this.logger.warn('Failed to gather fact-check context', { error: error instanceof Error ? error.message : 'Unknown' });
      return 'Unable to gather fact-checking context.';
    }
  }

  /**
   * Extract keywords from content for context search
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, this could use NLP libraries
    const cryptoTerms = ['bitcoin', 'ethereum', 'cryptocurrency', 'blockchain', 'defi', 'nft'];
    const africanTerms = ['nigeria', 'kenya', 'ghana', 'south africa', 'luno', 'quidax', 'binance'];
    const mobileMoneyTerms = ['mtn money', 'mpesa', 'airtel money', 'orange money'];
    
    const text = content.toLowerCase();
    const keywords: string[] = [];
    
    [...cryptoTerms, ...africanTerms, ...mobileMoneyTerms].forEach(term => {
      if (text.includes(term)) {
        keywords.push(term);
      }
    });
    
    return keywords.slice(0, 5); // Limit to 5 keywords
  }

  /**
   * Validate and normalize review response from Gemini
   */
  private validateAndNormalizeReview(reviewData: any, reviewCriteria: string[]): QualityReview {
    // Ensure all required fields exist with defaults
    const review: QualityReview = {
      overallQuality: this.validateScore(reviewData.overallQuality),
      dimensions: {
        accuracy: this.validateScore(reviewData.dimensions?.accuracy),
        clarity: this.validateScore(reviewData.dimensions?.clarity),
        engagement: this.validateScore(reviewData.dimensions?.engagement),
        structure: this.validateScore(reviewData.dimensions?.structure),
        grammar: this.validateScore(reviewData.dimensions?.grammar),
        factualConsistency: this.validateScore(reviewData.dimensions?.factualConsistency),
        africanRelevance: this.validateScore(reviewData.dimensions?.africanRelevance),
        culturalSensitivity: this.validateScore(reviewData.dimensions?.culturalSensitivity)
      },
      biasAnalysis: {
        overallBias: this.validateScore(reviewData.biasAnalysis?.overallBias, 0, 100),
        types: Array.isArray(reviewData.biasAnalysis?.types) ? reviewData.biasAnalysis.types : [],
        concerns: Array.isArray(reviewData.biasAnalysis?.concerns) ? reviewData.biasAnalysis.concerns : [],
        details: reviewData.biasAnalysis?.details
      },
      recommendations: Array.isArray(reviewData.recommendations) ? reviewData.recommendations : [],
      requiresHumanReview: Boolean(reviewData.requiresHumanReview)
    };

    // Add optional analyses if present in criteria
    if (reviewCriteria.includes('cultural_sensitivity') && reviewData.culturalAnalysis) {
      review.culturalAnalysis = reviewData.culturalAnalysis;
    }

    if (reviewCriteria.includes('fact_checking') && reviewData.factCheck) {
      review.factCheck = reviewData.factCheck;
    }

    if (reviewData.improvementSuggestions) {
      review.improvementSuggestions = Array.isArray(reviewData.improvementSuggestions) 
        ? reviewData.improvementSuggestions 
        : [];
    }

    return review;
  }

  /**
   * Validate score values (0-100)
   */
  private validateScore(score: any, min: number = 0, max: number = 100): number {
    const num = Number(score);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Validate task payload
   */
  private validateTask(task: QualityReviewTask): void {
    if (!task.payload.content || task.payload.content.trim().length === 0) {
      throw new Error('Content is required for quality review');
    }

    if (!task.payload.contentType) {
      throw new Error('Content type is required');
    }

    if (!Array.isArray(task.payload.reviewCriteria) || task.payload.reviewCriteria.length === 0) {
      throw new Error('Review criteria are required');
    }

    if (!task.payload.africanContext) {
      throw new Error('African context is required');
    }
  }

  /**
   * Execute promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Quality review timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Update agent metrics
   */
  private updateMetrics(
    success: boolean, 
    processingTime: number, 
    qualityScore: number, 
    biasAnalysis: BiasAnalysis
  ): void {
    this.metrics.totalTasksProcessed += 1;
    
    // Calculate success rate
    const successCount = Math.round(this.metrics.successRate * (this.metrics.totalTasksProcessed - 1)) + (success ? 1 : 0);
    this.metrics.successRate = successCount / this.metrics.totalTasksProcessed;

    // Update average quality score
    const totalQuality = this.metrics.averageQualityScore * (this.metrics.totalTasksProcessed - 1) + qualityScore;
    this.metrics.averageQualityScore = totalQuality / this.metrics.totalTasksProcessed;

    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalTasksProcessed - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalTasksProcessed;

    // Update bias detection rate
    if (biasAnalysis.types.length > 0) {
      const biasDetections = Math.round(this.metrics.biasDetectionRate * (this.metrics.totalTasksProcessed - 1)) + 1;
      this.metrics.biasDetectionRate = biasDetections / this.metrics.totalTasksProcessed;
    }

    // Update cultural sensitivity score (from dimensions if available)
    this.metrics.culturalSensitivityScore = this.metrics.averageQualityScore; // Simplified for now
    this.metrics.factCheckAccuracy = this.metrics.averageQualityScore; // Simplified for now
  }

  /**
   * Get agent performance metrics
   */
  getMetrics(): QualityAgentMetrics {
    return { ...this.metrics };
  }
}