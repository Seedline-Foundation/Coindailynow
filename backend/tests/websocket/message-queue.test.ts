/**
 * Message Queue Tests
 * Task 14: WebSocket Real-Time System
 */

import Redis from 'ioredis';
import { MessageQueue, QueuedMessage } from '../../src/services/websocket/MessageQueue';

// Mock Redis for testing
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('MessageQueue', () => {
  let messageQueue: MessageQueue;
  let mockRedis: jest.Mocked<Redis>;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    mockRedis = {
      pipeline: jest.fn(() => ({
        rpush: jest.fn().mockReturnThis(),
        lpop: jest.fn().mockReturnThis(),
        hset: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        incr: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      })),
      llen: jest.fn(),
      lrange: jest.fn(),
      rpush: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      eval: jest.fn(),
    } as any;

    messageQueue = new MessageQueue(mockRedis);
  });

  describe('queueMessage', () => {
    test('should queue a message for offline user', async () => {
      mockRedis.llen.mockResolvedValue(5); // Current queue size

      const message = {
        type: 'market_data_update',
        data: { symbol: 'BTC/USD', price: 50000 },
        timestamp: new Date()
      };

      await messageQueue.queueMessage(testUserId, message);

      expect(mockRedis.llen).toHaveBeenCalledWith(`ws:queue:${testUserId}`);
      expect(mockRedis.pipeline).toHaveBeenCalled();
      
      const pipeline = mockRedis.pipeline();
      expect(pipeline.rpush).toHaveBeenCalled();
      expect(pipeline.expire).toHaveBeenCalled();
      expect(pipeline.hset).toHaveBeenCalled();
      expect(pipeline.exec).toHaveBeenCalled();
    });

    test('should remove oldest message when queue size limit is reached', async () => {
      mockRedis.llen.mockResolvedValue(1000); // At max limit

      const message = {
        type: 'market_data_update',
        data: { symbol: 'BTC/USD', price: 50000 }
      };

      await messageQueue.queueMessage(testUserId, message);

      const pipeline = mockRedis.pipeline();
      expect(pipeline.lpop).toHaveBeenCalledWith(`ws:queue:${testUserId}`);
    });

    test('should set custom priority and TTL', async () => {
      mockRedis.llen.mockResolvedValue(0);

      const message = {
        type: 'urgent_notification',
        data: { message: 'System maintenance' }
      };

      const options = {
        priority: 'urgent' as const,
        ttl: 3600,
        maxRetries: 5
      };

      await messageQueue.queueMessage(testUserId, message, options);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.expire).toHaveBeenCalledWith(`ws:queue:${testUserId}`, 3600);
    });
  });

  describe('getQueuedMessages', () => {
    test('should return queued messages sorted by priority', async () => {
      const mockMessages = [
        JSON.stringify({
          id: 'msg1',
          type: 'market_data',
          data: { symbol: 'BTC/USD' },
          priority: 'normal',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          expiresAt: new Date('2024-01-02T10:00:00Z'),
          retryCount: 0,
          maxRetries: 3
        }),
        JSON.stringify({
          id: 'msg2',
          type: 'urgent_alert',
          data: { message: 'Price alert' },
          priority: 'urgent',
          timestamp: new Date('2024-01-01T10:05:00Z'),
          expiresAt: new Date('2024-01-02T10:05:00Z'),
          retryCount: 0,
          maxRetries: 3
        })
      ];

      mockRedis.lrange.mockResolvedValue(mockMessages);

      const messages = await messageQueue.getQueuedMessages(testUserId);

      expect(messages).toHaveLength(2);
      expect(messages[0].priority).toBe('urgent'); // Should be sorted by priority
      expect(messages[1].priority).toBe('normal');
    });

    test('should filter out expired messages', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 3600000); // 1 hour ago
      const futureDate = new Date(now.getTime() + 3600000); // 1 hour from now

      const mockMessages = [
        JSON.stringify({
          id: 'msg1',
          type: 'expired_message',
          data: {},
          priority: 'normal',
          timestamp: pastDate,
          expiresAt: pastDate, // Expired
          retryCount: 0,
          maxRetries: 3
        }),
        JSON.stringify({
          id: 'msg2',
          type: 'valid_message',
          data: {},
          priority: 'normal',
          timestamp: now,
          expiresAt: futureDate, // Valid
          retryCount: 0,
          maxRetries: 3
        })
      ];

      mockRedis.lrange.mockResolvedValue(mockMessages);

      const messages = await messageQueue.getQueuedMessages(testUserId);

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('valid_message');
    });

    test('should handle parsing errors gracefully', async () => {
      const mockMessages = [
        'invalid-json',
        JSON.stringify({
          id: 'msg1',
          type: 'valid_message',
          data: {},
          priority: 'normal',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          retryCount: 0,
          maxRetries: 3
        })
      ];

      mockRedis.lrange.mockResolvedValue(mockMessages);

      const messages = await messageQueue.getQueuedMessages(testUserId);

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('valid_message');
    });
  });

  describe('clearMessages', () => {
    test('should clear all messages for a user', async () => {
      await messageQueue.clearMessages(testUserId);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.del).toHaveBeenCalledWith(`ws:queue:${testUserId}`);
      expect(pipeline.del).toHaveBeenCalledWith(`ws:queue_meta:${testUserId}`);
      expect(pipeline.exec).toHaveBeenCalled();
    });
  });

  describe('removeMessages', () => {
    test('should remove specific messages by ID', async () => {
      const messagesInQueue: QueuedMessage[] = [
        {
          id: 'msg1',
          type: 'market_data',
          data: {},
          priority: 'normal',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: 'msg2',
          type: 'notification',
          data: {},
          priority: 'normal',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          retryCount: 0,
          maxRetries: 3
        }
      ];

      // Mock getQueuedMessages to return test messages
      jest.spyOn(messageQueue, 'getQueuedMessages').mockResolvedValue(messagesInQueue);

      await messageQueue.removeMessages(testUserId, ['msg1']);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.del).toHaveBeenCalledWith(`ws:queue:${testUserId}`);
      expect(pipeline.rpush).toHaveBeenCalled(); // Should re-add remaining messages
    });

    test('should delete entire queue when no messages remain', async () => {
      const messagesInQueue: QueuedMessage[] = [
        {
          id: 'msg1',
          type: 'market_data',
          data: {},
          priority: 'normal',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          retryCount: 0,
          maxRetries: 3
        }
      ];

      jest.spyOn(messageQueue, 'getQueuedMessages').mockResolvedValue(messagesInQueue);

      await messageQueue.removeMessages(testUserId, ['msg1']);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.del).toHaveBeenCalledWith(`ws:queue:${testUserId}`);
      expect(pipeline.rpush).not.toHaveBeenCalled(); // No messages to re-add
    });
  });

  describe('getUserQueueStats', () => {
    test('should return queue statistics for a user', async () => {
      const mockMessages: QueuedMessage[] = [
        {
          id: 'msg1',
          type: 'market_data',
          data: {},
          priority: 'high',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          expiresAt: new Date(Date.now() + 3600000),
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: 'msg2',
          type: 'market_data',
          data: {},
          priority: 'normal',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          expiresAt: new Date(Date.now() + 3600000),
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: 'msg3',
          type: 'notification',
          data: {},
          priority: 'urgent',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          expiresAt: new Date(Date.now() + 3600000),
          retryCount: 0,
          maxRetries: 3
        }
      ];

      jest.spyOn(messageQueue, 'getQueuedMessages').mockResolvedValue(mockMessages);

      const stats = await messageQueue.getUserQueueStats(testUserId);

      expect(stats.totalMessages).toBe(3);
      expect(stats.messagesByPriority).toEqual({
        low: 0,
        normal: 1,
        high: 1,
        urgent: 1
      });
      expect(stats.messagesByType).toEqual({
        market_data: 2,
        notification: 1
      });
      expect(stats.oldestMessage).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(stats.newestMessage).toEqual(new Date('2024-01-01T12:00:00Z'));
    });
  });

  describe('cleanupExpiredMessages', () => {
    test('should clean up expired messages across all queues', async () => {
      mockRedis.keys.mockResolvedValue(['ws:queue:user1', 'ws:queue:user2']);
      mockRedis.llen
        .mockResolvedValueOnce(5) // Original count for user1
        .mockResolvedValueOnce(3); // Original count for user2

      // Mock getQueuedMessages to return fewer messages (indicating cleanup)
      jest.spyOn(messageQueue, 'getQueuedMessages')
        .mockResolvedValueOnce([]) // user1 has 0 valid messages (5 expired)
        .mockResolvedValueOnce([   // user2 has 2 valid messages (1 expired)
          {
            id: 'msg1',
            type: 'test',
            data: {},
            priority: 'normal',
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 3600000),
            retryCount: 0,
            maxRetries: 3
          },
          {
            id: 'msg2',
            type: 'test',
            data: {},
            priority: 'normal',
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 3600000),
            retryCount: 0,
            maxRetries: 3
          }
        ]);

      const cleanedCount = await messageQueue.cleanupExpiredMessages();

      expect(cleanedCount).toBe(6); // 5 from user1 + 1 from user2
    });
  });

  describe('getGlobalQueueStats', () => {
    test('should return global queue statistics', async () => {
      mockRedis.keys.mockResolvedValue(['ws:queue:user1', 'ws:queue:user2']);

      // Mock getUserQueueStats for each user
      jest.spyOn(messageQueue, 'getUserQueueStats')
        .mockResolvedValueOnce({
          totalMessages: 5,
          messagesByPriority: { low: 1, normal: 2, high: 1, urgent: 1 },
          messagesByType: { market_data: 3, notification: 2 },
          oldestMessage: new Date(),
          newestMessage: new Date()
        })
        .mockResolvedValueOnce({
          totalMessages: 3,
          messagesByPriority: { low: 0, normal: 1, high: 1, urgent: 1 },
          messagesByType: { market_data: 2, alert: 1 },
          oldestMessage: new Date(),
          newestMessage: new Date()
        });

      const globalStats = await messageQueue.getGlobalQueueStats();

      expect(globalStats.totalQueues).toBe(2);
      expect(globalStats.totalMessages).toBe(8);
      expect(globalStats.averageMessagesPerQueue).toBe(4);
      expect(globalStats.topMessageTypes).toEqual([
        { type: 'market_data', count: 5 },
        { type: 'notification', count: 2 },
        { type: 'alert', count: 1 }
      ]);
    });
  });
});