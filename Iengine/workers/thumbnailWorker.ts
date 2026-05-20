/**
 * Thumbnail Worker
 * Specialized worker for CTR-optimized thumbnail generation.
 * Handles cropping, platform-specific variants, and saliency-based focus.
 */

import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../queues/redis';
import { QUEUE_NAMES } from '../queues/bullmq';
import { ThumbnailPlan, PlatformCrop } from '../types';

export interface ThumbnailJobData {
  request_id: string;
  source_image_base64: string;
  thumbnail_plan: ThumbnailPlan;
  article_id?: string;
}

const PLATFORM_SPECS: PlatformCrop[] = [
  { platform: 'twitter', width: 1200, height: 675, crop_gravity: 'center' },
  { platform: 'youtube', width: 1280, height: 720, crop_gravity: 'attention' },
  { platform: 'telegram', width: 800, height: 418, crop_gravity: 'center' },
  { platform: 'homepage', width: 1200, height: 630, crop_gravity: 'attention' },
  { platform: 'mobile', width: 400, height: 300, crop_gravity: 'center' },
];

export class ThumbnailWorker {
  private worker: Worker | null = null;

  async start(concurrency: number = 2): Promise<void> {
    this.worker = new Worker(
      QUEUE_NAMES.THUMBNAIL_FAST,
      async (job: Job<ThumbnailJobData>) => this.processJob(job),
      {
        connection: createRedisConnection(),
        concurrency,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[ThumbnailWorker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[ThumbnailWorker] Job ${job?.id} failed:`, error.message);
    });

    console.log('[ThumbnailWorker] Started');
  }

  private async processJob(job: Job<ThumbnailJobData>): Promise<any> {
    const { thumbnail_plan, source_image_base64, request_id } = job.data;
    await job.updateProgress(10);

    const variants: any[] = [];

    const platforms = thumbnail_plan.platform_variants.length > 0
      ? thumbnail_plan.platform_variants
      : PLATFORM_SPECS;

    for (let i = 0; i < platforms.length; i++) {
      const platformCrop = platforms[i];
      const variant = await this.generateVariant(
        source_image_base64,
        platformCrop,
        thumbnail_plan
      );
      variants.push(variant);

      const progress = 10 + ((i + 1) / platforms.length) * 80;
      await job.updateProgress(Math.round(progress));
    }

    await job.updateProgress(100);

    return {
      request_id,
      variants,
      generated_at: new Date().toISOString(),
    };
  }

  private async generateVariant(
    sourceBase64: string,
    crop: PlatformCrop,
    plan: ThumbnailPlan
  ): Promise<any> {
    try {
      const sharp = require('sharp');
      const imageBuffer = Buffer.from(sourceBase64, 'base64');

      const gravity = this.mapCropGravity(crop.crop_gravity, plan.crop_focus);

      const cropped = await sharp(imageBuffer)
        .resize(crop.width, crop.height, {
          fit: 'cover',
          position: gravity,
        })
        .sharpen({ sigma: 1.2 })
        .modulate({
          brightness: plan.contrast === 'high' ? 1.05 : 1.0,
          saturation: plan.contrast === 'high' ? 1.15 : 1.0,
        })
        .toBuffer();

      return {
        platform: crop.platform,
        width: crop.width,
        height: crop.height,
        image_base64: cropped.toString('base64'),
        size_bytes: cropped.length,
      };
    } catch (error: any) {
      return {
        platform: crop.platform,
        width: crop.width,
        height: crop.height,
        error: error.message,
      };
    }
  }

  private mapCropGravity(
    cropGravity: string,
    planFocus: ThumbnailPlan['crop_focus']
  ): string {
    if (cropGravity === 'attention') return 'attention';

    const focusMap: Record<string, string> = {
      center: 'centre',
      left: 'west',
      right: 'east',
      top: 'north',
      bottom: 'south',
    };

    return focusMap[planFocus] || 'centre';
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    console.log('[ThumbnailWorker] Stopped');
  }
}

export default ThumbnailWorker;
