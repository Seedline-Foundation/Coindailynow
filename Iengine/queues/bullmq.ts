/**
 * BullMQ Queue Definitions
 * Distributed GPU infrastructure queue management.
 *
 * Generation NEVER occurs synchronously.
 * API → BullMQ Queue → Redis → GPU Workers → Storage/CDN
 */

import { Queue, QueueEvents } from 'bullmq';
import { createRedisConnection } from './redis';

// ─── Queue Names ─────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  BREAKING_PRIORITY: 'iengine:breaking-priority',
  PREMIUM_PRIORITY: 'iengine:premium-priority',
  STANDARD: 'iengine:standard',
  THUMBNAIL_FAST: 'iengine:thumbnail-fast',
  UPSCALE: 'iengine:upscale',
  QUALITY_CHECK: 'iengine:quality-check',
  RETRY_FAILED: 'iengine:retry-failed',
  DELIVERY: 'iengine:delivery',
} as const;

// ─── Priority Values (lower = higher priority) ──────────────────────────────

export const PRIORITIES = {
  BREAKING: 1,
  PREMIUM: 2,
  STANDARD: 5,
  BACKGROUND: 10,
} as const;

// ─── Queue Factory ───────────────────────────────────────────────────────────

const queues: Map<string, Queue> = new Map();
const queueEvents: Map<string, QueueEvents> = new Map();

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    const connection = createRedisConnection();
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 86400,
          count: 5000,
        },
      },
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export function getQueueEvents(name: string): QueueEvents {
  if (!queueEvents.has(name)) {
    const connection = createRedisConnection();
    const events = new QueueEvents(name, { connection });
    queueEvents.set(name, events);
  }
  return queueEvents.get(name)!;
}

// ─── Convenience Accessors ───────────────────────────────────────────────────

export const breakingQueue = () => getQueue(QUEUE_NAMES.BREAKING_PRIORITY);
export const premiumQueue = () => getQueue(QUEUE_NAMES.PREMIUM_PRIORITY);
export const standardQueue = () => getQueue(QUEUE_NAMES.STANDARD);
export const thumbnailQueue = () => getQueue(QUEUE_NAMES.THUMBNAIL_FAST);
export const upscaleQueue = () => getQueue(QUEUE_NAMES.UPSCALE);
export const qualityCheckQueue = () => getQueue(QUEUE_NAMES.QUALITY_CHECK);
export const retryQueue = () => getQueue(QUEUE_NAMES.RETRY_FAILED);
export const deliveryQueue = () => getQueue(QUEUE_NAMES.DELIVERY);

// ─── Queue Operations ────────────────────────────────────────────────────────

export interface AddJobOptions {
  priority?: number;
  delay?: number;
  jobId?: string;
}

/**
 * Add an image generation job to the appropriate queue.
 */
export async function addGenerationJob(
  queueName: string,
  jobData: any,
  options?: AddJobOptions
): Promise<string> {
  const queue = getQueue(queueName);
  const job = await queue.add('generate', jobData, {
    priority: options?.priority,
    delay: options?.delay,
    jobId: options?.jobId,
  });
  return job.id!;
}

/**
 * Get counts across all queues.
 */
export async function getAllQueueCounts(): Promise<Record<string, any>> {
  const counts: Record<string, any> = {};

  for (const [key, name] of Object.entries(QUEUE_NAMES)) {
    try {
      const queue = getQueue(name);
      counts[key] = await queue.getJobCounts();
    } catch {
      counts[key] = { error: 'unavailable' };
    }
  }

  return counts;
}

/**
 * Gracefully close all queues.
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const queue of queues.values()) {
    closePromises.push(queue.close());
  }
  for (const events of queueEvents.values()) {
    closePromises.push(events.close());
  }

  await Promise.allSettled(closePromises);
  queues.clear();
  queueEvents.clear();
}

export default {
  QUEUE_NAMES,
  PRIORITIES,
  getQueue,
  addGenerationJob,
  getAllQueueCounts,
  closeAllQueues,
};
