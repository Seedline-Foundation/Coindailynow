/**
 * Subscription Manager
 * Task 14: WebSocket Real-Time System
 * 
 * Manages user subscriptions to market data streams with Redis persistence
 */

import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export class SubscriptionManager {
  private redis: Redis;
  private prisma: PrismaClient;
  private readonly SUBSCRIPTION_PREFIX = 'ws:sub:';
  private readonly USER_SUBSCRIPTIONS_PREFIX = 'ws:user_subs:';

  constructor(redis: Redis, prisma: PrismaClient) {
    this.redis = redis;
    this.prisma = prisma;
  }

  /**
   * Subscribe user to market data symbols
   */
  public async subscribe(userId: string, symbols: string[]): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      for (const symbol of symbols) {
        // Add user to symbol subscription set
        pipeline.sadd(`${this.SUBSCRIPTION_PREFIX}${symbol}`, userId);
        
        // Add symbol to user's subscriptions set
        pipeline.sadd(`${this.USER_SUBSCRIPTIONS_PREFIX}${userId}`, symbol);
      }

      await pipeline.exec();

      // Log subscription activity
      logger.info(`User ${userId} subscribed to symbols: ${symbols.join(', ')}`);
      
      // Update subscription metrics
      await this.updateSubscriptionMetrics(symbols, 'subscribe');
    } catch (error) {
      logger.error(`Error subscribing user ${userId} to symbols ${symbols}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from market data symbols
   */
  public async unsubscribe(userId: string, symbols: string[]): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      for (const symbol of symbols) {
        // Remove user from symbol subscription set
        pipeline.srem(`${this.SUBSCRIPTION_PREFIX}${symbol}`, userId);
        
        // Remove symbol from user's subscriptions set
        pipeline.srem(`${this.USER_SUBSCRIPTIONS_PREFIX}${userId}`, symbol);
      }

      await pipeline.exec();

      logger.info(`User ${userId} unsubscribed from symbols: ${symbols.join(', ')}`);
      
      // Update subscription metrics
      await this.updateSubscriptionMetrics(symbols, 'unsubscribe');
    } catch (error) {
      logger.error(`Error unsubscribing user ${userId} from symbols ${symbols}:`, error);
      throw error;
    }
  }

  /**
   * Get all symbols a user is subscribed to
   */
  public async getUserSubscriptions(userId: string): Promise<string[]> {
    try {
      const symbols = await this.redis.smembers(`${this.USER_SUBSCRIPTIONS_PREFIX}${userId}`);
      return symbols;
    } catch (error) {
      logger.error(`Error getting subscriptions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all users subscribed to a symbol
   */
  public async getSymbolSubscribers(symbol: string): Promise<string[]> {
    try {
      const userIds = await this.redis.smembers(`${this.SUBSCRIPTION_PREFIX}${symbol}`);
      return userIds;
    } catch (error) {
      logger.error(`Error getting subscribers for symbol ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Remove all subscriptions for a user (used on disconnect)
   */
  public async removeAllUserSubscriptions(userId: string): Promise<void> {
    try {
      // Get user's current subscriptions
      const symbols = await this.getUserSubscriptions(userId);
      
      if (symbols.length === 0) {
        return;
      }

      const pipeline = this.redis.pipeline();

      // Remove user from all symbol subscription sets
      for (const symbol of symbols) {
        pipeline.srem(`${this.SUBSCRIPTION_PREFIX}${symbol}`, userId);
      }

      // Remove user's subscription set
      pipeline.del(`${this.USER_SUBSCRIPTIONS_PREFIX}${userId}`);

      await pipeline.exec();

      logger.info(`Removed all subscriptions for user ${userId}`);
    } catch (error) {
      logger.error(`Error removing all subscriptions for user ${userId}:`, error);
    }
  }

  /**
   * Get subscription statistics
   */
  public async getSubscriptionStats(): Promise<{
    totalUniqueSymbols: number;
    totalUniqueUsers: number;
    totalSubscriptions: number;
    topSymbols: Array<{ symbol: string; subscriberCount: number }>;
  }> {
    try {
      // Get all symbol keys
      const symbolKeys = await this.redis.keys(`${this.SUBSCRIPTION_PREFIX}*`);
      const userKeys = await this.redis.keys(`${this.USER_SUBSCRIPTIONS_PREFIX}*`);

      let totalSubscriptions = 0;
      const symbolStats: Array<{ symbol: string; subscriberCount: number }> = [];

      // Get subscriber count for each symbol
      for (const key of symbolKeys) {
        const symbol = key.replace(this.SUBSCRIPTION_PREFIX, '');
        const subscriberCount = await this.redis.scard(key);
        symbolStats.push({ symbol, subscriberCount });
        totalSubscriptions += subscriberCount;
      }

      // Sort symbols by subscriber count
      symbolStats.sort((a, b) => b.subscriberCount - a.subscriberCount);

      return {
        totalUniqueSymbols: symbolKeys.length,
        totalUniqueUsers: userKeys.length,
        totalSubscriptions,
        topSymbols: symbolStats.slice(0, 10) // Top 10 symbols
      };
    } catch (error) {
      logger.error('Error getting subscription statistics:', error);
      return {
        totalUniqueSymbols: 0,
        totalUniqueUsers: 0,
        totalSubscriptions: 0,
        topSymbols: []
      };
    }
  }

  /**
   * Clean up expired or orphaned subscriptions
   */
  public async cleanupSubscriptions(): Promise<void> {
    try {
      const symbolKeys = await this.redis.keys(`${this.SUBSCRIPTION_PREFIX}*`);
      const pipeline = this.redis.pipeline();

      for (const key of symbolKeys) {
        // Check if the subscription set is empty
        const count = await this.redis.scard(key);
        if (count === 0) {
          pipeline.del(key);
        }
      }

      const results = await pipeline.exec();
      const deletedKeys = results?.filter(result => result && result[1] === 1).length || 0;
      
      if (deletedKeys > 0) {
        logger.info(`Cleaned up ${deletedKeys} empty subscription sets`);
      }
    } catch (error) {
      logger.error('Error cleaning up subscriptions:', error);
    }
  }

  /**
   * Update subscription metrics for analytics
   */
  private async updateSubscriptionMetrics(symbols: string[], action: 'subscribe' | 'unsubscribe'): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const pipeline = this.redis.pipeline();

      for (const symbol of symbols) {
        const metricKey = `metrics:subscription:${action}:${today}:${symbol}`;
        pipeline.incr(metricKey);
        pipeline.expire(metricKey, 30 * 24 * 60 * 60); // Expire after 30 days
      }

      await pipeline.exec();
    } catch (error) {
      logger.error('Error updating subscription metrics:', error);
      // Don't throw - metrics are not critical
    }
  }

  /**
   * Get subscription metrics for a specific date and symbol
   */
  public async getSubscriptionMetrics(date: string, symbol: string): Promise<{
    subscriptions: number;
    unsubscriptions: number;
  }> {
    try {
      const subscribeKey = `metrics:subscription:subscribe:${date}:${symbol}`;
      const unsubscribeKey = `metrics:subscription:unsubscribe:${date}:${symbol}`;

      const [subscriptions, unsubscriptions] = await Promise.all([
        this.redis.get(subscribeKey).then(val => parseInt(val || '0')),
        this.redis.get(unsubscribeKey).then(val => parseInt(val || '0'))
      ]);

      return { subscriptions, unsubscriptions };
    } catch (error) {
      logger.error(`Error getting subscription metrics for ${date}:${symbol}:`, error);
      return { subscriptions: 0, unsubscriptions: 0 };
    }
  }
}