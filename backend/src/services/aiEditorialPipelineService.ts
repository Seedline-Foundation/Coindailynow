/**
 * AI-0-3: Backend entrypoint for the canonical ai-system editorial pipeline.
 */
import { logger } from '../utils/logger';

export async function runEditorialPipelineJob(): Promise<unknown> {
  const { runEditorialPipeline } = await import(
    '../../../ai-system/pipeline/editorialPipeline'
  );
  logger.info('[EditorialPipeline] Starting ai-system pipeline run');
  const result = await runEditorialPipeline();
  logger.info('[EditorialPipeline] Completed', { queueId: (result as { id?: string })?.id });
  return result;
}
