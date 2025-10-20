/**
 * AI Social Media Automation - GraphQL Resolvers
 * Task 9.2 Implementation
 */

import { PrismaClient } from '@prisma/client';
import { aiSocialMediaService } from '../services/aiSocialMediaService';
import { PubSub } from 'graphql-subscriptions';

const prisma = new PrismaClient();
const pubsub = new PubSub();

// ============================================================================
// SUBSCRIPTION TOPICS
// ============================================================================

const TOPICS = {
  SOCIAL_POST_UPDATED: 'SOCIAL_POST_UPDATED',
  ENGAGEMENT_UPDATED: 'ENGAGEMENT_UPDATED',
  ANALYTICS_UPDATED: 'ANALYTICS_UPDATED',
};

// ============================================================================
// RESOLVERS
// ============================================================================

export const aiSocialMediaResolvers = {
  Query: {
    /**
     * Get analytics for a specific platform
     */
    socialMediaAnalytics: async (_: any, args: { platform: string; days?: number }, context: any) => {
      // Check authentication
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const startTime = Date.now();

      try {
        const analytics = await aiSocialMediaService.getPlatformAnalytics(
          args.platform,
          args.days || 30
        );

        console.log(`✅ Platform analytics retrieved (${Date.now() - startTime}ms)`);

        return analytics;

      } catch (error) {
        console.error('Error fetching platform analytics:', error);
        throw new Error('Failed to fetch platform analytics');
      }
    },

    /**
     * Get overview of all platforms
     */
    socialMediaOverview: async (_: any, args: { days?: number }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const startTime = Date.now();

      try {
        const days = args.days || 7;
        const platforms = ['TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN'];

        const analyticsPromises = platforms.map(platform =>
          aiSocialMediaService.getPlatformAnalytics(platform, days).catch(() => null)
        );

        const results = await Promise.all(analyticsPromises);

        const overview = {
          twitter: results[0],
          facebook: results[1],
          instagram: results[2],
          linkedin: results[3],
          period: `${days} days`,
        };

        console.log(`✅ Social media overview retrieved (${Date.now() - startTime}ms)`);

        return overview;

      } catch (error) {
        console.error('Error fetching overview:', error);
        throw new Error('Failed to fetch social media overview');
      }
    },

    /**
     * Get all social media posts with filtering
     */
    socialMediaPosts: async (_: any, args: {
      page?: number;
      limit?: number;
      filter?: {
        platform?: string;
        status?: string;
        dateFrom?: Date;
        dateTo?: Date;
      };
    }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const startTime = Date.now();

      try {
        const page = args.page || 1;
        const limit = args.limit || 20;

        const where: any = {};
        if (args.filter?.platform) where.platform = args.filter.platform;
        if (args.filter?.status) where.status = args.filter.status;
        if (args.filter?.dateFrom || args.filter?.dateTo) {
          where.publishedAt = {};
          if (args.filter.dateFrom) where.publishedAt.gte = args.filter.dateFrom;
          if (args.filter.dateTo) where.publishedAt.lte = args.filter.dateTo;
        }

        const [posts, total] = await Promise.all([
          prisma.socialMediaPost.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              Account: true,
            },
          }),
          prisma.socialMediaPost.count({ where }),
        ]);

        console.log(`✅ Posts retrieved (${Date.now() - startTime}ms)`);

        return {
          posts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };

      } catch (error) {
        console.error('Error fetching posts:', error);
        throw new Error('Failed to fetch posts');
      }
    },

    /**
     * Get a specific post by ID
     */
    socialMediaPost: async (_: any, args: { id: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const startTime = Date.now();

      try {
        const post = await prisma.socialMediaPost.findUnique({
          where: { id: args.id },
          include: {
            Account: true,
            Engagements: {
              orderBy: {
                engagedAt: 'desc',
              },
              take: 50,
            },
          },
        });

        if (!post) {
          throw new Error('Post not found');
        }

        console.log(`✅ Post retrieved (${Date.now() - startTime}ms)`);

        return post;

      } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
      }
    },

    /**
     * Get engagement prediction for an article
     */
    predictEngagement: async (_: any, args: {
      articleId: string;
      platform: string;
      scheduledTime?: Date;
    }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const startTime = Date.now();

      try {
        // Fetch article
        const article = await prisma.article.findUnique({
          where: { id: args.articleId },
          include: {
            Category: true,
          },
        });

        if (!article) {
          throw new Error('Article not found');
        }

        const featuredImage = await prisma.articleImage.findFirst({
          where: { articleId: article.id, imageType: 'FEATURED' },
        });

        const tags = article.tags ? article.tags.split(',').map((t: string) => t.trim()) : [];

        const articleData = {
          id: article.id,
          title: article.title,
          summary: article.excerpt || article.content.substring(0, 200),
          content: article.content,
          slug: article.slug,
          categoryId: article.categoryId,
          tags,
          imageUrl: featuredImage?.imageUrl || undefined,
          publishedAt: article.publishedAt || new Date(),
          isPremium: article.isPremium,
        };

        // Import EngagementPredictor (we need to export it from service)
        const { EngagementPredictor } = await import('../services/aiSocialMediaService');

        const prediction = await (EngagementPredictor as any).predictEngagement(
          articleData,
          args.platform,
          args.scheduledTime
        );

        console.log(`✅ Engagement prediction generated (${Date.now() - startTime}ms)`);

        return prediction;

      } catch (error) {
        console.error('Error predicting engagement:', error);
        throw new Error('Failed to predict engagement');
      }
    },

    /**
     * Get optimal posting time
     */
    optimalPostingTime: async (_: any, args: {
      platform: string;
      articleId: string;
    }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const startTime = Date.now();

      try {
        const article = await prisma.article.findUnique({
          where: { id: args.articleId },
        });

        if (!article) {
          throw new Error('Article not found');
        }

        const tags = article.tags ? article.tags.split(',').map((t: string) => t.trim()) : [];

        const articleData = {
          id: article.id,
          title: article.title,
          summary: article.excerpt || article.content.substring(0, 200),
          content: article.content,
          slug: article.slug,
          categoryId: article.categoryId,
          tags,
          publishedAt: article.publishedAt || new Date(),
          isPremium: article.isPremium,
        };

        const { EngagementPredictor } = await import('../services/aiSocialMediaService');

        const optimalTime = await (EngagementPredictor as any).predictOptimalPostingTime(
          args.platform,
          articleData
        );

        console.log(`✅ Optimal posting time calculated (${Date.now() - startTime}ms)`);

        return optimalTime;

      } catch (error) {
        console.error('Error calculating optimal time:', error);
        throw new Error('Failed to calculate optimal posting time');
      }
    },
  },

  Mutation: {
    /**
     * Auto-post article to all platforms
     */
    autoPostArticle: async (_: any, args: {
      input: {
        articleId: string;
        platforms?: string[];
        scheduleTime?: Date;
      };
    }, context: any) => {
      // Check authentication and role
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (!['SUPER_ADMIN', 'ADMIN'].includes(context.user.role)) {
        throw new Error('Insufficient permissions');
      }

      const startTime = Date.now();

      try {
        const results = await aiSocialMediaService.autoPostArticle(args.input.articleId);

        const successCount = results.filter(r => r.success).length;
        const totalTime = Date.now() - startTime;

        // Publish update
        results.forEach(result => {
          if (result.postId) {
            pubsub.publish(TOPICS.SOCIAL_POST_UPDATED, {
              socialMediaPostUpdated: { id: result.postId },
            });
          }
        });

        console.log(`✅ Auto-post completed (${totalTime}ms)`);

        return {
          success: true,
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: results.length - successCount,
            processingTime: totalTime,
            withinTarget: totalTime < 5 * 60 * 1000,
          },
        };

      } catch (error) {
        console.error('Error auto-posting:', error);
        throw new Error('Failed to auto-post article');
      }
    },

    /**
     * Track engagement for a post
     */
    trackEngagement: async (_: any, args: {
      input: {
        postId: string;
        likes?: number;
        comments?: number;
        shares?: number;
        impressions?: number;
      };
    }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (!['SUPER_ADMIN', 'ADMIN'].includes(context.user.role)) {
        throw new Error('Insufficient permissions');
      }

      const startTime = Date.now();

      try {
        await aiSocialMediaService.trackEngagement(args.input.postId, {
          likes: args.input.likes ?? undefined,
          comments: args.input.comments ?? undefined,
          shares: args.input.shares ?? undefined,
          impressions: args.input.impressions ?? undefined,
        });

        // Publish update
        pubsub.publish(TOPICS.SOCIAL_POST_UPDATED, {
          socialMediaPostUpdated: { id: args.input.postId },
        });

        console.log(`✅ Engagement tracked (${Date.now() - startTime}ms)`);

        return {
          success: true,
          postId: args.input.postId,
          updated: true,
        };

      } catch (error) {
        console.error('Error tracking engagement:', error);
        throw new Error('Failed to track engagement');
      }
    },

    /**
     * Delete a scheduled post
     */
    deleteScheduledPost: async (_: any, args: { postId: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (!['SUPER_ADMIN', 'ADMIN'].includes(context.user.role)) {
        throw new Error('Insufficient permissions');
      }

      const startTime = Date.now();

      try {
        const post = await prisma.socialMediaPost.findUnique({
          where: { id: args.postId },
        });

        if (!post) {
          throw new Error('Post not found');
        }

        if (post.status !== 'SCHEDULED') {
          throw new Error('Only scheduled posts can be deleted');
        }

        await prisma.socialMediaPost.delete({
          where: { id: args.postId },
        });

        console.log(`✅ Scheduled post deleted (${Date.now() - startTime}ms)`);

        return {
          success: true,
          postId: args.postId,
          deleted: true,
        };

      } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
    },

    /**
     * Retry a failed post
     */
    retryFailedPost: async (_: any, args: { postId: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (!['SUPER_ADMIN', 'ADMIN'].includes(context.user.role)) {
        throw new Error('Insufficient permissions');
      }

      const startTime = Date.now();

      try {
        const post = await prisma.socialMediaPost.findUnique({
          where: { id: args.postId },
        });

        if (!post) {
          throw new Error('Post not found');
        }

        if (post.status !== 'FAILED') {
          throw new Error('Only failed posts can be retried');
        }

        // Update retry count and status
        await prisma.socialMediaPost.update({
          where: { id: args.postId },
          data: {
            status: 'SCHEDULED',
            retryCount: post.retryCount + 1,
            errorMessage: null,
          },
        });

        console.log(`✅ Post retry scheduled (${Date.now() - startTime}ms)`);

        return {
          success: true,
          postId: args.postId,
          platform: post.platform,
          processingTime: Date.now() - startTime,
        };

      } catch (error) {
        console.error('Error retrying post:', error);
        throw error;
      }
    },
  },

  Subscription: {
    /**
     * Subscribe to post updates
     */
    socialMediaPostUpdated: {
      subscribe: (_: any, args: { platform?: string }) => {
        return pubsub.asyncIterator([TOPICS.SOCIAL_POST_UPDATED]);
      },
    },

    /**
     * Subscribe to engagement updates
     */
    engagementUpdated: {
      subscribe: (_: any, args: { postId: string }) => {
        return pubsub.asyncIterator([TOPICS.ENGAGEMENT_UPDATED]);
      },
    },

    /**
     * Subscribe to analytics updates
     */
    analyticsUpdated: {
      subscribe: (_: any, args: { platform: string }) => {
        return pubsub.asyncIterator([TOPICS.ANALYTICS_UPDATED]);
      },
    },
  },

  // ============================================================================
  // FIELD RESOLVERS
  // ============================================================================

  SocialMediaPost: {
    hashtags: (parent: any) => {
      if (!parent.hashtags) return [];
      try {
        return JSON.parse(parent.hashtags);
      } catch {
        return [];
      }
    },

    mediaUrls: (parent: any) => {
      if (!parent.mediaUrls) return [];
      try {
        return JSON.parse(parent.mediaUrls);
      } catch {
        return [];
      }
    },

    mentions: (parent: any) => {
      if (!parent.mentions) return [];
      try {
        return JSON.parse(parent.mentions);
      } catch {
        return [];
      }
    },

    account: async (parent: any) => {
      return await prisma.socialMediaAccount.findUnique({
        where: { id: parent.accountId },
      });
    },

    engagements: async (parent: any) => {
      return await prisma.socialEngagement.findMany({
        where: { postId: parent.id },
        orderBy: {
          engagedAt: 'desc',
        },
        take: 100,
      });
    },
  },
};

export default aiSocialMediaResolvers;
