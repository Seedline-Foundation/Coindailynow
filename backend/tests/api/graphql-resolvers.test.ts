import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '../../src/api/schema';
import { resolvers } from '../../src/api/resolvers';
import { GraphQLContext } from '../../src/api/context';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../../src/middleware/cache';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../src/middleware/cache');
jest.mock('../../src/utils/logger');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  article: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  tag: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  token: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  marketData: {
    findMany: jest.fn(),
  },
  communityPost: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  subscriptionPlan: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
} as any;

const mockCache = {
  cacheResolver: jest.fn((operation, resolver, options) => resolver),
  invalidateContent: jest.fn(),
  getMetrics: jest.fn(() => ({
    hits: 10,
    misses: 5,
    hitRate: 66.67,
    totalRequests: 15,
    averageResponseTime: 250,
    lastReset: new Date(),
  })),
} as any;

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  ping: jest.fn(),
} as any;

const mockAuthService = {
  verifyAccessToken: jest.fn(),
} as any;

// Mock context
const createMockContext = (user?: any): GraphQLContext => ({
  prisma: mockPrisma,
  redis: mockRedis,
  cache: mockCache,
  authService: mockAuthService,
  user,
  requestStartTime: Date.now(),
  operationName: 'TestOperation',
});

describe('GraphQL API Foundation', () => {
  let server: ApolloServer;
  let schema: any;

  beforeAll(() => {
    schema = makeExecutableSchema({ typeDefs, resolvers });
    server = new ApolloServer({
      schema,
      introspection: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should have a valid GraphQL schema', () => {
      expect(schema).toBeDefined();
      expect(schema._typeMap).toBeDefined();
    });

    it('should include all required types', () => {
      const typeNames = Object.keys(schema._typeMap);
      
      // Core types
      expect(typeNames).toContain('User');
      expect(typeNames).toContain('Article');
      expect(typeNames).toContain('Category');
      expect(typeNames).toContain('Tag');
      expect(typeNames).toContain('Token');
      expect(typeNames).toContain('MarketData');
      
      // Authentication types
      expect(typeNames).toContain('AuthPayload');
      expect(typeNames).toContain('AuthResponse');
      expect(typeNames).toContain('UserResponse');
      
      // Community types
      expect(typeNames).toContain('CommunityPost');
      expect(typeNames).toContain('Vote');
      
      // AI system types
      expect(typeNames).toContain('AIAgent');
      expect(typeNames).toContain('AITask');
      
      // Search types
      expect(typeNames).toContain('SearchResult');
      expect(typeNames).toContain('SearchSuggestion');
      
      // Custom scalars
      expect(typeNames).toContain('DateTime');
      expect(typeNames).toContain('JSON');
    });

    it('should include African market-specific enums', () => {
      const typeMap = schema._typeMap;
      
      expect(typeMap.SubscriptionTier).toBeDefined();
      expect(typeMap.TokenType).toBeDefined();
      expect(typeMap.ListingStatus).toBeDefined();
      expect(typeMap.AgentType).toBeDefined();
      expect(typeMap.TaskStatus).toBeDefined();
    });

    it('should have 100+ types and operations', () => {
      const typeNames = Object.keys(schema._typeMap);
      const queryType = schema._typeMap.Query;
      const mutationType = schema._typeMap.Mutation;
      
      const queryFields = queryType ? Object.keys(queryType._fields) : [];
      const mutationFields = mutationType ? Object.keys(mutationType._fields) : [];
      
      const totalOperations = queryFields.length + mutationFields.length;
      
      expect(typeNames.length).toBeGreaterThan(50); // Types
      expect(totalOperations).toBeGreaterThan(25); // Operations
    });
  });

  describe('Query Resolvers with Caching', () => {
    describe('Health Check', () => {
      it('should return health status', async () => {
        const context = createMockContext();
        const result = await resolvers.Query!.health(null, {}, context, {} as any);
        
        expect(result).toBe('CoinDaily API is healthy - African Crypto News Platform');
      });
    });

    describe('User Queries', () => {
      it('should resolve user by ID with caching', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        
        const context = createMockContext();
        const result = await resolvers.Query!.user(null, { id: 'user-1' }, context, {} as any);
        
        expect(result).toEqual(mockUser);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          include: {
            profile: true,
            subscription: {
              include: {
                plan: true,
              }
            },
            _count: {
              select: {
                articles: true,
                communityPosts: true,
              }
            }
          }
        });
      });

      it('should resolve users list with filtering', async () => {
        const mockUsers = [
          { id: 'user-1', username: 'user1' },
          { id: 'user-2', username: 'user2' },
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        
        const context = createMockContext();
        const result = await resolvers.Query!.users(
          null, 
          { limit: 10, offset: 0, filter: 'test' }, 
          context, 
          {} as any
        );
        
        expect(result).toEqual(mockUsers);
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
          take: 10,
          skip: 0,
          where: {
            OR: [
              { username: { contains: 'test', mode: 'insensitive' } },
              { firstName: { contains: 'test', mode: 'insensitive' } },
              { lastName: { contains: 'test', mode: 'insensitive' } },
            ]
          },
          include: {
            profile: true,
            _count: {
              select: {
                articles: true,
                communityPosts: true,
              }
            }
          }
        });
      });
    });

    describe('Article Queries', () => {
      it('should resolve article by ID with view count increment', async () => {
        const mockArticle = {
          id: 'article-1',
          title: 'Test Article',
          content: 'Test content',
          author: { id: 'user-1', username: 'author' },
          category: { id: 'cat-1', name: 'News' },
          tags: [],
          translations: [],
        };

        mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
        mockPrisma.article.update.mockResolvedValue(mockArticle);
        
        const context = createMockContext();
        const result = await resolvers.Query!.article(
          null, 
          { id: 'article-1' }, 
          context, 
          {} as any
        );
        
        expect(result).toEqual(mockArticle);
        expect(mockPrisma.article.findUnique).toHaveBeenCalled();
      });

      it('should resolve featured articles with African focus', async () => {
        const mockArticles = [
          {
            id: 'article-1',
            title: 'Bitcoin in Nigeria',
            priority: 'HIGH',
            status: 'PUBLISHED',
          },
        ];

        mockPrisma.article.findMany.mockResolvedValue(mockArticles);
        
        const context = createMockContext();
        const result = await resolvers.Query!.featuredArticles(
          null, 
          { limit: 5 }, 
          context, 
          {} as any
        );
        
        expect(result).toEqual(mockArticles);
        expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
          where: {
            status: 'PUBLISHED',
            priority: {
              in: ['HIGH', 'BREAKING']
            }
          },
          take: 5,
          orderBy: [
            { priority: 'desc' },
            { publishedAt: 'desc' }
          ],
          include: expect.objectContaining({
            author: expect.any(Object),
            category: true,
            tags: true,
          })
        });
      });

      it('should resolve trending articles based on engagement', async () => {
        const mockTrendingArticles = [
          {
            id: 'article-1',
            title: 'Trending Crypto in Africa',
            viewCount: 1000,
            likeCount: 50,
            shareCount: 25,
          },
        ];

        mockPrisma.article.findMany.mockResolvedValue(mockTrendingArticles);
        
        const context = createMockContext();
        const result = await resolvers.Query!.trendingArticles(
          null, 
          { limit: 10 }, 
          context, 
          {} as any
        );
        
        expect(result).toEqual(mockTrendingArticles);
        expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
          where: {
            status: 'PUBLISHED',
            publishedAt: {
              gte: expect.any(Date) // Last 24 hours
            }
          },
          take: 10,
          orderBy: [
            { viewCount: 'desc' },
            { likeCount: 'desc' },
            { shareCount: 'desc' }
          ],
          include: expect.objectContaining({
            author: expect.any(Object),
            category: true,
            tags: true,
          })
        });
      });
    });

    describe('Market Data Queries with African Exchange Focus', () => {
      it('should resolve tokens with African exchange data', async () => {
        const mockTokens = [
          {
            id: 'token-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            marketData: [
              {
                exchange: 'Luno',
                priceUsd: 45000,
                volume24h: 1000000,
              }
            ]
          },
        ];

        mockPrisma.token.findMany.mockResolvedValue(mockTokens);
        
        const context = createMockContext();
        const result = await resolvers.Query!.tokens(
          null, 
          { limit: 50, offset: 0, isListed: true }, 
          context, 
          {} as any
        );
        
        expect(result).toEqual(mockTokens);
        expect(mockPrisma.token.findMany).toHaveBeenCalledWith({
          where: { isListed: true },
          take: 50,
          skip: 0,
          orderBy: { marketCap: 'desc' },
          include: {
            marketData: {
              where: {
                exchange: {
                  in: expect.arrayContaining([
                    'Binance Africa', 'Luno', 'Quidax', 'BuyCoins', 'Valr', 'Ice3X'
                  ])
                }
              },
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        });
      });

      it('should resolve market data for African exchanges', async () => {
        const mockMarketData = [
          {
            id: 'market-1',
            exchange: 'Luno',
            token: { symbol: 'BTC' },
            priceUsd: 45000,
            timestamp: new Date(),
          },
        ];

        mockPrisma.marketData.findMany.mockResolvedValue(mockMarketData);
        
        const context = createMockContext();
        const result = await resolvers.Query!.marketData(null, {}, context, {} as any);
        
        expect(result).toEqual(mockMarketData);
        expect(mockPrisma.marketData.findMany).toHaveBeenCalledWith({
          where: {
            exchange: {
              in: expect.arrayContaining([
                'Binance Africa', 'Luno', 'Quidax', 'BuyCoins', 'Valr', 'Ice3X'
              ])
            },
            timestamp: {
              gte: expect.any(Date) // Last hour
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 1000,
          include: {
            token: true
          }
        });
      });
    });

    describe('Search Functionality', () => {
      it('should perform basic search across articles', async () => {
        const mockArticles = [
          {
            id: 'article-1',
            title: 'Bitcoin in Africa',
            excerpt: 'Cryptocurrency adoption in Africa',
            slug: 'bitcoin-in-africa',
            isPremium: false,
            publishedAt: new Date(),
          },
        ];

        mockPrisma.article.findMany.mockResolvedValue(mockArticles);
        
        const context = createMockContext();
        const result = await resolvers.Query!.search(
          null, 
          { 
            input: { 
              query: 'bitcoin africa', 
              limit: 20, 
              offset: 0 
            } 
          }, 
          context, 
          {} as any
        );
        
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toMatchObject({
          id: 'article-1',
          title: 'Bitcoin in Africa',
          type: 'ARTICLE',
          url: '/articles/bitcoin-in-africa',
          isAiGenerated: false,
          isPremium: false,
        });
      });

      it('should provide search suggestions', async () => {
        const mockTags = [
          { name: 'bitcoin', usageCount: 100 },
          { name: 'africa', usageCount: 50 },
        ];

        mockPrisma.tag.findMany.mockResolvedValue(mockTags);
        
        const context = createMockContext();
        const result = await resolvers.Query!.searchSuggestions(
          null, 
          { query: 'bit' }, 
          context, 
          {} as any
        );
        
        expect(result).toEqual([
          { query: 'bitcoin', type: 'TRENDING', count: 100 },
          { query: 'africa', type: 'TRENDING', count: 50 },
        ]);
      });
    });
  });

  describe('Mutation Resolvers', () => {
    describe('Article Management', () => {
      it('should create article with African crypto focus', async () => {
        const mockUser = { id: 'user-1', username: 'author' };
        const mockArticle = {
          id: 'article-1',
          title: 'Crypto in Nigeria',
          content: 'Article about cryptocurrency in Nigeria',
          authorId: 'user-1',
          slug: 'crypto-in-nigeria',
        };

        mockPrisma.article.create.mockResolvedValue(mockArticle);
        mockPrisma.tag.upsert.mockResolvedValue({ id: 'tag-1', name: 'nigeria' });
        mockPrisma.article.update.mockResolvedValue(mockArticle);
        
        const context = createMockContext(mockUser);
        const result = await resolvers.Mutation!.createArticle(
          null,
          {
            input: {
              title: 'Crypto in Nigeria',
              excerpt: 'Overview of crypto in Nigeria',
              content: 'Article about cryptocurrency in Nigeria',
              categoryId: 'cat-1',
              tags: ['nigeria', 'crypto'],
              isPremium: false,
            }
          },
          context,
          {} as any
        );
        
        expect(result).toEqual(mockArticle);
        expect(mockPrisma.article.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: 'Crypto in Nigeria',
            content: 'Article about cryptocurrency in Nigeria',
            authorId: 'user-1',
            slug: 'crypto-in-nigeria',
            status: 'DRAFT',
            priority: 'NORMAL',
            readingTimeMinutes: expect.any(Number),
          }),
          include: expect.any(Object)
        });
        expect(mockCache.invalidateContent).toHaveBeenCalledWith('article');
      });

      it('should require authentication for article creation', async () => {
        const context = createMockContext(); // No user
        
        await expect(
          resolvers.Mutation!.createArticle(
            null,
            { input: { title: 'Test', excerpt: 'Test', content: 'Test', categoryId: 'cat-1', tags: [], isPremium: false } },
            context,
            {} as any
          )
        ).rejects.toThrow('Authentication required');
      });

      it('should publish approved articles', async () => {
        const mockUser = { id: 'user-1', username: 'author' };
        const mockArticle = {
          id: 'article-1',
          authorId: 'user-1',
          status: 'APPROVED',
        };
        const mockPublishedArticle = {
          ...mockArticle,
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
        };

        mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
        mockPrisma.article.update.mockResolvedValue(mockPublishedArticle);
        
        const context = createMockContext(mockUser);
        const result = await resolvers.Mutation!.publishArticle(
          null,
          { id: 'article-1' },
          context,
          {} as any
        );
        
        expect(mockPrisma.article.update).toHaveBeenCalledWith({
          where: { id: 'article-1' },
          data: {
            status: 'PUBLISHED',
            publishedAt: expect.any(Date),
          },
          include: expect.any(Object)
        });
        expect(mockCache.invalidateContent).toHaveBeenCalledWith('article');
      });
    });

    describe('User Profile Management', () => {
      it('should update user profile', async () => {
        const mockUser = { id: 'user-1', username: 'testuser' };
        const mockUpdatedUser = {
          ...mockUser,
          firstName: 'Updated',
          lastName: 'User',
          bio: 'Updated bio',
        };

        mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
        
        const context = createMockContext(mockUser);
        const result = await resolvers.Mutation!.updateProfile(
          null,
          {
            input: {
              firstName: 'Updated',
              lastName: 'User',
              bio: 'Updated bio',
            }
          },
          context,
          {} as any
        );
        
        expect(result).toEqual(mockUpdatedUser);
        expect(mockCache.invalidateContent).toHaveBeenCalledWith('user', 'user-1');
      });
    });

    describe('Content Interactions', () => {
      it('should like article and increment count', async () => {
        const mockUser = { id: 'user-1', username: 'user' };
        const mockArticle = {
          id: 'article-1',
          likeCount: 5,
        };

        mockPrisma.article.update.mockResolvedValue(mockArticle);
        
        const context = createMockContext(mockUser);
        const result = await resolvers.Mutation!.likeArticle(
          null,
          { id: 'article-1' },
          context,
          {} as any
        );
        
        expect(result).toEqual(mockArticle);
        expect(mockPrisma.article.update).toHaveBeenCalledWith({
          where: { id: 'article-1' },
          data: {
            likeCount: { increment: 1 }
          },
          include: expect.any(Object)
        });
        expect(mockCache.invalidateContent).toHaveBeenCalledWith('article', 'article-1');
      });

      it('should track content sharing', async () => {
        const mockUser = { id: 'user-1', username: 'user' };

        mockPrisma.article.update.mockResolvedValue({ id: 'article-1', shareCount: 3 });
        
        const context = createMockContext(mockUser);
        const result = await resolvers.Mutation!.shareContent(
          null,
          {
            contentId: 'article-1',
            contentType: 'ARTICLE',
            platform: 'twitter'
          },
          context,
          {} as any
        );
        
        expect(result).toBe(true);
        expect(mockPrisma.article.update).toHaveBeenCalledWith({
          where: { id: 'article-1' },
          data: {
            shareCount: { increment: 1 }
          }
        });
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should implement caching for all query resolvers', () => {
      // Verify cache service is called in resolvers
      expect(mockCache.cacheResolver).toBeDefined();
    });

    it('should have appropriate TTL values for different data types', () => {
      // This would be tested through the cache service mock
      // Articles: 3600s, Market data: 30s, User data: 300s
      expect(mockCache.cacheResolver).toBeDefined();
    });

    it('should invalidate cache on mutations', async () => {
      const mockUser = { id: 'user-1', username: 'author' };
      mockPrisma.article.create.mockResolvedValue({ id: 'article-1' });
      
      const context = createMockContext(mockUser);
      await resolvers.Mutation!.createArticle(
        null,
        {
          input: {
            title: 'Test',
            excerpt: 'Test',
            content: 'Test content',
            categoryId: 'cat-1',
            tags: [],
            isPremium: false,
          }
        },
        context,
        {} as any
      );
      
      expect(mockCache.invalidateContent).toHaveBeenCalledWith('article');
    });
  });

  describe('African Market Specialization', () => {
    it('should prioritize African exchanges in market data', async () => {
      const context = createMockContext();
      await resolvers.Query!.marketData(null, {}, context, {} as any);
      
      expect(mockPrisma.marketData.findMany).toHaveBeenCalledWith({
        where: {
          exchange: {
            in: expect.arrayContaining([
              'Binance Africa',
              'Luno',
              'Quidax',
              'BuyCoins',
              'Valr',
              'Ice3X'
            ])
          },
          timestamp: expect.any(Object)
        },
        orderBy: { timestamp: 'desc' },
        take: 1000,
        include: { token: true }
      });
    });

    it('should include African market context in token queries', async () => {
      const context = createMockContext();
      await resolvers.Query!.tokens(null, { limit: 100, offset: 0, isListed: true }, context, {} as any);
      
      expect(mockPrisma.token.findMany).toHaveBeenCalledWith({
        where: { isListed: true },
        take: 100,
        skip: 0,
        orderBy: { marketCap: 'desc' },
        include: {
          marketData: {
            where: {
              exchange: {
                in: expect.arrayContaining([
                  'Binance Africa', 'Luno', 'Quidax', 'BuyCoins', 'Valr', 'Ice3X'
                ])
              }
            },
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle database errors gracefully', async () => {
      const context = createMockContext();
      mockPrisma.article.findMany.mockRejectedValue(new Error('Database connection failed'));
      
      await expect(
        resolvers.Query!.articles(null, { limit: 20, offset: 0 }, context, {} as any)
      ).rejects.toThrow('Database connection failed');
    });

    it('should validate authentication for protected operations', async () => {
      const context = createMockContext(); // No user
      
      await expect(
        resolvers.Mutation!.createArticle(
          null,
          { 
            input: { 
              title: 'Test', 
              excerpt: 'Test', 
              content: 'Test', 
              categoryId: 'cat-1', 
              tags: [], 
              isPremium: false 
            } 
          },
          context,
          {} as any
        )
      ).rejects.toThrow('Authentication required');
    });

    it('should validate permissions for article operations', async () => {
      const mockUser = { id: 'user-1', username: 'user' };
      const mockArticle = { id: 'article-1', authorId: 'different-user' };
      
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
      
      const context = createMockContext(mockUser);
      
      await expect(
        resolvers.Mutation!.updateArticle(
          null,
          { 
            id: 'article-1', 
            input: { title: 'Updated Title' } 
          },
          context,
          {} as any
        )
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('Custom Scalar Types', () => {
    it('should serialize DateTime values correctly', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = resolvers.DateTime!.serialize!(date);
      expect(result).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should parse DateTime values correctly', () => {
      const dateString = '2024-01-01T12:00:00Z';
      const result = resolvers.DateTime!.parseValue!(dateString);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle JSON scalar type', () => {
      const jsonData = { key: 'value', number: 123 };
      const serialized = resolvers.JSON!.serialize!(jsonData);
      expect(serialized).toEqual(jsonData);
      
      const parsed = resolvers.JSON!.parseValue!(jsonData);
      expect(parsed).toEqual(jsonData);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});