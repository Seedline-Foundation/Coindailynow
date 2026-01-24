/**
 * AI Cost Worker (STUB)
 * See docs/ai-system/TASK_10.3_IMPLEMENTATION.md for full implementation
 */

import { logger } from '../utils/logger';

export async function startAICostWorker(): Promise<void> {
  logger.info('AI Cost Worker in stub mode - run migration to activate');
}

export async function stopAICostWorker(): Promise<void> {
  logger.info('AI Cost Worker stopped');
}
