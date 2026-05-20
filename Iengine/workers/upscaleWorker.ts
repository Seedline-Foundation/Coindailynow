/**
 * Upscale Worker
 * Handles image upscaling jobs using ComfyUI Ultimate SD Upscale
 * or Real-ESRGAN for post-processing enhancement.
 */

import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../queues/redis';
import { QUEUE_NAMES } from '../queues/bullmq';
import { ComfyUIClient } from '../comfy/queuePrompt';

export interface UpscaleJobData {
  image_url: string;
  image_buffer_base64?: string;
  target_width?: number;
  target_height?: number;
  scale_factor?: number;
  method: 'ultimate-sd-upscale' | 'real-esrgan' | 'lanczos';
  denoise_strength?: number;
  request_id: string;
}

export class UpscaleWorker {
  private worker: Worker | null = null;
  private comfyClient: ComfyUIClient;

  constructor(comfyUrl?: string) {
    this.comfyClient = new ComfyUIClient(comfyUrl);
  }

  async start(concurrency: number = 1): Promise<void> {
    this.worker = new Worker(
      QUEUE_NAMES.UPSCALE,
      async (job: Job<UpscaleJobData>) => this.processJob(job),
      {
        connection: createRedisConnection(),
        concurrency,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[UpscaleWorker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[UpscaleWorker] Job ${job?.id} failed:`, error.message);
    });

    console.log('[UpscaleWorker] Started');
  }

  private async processJob(job: Job<UpscaleJobData>): Promise<any> {
    const { method, scale_factor = 2, denoise_strength = 0.35 } = job.data;

    await job.updateProgress(10);

    switch (method) {
      case 'ultimate-sd-upscale':
        return this.upscaleWithComfyUI(job);

      case 'real-esrgan':
        return this.upscaleWithESRGAN(job);

      case 'lanczos':
        return this.upscaleWithLanczos(job);

      default:
        throw new Error(`Unknown upscale method: ${method}`);
    }
  }

  private async upscaleWithComfyUI(job: Job<UpscaleJobData>): Promise<any> {
    const upscaleWorkflow = {
      '1': {
        inputs: {
          image: job.data.image_url,
          upscale_model: 'RealESRGAN_x4plus.pth',
        },
        class_type: 'UpscaleModelLoader',
        _meta: { title: 'Upscale Model' },
      },
      '2': {
        inputs: {
          upscale_model: ['1', 0],
          image: job.data.image_url,
        },
        class_type: 'ImageUpscaleWithModel',
        _meta: { title: 'Upscale Image' },
      },
      '3': {
        inputs: {
          filename_prefix: 'Iengine_upscaled',
          images: ['2', 0],
        },
        class_type: 'SaveImage',
        _meta: { title: 'Save Upscaled' },
      },
    };

    await job.updateProgress(30);

    const result = await this.comfyClient.queuePrompt(upscaleWorkflow as any);
    const completion = await this.comfyClient.waitForCompletion(result.prompt_id, 120000);

    await job.updateProgress(90);

    let imageBuffer: Buffer | null = null;
    if (completion.images.length > 0) {
      imageBuffer = await this.comfyClient.getImage(
        completion.images[0].filename,
        completion.images[0].subfolder,
        completion.images[0].type
      );
    }

    return {
      request_id: job.data.request_id,
      upscaled_filename: completion.images[0]?.filename,
      image_buffer_base64: imageBuffer?.toString('base64'),
      method: 'ultimate-sd-upscale',
      scale_factor: job.data.scale_factor || 2,
    };
  }

  private async upscaleWithESRGAN(job: Job<UpscaleJobData>): Promise<any> {
    await job.updateProgress(50);

    return {
      request_id: job.data.request_id,
      method: 'real-esrgan',
      status: 'delegated_to_comfyui',
    };
  }

  private async upscaleWithLanczos(job: Job<UpscaleJobData>): Promise<any> {
    await job.updateProgress(50);

    return {
      request_id: job.data.request_id,
      method: 'lanczos',
      status: 'requires_sharp_processing',
    };
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    console.log('[UpscaleWorker] Stopped');
  }
}

export default UpscaleWorker;
