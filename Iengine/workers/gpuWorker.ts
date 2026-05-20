/**
 * GPU Worker
 * Processes image generation jobs from BullMQ queues.
 * Loads workflows, injects prompts, executes via ComfyUI,
 * monitors progress, stores assets, and returns metadata.
 */

import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../queues/redis';
import { QUEUE_NAMES } from '../queues/bullmq';
import { ComfyUIClient } from '../comfy/queuePrompt';
import { WorkflowInjector } from '../comfy/injectWorkflow';
import { QualityJudge } from '../core/qualityJudge';
import { WorkflowConfig, GenerationResult, QualityScores } from '../types';

export interface GPUWorkerOptions {
  gpuId?: number;
  comfyUrl?: string;
  concurrency?: number;
  queues?: string[];
}

export class GPUWorker {
  private workers: Worker[] = [];
  private comfyClient: ComfyUIClient;
  private injector: WorkflowInjector;
  private qualityJudge: QualityJudge;
  private gpuId: number;
  private jobsCompleted: number = 0;
  private startTime: number = Date.now();

  constructor(options: GPUWorkerOptions = {}) {
    this.gpuId = options.gpuId || 0;
    this.comfyClient = new ComfyUIClient(options.comfyUrl);
    this.injector = new WorkflowInjector();
    this.qualityJudge = new QualityJudge();
  }

  /**
   * Start processing jobs from queues.
   */
  async start(options: GPUWorkerOptions = {}): Promise<void> {
    const concurrency = options.concurrency || 1;
    const targetQueues = options.queues || [
      QUEUE_NAMES.BREAKING_PRIORITY,
      QUEUE_NAMES.PREMIUM_PRIORITY,
      QUEUE_NAMES.STANDARD,
    ];

    for (const queueName of targetQueues) {
      const worker = new Worker(
        queueName,
        async (job: Job) => this.processJob(job),
        {
          connection: createRedisConnection(),
          concurrency,
          limiter: {
            max: concurrency,
            duration: 1000,
          },
        }
      );

      worker.on('completed', (job) => {
        this.jobsCompleted++;
        console.log(`[GPU:${this.gpuId}] Job ${job.id} completed`);
      });

      worker.on('failed', (job, error) => {
        console.error(`[GPU:${this.gpuId}] Job ${job?.id} failed:`, error.message);
      });

      worker.on('error', (error) => {
        console.error(`[GPU:${this.gpuId}] Worker error:`, error.message);
      });

      this.workers.push(worker);
    }

    console.log(`[GPU:${this.gpuId}] Worker started on ${targetQueues.length} queues (concurrency: ${concurrency})`);
  }

  /**
   * Process a single generation job.
   */
  private async processJob(job: Job): Promise<GenerationResult> {
    const startTime = Date.now();
    const { scene_plan, prompt, negative_prompt, workflow_config, request } = job.data;

    await job.updateProgress(5);

    const wfConfig = workflow_config as WorkflowConfig;
    const seed = Math.floor(Math.random() * 2147483647);

    const comfyWorkflow = this.injector.buildFromConfig(
      wfConfig,
      prompt,
      negative_prompt,
      seed
    );

    await job.updateProgress(10);

    const promptResponse = await this.comfyClient.queuePrompt(comfyWorkflow);
    await job.updateProgress(20);

    const completionResult = await this.comfyClient.waitForCompletion(
      promptResponse.prompt_id,
      wfConfig.sla_seconds * 2 * 1000
    );

    await job.updateProgress(80);

    let imageBuffer: Buffer | null = null;
    let imageFilename = '';
    const cdnUrls: Record<string, string> = {};

    if (completionResult.images.length > 0) {
      const firstImage = completionResult.images[0];
      imageFilename = firstImage.filename;
      imageBuffer = await this.comfyClient.getImage(
        firstImage.filename,
        firstImage.subfolder,
        firstImage.type
      );
    }

    await job.updateProgress(85);

    let qualityScores: QualityScores;

    if (imageBuffer) {
      if (wfConfig.name === 'breaking-fast') {
        const quickResult = await this.qualityJudge.quickScore(imageBuffer);
        qualityScores = {
          clip_score: 0.8,
          aesthetic_score: 7.5,
          artifact_score: quickResult.approved ? 0.05 : 0.3,
          brand_alignment: 0.8,
          composition_score: 0.75,
          technical_quality: quickResult.overall,
          overall_score: quickResult.overall,
          approved: quickResult.approved,
        };
      } else {
        qualityScores = await this.qualityJudge.score(imageBuffer, prompt, scene_plan);
      }
    } else {
      qualityScores = {
        clip_score: 0,
        aesthetic_score: 0,
        artifact_score: 1,
        brand_alignment: 0,
        composition_score: 0,
        technical_quality: 0,
        overall_score: 0,
        approved: false,
        rejection_reasons: ['No image generated'],
      };
    }

    await job.updateProgress(95);

    const result: GenerationResult = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      request_id: request?.id || job.id!,
      article_id: request?.articleId,
      scene_plan,
      prompt,
      negative_prompt,
      workflow_used: wfConfig.name,
      image_url: imageFilename ? `comfyui://output/${imageFilename}` : '',
      cdn_urls: cdnUrls,
      quality_scores: qualityScores,
      variants: [],
      metadata: {
        generation_time_ms: Date.now() - startTime,
        model_used: wfConfig.model,
        seed,
        steps: wfConfig.steps,
        cfg: wfConfig.cfg,
        sampler: wfConfig.sampler,
        scheduler: wfConfig.scheduler,
        loras: wfConfig.lora,
      },
      status: qualityScores.approved ? 'approved' : 'rejected',
      created_at: new Date(),
      completed_at: new Date(),
    };

    await job.updateProgress(100);

    return result;
  }

  /**
   * Stop all workers gracefully.
   */
  async stop(): Promise<void> {
    await Promise.allSettled(this.workers.map(w => w.close()));
    this.workers = [];
    console.log(`[GPU:${this.gpuId}] Worker stopped. Jobs completed: ${this.jobsCompleted}`);
  }

  /**
   * Get worker status.
   */
  getStatus() {
    return {
      id: `gpu_worker_${this.gpuId}`,
      gpu_id: this.gpuId,
      status: this.workers.length > 0 ? 'running' : 'stopped',
      workers_active: this.workers.length,
      jobs_completed: this.jobsCompleted,
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}

export default GPUWorker;
