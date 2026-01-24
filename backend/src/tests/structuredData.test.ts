/**
 * Structured Data Service Tests
 * Comprehensive tests for Task 57 implementation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { structuredDataService } from '../services/structuredDataService';

const prisma = new PrismaClient();

describe('Structured Data Service - Task 57', () => {
  let testArticleId: string;
  let testUserId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Create test data
    const category = await prisma.category.create({
      data: {
        id: 'test-category-' + Date.now(),
        name: 'Cryptocurrency News',
        slug: 'crypto-news-' + Date.now(),
        isActive: true,
        updatedAt: new Date(),
      },
    });
    testCategoryId = category.id;

    const user = await prisma.user.create({
      data: {
        id: 'test-user-' + Date.now(),
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        passwordHash: 'test-hash',
        firstName: 'Test',
        lastName: 'Author',
        role: 'WRITER' as any,
        updatedAt: new Date(),
      },
    });
    testUserId = user.id;

    const article = await prisma.article.create({
      data: {
        id: 'test-article-' + Date.now(),
        title: 'Bitcoin Reaches $100,000: A Historic Milestone',
        slug: 'bitcoin-reaches-100k-' + Date.now(),
        excerpt: 'Bitcoin surpasses the $100,000 mark for the first time in history.',
        content: '<p>Bitcoin has reached a historic milestone...</p>',
        featuredImageUrl: 'https://example.com/bitcoin.jpg',
        authorId: testUserId,
        categoryId: testCategoryId,
        status: 'PUBLISHED',
        readingTimeMinutes: 5,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    testArticleId = article.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.sEOMetadata.deleteMany({
      where: {
        contentId: testArticleId,
      },
    });
    await prisma.article.delete({ where: { id: testArticleId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.category.delete({ where: { id: testCategoryId } });
    await prisma.$disconnect();
  });

  describe('NewsArticle Schema Generation', () => {
    it('should generate valid NewsArticle schema for published article', async () => {
      const schema = await structuredDataService.generateNewsArticleSchema(testArticleId);

      expect(schema).not.toBeNull();
      expect(schema?.['@context']).toBe('https://schema.org');
      expect(schema?.['@type']).toBe('NewsArticle');
      expect(schema?.headline).toBe('Bitcoin Reaches $100,000: A Historic Milestone');
      expect(schema?.author).toBeDefined();
      expect(schema?.publisher).toBeDefined();
      expect(schema?.datePublished).toBeDefined();
    });

    it('should return null for non-existent article', async () => {
      const schema = await structuredDataService.generateNewsArticleSchema('non-existent-id');
      expect(schema).toBeNull();
    });

    it('should include featured image in schema', async () => {
      const schema = await structuredDataService.generateNewsArticleSchema(testArticleId);
      expect(schema?.image).toContain('https://example.com/bitcoin.jpg');
    });

    it('should include article section (category)', async () => {
      const schema = await structuredDataService.generateNewsArticleSchema(testArticleId);
      expect(schema?.articleSection).toBe('Cryptocurrency News');
    });
  });

  describe('Person Schema Generation', () => {
    it('should generate valid Person schema for author', async () => {
      const schema = await structuredDataService.generatePersonSchema(testUserId);

      expect(schema['@type']).toBe('Person');
      expect(schema.name).toContain('Test');
      expect(schema.name).toContain('Author');
      expect(schema.url).toContain('/author/');
    });

    it('should handle missing user gracefully', async () => {
      const schema = await structuredDataService.generatePersonSchema('non-existent-id');
      expect(schema['@type']).toBe('Person');
      expect(schema.name).toBe('CoinDaily Team');
    });
  });

  describe('Organization Schema Generation', () => {
    it('should generate valid Organization schema', () => {
      const schema = structuredDataService.generateOrganizationSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('CoinDaily');
      expect(schema.logo).toBeDefined();
      expect(schema.logo['@type']).toBe('ImageObject');
      expect(schema.sameAs).toBeInstanceOf(Array);
      expect(schema.sameAs?.length).toBeGreaterThan(0);
    });
  });

  describe('CryptoCurrency Schema Generation', () => {
    it('should generate valid CryptoCurrency schema', async () => {
      const schema = await structuredDataService.generateCryptoCurrencySchema(
        'BTC',
        'Bitcoin',
        'The first and most well-known cryptocurrency',
        50000,
        'https://example.com/btc.png'
      );

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FinancialProduct');
      expect(schema.name).toBe('Bitcoin');
      expect(schema.alternateName).toBe('BTC');
      expect(schema.offers?.price).toBe('50000');
    });

    it('should work without optional price parameter', async () => {
      const schema = await structuredDataService.generateCryptoCurrencySchema(
        'ETH',
        'Ethereum',
        'A decentralized platform for smart contracts'
      );

      expect(schema.name).toBe('Ethereum');
      expect(schema.offers).toBeUndefined();
    });
  });

  describe('ExchangeRate Schema Generation', () => {
    it('should generate valid ExchangeRate schema', () => {
      const schema = structuredDataService.generateExchangeRateSchema(
        'BTC',
        'USD',
        50000,
        100
      );

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('ExchangeRateSpecification');
      expect(schema.currency).toBe('BTC');
      expect(schema.currentExchangeRate.price).toBe(50000);
      expect(schema.currentExchangeRate.priceCurrency).toBe('USD');
      expect(schema.exchangeRateSpread?.value).toBe(100);
    });
  });

  describe('RAO Schema Generation', () => {
    it('should generate valid RAO schema with FAQ structure', async () => {
      const schema = await structuredDataService.generateRAOSchema(testArticleId);

      expect(schema).not.toBeNull();
      expect(schema?.['@context']).toBe('https://schema.org');
      expect(schema?.['@type']).toBe('FAQPage');
      expect(schema?.mainEntity).toBeInstanceOf(Array);
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct NewsArticle schema', async () => {
      const schema = await structuredDataService.generateNewsArticleSchema(testArticleId);
      const validation = structuredDataService.validateSchema(schema, 'newsArticle');

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toBeUndefined();
    });

    it('should detect invalid schema', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        // Missing required fields
      };

      const validation = structuredDataService.validateSchema(invalidSchema, 'newsArticle');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Database Integration', () => {
    it('should save structured data to database', async () => {
      const payload = await structuredDataService.generateAndSaveArticleStructuredData(
        testArticleId
      );

      expect(payload.contentId).toBe(testArticleId);
      expect(payload.contentType).toBe('article');
      expect(payload.schemas.newsArticle).toBeDefined();
      expect(payload.validation.isValid).toBe(true);

      // Verify database entry
      const metadata = await prisma.sEOMetadata.findUnique({
        where: {
          contentId_contentType: {
            contentId: testArticleId,
            contentType: 'article',
          },
        },
      });

      expect(metadata).not.toBeNull();
      expect(metadata?.isActive).toBe(true);
    });

    it('should retrieve structured data from database', async () => {
      // First save
      await structuredDataService.generateAndSaveArticleStructuredData(testArticleId);

      // Then retrieve
      const data = await structuredDataService.getStructuredData(testArticleId, 'article');

      expect(data).not.toBeNull();
      expect(data.schemas).toBeDefined();
      expect(data.schemas.newsArticle).toBeDefined();
    });

    it('should update existing structured data', async () => {
      // Save once
      await structuredDataService.generateAndSaveArticleStructuredData(testArticleId);

      // Update article
      await prisma.article.update({
        where: { id: testArticleId },
        data: { title: 'Updated Title' },
      });

      // Save again
      const updated = await structuredDataService.generateAndSaveArticleStructuredData(
        testArticleId
      );

      expect(updated.schemas.newsArticle?.headline).toBe('Updated Title');
    });
  });

  describe('Bulk Generation', () => {
    it('should process multiple articles', async () => {
      const result = await structuredDataService.bulkGenerateStructuredData();

      expect(result.processed).toBeGreaterThan(0);
      expect(result.succeeded).toBeLessThanOrEqual(result.processed);
      expect(result.failed).toBeLessThanOrEqual(result.processed);
      expect(result.succeeded + result.failed).toBe(result.processed);
    });
  });

  describe('Utility Functions', () => {
    it('should strip HTML tags correctly', () => {
      const service = structuredDataService as any;
      const html = '<p>This is <strong>bold</strong> text</p>';
      const stripped = service.stripHtml(html);
      expect(stripped).toBe('This is bold text');
    });

    it('should count words accurately', () => {
      const service = structuredDataService as any;
      const text = '<p>This is a test with five words</p>';
      const count = service.countWords(text);
      expect(count).toBe(7);
    });

    it('should extract token mentions', () => {
      const service = structuredDataService as any;
      const content = 'BTC and ETH are the top cryptocurrencies. SOL is rising.';
      const tokens = service.extractTokenMentions(content);
      expect(tokens).toContain('BTC');
      expect(tokens).toContain('ETH');
      expect(tokens).toContain('SOL');
    });
  });
});

console.log('✅ Task 57 Tests: Structured Data & Rich Snippets');
console.log('Tests cover:');
console.log('- NewsArticle schema generation');
console.log('- Person/Author schema generation');
console.log('- Organization schema generation');
console.log('- CryptoCurrency schema generation');
console.log('- ExchangeRate schema generation');
console.log('- RAO (Retrieval-Augmented Optimization) schema');
console.log('- Schema validation');
console.log('- Database integration');
console.log('- Bulk generation');
console.log('- Utility functions');
