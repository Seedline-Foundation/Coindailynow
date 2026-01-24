/**
 * Enhanced Translation Resolvers - Task 7: Multi-Language Content System
 * GraphQL resolvers for the multi-language content system with African focus
 */

import { AuthenticationError, UserInputError, ForbiddenError } from 'apollo-server-express';
import { GraphQLContext } from './context';
import { TranslationService, SupportedLanguage } from '../services/translationService';
import { TranslationAgent } from '../agents/translationAgent';

export const translationResolvers = {
  Query: {
    // Get all translations for an article
    articleTranslations: async (
      _: any,
      { articleId }: { articleId: string },
      context: GraphQLContext
    ) => {
      const translations = await context.prisma.articleTranslation.findMany({
        where: { articleId },
        include: { User: true }
      });

      return translations.map(translation => ({
        ...translation,
        culturalAdaptations: [], // Would be populated from translation metadata
        cryptoTermsPreserved: [], // Would be populated from translation metadata
        fallbackUsed: false,
        languageInfo: context.translationService.getLanguageInfo(translation.languageCode as SupportedLanguage),
        localizations: [],
        qualityAssessment: null
      }));
    },

    // Get specific translation
    articleTranslation: async (
      _: any,
      { articleId, languageCode }: { articleId: string; languageCode: string },
      context: GraphQLContext
    ) => {
      const translation = await context.prisma.articleTranslation.findFirst({
        where: { articleId, languageCode },
        include: { User: true }
      });

      if (!translation) return null;

      return {
        ...translation,
        culturalAdaptations: [], // Would be populated from translation metadata
        cryptoTermsPreserved: [], // Would be populated from translation metadata
        fallbackUsed: false,
        languageInfo: context.translationService.getLanguageInfo(languageCode as SupportedLanguage),
        localizations: [],
        qualityAssessment: null
      };
    },

    // Get all supported languages with regional info
    supportedLanguages: async (
      _: any,
      __: any,
      context: GraphQLContext
    ) => {
      const supportedLanguages = context.translationService.getSupportedLanguages();
      
      return supportedLanguages.map(langCode => 
        context.translationService.getLanguageInfo(langCode)
      ).filter(Boolean);
    },

    // Get translation task status
    translationTask: async (
      _: any,
      { taskId }: { taskId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      const task = context.translationAgent?.getTaskStatus(taskId);
      
      if (!task) {
        throw new UserInputError('Translation task not found');
      }

      return {
        taskId: task.id,
        status: task.status.toUpperCase(),
        progress: task.status === 'completed' ? 100 : task.status === 'processing' ? 50 : 0,
        completedTranslations: task.status === 'completed' ? task.targetLanguages.length : 0,
        totalTranslations: task.targetLanguages.length,
        estimatedTimeRemaining: task.status === 'processing' ? 300000 : 0, // 5 minutes estimate
        errors: task.status === 'failed' ? ['Translation failed'] : []
      };
    },

    // Get translation performance metrics
    translationMetrics: async (
      _: any,
      __: any,
      context: GraphQLContext
    ) => {
      if (!context.user || !['ADMIN', 'EDITOR'].includes(context.user.role || '')) {
        throw new ForbiddenError('Admin access required');
      }

      const metrics = context.translationAgent?.getMetrics();
      const analytics = await context.translationAgent?.getPerformanceAnalytics();

      if (!metrics || !analytics) {
        throw new Error('Translation metrics unavailable');
      }

      return {
        totalTranslations: metrics.totalTranslations,
        successRate: metrics.successRate,
        averageQualityScore: metrics.averageQualityScore,
        averageProcessingTime: Math.round(metrics.averageProcessingTime),
        languagePerformance: Object.entries(analytics.languageStats).map(([code, stats]) => ({
          languageCode: code,
          languageName: context.translationService.getLanguageInfo(code as SupportedLanguage)?.name || code,
          totalTranslations: stats.totalTranslations,
          averageQuality: stats.averageQuality,
          averageTime: 180000, // Mock average time
          successRate: stats.successRate
        })),
        humanReviewRate: metrics.humanReviewRate,
        dailyStats: analytics.dailyStats
      };
    },

    // Get crypto glossary for language
    cryptoGlossary: async (
      _: any,
      { languageCode }: { languageCode: string },
      context: GraphQLContext
    ) => {
      const glossary = await context.translationService.getCryptoGlossary(languageCode as SupportedLanguage);
      
      return Object.entries(glossary).map(([english, translated]) => ({
        englishTerm: english,
        translatedTerm: translated,
        context: `Cryptocurrency terminology in ${languageCode}`,
        usage: `Use "${translated}" when translating "${english}" in ${languageCode} content`
      }));
    },

    // Get translation queue status
    translationQueueStatus: async (
      _: any,
      __: any,
      context: GraphQLContext
    ) => {
      if (!context.user || !['ADMIN', 'EDITOR'].includes(context.user.role || '')) {
        throw new ForbiddenError('Admin access required');
      }

      // Mock queue status - in real implementation would query translation agent
      return {
        queuedTasks: 12,
        processingTasks: 3,
        completedToday: 45,
        averageWaitTime: 300000, // 5 minutes
        priorityBreakdown: {
          urgent: 2,
          high: 5,
          normal: 8,
          low: 0
        }
      };
    }
  },

  Mutation: {
    // Enhanced article translation creation (existing)
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

      // Create translation using enhanced service
      const newTranslation = await context.translationService.createArticleTranslation(
        articleId,
        languageCode as SupportedLanguage,
        translation
      );

      // Invalidate cache
      if (context.cache) {
        await context.cache.invalidateContent('article');
      }

      return {
        ...newTranslation,
        culturalAdaptations: [],
        cryptoTermsPreserved: [],
        fallbackUsed: false,
        languageInfo: context.translationService.getLanguageInfo(languageCode as SupportedLanguage),
        localizations: [],
        qualityAssessment: null
      };
    },

    // Batch translate article
    batchTranslateArticle: async (
      _: any,
      { 
        articleId, 
        targetLanguages, 
        options 
      }: { 
        articleId: string; 
        targetLanguages: string[]; 
        options?: any 
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!context.translationAgent) {
        throw new Error('Translation agent not available');
      }

      // Get article content
      const article = await context.prisma.article.findUnique({
        where: { id: articleId }
      });

      if (!article) {
        throw new UserInputError('Article not found');
      }

      // Detect source language
      const sourceLanguage = await context.translationService.detectLanguage(article.content);

      // Start batch translation
      const results = await context.translationService.batchTranslate(
        [{ 
          id: articleId, 
          title: article.title, 
          excerpt: article.excerpt, 
          content: article.content 
        }],
        sourceLanguage,
        targetLanguages as SupportedLanguage[],
        { priority: 'normal' }
      );

      const taskId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        taskId,
        totalTranslations: results.length,
        estimatedCompletionTime: new Date(Date.now() + 600000), // 10 minutes estimate
        results: results.map(result => ({
          languageCode: result.languageCode,
          status: result.status.toUpperCase(),
          translation: result.translation ? {
            id: 'temp',
            articleId: result.articleId,
            languageCode: result.languageCode,
            ...result.translation,
            translationStatus: 'COMPLETED',
            aiGenerated: true,
            humanReviewed: false,
            translatorId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            culturalAdaptations: result.translation.culturalAdaptations || [],
            cryptoTermsPreserved: result.translation.cryptoTermsPreserved || [],
            fallbackUsed: result.translation.fallbackUsed || false,
            languageInfo: context.translationService.getLanguageInfo(result.languageCode),
            localizations: [],
            qualityAssessment: null
          } : null,
          error: result.error || null,
          processingTime: result.processingTime
        }))
      };
    },

    // Queue article translation
    queueArticleTranslation: async (
      _: any,
      { 
        articleId, 
        targetLanguages, 
        priority 
      }: { 
        articleId: string; 
        targetLanguages: string[]; 
        priority: string 
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!context.translationAgent) {
        throw new Error('Translation agent not available');
      }

      // Get article content
      const article = await context.prisma.article.findUnique({
        where: { id: articleId }
      });

      if (!article) {
        throw new UserInputError('Article not found');
      }

      // Detect source language
      const sourceLanguage = await context.translationService.detectLanguage(article.content);

      // Queue translation task
      const taskId = await context.translationAgent.queueTranslation(
        articleId,
        {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content
        },
        sourceLanguage,
        targetLanguages as SupportedLanguage[],
        { 
          priority: priority.toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
          requiresHumanReview: false 
        }
      );

      context.logger.info('Translation task queued', {
        taskId,
        articleId,
        targetLanguages,
        priority
      });

      return taskId;
    },

    // Update translation status
    updateTranslationStatus: async (
      _: any,
      { 
        translationId, 
        status, 
        reviewNotes 
      }: { 
        translationId: string; 
        status: string; 
        reviewNotes?: string 
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check permissions
      if (!['TRANSLATOR', 'EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Translation management permission required');
      }

      const updatedTranslation = await context.prisma.articleTranslation.update({
        where: { id: translationId },
        data: { 
          translationStatus: status,
          humanReviewed: status === 'REVIEWED',
          updatedAt: new Date()
        }
      });

      // Log review notes if provided
      if (reviewNotes) {
        context.logger.info('Translation review completed', {
          translationId,
          status,
          reviewNotes,
          reviewerId: context.user.id
        });
      }

      return {
        ...updatedTranslation,
        culturalAdaptations: [],
        cryptoTermsPreserved: [],
        fallbackUsed: false,
        languageInfo: context.translationService.getLanguageInfo(updatedTranslation.languageCode as SupportedLanguage),
        localizations: [],
        qualityAssessment: null
      };
    },

    // Retranslate article
    retranslateArticle: async (
      _: any,
      { 
        articleId, 
        languageCode, 
        options 
      }: { 
        articleId: string; 
        languageCode: string; 
        options?: any 
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check permissions
      if (!['TRANSLATOR', 'EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Translation management permission required');
      }

      // Get original article
      const article = await context.prisma.article.findUnique({
        where: { id: articleId }
      });

      if (!article) {
        throw new UserInputError('Article not found');
      }

      // Detect source language
      const sourceLanguage = await context.translationService.detectLanguage(article.content);

      // Perform retranslation
      const retranslation = await context.translationService.translateContent(
        {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content
        },
        sourceLanguage,
        languageCode as SupportedLanguage
      );

      // Update existing translation
      const updatedTranslation = await context.prisma.articleTranslation.upsert({
        where: {
          articleId_languageCode: {
            articleId,
            languageCode
          }
        },
        update: {
          title: retranslation.title,
          excerpt: retranslation.excerpt,
          content: retranslation.content,
          qualityScore: retranslation.qualityScore,
          translationStatus: 'COMPLETED',
          humanReviewed: false,
          updatedAt: new Date()
        },
        create: {
          id: `${articleId}_${languageCode}`,
          articleId,
          languageCode,
          title: retranslation.title,
          excerpt: retranslation.excerpt,
          content: retranslation.content,
          qualityScore: retranslation.qualityScore,
          translationStatus: 'COMPLETED',
          aiGenerated: true,
          humanReviewed: false,
          updatedAt: new Date()
        }
      });

      context.logger.info('Article retranslated', {
        articleId,
        languageCode,
        qualityScore: retranslation.qualityScore,
        userId: context.user.id
      });

      return {
        ...updatedTranslation,
        culturalAdaptations: retranslation.culturalAdaptations || [],
        cryptoTermsPreserved: retranslation.cryptoTermsPreserved || [],
        fallbackUsed: retranslation.fallbackUsed || false,
        languageInfo: context.translationService.getLanguageInfo(languageCode as SupportedLanguage),
        localizations: [],
        qualityAssessment: null
      };
    },

    // Update crypto glossary
    updateCryptoGlossary: async (
      _: any,
      { 
        languageCode, 
        terms 
      }: { 
        languageCode: string; 
        terms: Array<{ englishTerm: string; translatedTerm: string; context?: string }> 
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check permissions
      if (!['TRANSLATOR', 'EDITOR', 'ADMIN'].includes(context.user.role || '')) {
        throw new ForbiddenError('Glossary management permission required');
      }

      const glossaryUpdates: Record<string, string> = {};
      terms.forEach(term => {
        glossaryUpdates[term.englishTerm] = term.translatedTerm;
      });

      await context.translationService.updateCryptoGlossary(
        languageCode as SupportedLanguage,
        glossaryUpdates
      );

      context.logger.info('Crypto glossary updated', {
        languageCode,
        termsCount: terms.length,
        userId: context.user.id
      });

      return true;
    }
  }
};