/**
 * AI Image GraphQL Resolvers
 * TASK 8.2: AI-Generated Visuals
 */

import { PrismaClient } from '@prisma/client';
import { aiImageService, ImageGenerationResult } from '../services/aiImageService';
import { PubSub } from 'graphql-subscriptions';

const prisma = new PrismaClient();
const pubsub = new PubSub();

// Subscription topics
const IMAGE_GENERATION_PROGRESS = 'IMAGE_GENERATION_PROGRESS';

// Type for resolver context
interface Context {
  prisma: PrismaClient;
  user?: any;
}

export const aiImageResolvers = {
  // ============================================================
  // QUERIES
  // ============================================================
  Query: {
    /**
     * Get all images for an article
     */
    articleImages: async (_: any, args: { articleId: string; imageType?: string }) => {
      try {
        const { articleId, imageType } = args;

        const where: any = {
          articleId,
          status: 'active',
          processingStatus: 'completed',
        };

        if (imageType) {
          where.imageType = imageType.toLowerCase();
        }

        const images = await prisma.articleImage.findMany({
          where,
          orderBy: [
            { imageType: 'asc' },
            { createdAt: 'desc' },
          ],
        });

        return images.map((img: any) => ({
          ...img,
          imageType: img.imageType.toUpperCase(),
          seoKeywords: img.seoKeywords ? JSON.parse(img.seoKeywords) : [],
          metadata: img.metadata ? JSON.parse(img.metadata) : null,
          chartData: img.chartData ? JSON.parse(img.chartData) : null,
        }));
      } catch (error) {
        console.error('[AI Image Resolvers] Error fetching article images:', error);
        throw new Error('Failed to fetch article images');
      }
    },

    /**
     * Get a specific image by ID
     */
    articleImage: async (_: any, args: { id: string }) => {
      try {
        const image = await prisma.articleImage.findUnique({
          where: { id: args.id },
        });

        if (!image) {
          throw new Error('Image not found');
        }

        // Increment view count
        await prisma.articleImage.update({
          where: { id: args.id },
          data: { viewCount: { increment: 1 } },
        });

        return {
          ...image,
          imageType: image.imageType.toUpperCase(),
          seoKeywords: image.seoKeywords ? JSON.parse(image.seoKeywords) : [],
          metadata: image.metadata ? JSON.parse(image.metadata) : null,
          chartData: image.chartData ? JSON.parse(image.chartData) : null,
        };
      } catch (error) {
        console.error('[AI Image Resolvers] Error fetching image:', error);
        throw error;
      }
    },

    /**
     * Get market chart visualization
     */
    marketChart: async (_: any, args: { symbol: string; type: string; timeframe?: string }) => {
      try {
        const { symbol, type, timeframe } = args;

        const result = await aiImageService.generateMarketChart({
          symbol: symbol.toUpperCase(),
          type: type.toLowerCase() as any,
          timeframe: (timeframe || '24h') as any,
        });

        return {
          id: result.id,
          symbol: symbol.toUpperCase(),
          chartType: type.toUpperCase(),
          timeframe: timeframe || '24h',
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          altText: result.altText,
          width: result.width,
          height: result.height,
          theme: 'light',
          metadata: result.metadata,
          createdAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[AI Image Resolvers] Error generating market chart:', error);
        throw new Error('Failed to generate market chart');
      }
    },

    /**
     * Get available image types
     */
    availableImageTypes: async () => {
      return [
        {
          type: 'FEATURED',
          description: 'Large featured image for article header',
          recommendedSize: '1792x1024',
          aspectRatio: '16:9',
          loadingPriority: 'EAGER',
        },
        {
          type: 'THUMBNAIL',
          description: 'Small preview image for article cards',
          recommendedSize: '1024x1024',
          aspectRatio: '1:1',
          loadingPriority: 'LAZY',
        },
        {
          type: 'SOCIAL',
          description: 'Optimized image for social media sharing',
          recommendedSize: '1024x1024',
          aspectRatio: '1:1',
          loadingPriority: 'LAZY',
        },
        {
          type: 'CHART',
          description: 'Market data visualization chart',
          recommendedSize: '800x400',
          aspectRatio: '2:1',
          loadingPriority: 'LAZY',
        },
        {
          type: 'GALLERY',
          description: 'Additional gallery images for article',
          recommendedSize: '1024x1024',
          aspectRatio: 'variable',
          loadingPriority: 'LAZY',
        },
        {
          type: 'INFOGRAPHIC',
          description: 'Informative infographic visualization',
          recommendedSize: '1024x1792',
          aspectRatio: '9:16',
          loadingPriority: 'LAZY',
        },
      ];
    },

    /**
     * Search images across articles
     */
    searchImages: async (_: any, args: { filter: any; limit?: number; offset?: number }) => {
      try {
        const { filter, limit = 20, offset = 0 } = args;

        const where: any = {};

        if (filter.articleId) {
          where.articleId = filter.articleId;
        }
        if (filter.imageType) {
          where.imageType = filter.imageType.toLowerCase();
        }
        if (filter.status) {
          where.status = filter.status.toLowerCase();
        }
        if (filter.processingStatus) {
          where.processingStatus = filter.processingStatus.toLowerCase();
        }
        if (typeof filter.aiGenerated === 'boolean') {
          where.aiGenerated = filter.aiGenerated;
        }

        const images = await prisma.articleImage.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        });

        return images.map((img: any) => ({
          ...img,
          imageType: img.imageType.toUpperCase(),
          seoKeywords: img.seoKeywords ? JSON.parse(img.seoKeywords) : [],
          metadata: img.metadata ? JSON.parse(img.metadata) : null,
        }));
      } catch (error) {
        console.error('[AI Image Resolvers] Error searching images:', error);
        throw new Error('Failed to search images');
      }
    },
  },

  // ============================================================
  // MUTATIONS
  // ============================================================
  Mutation: {
    /**
     * Generate a new AI image for an article
     */
    generateArticleImage: async (_: any, args: { input: any }) => {
      try {
        const { articleId, type, prompt, keywords, size, quality, style } = args.input;

        // Validate article exists
        const article = await prisma.article.findUnique({
          where: { id: articleId },
          select: { id: true, title: true, content: true },
        });

        if (!article) {
          throw new Error('Article not found');
        }

        // Publish progress update
        pubsub.publish(IMAGE_GENERATION_PROGRESS, {
          imageGenerationProgress: {
            articleId,
            status: 'PROCESSING',
            progress: 0,
            message: 'Starting image generation...',
          },
        });

        // Generate image
        const result = await aiImageService.generateArticleImage(articleId, {
          type: type.toLowerCase(),
          prompt,
          keywords,
          size,
          quality: quality?.toLowerCase(),
          style: style?.toLowerCase(),
          articleTitle: article.title,
          articleContent: article.content.substring(0, 500),
        });

        // Publish completion
        pubsub.publish(IMAGE_GENERATION_PROGRESS, {
          imageGenerationProgress: {
            articleId,
            status: 'COMPLETED',
            progress: 100,
            message: 'Image generation completed',
            imageUrl: result.imageUrl,
          },
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AI Image Resolvers] Error generating image:', errorMessage);

        // Publish error
        pubsub.publish(IMAGE_GENERATION_PROGRESS, {
          imageGenerationProgress: {
            articleId: args.input.articleId,
            status: 'FAILED',
            progress: 0,
            message: errorMessage,
          },
        });

        throw new Error('Failed to generate image');
      }
    },

    /**
     * Generate market chart
     */
    generateMarketChart: async (_: any, args: { input: any }) => {
      try {
        const { symbol, type, timeframe, width, height, theme } = args.input;

        const result = await aiImageService.generateMarketChart({
          symbol: symbol.toUpperCase(),
          type: type.toLowerCase(),
          timeframe: timeframe || '24h',
          width: width || 800,
          height: height || 400,
          theme: theme || 'light',
        });

        return {
          id: result.id,
          symbol: symbol.toUpperCase(),
          chartType: type.toUpperCase(),
          timeframe: timeframe || '24h',
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          altText: result.altText,
          width: result.width,
          height: result.height,
          theme: theme || 'light',
          metadata: result.metadata,
          createdAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[AI Image Resolvers] Error generating chart:', error);
        throw new Error('Failed to generate market chart');
      }
    },

    /**
     * Delete (archive) an image
     */
    deleteArticleImage: async (_: any, args: { id: string }) => {
      try {
        const image = await prisma.articleImage.findUnique({
          where: { id: args.id },
        });

        if (!image) {
          throw new Error('Image not found');
        }

        // Soft delete
        const updated = await prisma.articleImage.update({
          where: { id: args.id },
          data: { status: 'deleted' },
        });

        // Clear cache
        await aiImageService.clearArticleCache(image.articleId);

        return {
          ...updated,
          imageType: updated.imageType.toUpperCase(),
          seoKeywords: updated.seoKeywords ? JSON.parse(updated.seoKeywords) : [],
          metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
        };
      } catch (error) {
        console.error('[AI Image Resolvers] Error deleting image:', error);
        throw error;
      }
    },

    /**
     * Update image SEO metadata
     */
    updateImageSEO: async (_: any, args: { id: string; altText?: string; keywords?: string[] }) => {
      try {
        const { id, altText, keywords } = args;

        const image = await prisma.articleImage.findUnique({
          where: { id },
        });

        if (!image) {
          throw new Error('Image not found');
        }

        const updateData: any = {};

        if (altText) {
          updateData.altText = altText;
        }

        if (keywords) {
          updateData.seoKeywords = JSON.stringify(keywords);
        }

        const updated = await prisma.articleImage.update({
          where: { id },
          data: updateData,
        });

        // Clear cache
        await aiImageService.clearArticleCache(image.articleId);

        return {
          ...updated,
          imageType: updated.imageType.toUpperCase(),
          seoKeywords: updated.seoKeywords ? JSON.parse(updated.seoKeywords) : [],
          metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
        };
      } catch (error) {
        console.error('[AI Image Resolvers] Error updating image SEO:', error);
        throw error;
      }
    },
  },

  // ============================================================
  // SUBSCRIPTIONS
  // ============================================================
  Subscription: {
    /**
     * Subscribe to image generation progress
     */
    imageGenerationProgress: {
      subscribe: (_: any, args: { articleId: string }) => {
        return pubsub.asyncIterator([IMAGE_GENERATION_PROGRESS]);
      },
    },
  },

  // ============================================================
  // FIELD RESOLVERS
  // ============================================================
  ArticleImage: {
    /**
     * Resolve article relation
     */
    article: async (parent: any) => {
      return prisma.article.findUnique({
        where: { id: parent.articleId },
      });
    },
  },
};

export default aiImageResolvers;
