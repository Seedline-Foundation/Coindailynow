import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { createRedisClient } from './ioredis';

// Use Redis PubSub for production, in-memory for development
export const pubsub = process.env.NODE_ENV === 'production' 
  ? new RedisPubSub({
      publisher: createRedisClient({ enableReadyCheck: false, maxRetriesPerRequest: null }) as any,
      subscriber: createRedisClient({ enableReadyCheck: false, maxRetriesPerRequest: null }) as any,
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