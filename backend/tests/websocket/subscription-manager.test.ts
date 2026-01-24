/**
 * Subscription Manager Tests
 * Task 14: WebSocket Real-Time System
 */

import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { SubscriptionManager } from '../../src/services/websocket/SubscriptionManager';
import { createTestUser, cleanupTestData } from '../helpers/testData';

// Mock Redis for testing
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('SubscriptionManager', () => {
  let subscriptionManager: SubscriptionManager;
  let mockRedis: jest.Mocked<Redis>;
  let prisma: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const testUser = await createTestUser();
    testUserId = testUser.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockRedis = {
      pipeline: jest.fn(() => ({
        sadd: jest.fn().mockReturnThis(),
        srem: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      })),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      scard: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
      hset: jest.fn(),
    } as any;

    subscriptionManager = new SubscriptionManager(mockRedis, prisma);
  });

  describe('subscribe', () => {
    test('should subscribe user to market data symbols', async () => {
      const symbols = ['BTC/USD', 'ETH/USD'];
      
      await subscriptionManager.subscribe(testUserId, symbols);

      // Verify pipeline operations were called
      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.sadd).toHaveBeenCalledTimes(4); // 2 symbols × 2 operations each
      expect(pipeline.exec).toHaveBeenCalled();
    });

    test('should handle subscription errors gracefully', async () => {
      const symbols = ['BTC/USD'];
      const pipelineMock = {
        sadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Redis error'))
      };
      mockRedis.pipeline.mockReturnValue(pipelineMock as any);

      await expect(subscriptionManager.subscribe(testUserId, symbols))
        .rejects.toThrow('Redis error');
    });
  });

  describe('unsubscribe', () => {
    test('should unsubscribe user from market data symbols', async () => {
      const symbols = ['BTC/USD', 'ETH/USD'];
      
      await subscriptionManager.unsubscribe(testUserId, symbols);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.srem).toHaveBeenCalledTimes(4); // 2 symbols × 2 operations each
      expect(pipeline.exec).toHaveBeenCalled();
    });
  });

  describe('getUserSubscriptions', () => {
    test('should return user subscriptions', async () => {
      const expectedSymbols = ['BTC/USD', 'ETH/USD', 'ADA/USD'];
      mockRedis.smembers.mockResolvedValue(expectedSymbols);

      const result = await subscriptionManager.getUserSubscriptions(testUserId);

      expect(result).toEqual(expectedSymbols);
      expect(mockRedis.smembers).toHaveBeenCalledWith(`ws:user_subs:${testUserId}`);
    });

    test('should return empty array on error', async () => {
      mockRedis.smembers.mockRejectedValue(new Error('Redis error'));

      const result = await subscriptionManager.getUserSubscriptions(testUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getSymbolSubscribers', () => {
    test('should return subscribers for a symbol', async () => {
      const symbol = 'BTC/USD';
      const expectedUsers = ['user1', 'user2', 'user3'];
      mockRedis.smembers.mockResolvedValue(expectedUsers);

      const result = await subscriptionManager.getSymbolSubscribers(symbol);

      expect(result).toEqual(expectedUsers);
      expect(mockRedis.smembers).toHaveBeenCalledWith(`ws:sub:${symbol}`);
    });
  });

  describe('removeAllUserSubscriptions', () => {
    test('should remove all subscriptions for a user', async () => {
      const userSymbols = ['BTC/USD', 'ETH/USD'];
      mockRedis.smembers.mockResolvedValue(userSymbols);

      await subscriptionManager.removeAllUserSubscriptions(testUserId);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.srem).toHaveBeenCalledTimes(2); // One for each symbol
      expect(pipeline.del).toHaveBeenCalledWith(`ws:user_subs:${testUserId}`);
      expect(pipeline.exec).toHaveBeenCalled();
    });

    test('should handle empty subscription list', async () => {
      mockRedis.smembers.mockResolvedValue([]);

      await subscriptionManager.removeAllUserSubscriptions(testUserId);

      // Should not call pipeline operations for empty list
      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });
  });

  describe('getSubscriptionStats', () => {
    test('should return subscription statistics', async () => {
      mockRedis.keys
        .mockResolvedValueOnce(['ws:sub:BTC/USD', 'ws:sub:ETH/USD']) // Symbol keys
        .mockResolvedValueOnce(['ws:user_subs:user1', 'ws:user_subs:user2']); // User keys

      mockRedis.scard
        .mockResolvedValueOnce(5) // BTC/USD subscribers
        .mockResolvedValueOnce(3); // ETH/USD subscribers

      const stats = await subscriptionManager.getSubscriptionStats();

      expect(stats).toEqual({
        totalUniqueSymbols: 2,
        totalUniqueUsers: 2,
        totalSubscriptions: 8,
        topSymbols: [
          { symbol: 'BTC/USD', subscriberCount: 5 },
          { symbol: 'ETH/USD', subscriberCount: 3 }
        ]
      });
    });
  });

  describe('cleanupSubscriptions', () => {
    test('should clean up empty subscription sets', async () => {
      mockRedis.keys.mockResolvedValue(['ws:sub:BTC/USD', 'ws:sub:ETH/USD']);
      mockRedis.scard
        .mockResolvedValueOnce(0) // Empty subscription
        .mockResolvedValueOnce(3); // Active subscription

      const pipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 1]]) // One deletion
      };
      mockRedis.pipeline.mockReturnValue(pipeline as any);

      await subscriptionManager.cleanupSubscriptions();

      expect(pipeline.del).toHaveBeenCalledWith('ws:sub:BTC/USD');
      expect(pipeline.del).not.toHaveBeenCalledWith('ws:sub:ETH/USD');
    });
  });

  describe('getSubscriptionMetrics', () => {
    test('should return subscription metrics for date and symbol', async () => {
      const date = '2024-01-01';
      const symbol = 'BTC/USD';
      
      mockRedis.get
        .mockResolvedValueOnce('10') // subscriptions
        .mockResolvedValueOnce('5');  // unsubscriptions

      const metrics = await subscriptionManager.getSubscriptionMetrics(date, symbol);

      expect(metrics).toEqual({
        subscriptions: 10,
        unsubscriptions: 5
      });
    });

    test('should return zero metrics when Redis returns null', async () => {
      const date = '2024-01-01';
      const symbol = 'BTC/USD';
      
      mockRedis.get.mockResolvedValue(null);

      const metrics = await subscriptionManager.getSubscriptionMetrics(date, symbol);

      expect(metrics).toEqual({
        subscriptions: 0,
        unsubscriptions: 0
      });
    });
  });
});