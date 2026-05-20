/**
 * AI-0-3: Single editorial pipeline entrypoint for backend workers.
 */

import Redis from 'ioredis';
import { AIReviewAgent } from '../agents/review/aiReviewAgent';
import ResearchAgent from '../agents/research/researchAgent';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: process.env.NODE_ENV === 'test' })],
});

export async function runEditorialPipeline() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const prisma = new PrismaClient();
  const research = new ResearchAgent(prisma, logger);
  const agent = new AIReviewAgent(redis, logger, prisma);

  const outcome = await research.fetchTrendingTopics();
  return agent.orchestrateArticleCreation(outcome as any);
}
