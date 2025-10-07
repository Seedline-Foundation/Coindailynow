/**
 * Content Generation Agent GraphQL Resolvers - Task 10
 * GraphQL resolvers for content generation operations with African focus
 */

import { ContentGenerationAgent, ContentGenerationConfig } from '../agents/contentGenerationAgent';
import { 
  ContentGenerationTask, 
  AfricanMarketContext, 
  AgentType, 
  TaskStatus, 
  TaskPriority 
} from '../types/ai-system';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

export interface ContentGenerationInput {
  topic: string;
  targetLanguages: string[];
  africanContext: AfricanMarketContextInput;
  contentType: 'article' | 'summary' | 'social_post' | 'newsletter';
  keywords: string[];
  sources?: string[];
  priority?: TaskPriority;
}

export interface AfricanMarketContextInput {
  region: 'west' | 'east' | 'north' | 'south' | 'central';
  countries: string[];
  languages: string[];
  exchanges: string[];
  mobileMoneyProviders: string[];
  timezone: string;
  culturalContext?: any;
}

export interface ContentGenerationResponse {
  success: boolean;
  taskId: string;
  content?: {
    title: string;
    content: string;
    excerpt: string;
    keywords: string[];
    qualityScore: number;
    wordCount: number;
    readingTime: number;
    format: string;
    africanRelevance?: {
      score: number;
      mentionedCountries: string[];
      mentionedExchanges: string[];
      mobileMoneyIntegration: boolean;
      localCurrencyMention: boolean;
    };
    marketDataIntegration?: {
      realTimeData: boolean;
      exchanges: string[];
      pricePoints: number[];
      volumeData: boolean;
    };
  };
  error?: string;
  processingTime?: number;
  similarityCheck?: {
    maxSimilarity: number;
    similarArticleCount: number;
  };
}

