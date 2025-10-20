import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

// Create Redis instances for pub/sub
const createRedisInstance = (options: any = {}) => {
  const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    ...options,
  };

  return new Redis(redisOptions);
};

// Use Redis PubSub for production, in-memory for development
export const pubsub = process.env.NODE_ENV === 'production' 
  ? new RedisPubSub({
      publisher: createRedisInstance(),
      subscriber: createRedisInstance(),
    })
  : new PubSub();

// Subscription event types
export const SUBSCRIPTION_EVENTS = {
  VIOLATION_DETECTED: 'VIOLATION_DETECTED',
  MODERATION_ALERT: 'MODERATION_ALERT',
  QUEUE_UPDATED: 'QUEUE_UPDATED',
  USER_PENALTY_APPLIED: 'USER_PENALTY_APPLIED',
  USER_REPUTATION_CHANGED: 'USER_REPUTATION_CHANGED',
  SYSTEM_HEALTH_CHANGED: 'SYSTEM_HEALTH_CHANGED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  METRICS_UPDATED: 'METRICS_UPDATED',
} as const;

export type SubscriptionEvent = typeof SUBSCRIPTION_EVENTS[keyof typeof SUBSCRIPTION_EVENTS];

export default pubsub;