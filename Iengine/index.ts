/**
 * Iengine — AI Visual Journalism Intelligence Engine
 *
 * A real-time editorial visual operating system for CoinDaily.
 * This is NOT merely an image generator. This is:
 *   - recognizable visual identity
 *   - cinematic editorial consistency
 *   - scalable automation
 *   - rapid breaking-news rendering
 *   - intelligent storytelling
 *   - regional visual differentiation
 *   - institutional-grade media aesthetics
 *
 * Architecture:
 *   headline → story decomposition → narrative classification
 *   → symbol extraction → scene planning → cinematic direction
 *   → brand governance → workflow routing → generation
 *   → quality scoring → post-processing → delivery
 */

// Core Engines
export { NarrativeEngine } from './core/narrativeEngine';
export { EmotionEngine } from './core/emotionEngine';
export { ScenePlanner } from './core/scenePlanner';
export { PromptComposer } from './core/promptComposer';
export { WorkflowRouter, workflowConfigs } from './core/workflowRouter';
export { QualityJudge } from './core/qualityJudge';

// Visual Bible
export * from './visual-bible';

// ComfyUI Integration
export { WorkflowInjector } from './comfy/injectWorkflow';
export { ComfyUIClient } from './comfy/queuePrompt';
export { ComfyUIWebSocket } from './comfy/websocketClient';

// Queue Infrastructure
export {
  QUEUE_NAMES,
  PRIORITIES,
  addGenerationJob,
  getAllQueueCounts,
} from './queues/bullmq';

// Workers
export { GPUWorker } from './workers/gpuWorker';
export { UpscaleWorker } from './workers/upscaleWorker';
export { ThumbnailWorker } from './workers/thumbnailWorker';
export { DeliveryWorker } from './workers/deliveryWorker';

// Quality & Thumbnail
export { ThumbnailIntelligence } from './quality/thumbnailIntelligence';

// Storage
export { CDNManager } from './storage/cdnManager';

// Service & API
export { IengineService } from './api/iengineService';
export { default as iengineRouter } from './api/routes';

// Config
export { loadConfig } from './config';

// Types
export * from './types';

// ─── Standalone Launcher ─────────────────────────────────────────────────────

import { GPUWorker } from './workers/gpuWorker';
import { UpscaleWorker } from './workers/upscaleWorker';
import { ThumbnailWorker } from './workers/thumbnailWorker';
import { DeliveryWorker } from './workers/deliveryWorker';
import { loadConfig } from './config';

/**
 * Launch Iengine as a standalone worker process.
 * Called when running `node dist/Iengine/index.js --workers`
 */
async function launchWorkers(): Promise<void> {
  const config = loadConfig();

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Iengine — AI Visual Journalism Intelligence    ║');
  console.log('║  Starting worker processes...                   ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const workers: Array<{ name: string; instance: any }> = [];

  for (let i = 0; i < config.workers.gpuCount; i++) {
    const gpuWorker = new GPUWorker({
      gpuId: i,
      concurrency: config.workers.concurrencyPerGpu,
    });
    await gpuWorker.start();
    workers.push({ name: `GPU Worker ${i}`, instance: gpuWorker });
  }

  if (config.generation.enableUpscaling) {
    const upscaleWorker = new UpscaleWorker();
    await upscaleWorker.start();
    workers.push({ name: 'Upscale Worker', instance: upscaleWorker });
  }

  if (config.generation.enableThumbnailGeneration) {
    const thumbnailWorker = new ThumbnailWorker();
    await thumbnailWorker.start(2);
    workers.push({ name: 'Thumbnail Worker', instance: thumbnailWorker });
  }

  const deliveryWorker = new DeliveryWorker();
  await deliveryWorker.start(2);
  workers.push({ name: 'Delivery Worker', instance: deliveryWorker });

  console.log(`\n[Iengine] ${workers.length} workers started:`);
  workers.forEach(w => console.log(`  ✓ ${w.name}`));
  console.log(`\n[Iengine] ComfyUI: ${config.comfyui.url}`);
  console.log(`[Iengine] Redis: ${config.redis.host}:${config.redis.port} db=${config.redis.db}`);
  console.log(`[Iengine] Ready to process generation jobs.\n`);

  const shutdown = async () => {
    console.log('\n[Iengine] Shutting down workers...');
    for (const w of workers) {
      await w.instance.stop?.();
    }
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (process.argv.includes('--workers')) {
  launchWorkers().catch((err) => {
    console.error('[Iengine] Fatal error:', err);
    process.exit(1);
  });
}