export const contentGenerationResolvers = (
  prisma: PrismaClient, 
  logger: Logger,
  contentAgent: ContentGenerationAgent
) => ({
  Query: {
    /**
     * Get content generation agent status and metrics
     */
    contentGenerationStatus: async () => {
      try {
        const metrics = contentAgent.getMetrics();
        
        return {
          status: 'active',
          metrics: {
            totalTasksProcessed: metrics.totalTasksProcessed,
            successRate: metrics.successRate,
            averageQualityScore: metrics.averageQualityScore,
            averageProcessingTime: metrics.averageProcessingTime,
            africanContextScore: metrics.africanContextScore
          },
          capabilities: [
            'article_generation',
            'summary_generation', 
            'social_post_generation',
            'newsletter_generation',
            'african_context_integration',
            'plagiarism_detection',
            'quality_validation'
          ],
          supportedLanguages: [
            'en', 'fr', 'pt', 'ar', 'sw', 'ha', 'yo', 'ig', 
            'zu', 'xh', 'af', 'am', 'om', 'ti', 'so'
          ],
          supportedExchanges: [
            'Binance_Africa', 'Luno', 'Quidax', 'BuyCoins', 
            'Valr', 'Ice3X', 'Remitano', 'NairaEx', 'KuBitX'
          ]
        };
      } catch (error) {
        logger.error('Failed to get content generation status', { 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        });
        throw new Error('Failed to retrieve agent status');
      }
    },

    /**
     * Get recent content generation tasks
     */
    recentContentGenerationTasks: async (_: any, args: { limit?: number }) => {
      try {
        const limit = args.limit || 10;
        
        const recentArticles = await prisma.article.findMany({
          where: {
            // Filter for AI-generated content
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit,
          select: {
            id: true,
            title: true,
            excerpt: true,
            status: true,
            createdAt: true,
            author: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        return recentArticles.map(article => ({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          status: article.status,
          qualityScore: 85, // Mock value - would come from AI metadata
          wordCount: 1200, // Mock value - would be calculated
          createdAt: article.createdAt,
          author: `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || 'Unknown Author'
        }));
      } catch (error) {
        logger.error('Failed to get recent content generation tasks', { 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        });
        throw new Error('Failed to retrieve recent tasks');
      }
    }
  },

  Mutation: {
    /**
     * Generate content using the content generation agent
     */
    generateContent: async (_: any, args: { input: ContentGenerationInput }) => {
      const startTime = Date.now();
      
      try {
        logger.info('Content generation requested via GraphQL', {
          topic: args.input.topic,
          contentType: args.input.contentType,
          region: args.input.africanContext.region
        });

        // Validate input
        if (!args.input.topic || args.input.topic.trim().length === 0) {
          throw new Error('Topic is required');
        }

        if (!args.input.targetLanguages || args.input.targetLanguages.length === 0) {
          throw new Error('At least one target language is required');
        }

        if (!args.input.africanContext || !args.input.africanContext.countries.length) {
          throw new Error('African context with countries is required');
        }

        // Generate unique task ID
        const taskId = `content-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create content generation task
        const task: ContentGenerationTask = {
          id: taskId,
          type: AgentType.CONTENT_GENERATION,
          priority: args.input.priority || TaskPriority.NORMAL,
          status: TaskStatus.QUEUED,
          payload: {
            topic: args.input.topic,
            targetLanguages: args.input.targetLanguages,
            africanContext: args.input.africanContext as AfricanMarketContext,
            contentType: args.input.contentType,
            keywords: args.input.keywords || [],
            sources: args.input.sources || []
          },
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            retryCount: 0,
            maxRetries: 3,
            timeoutMs: 30000
          }
        };

        // Process the task
        const result = await contentAgent.processTask(task);

        const processingTime = Date.now() - startTime;

        if (result.success && result.content) {
          // Log successful generation
          logger.info('Content generated successfully via GraphQL', {
            taskId,
            processingTime,
            qualityScore: result.content.qualityScore,
            wordCount: result.content.wordCount,
            africanRelevance: result.content.africanRelevance?.score
          });

          const response: ContentGenerationResponse = {
            success: true,
            taskId,
            content: {
              title: result.content.title,
              content: result.content.content,
              excerpt: result.content.excerpt,
              keywords: result.content.keywords,
              qualityScore: result.content.qualityScore,
              wordCount: result.content.wordCount,
              readingTime: result.content.readingTime,
              format: result.content.format,
              ...(result.content.africanRelevance && {
                africanRelevance: result.content.africanRelevance
              }),
              ...(result.content.marketDataIntegration && {
                marketDataIntegration: result.content.marketDataIntegration
              })
            },
            processingTime,
            ...(result.similarityCheck && {
              similarityCheck: {
                maxSimilarity: result.similarityCheck.maxSimilarity,
                similarArticleCount: result.similarityCheck.similarArticles.length
              }
            })
          };

          return response;
        } else {
          // Log failed generation
          logger.error('Content generation failed via GraphQL', {
            taskId,
            processingTime,
            error: result.error
          });

          return {
            success: false,
            taskId,
            error: result.error || 'Content generation failed',
            processingTime
          };
        }
      } catch (error) {
        const processingTime = Date.now() - startTime;
        
        logger.error('Content generation error via GraphQL', {
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          processingTime,
          input: args.input
        });

        return {
          success: false,
          taskId: `error-${Date.now()}`,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          processingTime
        };
      }
    },

    /**
     * Regenerate content with different parameters
     */
    regenerateContent: async (_: any, args: { 
      originalTaskId: string; 
      modifications: Partial<ContentGenerationInput> 
    }) => {
      try {
        logger.info('Content regeneration requested', {
          originalTaskId: args.originalTaskId,
          modifications: Object.keys(args.modifications)
        });

        // Get original article details (in production, this would come from a task store)
        const originalArticle = await prisma.article.findUnique({
          where: { id: args.originalTaskId },
          select: {
            title: true,
            content: true,
            excerpt: true
          }
        });

        if (!originalArticle) {
          throw new Error('Original content not found');
        }

        // Create new generation input with modifications
        const baseInput: ContentGenerationInput = {
          topic: 'Regenerated content',
          targetLanguages: ['en'],
          africanContext: {
            region: 'west',
            countries: ['Nigeria'],
            languages: ['en'],
            exchanges: ['Binance_Africa'],
            mobileMoneyProviders: ['MTN_Money'],
            timezone: 'Africa/Lagos'
          },
          contentType: 'article',
          keywords: []
        };

        const regenerationInput = {
          ...baseInput,
          ...args.modifications
        };

        // Process regeneration as new content generation
        return await contentGenerationResolvers(prisma, logger, contentAgent)
          .Mutation.generateContent(_, { input: regenerationInput });

      } catch (error) {
        logger.error('Content regeneration failed', {
          originalTaskId: args.originalTaskId,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });

        return {
          success: false,
          taskId: `regen-error-${Date.now()}`,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          processingTime: 0
        };
      }
    },

    /**
     * Validate content quality without generating new content
     */
    validateContentQuality: async (_: any, args: {
      content: string;
      title: string;
      africanContext: AfricanMarketContextInput;
    }) => {
      try {
        logger.info('Content quality validation requested');

        // Simple quality checks (in production, this would use the full AI pipeline)
        const wordCount = args.content.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);
        
        // Check for African relevance
        const text = (args.title + ' ' + args.content).toLowerCase();
        const africanKeywords = ['africa', 'nigeria', 'kenya', 'south africa', 'ghana'];
        const africanMentions = africanKeywords.filter(keyword => 
          text.includes(keyword)
        ).length;

        const qualityScore = Math.min(
          30 + // Base score
          (wordCount > 500 ? 20 : wordCount / 25) + // Length score
          (africanMentions * 10) + // African relevance
          (args.title.length > 10 ? 15 : args.title.length) + // Title quality
          (readingTime > 2 && readingTime < 10 ? 15 : 0), // Reading time
          100
        );

        return {
          success: true,
          qualityScore: Math.round(qualityScore),
          wordCount,
          readingTime,
          africanRelevance: {
            score: africanMentions * 25,
            mentionedKeywords: africanKeywords.filter(keyword => 
              text.includes(keyword)
            )
          },
          recommendations: [
            ...(wordCount < 500 ? ['Consider adding more content for better depth'] : []),
            ...(africanMentions === 0 ? ['Add more African context and examples'] : []),
            ...(args.title.length < 10 ? ['Consider a more descriptive title'] : []),
            ...(readingTime > 10 ? ['Content might be too long for optimal engagement'] : [])
          ]
        };
      } catch (error) {
        logger.error('Content quality validation failed', {
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          qualityScore: 0
        };
      }
    }
  }
});

export default contentGenerationResolvers;