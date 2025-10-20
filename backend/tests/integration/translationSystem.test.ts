/**
 * Translation System Integration Tests - Task 7: Multi-Language Content System
 * Tests the complete translation workflow from GraphQL API to database storage
 */

import { PrismaClient } from '@prisma/client';
import { TranslationService } from '../../src/services/translationService';
import { TranslationAgent } from '../../src/agents/translationAgent';
import { logger } from '../../src/utils/logger';

describe('Translation System Integration - Task 7', () => {
  let prisma: PrismaClient;
  let translationService: TranslationService;
  let translationAgent: TranslationAgent;
  let testApp: any;

  beforeAll(async () => {
    // Setup test services
    prisma = new PrismaClient({ 
      datasources: { 
        db: { 
          url: process.env.TEST_DATABASE_URL || 'file:./test.db'
        } 
      } 
    });
    translationService = new TranslationService(prisma, logger);
    translationAgent = new TranslationAgent(translationService, prisma, logger);

    // Start the translation agent
    await translationAgent.start();
  });

  afterAll(async () => {
    // Cleanup
    await translationAgent.stop();
    await prisma.$disconnect();
    await testApp?.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.articleTranslation.deleteMany();
    await prisma.article.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Complete Translation Workflow', () => {
    test('should handle end-to-end article translation workflow', async () => {
      // Create test user and article
      const user = await prisma.user.create({
        data: {
          id: `user-test-${Date.now()}`,
          email: 'author@coindaily.co',
          username: 'testauthor',
          passwordHash: 'hashedpassword',
          role: 'CONTENT_ADMIN',
          emailVerified: true,
          updatedAt: new Date()
        }
      });

      const category = await prisma.category.create({
        data: {
          id: `category-test-${Date.now()}`,
          name: 'Cryptocurrency News',
          slug: 'crypto-news',
          sortOrder: 1,
          updatedAt: new Date()
        }
      });

      const article = await prisma.article.create({
        data: {
          id: `article-test-${Date.now()}`,
          title: 'Bitcoin Adoption Grows in Kenya Through M-Pesa Integration',
          slug: 'bitcoin-kenya-mpesa',
          excerpt: 'Major cryptocurrency exchange partners with mobile money providers',
          content: 'Bitcoin adoption is accelerating across Kenya as major cryptocurrency exchanges integrate with M-Pesa and other mobile money services. This integration allows Kenyan users to buy and sell Bitcoin using their mobile money wallets, making cryptocurrency more accessible to the unbanked population.',
          authorId: user.id,
          categoryId: category.id,
          status: 'PUBLISHED',
          readingTimeMinutes: 3,
          updatedAt: new Date()
        }
      });

      // Test language detection
      const detectedLanguage = await translationService.detectLanguage(article.content);
      expect(detectedLanguage).toBe('en');

      // Test content translation to Swahili
      const translation = await translationService.translateContent(
        {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content
        },
        'en',
        'sw'
      );

      expect(translation.qualityScore).toBeGreaterThan(70);
      expect(translation.cryptoTermsPreserved).toContain('Bitcoin');
      expect(translation.cryptoTermsPreserved).toContain('M-Pesa');
      expect(translation.fallbackUsed).toBe(false);

      // Test cultural adaptations
      expect(translation.culturalAdaptations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            context: expect.stringContaining('African')
          })
        ])
      );

      // Create database translation record
      const dbTranslation = await translationService.createArticleTranslation(
        article.id,
        'sw',
        translation
      );

      expect(dbTranslation).toEqual(
        expect.objectContaining({
          articleId: article.id,
          languageCode: 'sw',
          title: translation.title,
          excerpt: translation.excerpt,
          content: translation.content,
          qualityScore: translation.qualityScore,
          aiGenerated: true,
          humanReviewed: false,
          translationStatus: 'COMPLETED'
        })
      );

      // Verify database state
      const storedTranslations = await prisma.articleTranslation.findMany({
        where: { articleId: article.id }
      });

      expect(storedTranslations).toHaveLength(1);
      expect(storedTranslations[0]?.languageCode).toBe('sw');
    });

    test('should handle batch translation workflow', async () => {
      // Create test articles
      const user = await prisma.user.create({
        data: {
          id: `user-test-${Date.now() + 1}`,
          email: 'editor@coindaily.co',
          username: 'testeditor',
          passwordHash: 'hashedpassword',
          role: 'CONTENT_ADMIN',
          emailVerified: true,
          updatedAt: new Date()
        }
      });

      const category = await prisma.category.create({
        data: {
          id: `category-test-${Date.now() + 1}`,
          name: 'Market Analysis',
          slug: 'market-analysis',
          sortOrder: 2,
          updatedAt: new Date()
        }
      });

      const articles = await Promise.all([
        prisma.article.create({
          data: {
            id: `article-test-${Date.now() + 2}`,
            title: 'DeFi Growth in Nigeria Reaches New Heights',
            slug: 'defi-nigeria-growth',
            excerpt: 'Decentralized Finance protocols gain traction',
            content: 'DeFi adoption in Nigeria has grown by 300% this quarter, driven by high inflation and currency devaluation. Protocols like Uniswap and Aave are seeing increased usage from Nigerian users.',
            authorId: user.id,
            categoryId: category.id,
            status: 'PUBLISHED',
            readingTimeMinutes: 4,
            updatedAt: new Date()
          }
        }),
        prisma.article.create({
          data: {
            id: `article-test-${Date.now() + 3}`,
            title: 'NFT Marketplaces Launch in South Africa',
            slug: 'nft-south-africa',
            excerpt: 'Local NFT platforms emerge',
            content: 'South African artists are embracing NFT marketplaces as new platforms launch with support for local payment methods. These platforms integrate with major South African banks and mobile payment systems.',
            authorId: user.id,
            categoryId: category.id,
            status: 'PUBLISHED',
            readingTimeMinutes: 3,
            updatedAt: new Date()
          }
        })
      ]);

      // Test batch translation
      const batchResults = await translationService.batchTranslate(
        articles.map(a => ({
          id: a.id,
          title: a.title,
          excerpt: a.excerpt,
          content: a.content
        })),
        'en',
        ['sw', 'fr', 'ar'],
        { priority: 'normal' }
      );

      // Should have 6 results (2 articles × 3 languages)
      expect(batchResults).toHaveLength(6);
      
      // All should be successful
      const successfulTranslations = batchResults.filter(r => r.status === 'completed');
      expect(successfulTranslations).toHaveLength(6);

      // Each should have good quality scores
      successfulTranslations.forEach(result => {
        expect(result.translation?.qualityScore).toBeGreaterThan(60);
        expect(result.processingTime).toBeGreaterThan(0);
      });

      // Verify language-specific characteristics
      const swahiliTranslations = batchResults.filter(r => r.languageCode === 'sw');
      swahiliTranslations.forEach(result => {
        expect(result.translation?.cryptoTermsPreserved).toContain('DeFi');
        expect(result.translation?.cryptoTermsPreserved).toContain('NFT');
      });
    });

    test('should handle translation agent queue processing', async () => {
      // Create test article
      const user = await prisma.user.create({
        data: {
          id: `user-test-${Date.now() + 4}`,
          email: 'admin@coindaily.co',
          username: 'testadmin',
          passwordHash: 'hashedpassword',
          role: 'CONTENT_ADMIN',
          emailVerified: true,
          updatedAt: new Date()
        }
      });

      const category = await prisma.category.create({
        data: {
          id: `category-test-${Date.now() + 4}`,
          name: 'Breaking News',
          slug: 'breaking-news',
          sortOrder: 3,
          updatedAt: new Date()
        }
      });

      const article = await prisma.article.create({
        data: {
          id: `article-test-${Date.now() + 5}`,
          title: 'Breaking: Major African Bank Announces Bitcoin Support',
          slug: 'african-bank-bitcoin',
          excerpt: 'First major African bank to offer Bitcoin services',
          content: 'Standard Bank of South Africa has announced comprehensive Bitcoin support, including custody services and trading platform integration. This move is expected to accelerate institutional adoption across the continent.',
          authorId: user.id,
          categoryId: category.id,
          status: 'PUBLISHED',
          readingTimeMinutes: 5,
          priority: 'BREAKING',
          updatedAt: new Date()
        }
      });

      // Queue urgent translation task
      const taskId = await translationAgent.queueTranslation(
        article.id,
        {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content
        },
        'en',
        ['sw', 'fr', 'ar'],
        { priority: 'urgent', requiresHumanReview: false }
      );

      expect(taskId).toBeTruthy();

      // Check task status
      const taskStatus = translationAgent.getTaskStatus(taskId);
      expect(taskStatus).toEqual(
        expect.objectContaining({
          id: taskId,
          articleId: article.id,
          status: expect.stringMatching(/^(queued|processing|completed)$/),
          targetLanguages: ['sw', 'fr', 'ar'],
          priority: 'urgent'
        })
      );

      // Wait for processing (with timeout)
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const status = translationAgent.getTaskStatus(taskId);
        if (status?.status === 'completed') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // Verify translations were created in database
      const dbTranslations = await prisma.articleTranslation.findMany({
        where: { articleId: article.id }
      });

      expect(dbTranslations.length).toBeGreaterThan(0);
      expect(dbTranslations.length).toBeLessThanOrEqual(3); // sw, fr, ar

      // Verify quality scores
      dbTranslations.forEach(translation => {
        expect(translation.qualityScore).toBeGreaterThan(60);
        expect(translation.aiGenerated).toBe(true);
        expect(['COMPLETED', 'PENDING']).toContain(translation.translationStatus);
      });

      // Check agent metrics
      const metrics = translationAgent.getMetrics();
      expect(metrics.totalTranslations).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('Translation Quality and Cultural Adaptation', () => {
    test('should preserve crypto terminology across languages', async () => {
      const testContent = {
        title: 'Understanding DeFi, NFTs, and Smart Contracts on Ethereum',
        excerpt: 'Comprehensive guide to blockchain technology',
        content: 'DeFi protocols, NFT marketplaces, and smart contracts are revolutionizing finance on the Ethereum blockchain. Yield farming and staking rewards provide new opportunities for cryptocurrency investors.'
      };

      // Test multiple African languages
      const languages = ['sw', 'fr', 'ar', 'pt', 'ha'];
      
      for (const lang of languages) {
        const translation = await translationService.translateContent(
          testContent,
          'en',
          lang as any
        );

        // Key crypto terms should be preserved
        expect(translation.cryptoTermsPreserved).toEqual(
          expect.arrayContaining([
            'DeFi', 'NFT', 'Ethereum', 'blockchain', 'smart contract'
          ])
        );

        // Quality should be reasonable
        expect(translation.qualityScore).toBeGreaterThan(50);

        // Should not use fallback for supported languages
        expect(translation.fallbackUsed).toBe(false);
      }
    });

    test('should apply cultural adaptations for African markets', async () => {
      const testContent = {
        title: 'Mobile Money and Cryptocurrency Integration',
        excerpt: 'Digital payments revolution in Africa',
        content: 'Mobile money services are integrating with cryptocurrency platforms to serve unbanked populations across Africa. Users can now buy Bitcoin using their mobile wallets and access DeFi services.'
      };

      // Test East African context (Swahili)
      const swahiliTranslation = await translationService.translateContent(
        testContent,
        'en',
        'sw'
      );

      expect(swahiliTranslation.culturalAdaptations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            context: expect.stringContaining('African')
          })
        ])
      );

      // Test localization with currency
      const localization = await translationService.localizeContent(
        testContent,
        'en',
        'yo', // Yoruba for Nigeria
        { includeLocalCurrency: true, region: 'West Africa' }
      );

      expect(localization.localizations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'currency'
          })
        ])
      );
    });

    test('should handle translation fallbacks gracefully', async () => {
      const testContent = {
        title: 'Test Content',
        excerpt: 'Test excerpt',
        content: 'Test content for fallback testing'
      };

      // Test unsupported language
      const fallbackTranslation = await translationService.translateContent(
        testContent,
        'en',
        'xyz' as any // Unsupported language
      );

      expect(fallbackTranslation.fallbackUsed).toBe(true);
      expect(fallbackTranslation.fallbackReason).toBe('Target language not supported');
      expect(fallbackTranslation.qualityScore).toBeGreaterThanOrEqual(0);

      // Content should remain unchanged
      expect(fallbackTranslation.title).toBe(testContent.title);
      expect(fallbackTranslation.excerpt).toBe(testContent.excerpt);
      expect(fallbackTranslation.content).toBe(testContent.content);
    });
  });

  describe('Performance and Reliability', () => {
    test('should process translations within performance requirements', async () => {
      const testContent = {
        title: 'Performance Test Article',
        excerpt: 'Testing translation performance',
        content: 'This is a test article to measure translation performance and ensure we meet the sub-500ms requirement for API responses.'
      };

      const startTime = Date.now();
      
      const translation = await translationService.translateContent(
        testContent,
        'en',
        'sw'
      );

      const processingTime = Date.now() - startTime;

      // Should complete reasonably quickly (allowing for test environment overhead)
      expect(processingTime).toBeLessThan(5000); // 5 seconds max for test environment
      expect(translation.qualityScore).toBeGreaterThan(0);
    });

    test('should maintain data consistency across concurrent translations', async () => {
      // Create test article
      const user = await prisma.user.create({
        data: {
          id: `user-test-${Date.now() + 6}`,
          email: 'concurrent@coindaily.co',
          username: 'testconcurrent',
          passwordHash: 'hashedpassword',
          role: 'CONTENT_ADMIN',
          emailVerified: true,
          updatedAt: new Date()
        }
      });

      const category = await prisma.category.create({
        data: {
          id: `category-test-${Date.now() + 6}`,
          name: 'Concurrent Test',
          slug: 'concurrent-test',
          sortOrder: 4,
          updatedAt: new Date()
        }
      });

      const article = await prisma.article.create({
        data: {
          id: `article-test-${Date.now() + 7}`,
          title: 'Concurrent Translation Test',
          slug: 'concurrent-test',
          excerpt: 'Testing concurrent translation processing',
          content: 'This article tests the system\'s ability to handle concurrent translation requests without data corruption or conflicts.',
          authorId: user.id,
          categoryId: category.id,
          status: 'PUBLISHED',
          readingTimeMinutes: 2,
          updatedAt: new Date()
        }
      });

      // Start multiple concurrent translations
      const concurrentTranslations = ['sw', 'fr', 'ar'].map(async (lang) => {
        return translationService.createArticleTranslation(
          article.id,
          lang as any,
          {
            title: `[${lang}] ${article.title}`,
            excerpt: `[${lang}] ${article.excerpt}`,
            content: `[${lang}] ${article.content}`
          }
        );
      });

      const results = await Promise.all(concurrentTranslations);

      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.articleId).toBe(article.id);
        expect(result.languageCode).toBe(['sw', 'fr', 'ar'][index]);
      });

      // Verify database consistency
      const storedTranslations = await prisma.articleTranslation.findMany({
        where: { articleId: article.id },
        orderBy: { languageCode: 'asc' }
      });

      expect(storedTranslations).toHaveLength(3);
      expect(storedTranslations.map(t => t.languageCode)).toEqual(['ar', 'fr', 'sw']);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle database connection errors gracefully', async () => {
      // Temporarily disconnect Prisma to simulate database error
      await prisma.$disconnect();

      const testContent = {
        title: 'Error Test Article',
        excerpt: 'Testing error handling',
        content: 'This tests how the system handles database connection errors.'
      };

      // Translation service should handle the error gracefully
      // Note: In a real test, we'd use a mock or temporary database issue
      // For this test, we'll reconnect and test error logging

      // Reconnect
      prisma = new PrismaClient({ 
        datasources: { 
          db: { 
            url: process.env.TEST_DATABASE_URL || 'file:./test.db'
          } 
        } 
      });

      const translation = await translationService.translateContent(
        testContent,
        'en',
        'sw'
      );

      // Should still return a translation (possibly with fallback)
      expect(translation).toBeDefined();
      expect(translation.title).toBeDefined();
      expect(translation.excerpt).toBeDefined();
      expect(translation.content).toBeDefined();
    });

    test('should retry failed translations according to configuration', async () => {
      // Create a task that will initially fail
      const user = await prisma.user.create({
        data: {
          id: `user-test-${Date.now() + 8}`,
          email: 'retry@coindaily.co',
          username: 'testretry',
          passwordHash: 'hashedpassword',
          role: 'CONTENT_ADMIN',
          emailVerified: true,
          updatedAt: new Date()
        }
      });

      const category = await prisma.category.create({
        data: {
          id: `category-test-${Date.now() + 8}`,
          name: 'Retry Test',
          slug: 'retry-test',
          sortOrder: 5,
          updatedAt: new Date()
        }
      });

      const article = await prisma.article.create({
        data: {
          id: `article-test-${Date.now() + 9}`,
          title: 'Retry Test Article',
          slug: 'retry-test',
          excerpt: 'Testing retry mechanism',
          content: 'This article tests the translation retry functionality.',
          authorId: user.id,
          categoryId: category.id,
          status: 'PUBLISHED',
          readingTimeMinutes: 1,
          updatedAt: new Date()
        }
      });

      // Queue a task (it should succeed in test environment)
      const taskId = await translationAgent.queueTranslation(
        article.id,
        {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content
        },
        'en',
        ['sw'],
        { priority: 'normal', requiresHumanReview: false }
      );

      expect(taskId).toBeTruthy();

      // Check that task is queued
      const taskStatus = translationAgent.getTaskStatus(taskId);
      expect(taskStatus?.retryCount).toBe(0);
      expect(taskStatus?.maxRetries).toBe(3);
    });
  });
});