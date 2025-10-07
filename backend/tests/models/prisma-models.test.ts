import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

const prisma = new PrismaClient();

describe('Prisma Models', () => {
  beforeAll(async () => {
    // Clean up database before tests
    await prisma.contentPerformance.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.userEngagement.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.communityPost.deleteMany();
    await prisma.articleTranslation.deleteMany();
    await prisma.article.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    await prisma.aITask.deleteMany();
    await prisma.aIAgent.deleteMany();
    await prisma.marketData.deleteMany();
    await prisma.token.deleteMany();
    await prisma.exchangeIntegration.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        preferredLanguage: 'en',
        subscriptionTier: 'FREE',
      };

      const user = await prisma.user.create({ data: userData });

      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.subscriptionTier).toBe('FREE');
      expect(user.status).toBe('ACTIVE');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'unique@example.com',
        username: 'user1',
        passwordHash: 'hash1',
      };

      await prisma.user.create({ data: userData });

      await expect(
        prisma.user.create({
          data: { ...userData, username: 'user2' }
        })
      ).rejects.toThrow();
    });

    it('should enforce unique username constraint', async () => {
      const userData = {
        email: 'test2@example.com',
        username: 'uniqueuser',
        passwordHash: 'hash2',
      };

      await prisma.user.create({ data: userData });

      await expect(
        prisma.user.create({
          data: { ...userData, email: 'different@example.com' }
        })
      ).rejects.toThrow();
    });
  });

  describe('Category Model', () => {
    it('should create a category', async () => {
      const categoryData = {
        name: 'Market Analysis',
        slug: 'market-analysis',
        description: 'Market analysis content',
        sortOrder: 1,
      };

      const category = await prisma.category.create({ data: categoryData });

      expect(category.name).toBe(categoryData.name);
      expect(category.slug).toBe(categoryData.slug);
      expect(category.isActive).toBe(true);
      expect(category.articleCount).toBe(0);
    });

    it('should enforce unique slug constraint', async () => {
      const categoryData = {
        name: 'News',
        slug: 'news-category',
        sortOrder: 2,
      };

      await prisma.category.create({ data: categoryData });

      await expect(
        prisma.category.create({
          data: { ...categoryData, name: 'Different News' }
        })
      ).rejects.toThrow();
    });
  });

  describe('Article Model', () => {
    let user: any;
    let category: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: `author-${Date.now()}-${Math.random()}@example.com`,
          username: `author-${Date.now()}-${Math.random()}`,
          passwordHash: 'hash',
        },
      });

      category = await prisma.category.create({
        data: {
          name: `Test Category ${Date.now()}`,
          slug: `test-category-${Date.now()}-${Math.random()}`,
          sortOrder: 1,
        },
      });
    });

    it('should create an article with relationships', async () => {
      const articleData = {
        title: 'Test Article',
        slug: 'test-article',
        excerpt: 'Test excerpt',
        content: 'Test content',
        authorId: user.id,
        categoryId: category.id,
        readingTimeMinutes: 5,
        tags: JSON.stringify(['test', 'article']),
      };

      const article = await prisma.article.create({ 
        data: articleData,
        include: {
          author: true,
          category: true,
        }
      });

      expect(article.title).toBe(articleData.title);
      expect(article.author.id).toBe(user.id);
      expect(article.category.id).toBe(category.id);
      expect(article.status).toBe('DRAFT');
      expect(article.isPremium).toBe(false);
    });

    it('should enforce unique slug constraint', async () => {
      const articleData = {
        title: 'Article 1',
        slug: 'unique-article',
        excerpt: 'Excerpt 1',
        content: 'Content 1',
        authorId: user.id,
        categoryId: category.id,
        readingTimeMinutes: 3,
      };

      await prisma.article.create({ data: articleData });

      await expect(
        prisma.article.create({
          data: { ...articleData, title: 'Article 2' }
        })
      ).rejects.toThrow();
    });
  });

  describe('Token Model', () => {
    it('should create a token with market data', async () => {
      const tokenData = {
        symbol: 'BTC',
        name: 'Bitcoin',
        slug: 'bitcoin',
        blockchain: 'Bitcoin',
        tokenType: 'CRYPTOCURRENCY',
        isMemecoin: false,
        isListed: true,
        listingStatus: 'APPROVED',
      };

      const token = await prisma.token.create({ data: tokenData });

      expect(token.symbol).toBe('BTC');
      expect(token.name).toBe('Bitcoin');
      expect(token.isListed).toBe(true);
      expect(token.tokenType).toBe('CRYPTOCURRENCY');
    });

    it('should enforce unique symbol constraint', async () => {
      const tokenData = {
        symbol: 'ETH',
        name: 'Ethereum',
        slug: 'ethereum',
        blockchain: 'Ethereum',
        tokenType: 'CRYPTOCURRENCY',
        isMemecoin: false,
        isListed: true,
        listingStatus: 'APPROVED',
      };

      await prisma.token.create({ data: tokenData });

      await expect(
        prisma.token.create({
          data: { ...tokenData, name: 'Different Ethereum' }
        })
      ).rejects.toThrow();
    });
  });

  describe('African Exchange Integration Model', () => {
    it('should create African exchange integration', async () => {
      const exchangeData = {
        name: 'Binance Africa',
        slug: 'binance-africa',
        apiEndpoint: 'https://api.binance.africa/v1',
        region: 'Africa',
        supportedCountries: JSON.stringify(['NG', 'KE', 'ZA', 'GH']),
        rateLimitPerMinute: 100,
      };

      const exchange = await prisma.exchangeIntegration.create({ 
        data: exchangeData 
      });

      expect(exchange.name).toBe('Binance Africa');
      expect(exchange.region).toBe('Africa');
      expect(exchange.isActive).toBe(true);
      expect(JSON.parse(exchange.supportedCountries || '[]')).toContain('NG');
    });

    it('should create Luno exchange for African markets', async () => {
      const lunoData = {
        name: 'Luno',
        slug: 'luno',
        apiEndpoint: 'https://api.mybitx.com/api/1',
        region: 'Africa',
        supportedCountries: JSON.stringify(['ZA', 'NG', 'KE', 'UG']),
        rateLimitPerMinute: 60,
      };

      const luno = await prisma.exchangeIntegration.create({ 
        data: lunoData 
      });

      expect(luno.name).toBe('Luno');
      expect(luno.region).toBe('Africa');
      expect(JSON.parse(luno.supportedCountries || '[]')).toContain('ZA');
    });
  });

  describe('AI System Models', () => {
    it('should create AI agent and tasks', async () => {
      const agentData = {
        name: 'Content Generation Agent',
        type: 'CONTENT_GENERATION',
        modelProvider: 'openai',
        modelName: 'gpt-4-turbo',
        configuration: JSON.stringify({
          temperature: 0.7,
          max_tokens: 2000,
        }),
        performanceMetrics: JSON.stringify({
          totalRequests: 100,
          successfulRequests: 95,
          averageResponseTimeMs: 2500,
          qualityScore: 8.5,
        }),
      };

      const agent = await prisma.aIAgent.create({ data: agentData });

      expect(agent.name).toBe('Content Generation Agent');
      expect(agent.type).toBe('CONTENT_GENERATION');
      expect(agent.isActive).toBe(true);

      // Create AI task for this agent
      const taskData = {
        agentId: agent.id,
        taskType: 'article_generation',
        inputData: JSON.stringify({
          topic: 'Bitcoin price analysis',
          language: 'en',
          targetLength: 1000,
        }),
        status: 'QUEUED',
        priority: 'NORMAL',
        estimatedCost: 0.05,
        retryCount: 0,
        maxRetries: 3,
      };

      const task = await prisma.aITask.create({ 
        data: taskData,
        include: { agent: true }
      });

      expect(task.agentId).toBe(agent.id);
      expect(task.status).toBe('QUEUED');
      expect(task.agent.name).toBe('Content Generation Agent');
    });
  });

  describe('Tag Model', () => {
    it('should create tags for content organization', async () => {
      const tagData = {
        name: 'Bitcoin',
        slug: 'bitcoin',
        description: 'Bitcoin-related content',
        usageCount: 5,
        trendingScore: 8.5,
      };

      const tag = await prisma.tag.create({ data: tagData });

      expect(tag.name).toBe('Bitcoin');
      expect(tag.slug).toBe('bitcoin');
      expect(tag.usageCount).toBe(5);
      expect(tag.trendingScore).toBe(8.5);
    });

    it('should enforce unique tag name constraint', async () => {
      const tagData = {
        name: 'Ethereum',
        slug: 'ethereum',
        usageCount: 0,
        trendingScore: 0.0,
      };

      await prisma.tag.create({ data: tagData });

      await expect(
        prisma.tag.create({
          data: { ...tagData, slug: 'ethereum-2' }
        })
      ).rejects.toThrow();
    });
  });

  describe('Content Performance Model', () => {
    let article: any;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: `perf-author-${Date.now()}-${Math.random()}@example.com`,
          username: `perfauthor-${Date.now()}-${Math.random()}`,
          passwordHash: 'hash',
        },
      });

      const category = await prisma.category.create({
        data: {
          name: `Performance Category ${Date.now()}`,
          slug: `performance-category-${Date.now()}-${Math.random()}`,
          sortOrder: 1,
        },
      });

      article = await prisma.article.create({
        data: {
          title: `Performance Test Article ${Date.now()}`,
          slug: `performance-test-article-${Date.now()}-${Math.random()}`,
          excerpt: 'Test excerpt',
          content: 'Test content',
          authorId: user.id,
          categoryId: category.id,
          readingTimeMinutes: 5,
        },
      });
    });

    it('should create content performance analytics', async () => {
      const performanceData = {
        contentId: article.id,
        contentType: 'article',
        date: new Date(),
        views: 150,
        uniqueViews: 120,
        likes: 25,
        shares: 8,
        comments: 5,
        readingTimeAvg: 180.5,
        bounceRate: 0.15,
        conversionRate: 0.08,
        revenueGenerated: 12.50,
      };

      const performance = await prisma.contentPerformance.create({ 
        data: performanceData 
      });

      expect(performance.contentId).toBe(article.id);
      expect(performance.contentType).toBe('article');
      expect(performance.views).toBe(150);
      expect(performance.conversionRate).toBe(0.08);
    });

    it('should enforce unique constraint on contentId + contentType + date', async () => {
      const today = new Date();
      const performanceData = {
        contentId: article.id,
        contentType: 'article',
        date: today,
        views: 100,
        uniqueViews: 80,
        likes: 10,
        shares: 2,
        comments: 1,
        readingTimeAvg: 120.0,
        bounceRate: 0.20,
        conversionRate: 0.05,
        revenueGenerated: 5.00,
      };

      await prisma.contentPerformance.create({ data: performanceData });

      await expect(
        prisma.contentPerformance.create({
          data: { ...performanceData, views: 200 }
        })
      ).rejects.toThrow();
    });
  });

  describe('Community Features', () => {
    let user: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: 'community@example.com',
          username: 'communityuser',
          passwordHash: 'hash',
        },
      });
    });

    it('should create community post with voting', async () => {
      const postData = {
        authorId: user.id,
        title: 'Bitcoin to the moon!',
        content: 'Detailed analysis of Bitcoin price movement...',
        postType: 'TEXT',
        tokenMentions: JSON.stringify(['BTC', 'ETH']),
        moderationStatus: 'APPROVED',
      };

      const post = await prisma.communityPost.create({ 
        data: postData,
        include: { author: true }
      });

      expect(post.title).toBe('Bitcoin to the moon!');
      expect(post.author.id).toBe(user.id);
      expect(post.moderationStatus).toBe('APPROVED');

      // Create vote for the post
      const voteData = {
        userId: user.id,
        postId: post.id,
        voteType: 'UPVOTE',
      };

      const vote = await prisma.vote.create({ 
        data: voteData,
        include: { user: true, post: true }
      });

      expect(vote.voteType).toBe('UPVOTE');
      expect(vote.userId).toBe(user.id);
      expect(vote.postId).toBe(post.id);
    });
  });
});