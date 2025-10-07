/**
 * Test Data Helpers
 * Utilities for creating test data and cleanup
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  token: string;
  username: string;
  timezone?: string;
}

export interface TestUserOptions {
  timezone?: string;
  role?: string;
  isVerified?: boolean;
}

let testDataIds: string[] = [];

export async function createTestUser(options: TestUserOptions = {}): Promise<TestUser> {
  const email = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;
  const username = `testuser-${Date.now()}`;
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: hashedPassword,
      emailVerified: options.isVerified ?? true,
      subscriptionTier: options.role ?? 'FREE',
      preferredLanguage: 'en',
      status: 'ACTIVE',
      profile: {
        create: {
          tradingExperience: 'BEGINNER',
          investmentPortfolioSize: 'SMALL',
          preferredExchanges: JSON.stringify(['binance-africa', 'luno']),
          notificationPreferences: JSON.stringify({
            email: true,
            push: true,
            sms: false,
            timezone: options.timezone || 'UTC'
          }),
          privacySettings: JSON.stringify({ isPublic: true }),
          contentPreferences: JSON.stringify({ language: 'en' }),
        }
      }
    },
    include: {
      profile: true
    }
  });

  testDataIds.push(user.id);

  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      subscriptionTier: user.subscriptionTier 
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    token,
    timezone: user.profile?.notificationPreferences ? 
      JSON.parse(user.profile.notificationPreferences).timezone : 'UTC'
  };
}

export async function createTestArticle(authorId: string, options: any = {}) {
  const article = await prisma.article.create({
    data: {
      title: options.title || `Test Article ${Date.now()}`,
      slug: options.slug || `test-article-${Date.now()}`,
      content: options.content || 'Test article content',
      excerpt: options.excerpt || 'Test article excerpt',
      authorId,
      categoryId: options.categoryId || await createTestCategory(),
      status: options.status || 'PUBLISHED',
      publishedAt: options.publishedAt || new Date(),
      isPremium: options.isPremium || false,
      priority: options.priority || 'NORMAL',
      readingTimeMinutes: options.readingTimeMinutes || 5,
      viewCount: options.viewCount || 0,
      likeCount: options.likeCount || 0,
      shareCount: options.shareCount || 0,
      seoTitle: options.seoTitle || `Test Article ${Date.now()}`,
      seoDescription: options.seoDescription || 'Test article description',
      tags: JSON.stringify(options.tags || ['test', 'article']),
    }
  });

  testDataIds.push(article.id);
  return article;
}

export async function createTestCategory(options: any = {}) {
  const category = await prisma.category.create({
    data: {
      name: options.name || `Test Category ${Date.now()}`,
      slug: options.slug || `test-category-${Date.now()}`,
      description: options.description || 'Test category description',
      colorHex: options.colorHex || '#000000',
      isActive: options.isActive ?? true,
      sortOrder: options.sortOrder || 0,
    }
  });

  testDataIds.push(category.id);
  return category.id;
}

export async function createTestMarketData(options: any = {}) {
  // First create a test token if not provided
  let tokenId = options.tokenId;
  if (!tokenId) {
    const token = await prisma.token.create({
      data: {
        symbol: options.symbol || 'BTC',
        name: options.name || 'Bitcoin',
        slug: options.slug || `test-token-${Date.now()}`,
        description: 'Test token',
        blockchain: 'Bitcoin',
        tokenType: 'CRYPTOCURRENCY',
        isListed: true,
      }
    });
    testDataIds.push(token.id);
    tokenId = token.id;
  }

  const marketData = await prisma.marketData.create({
    data: {
      tokenId,
      exchange: options.exchange || 'test-exchange',
      priceUsd: options.priceUsd || 50000,
      priceChange24h: options.priceChange24h || 1000,
      volume24h: options.volume24h || 1000000,
      marketCap: options.marketCap || 1000000000,
      high24h: options.high24h || 51000,
      low24h: options.low24h || 49000,
      timestamp: options.timestamp || new Date(),
      tradingPairs: JSON.stringify(options.tradingPairs || [{ base: 'BTC', quote: 'USD', price: 50000 }]),
    }
  });

  testDataIds.push(marketData.id);
  return marketData;
}

export async function cleanupTestData() {
  try {
    // Clean up in reverse dependency order
    await prisma.marketData.deleteMany({
      where: { id: { in: testDataIds } }
    });

    await prisma.token.deleteMany({
      where: { id: { in: testDataIds } }
    });

    await prisma.article.deleteMany({
      where: { id: { in: testDataIds } }
    });

    await prisma.category.deleteMany({
      where: { id: { in: testDataIds } }
    });

    await prisma.userProfile.deleteMany({
      where: { userId: { in: testDataIds } }
    });

    await prisma.user.deleteMany({
      where: { id: { in: testDataIds } }
    });

    testDataIds = [];
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

export async function seedTestDatabase() {
  // Create test categories
  const categories = [
    { name: 'Bitcoin', slug: 'bitcoin', description: 'Bitcoin news and updates' },
    { name: 'Ethereum', slug: 'ethereum', description: 'Ethereum news and updates' },
    { name: 'African Markets', slug: 'african-markets', description: 'African cryptocurrency markets' },
  ];

  for (const categoryData of categories) {
    await createTestCategory(categoryData);
  }

  // Create test users
  const testUsers = [
    { role: 'ADMIN', timezone: 'Africa/Lagos' },
    { role: 'EDITOR', timezone: 'Africa/Nairobi' },
    { role: 'PREMIUM', timezone: 'Africa/Johannesburg' },
  ];

  for (const userData of testUsers) {
    await createTestUser(userData);
  }

  console.log('Test database seeded successfully');
}