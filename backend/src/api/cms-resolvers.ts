/**
 * CMS GraphQL Resolvers - Task 6: Headless CMS Core
 * Implements GraphQL operations for content management workflows
 */

import { IResolvers } from '@graphql-tools/utils';
export interface GraphQLContext {
  prisma: any;
  redis: any;
  cache: any;
  authService: any;
  logger: any;
  user?: {
    id: string;
    email: string;
    username: string;
    role?: string;
    subscriptionTier: string;
    status: string;
    emailVerified: boolean;
  };
  requestStartTime: number;
  operationName?: string;
}
import { CMSService } from '../services/cmsService';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { logger } from '../utils/logger';

// Initialize CMS Service
const cmsService = new CMSService(
  // These will be injected via context in actual implementation
  {} as any, // prisma
  {} as any  // logger
);

export const cmsResolvers: IResolvers<any, GraphQLContext> = {
  Query: {
    // Get article with workflow status and translations
    article: async (
      _: any, 
      { id, slug }: { id?: string; slug?: string }, 
      context: GraphQLContext
    ) => {
      const where = id ? { id } : slug ? { slug } : null;
      if (!where) {
        throw new UserInputError('Either id or slug must be provided');
      }

      return await context.prisma.article.findUnique({
        where,
        include: {
          author: { 
            select: { 
              id: true, 
              username: true, 
              firstName: true, 
              lastName: true, 
              avatarUrl: true 
            } 
          },
          category: true,
          translations: {
            where: { translationStatus: 'COMPLETED' }
          }
        }
      });
    },

    // Get articles with filtering and workflow status
    articles: async (
      _: any,
      { 
        limit = 20, 
        offset = 0, 
        categoryId, 
        status, 
        isPremium, 
        authorId,
        workflowStatus 
      }: {
        limit?: number;
        offset?: number;
        categoryId?: string;
        status?: string;
        isPremium?: boolean;
        authorId?: string;
        workflowStatus?: string;
      },
      context: GraphQLContext
    ) => {
      const where: any = {};
      
      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status;
      if (isPremium !== undefined) where.isPremium = isPremium;
      if (authorId) where.authorId = authorId;

      // If user is not authenticated or doesn't have editor role, only show published articles
      if (!context.user || !['EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        where.status = 'PUBLISHED';
      }

      return await context.prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          author: { 
            select: { 
              id: true, 
              username: true, 
              firstName: true, 
              lastName: true, 
              avatarUrl: true 
            } 
          },
          category: true,
          translations: {
            where: { translationStatus: 'COMPLETED' }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    },

    // Get articles for CMS management (requires editor role)
    articlesForManagement: async (
      _: any,
      { 
        limit = 50, 
        offset = 0, 
        status, 
        authorId,
        categoryId,
        searchTerm 
      }: {
        limit?: number;
        offset?: number;
        status?: string;
        authorId?: string;
        categoryId?: string;
        searchTerm?: string;
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Only editors and admins can access CMS management
      if (!['EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Editor role required for CMS access');
      }

      const where: any = {};
      
      if (status) where.status = status;
      if (authorId) where.authorId = authorId;
      if (categoryId) where.categoryId = categoryId;
      
      if (searchTerm) {
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { excerpt: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      return await context.prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          author: { 
            select: { 
              id: true, 
              username: true, 
              firstName: true, 
              lastName: true, 
              avatarUrl: true 
            } 
          },
          category: true,
          translations: true
        },
        orderBy: [
          { updatedAt: 'desc' }
        ]
      });
    },

    // Get article revision history
    articleRevisions: async (
      _: any,
      { articleId }: { articleId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has access to this article
      const article = await context.prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true }
      });

      if (!article) {
        throw new UserInputError('Article not found');
      }

      // Only author, editors, and admins can view revisions
      const hasAccess = article.authorId === context.user.id || 
                       ['EDITOR', 'ADMIN'].includes(context.user.role || '');

      if (!hasAccess) {
        throw new ForbiddenError('Access denied');
      }

      // Return placeholder - actual implementation requires ContentRevision table
      return [];
    },

    // Get AI analysis for article
    articleAIAnalysis: async (
      _: any,
      { articleId }: { articleId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      const cmsService = new CMSService(context.prisma, logger);
      return await cmsService.requestAIAnalysis(articleId);
    }
  },

  Mutation: {
    // Create new article
    createArticle: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      const cmsService = new CMSService(context.prisma, logger);
      
      const articleInput = {
        ...input,
        authorId: context.user.id
      };

      const article = await cmsService.createArticle(articleInput);
      
      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return article;
    },

    // Update existing article
    updateArticle: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user owns the article or has editor role
      const existingArticle = await context.prisma.article.findUnique({
        where: { id: input.id },
        select: { authorId: true }
      });

      if (!existingArticle) {
        throw new UserInputError('Article not found');
      }

      const canEdit = existingArticle.authorId === context.user.id || 
                     ['EDITOR', 'ADMIN'].includes(context.user.role || '');

      if (!canEdit) {
        throw new ForbiddenError('Permission denied');
      }

      const cmsService = new CMSService(context.prisma, logger);
      const updatedArticle = await cmsService.updateArticle(input);

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return updatedArticle;
    },

    // Submit article for review
    submitArticleForReview: async (
      _: any,
      { articleId }: { articleId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      const cmsService = new CMSService(context.prisma, logger);
      const article = await cmsService.submitForReview(articleId, context.user.id);

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return article;
    },

    // Approve article (editor/admin only)
    approveArticle: async (
      _: any,
      { articleId, notes }: { articleId: string; notes?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!['EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Editor role required');
      }

      const cmsService = new CMSService(context.prisma, logger);
      const article = await cmsService.approveArticle(articleId, context.user.id, notes);

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return article;
    },

    // Reject article (editor/admin only)
    rejectArticle: async (
      _: any,
      { articleId, reason }: { articleId: string; reason: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!['EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Editor role required');
      }

      const cmsService = new CMSService(context.prisma, logger);
      const article = await cmsService.rejectArticle(articleId, context.user.id, reason);

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return article;
    },

    // Publish approved article (editor/admin only)
    publishArticle: async (
      _: any,
      { articleId }: { articleId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!['EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Editor role required');
      }

      const cmsService = new CMSService(context.prisma, logger);
      const article = await cmsService.publishArticle(articleId, context.user.id);

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return article;
    },

    // Create or update article translation
    createArticleTranslation: async (
      _: any,
      { 
        articleId, 
        languageCode, 
        translation 
      }: { 
        articleId: string; 
        languageCode: string; 
        translation: any 
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user can translate (author, translator, editor, or admin)
      const article = await context.prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true }
      });

      if (!article) {
        throw new UserInputError('Article not found');
      }

      const canTranslate = article.authorId === context.user.id ||
                          ['TRANSLATOR', 'EDITOR', 'ADMIN'].includes(context.user.role || '');

      if (!canTranslate) {
        throw new ForbiddenError('Translation permission denied');
      }

      const cmsService = new CMSService(context.prisma, logger);
      const translatorId = ['TRANSLATOR', 'EDITOR', 'ADMIN'].includes(context.user.role || '') 
        ? context.user.id 
        : undefined;

      const articleTranslation = await cmsService.createTranslation(
        articleId,
        languageCode,
        translation,
        translatorId
      );

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return articleTranslation;
    },

    // Rollback to previous revision
    rollbackArticleToRevision: async (
      _: any,
      { articleId, revisionId }: { articleId: string; revisionId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!['EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Editor role required');
      }

      const cmsService = new CMSService(context.prisma, logger);
      const article = await cmsService.rollbackToRevision(articleId, revisionId, context.user.id);

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return article;
    },

    // Archive article
    archiveArticle: async (
      _: any,
      { articleId }: { articleId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check permissions
      const article = await context.prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true }
      });

      if (!article) {
        throw new UserInputError('Article not found');
      }

      const canArchive = article.authorId === context.user.id ||
                        ['EDITOR', 'ADMIN'].includes(context.user.role || '');

      if (!canArchive) {
        throw new ForbiddenError('Archive permission denied');
      }

      const archivedArticle = await context.prisma.article.update({
        where: { id: articleId },
        data: { 
          status: 'ARCHIVED',
          updatedAt: new Date()
        },
        include: {
          author: { 
            select: { 
              id: true, 
              username: true, 
              firstName: true, 
              lastName: true, 
              avatarUrl: true 
            } 
          },
          category: true
        }
      });

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return archivedArticle;
    },

    // Delete article (admin only)
    deleteArticle: async (
      _: any,
      { articleId }: { articleId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (context.user.role !== 'ADMIN') {
        throw new ForbiddenError('Admin role required');
      }

      await context.prisma.article.delete({
        where: { id: articleId }
      });

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return true;
    },

    // Bulk operations for CMS efficiency
    bulkUpdateArticleStatus: async (
      _: any,
      { articleIds, status }: { articleIds: string[]; status: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!['EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Editor role required');
      }

      const validStatuses = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        throw new UserInputError('Invalid status');
      }

      const updatedArticles = await context.prisma.article.updateMany({
        where: {
          id: { in: articleIds }
        },
        data: {
          status,
          updatedAt: new Date(),
          ...(status === 'PUBLISHED' && { publishedAt: new Date() })
        }
      });

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return updatedArticles.count;
    }
  },

  // Type resolvers for additional fields
  Article: {
    // Calculate article metrics
    engagementMetrics: async (parent: any, _: any, context: GraphQLContext) => {
      // This would typically come from analytics service
      return {
        views: parent.viewCount || 0,
        likes: parent.likeCount || 0,
        shares: parent.shareCount || 0,
        comments: parent.commentCount || 0,
        engagementRate: 0.0 // Calculated metric
      };
    },

    // Get workflow status (if workflow table exists)
    workflowStatus: async (parent: any, _: any, context: GraphQLContext) => {
      // Placeholder - would query ArticleWorkflow table
      return {
        currentStep: parent.status,
        assignedReviewer: null,
        lastAction: null,
        actionDate: parent.updatedAt
      };
    },

    // Check if user can edit this article
    canEdit: (parent: any, _: any, context: GraphQLContext) => {
      if (!context.user) return false;
      
      return parent.authorId === context.user.id || 
             ['EDITOR', 'ADMIN'].includes(context.user.role || '');
    },

    // Check if article has pending translations
    hasPendingTranslations: async (parent: any, _: any, context: GraphQLContext) => {
      const pendingCount = await context.prisma.articleTranslation.count({
        where: {
          articleId: parent.id,
          translationStatus: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      return pendingCount > 0;
    }
  },

  ArticleTranslation: {
    // Get translator info
    translator: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.translatorId) return null;

      return await context.prisma.user.findUnique({
        where: { id: parent.translatorId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true
        }
      });
    }
  }
};
