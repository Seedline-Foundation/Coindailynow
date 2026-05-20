/**
 * Delivery Worker
 * Handles post-generation delivery: CDN upload, CMS update,
 * article image association, and webhook notifications.
 */

import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../queues/redis';
import { QUEUE_NAMES } from '../queues/bullmq';
import { GenerationResult } from '../types';

export interface DeliveryJobData {
  generation_result: GenerationResult;
  image_buffer_base64: string;
  article_id?: string;
  callback_url?: string;
  upload_to_cdn: boolean;
  update_cms: boolean;
}

export class DeliveryWorker {
  private worker: Worker | null = null;
  private backendUrl: string;
  private serviceToken: string;

  constructor() {
    this.backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000';
    this.serviceToken = process.env.IENGINE_SERVICE_TOKEN || process.env.AI_PIPELINE_SERVICE_TOKEN || '';
  }

  async start(concurrency: number = 2): Promise<void> {
    this.worker = new Worker(
      QUEUE_NAMES.DELIVERY,
      async (job: Job<DeliveryJobData>) => this.processJob(job),
      {
        connection: createRedisConnection(),
        concurrency,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[DeliveryWorker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[DeliveryWorker] Job ${job?.id} failed:`, error.message);
    });

    console.log('[DeliveryWorker] Started');
  }

  private async processJob(job: Job<DeliveryJobData>): Promise<any> {
    const { generation_result, image_buffer_base64, article_id, callback_url, upload_to_cdn, update_cms } = job.data;

    await job.updateProgress(10);

    let cdnUrl: string | null = null;

    if (upload_to_cdn && image_buffer_base64) {
      cdnUrl = await this.uploadToCDN(image_buffer_base64, generation_result.id);
      await job.updateProgress(40);
    }

    if (update_cms && article_id && cdnUrl) {
      await this.updateCMS(article_id, cdnUrl, generation_result);
      await job.updateProgress(70);
    }

    if (callback_url) {
      await this.sendWebhook(callback_url, {
        ...generation_result,
        image_url: cdnUrl || generation_result.image_url,
      });
      await job.updateProgress(90);
    }

    await job.updateProgress(100);

    return {
      cdn_url: cdnUrl,
      cms_updated: update_cms && !!article_id,
      webhook_sent: !!callback_url,
      delivered_at: new Date().toISOString(),
    };
  }

  private async uploadToCDN(imageBase64: string, imageId: string): Promise<string> {
    try {
      const response = await fetch(`${this.backendUrl}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.serviceToken ? { Authorization: `Bearer ${this.serviceToken}` } : {}),
        },
        body: JSON.stringify({
          image: `data:image/png;base64,${imageBase64}`,
          prefix: 'iengine-images',
          filename: `${imageId}.png`,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const data = await response.json() as { url?: string };
        if (data.url) {
          const publicBase = process.env.CFIS_PUBLIC_MEDIA_BASE?.replace(/\/$/, '');
          if (publicBase) {
            try {
              const pathOnly = new URL(data.url).pathname;
              return `${publicBase}${pathOnly}`;
            } catch {
              return data.url;
            }
          }
          return data.url;
        }
      }
    } catch (error: any) {
      console.error('[DeliveryWorker] CDN upload failed:', error.message);
    }

    return '';
  }

  private async updateCMS(
    articleId: string,
    imageUrl: string,
    result: GenerationResult
  ): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/iengine/delivery/cms-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.serviceToken ? { Authorization: `Bearer ${this.serviceToken}` } : {}),
        },
        body: JSON.stringify({
          articleId,
          imageUrl,
          quality_scores: result.quality_scores,
          metadata: result.metadata,
          scene_plan: result.scene_plan,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error: any) {
      console.error('[DeliveryWorker] CMS update failed:', error.message);
    }
  }

  private async sendWebhook(url: string, data: any): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error: any) {
      console.error('[DeliveryWorker] Webhook failed:', error.message);
    }
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    console.log('[DeliveryWorker] Stopped');
  }
}

export default DeliveryWorker;
