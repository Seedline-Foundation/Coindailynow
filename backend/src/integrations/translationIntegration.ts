/**
 * Article Translation Integration Module - Task 8.1
 * 
 * Unified integration for mounting REST routes and exporting GraphQL schemas.
 * Provides a single entry point for all translation-related functionality.
 */

import { Express } from 'express';
import articleTranslationsRouter from '../api/article-translations';
import { translationTypeDefs } from '../api/translationSchema';

/**
 * Mount all translation REST API routes
 * 
 * @param app - Express application instance
 */
export const mountTranslationRoutes = (app: Express): void => {
  // Mount article translation routes
  app.use('/api/articles', articleTranslationsRouter);
  
  console.log('✅ Translation API routes mounted:');
  console.log('   GET  /api/articles/:id/translations');
  console.log('   GET  /api/articles/:id/translations/:lang');
  console.log('   GET  /api/articles/:id/translations/languages/available');
  console.log('   GET  /api/articles/translations/health');
};

/**
 * Export GraphQL type definitions for translation
 */
export const getTranslationTypeDefs = () => translationTypeDefs;

/**
 * Export GraphQL resolvers for translation
 * (Already exported from translationResolvers.ts)
 */
export { translationResolvers } from '../api/translationResolvers';

/**
 * Supported languages export for external use
 */
export { SUPPORTED_LANGUAGES, type LanguageCode } from '../../../shared/languages';

/**
 * Initialize translation system
 * 
 * Call this during application startup to set up translation functionality.
 */
export const initializeTranslationSystem = (app: Express): void => {
  console.log('🌍 Initializing Translation System...');
  
  // Mount routes
  mountTranslationRoutes(app);
  
  console.log('✅ Translation System initialized successfully');
  console.log(`   Supported languages: 13 (7 African languages + 6 European)`);
  console.log(`   Cache strategy: Redis with 1-hour TTL`);
  console.log(`   Performance target: <300ms per request`);
};

export default {
  mountTranslationRoutes,
  getTranslationTypeDefs,
  initializeTranslationSystem,
};
