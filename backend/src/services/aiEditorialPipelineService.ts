/**
 * AI-0-3: Backend entrypoint for the canonical ai-system editorial pipeline.
 */
import { logger } from '../utils/logger';
import prisma from '../lib/prisma';

/**
 * Check whether the AI content pipeline is enabled via PlatformSettings.
 * Defaults to enabled when no settings row exists.
 */
export async function isAIContentPipelineEnabled(): Promise<boolean> {
  try {
    const settings = await prisma.platformSettings.findFirst();
    return settings?.aiContentPipelineEnabled ?? true;
  } catch {
    return true;
  }
}

export async function runEditorialPipelineJob(): Promise<unknown> {
  const enabled = await isAIContentPipelineEnabled();
  if (!enabled) {
    logger.warn('[EditorialPipeline] AI content pipeline is DISABLED via kill-switch. Skipping run.');
    return { skipped: true, reason: 'AI content pipeline disabled by admin kill-switch' };
  }

  const { runEditorialPipeline } = await import(
    '../../../ai-system/pipeline/editorialPipeline'
  );
  logger.info('[EditorialPipeline] Starting ai-system pipeline run');
  const result = await runEditorialPipeline();
  logger.info('[EditorialPipeline] Completed', { queueId: (result as { id?: string })?.id });
  return result;
}
