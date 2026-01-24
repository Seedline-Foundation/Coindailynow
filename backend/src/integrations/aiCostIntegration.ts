/**
 * AI Cost Integration (STUB)
 * See docs/ai-system/TASK_10.3_IMPLEMENTATION.md for full implementation
 */

import { Express } from 'express';
import aiCostRoutes from '../api/ai-costs';
import { logger } from '../utils/logger';

export async function mountAICostSystem(
  app: Express,
  basePath: string = '/api',
  options: any = {}
): Promise<void> {
  logger.info('Mounting AI Cost system in stub mode');
  logger.info('Full implementation available after running: npx prisma migrate dev');
  
  // Mount stub routes
  app.use(`${basePath}/ai/costs`, aiCostRoutes);
  
  logger.info('AI Cost stub system mounted successfully');
  logger.info('See docs/ai-system/TASK_10.3_IMPLEMENTATION.md for details');
}
