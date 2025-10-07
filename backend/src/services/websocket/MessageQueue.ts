/**
 * Message Queue
 * Task 14: WebSocket Real-Time System
 * 
 * Queues messages for offline users with Redis persistence and TTL management
 */

import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export interface QueuedMessage {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  retryCount: number;
  maxRetries: number;
  expiresAt: Date;
}

export interface QueueStats {
  totalMessages: number;
  messagesByPriority: { [key: string]: number };
  messagesByType: { [key: string]: number };
  oldestMessage?: Date | undefined;
  newestMessage?: Date | undefined;
}

export class MessageQueue {
  private redis: Redis;
  private readonly QUEUE_PREFIX = 'ws:queue:';
  private readonly QUEUE_METADATA_PREFIX = 'ws:queue_meta:';
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly MAX_QUEUE_SIZE = 1000; // Maximum messages per user

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Queue a message for an offline user
   */
  public async queueMessage(
    userId: string,
    message: { type: string; data: any; timestamp?: Date },
    options: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      ttl?: number;
      maxRetries?: number;
    } = {}
  ): Promise<void> {
    try {
      const messageId = this.generateMessageId();
      const timestamp = message.timestamp || new Date();
      const priority = options.priority || 'normal';
      const ttl = options.ttl || this.DEFAULT_TTL;
      const maxRetries = options.maxRetries || 3;

      const queuedMessage: QueuedMessage = {
        id: messageId,
        type: message.type,
        data: message.data,
        timestamp,
        priority,
        retryCount: 0,
        maxRetries,
        expiresAt: new Date(Date.now() + ttl * 1000)
      };

      const userQueueKey = `${this.QUEUE_PREFIX}${userId}`;
      const metadataKey = `${this.QUEUE_METADATA_PREFIX}${userId}`;

      // Check queue size limit
      const currentSize = await this.redis.llen(userQueueKey);
      if (currentSize >= this.MAX_QUEUE_SIZE) {
        // Remove oldest message to make room
        await this.redis.lpop(userQueueKey);
        logger.warn(`Queue size limit reached for user ${userId}, removed oldest message`);
      }

      // Add message to queue (newest messages at the end)
      const pipeline = this.redis.pipeline();
      pipeline.rpush(userQueueKey, JSON.stringify(queuedMessage));
      pipeline.expire(userQueueKey, ttl);

      // Update metadata
      const metadata = {
        lastMessageAt: timestamp.toISOString(),
        messageCount: currentSize + 1,
        priority
      };
      pipeline.hset(metadataKey, metadata);
      pipeline.expire(metadataKey, ttl);

      await pipeline.exec();

      logger.debug(`Queued ${message.type} message for offline user ${userId}`);

      // Update queue metrics
      await this.updateQueueMetrics(message.type, priority);
    } catch (error) {
      logger.error(`Error queuing message for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all queued messages for a user
   */
  public async getQueuedMessages(userId: string): Promise<QueuedMessage[]> {
    try {
      const userQueueKey = `${this.QUEUE_PREFIX}${userId}`;
      const rawMessages = await this.redis.lrange(userQueueKey, 0, -1);

      const messages: QueuedMessage[] = [];
      const expiredMessageIndices: number[] = [];
      const now = new Date();

      rawMessages.forEach((rawMessage, index) => {
        try {
          const message = JSON.parse(rawMessage) as QueuedMessage;
          message.timestamp = new Date(message.timestamp);
          message.expiresAt = new Date(message.expiresAt);

          // Check if message has expired
          if (message.expiresAt < now) {
            expiredMessageIndices.push(index);
          } else {
            messages.push(message);
          }
        } catch (parseError) {
          logger.error(`Error parsing queued message for user ${userId}:`, parseError);
          expiredMessageIndices.push(index);
        }
      });

      // Remove expired messages
      if (expiredMessageIndices.length > 0) {
        await this.removeExpiredMessages(userQueueKey, expiredMessageIndices);
      }

      // Sort messages by priority and timestamp
      messages.sort((a, b) => {
        const priorityOrder = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      return messages;
    } catch (error) {
      logger.error(`Error getting queued messages for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Clear all messages for a user (called after successful delivery)
   */
  public async clearMessages(userId: string): Promise<void> {
    try {
      const userQueueKey = `${this.QUEUE_PREFIX}${userId}`;
      const metadataKey = `${this.QUEUE_METADATA_PREFIX}${userId}`;

      const pipeline = this.redis.pipeline();
      pipeline.del(userQueueKey);
      pipeline.del(metadataKey);

      await pipeline.exec();

      logger.debug(`Cleared message queue for user ${userId}`);
    } catch (error) {
      logger.error(`Error clearing messages for user ${userId}:`, error);
    }
  }

  /**
   * Remove specific messages from user's queue
   */
  public async removeMessages(userId: string, messageIds: string[]): Promise<void> {
    try {
      const userQueueKey = `${this.QUEUE_PREFIX}${userId}`;
      const messages = await this.getQueuedMessages(userId);

      // Filter out messages to remove
      const remainingMessages = messages.filter(msg => !messageIds.includes(msg.id));

      // Replace the entire queue with remaining messages
      const pipeline = this.redis.pipeline();
      pipeline.del(userQueueKey);

      if (remainingMessages.length > 0) {
        const serializedMessages = remainingMessages.map(msg => JSON.stringify(msg));
        pipeline.rpush(userQueueKey, ...serializedMessages);
        pipeline.expire(userQueueKey, this.DEFAULT_TTL);
      }

      await pipeline.exec();

      logger.debug(`Removed ${messageIds.length} messages from user ${userId} queue`);
    } catch (error) {
      logger.error(`Error removing messages for user ${userId}:`, error);
    }
  }

  /**
   * Get queue statistics for a user
   */
  public async getUserQueueStats(userId: string): Promise<QueueStats> {
    try {
      const messages = await this.getQueuedMessages(userId);

      const messagesByPriority: { [key: string]: number } = {
        low: 0, normal: 0, high: 0, urgent: 0
      };
      const messagesByType: { [key: string]: number } = {};

      let oldestMessage: Date | undefined;
      let newestMessage: Date | undefined;

      messages.forEach(message => {
        const currentCount = messagesByPriority[message.priority] || 0;
        messagesByPriority[message.priority] = currentCount + 1;
        messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;

        if (!oldestMessage || message.timestamp < oldestMessage) {
          oldestMessage = message.timestamp;
        }
        if (!newestMessage || message.timestamp > newestMessage) {
          newestMessage = message.timestamp;
        }
      });

      return {
        totalMessages: messages.length,
        messagesByPriority,
        messagesByType,
        oldestMessage,
        newestMessage
      };
    } catch (error) {
      logger.error(`Error getting queue stats for user ${userId}:`, error);
      return {
        totalMessages: 0,
        messagesByPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
        messagesByType: {}
      };
    }
  }

  /**
   * Clean up expired messages across all user queues
   */
  public async cleanupExpiredMessages(): Promise<number> {
    try {
      const queueKeys = await this.redis.keys(`${this.QUEUE_PREFIX}*`);
      let totalCleaned = 0;

      for (const queueKey of queueKeys) {
        const userId = queueKey.replace(this.QUEUE_PREFIX, '');
        const messages = await this.getQueuedMessages(userId);
        const originalCount = await this.redis.llen(queueKey);
        
        if (messages.length < originalCount) {
          totalCleaned += (originalCount - messages.length);
        }
      }

      logger.info(`Cleaned up ${totalCleaned} expired messages across all queues`);
      return totalCleaned;
    } catch (error) {
      logger.error('Error cleaning up expired messages:', error);
      return 0;
    }
  }

  /**
   * Get global queue statistics
   */
  public async getGlobalQueueStats(): Promise<{
    totalQueues: number;
    totalMessages: number;
    averageMessagesPerQueue: number;
    topMessageTypes: Array<{ type: string; count: number }>;
  }> {
    try {
      const queueKeys = await this.redis.keys(`${this.QUEUE_PREFIX}*`);
      let totalMessages = 0;
      const messageTypes: { [key: string]: number } = {};

      for (const queueKey of queueKeys) {
        const userId = queueKey.replace(this.QUEUE_PREFIX, '');
        const stats = await this.getUserQueueStats(userId);
        totalMessages += stats.totalMessages;

        Object.entries(stats.messagesByType).forEach(([type, count]) => {
          messageTypes[type] = (messageTypes[type] || 0) + count;
        });
      }

      const topMessageTypes = Object.entries(messageTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalQueues: queueKeys.length,
        totalMessages,
        averageMessagesPerQueue: queueKeys.length > 0 ? totalMessages / queueKeys.length : 0,
        topMessageTypes
      };
    } catch (error) {
      logger.error('Error getting global queue statistics:', error);
      return {
        totalQueues: 0,
        totalMessages: 0,
        averageMessagesPerQueue: 0,
        topMessageTypes: []
      };
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async removeExpiredMessages(queueKey: string, expiredIndices: number[]): Promise<void> {
    // Remove expired messages in reverse order to maintain indices
    const sortedIndices = expiredIndices.sort((a, b) => b - a);
    
    for (const index of sortedIndices) {
      // Use Lua script to remove by index atomically
      await this.redis.eval(`
        local messages = redis.call('lrange', KEYS[1], 0, -1)
        redis.call('del', KEYS[1])
        for i, message in ipairs(messages) do
          if i ~= tonumber(ARGV[1]) + 1 then
            redis.call('rpush', KEYS[1], message)
          end
        end
      `, 1, queueKey, index);
    }
  }

  private async updateQueueMetrics(messageType: string, priority: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const pipeline = this.redis.pipeline();

      // Update message type metrics
      const typeMetricKey = `metrics:queue:type:${today}:${messageType}`;
      pipeline.incr(typeMetricKey);
      pipeline.expire(typeMetricKey, 30 * 24 * 60 * 60); // 30 days

      // Update priority metrics
      const priorityMetricKey = `metrics:queue:priority:${today}:${priority}`;
      pipeline.incr(priorityMetricKey);
      pipeline.expire(priorityMetricKey, 30 * 24 * 60 * 60); // 30 days

      await pipeline.exec();
    } catch (error) {
      logger.error('Error updating queue metrics:', error);
      // Don't throw - metrics are not critical
    }
  }
}