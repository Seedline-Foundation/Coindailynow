/**
 * Iengine Service
 * The main orchestration service that ties all engines together.
 * This is the primary interface for the backend and CMS integration.
 *
 * Full pipeline:
 *   headline → narrative analysis → emotion analysis → scene planning
 *   → prompt composition → workflow routing → queue submission
 *   → GPU generation → quality scoring → thumbnail generation
 *   → CDN upload → CMS delivery
 */

import { NarrativeEngine } from '../core/narrativeEngine';
import { EmotionEngine } from '../core/emotionEngine';
import { ScenePlanner } from '../core/scenePlanner';
import { PromptComposer } from '../core/promptComposer';
import { WorkflowRouter } from '../core/workflowRouter';
import { QualityJudge } from '../core/qualityJudge';
import { ThumbnailIntelligence } from '../quality/thumbnailIntelligence';
import { CDNManager } from '../storage/cdnManager';
import { WorkflowInjector } from '../comfy/injectWorkflow';
import { ComfyUIClient } from '../comfy/queuePrompt';
import {
  addGenerationJob,
  QUEUE_NAMES,
  PRIORITIES,
  getAllQueueCounts,
} from '../queues/bullmq';
import {
  GenerationRequest,
  GenerationResult,
  ScenePlan,
  QualityScores,
  ThumbnailPlan,
  NarrativeAnalysis,
  EmotionAnalysis,
  WorkflowConfig,
  UrgencyLevel,
} from '../types';

export class IengineService {
  private narrativeEngine: NarrativeEngine;
  private emotionEngine: EmotionEngine;
  private scenePlanner: ScenePlanner;
  private promptComposer: PromptComposer;
  private workflowRouter: WorkflowRouter;
  private qualityJudge: QualityJudge;
  private thumbnailIntelligence: ThumbnailIntelligence;
  private cdnManager: CDNManager;
  private workflowInjector: WorkflowInjector;
  private comfyClient: ComfyUIClient;

  constructor() {
    this.narrativeEngine = new NarrativeEngine();
    this.emotionEngine = new EmotionEngine();
    this.scenePlanner = new ScenePlanner();
    this.promptComposer = new PromptComposer();
    this.workflowRouter = new WorkflowRouter();
    this.qualityJudge = new QualityJudge();
    this.thumbnailIntelligence = new ThumbnailIntelligence();
    this.cdnManager = new CDNManager();
    this.workflowInjector = new WorkflowInjector();
    this.comfyClient = new ComfyUIClient();
  }

  // ─── Full Pipeline (Async via Queue) ─────────────────────────────────────

  /**
   * Submit a generation request to the pipeline.
   * This is the primary entry point for the CMS / backend.
   * Returns immediately with a job ID — generation happens asynchronously.
   */
  async submitGeneration(request: GenerationRequest): Promise<{
    job_id: string;
    scene_plan: ScenePlan;
    prompt: string;
    negative_prompt: string;
    workflow: WorkflowConfig;
    queue: string;
    estimated_time_seconds: number;
  }> {
    const narrative = this.narrativeEngine.analyze(
      request.headline,
      request.excerpt,
      request.category,
      request.tags
    );

    const emotion = this.emotionEngine.analyze(narrative);
    const scene = this.scenePlanner.plan(narrative, emotion, request.region);
    const { positive, negative } = this.promptComposer.compose(scene);
    const workflow = this.workflowRouter.route(scene);

    const queueName = this.selectQueue(narrative.urgency, request.priority);
    const priority = this.getPriorityValue(narrative.urgency);

    const jobData = {
      request,
      scene_plan: scene,
      prompt: positive,
      negative_prompt: negative,
      workflow_config: workflow,
      narrative,
      emotion,
    };

    const jobId = await addGenerationJob(queueName, jobData, {
      priority,
      jobId: request.id,
    });

    return {
      job_id: jobId,
      scene_plan: scene,
      prompt: positive,
      negative_prompt: negative,
      workflow,
      queue: queueName,
      estimated_time_seconds: workflow.sla_seconds,
    };
  }

  // ─── Synchronous Pipeline (Direct Execution) ────────────────────────────

  /**
   * Execute the full pipeline synchronously.
   * Use for testing or when immediate results are needed.
   */
  async generateDirect(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    const narrative = this.narrativeEngine.analyze(
      request.headline,
      request.excerpt,
      request.category,
      request.tags
    );
    const emotion = this.emotionEngine.analyze(narrative);
    const scene = this.scenePlanner.plan(narrative, emotion, request.region);
    const { positive, negative } = this.promptComposer.compose(scene);
    const workflow = this.workflowRouter.route(scene);

    const seed = Math.floor(Math.random() * 2147483647);
    const comfyWorkflow = this.workflowInjector.buildFromConfig(workflow, positive, negative, seed);

    const promptResponse = await this.comfyClient.queuePrompt(comfyWorkflow);
    const completion = await this.comfyClient.waitForCompletion(
      promptResponse.prompt_id,
      workflow.sla_seconds * 2 * 1000
    );

    let imageBuffer: Buffer | null = null;
    if (completion.images.length > 0) {
      imageBuffer = await this.comfyClient.getImage(
        completion.images[0].filename,
        completion.images[0].subfolder,
        completion.images[0].type
      );
    }

    let qualityScores: QualityScores;
    if (imageBuffer) {
      qualityScores = await this.qualityJudge.score(imageBuffer, positive, scene);
    } else {
      qualityScores = {
        clip_score: 0, aesthetic_score: 0, artifact_score: 1,
        brand_alignment: 0, composition_score: 0, technical_quality: 0,
        overall_score: 0, approved: false,
        rejection_reasons: ['No image generated'],
      };
    }

    let cdnUrls: Record<string, string> = {};
    if (imageBuffer && qualityScores.approved) {
      const uploadResult = await this.cdnManager.uploadWithOptimization(
        imageBuffer,
        `iengine_${request.id}_${Date.now()}.png`
      );
      cdnUrls = {
        original: uploadResult.original_url || '',
        webp: uploadResult.webp_url || '',
        avif: uploadResult.avif_url || '',
        thumbnail: uploadResult.thumbnail_url || '',
      };
    }

    return {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      request_id: request.id,
      article_id: request.articleId,
      scene_plan: scene,
      prompt: positive,
      negative_prompt: negative,
      workflow_used: workflow.name,
      image_url: cdnUrls.original || '',
      thumbnail_url: cdnUrls.thumbnail,
      cdn_urls: cdnUrls,
      quality_scores: qualityScores,
      variants: [],
      metadata: {
        generation_time_ms: Date.now() - startTime,
        model_used: workflow.model,
        seed,
        steps: workflow.steps,
        cfg: workflow.cfg,
        sampler: workflow.sampler,
        scheduler: workflow.scheduler,
        loras: workflow.lora,
      },
      status: qualityScores.approved ? 'approved' : 'rejected',
      created_at: new Date(),
      completed_at: new Date(),
    };
  }

  // ─── Individual Engine Access ────────────────────────────────────────────

  /**
   * Analyze a headline without generating an image.
   * Useful for preview/debugging in the admin dashboard.
   */
  analyzeHeadline(
    headline: string,
    excerpt?: string,
    category?: string,
    tags?: string[],
    region?: string
  ): {
    narrative: NarrativeAnalysis;
    emotion: EmotionAnalysis;
    scene: ScenePlan;
    prompt: string;
    negative_prompt: string;
    workflow: WorkflowConfig;
    thumbnail_plan: ThumbnailPlan;
  } {
    const narrative = this.narrativeEngine.analyze(headline, excerpt, category, tags);
    const emotion = this.emotionEngine.analyze(narrative);
    const scene = this.scenePlanner.plan(narrative, emotion, region);
    const { positive, negative } = this.promptComposer.compose(scene);
    const workflow = this.workflowRouter.route(scene);
    const thumbnailPlan = this.thumbnailIntelligence.plan(scene);

    return {
      narrative,
      emotion,
      scene,
      prompt: positive,
      negative_prompt: negative,
      workflow,
      thumbnail_plan: thumbnailPlan,
    };
  }

  // ─── Queue Status ────────────────────────────────────────────────────────

  async getQueueStatus(): Promise<Record<string, any>> {
    return getAllQueueCounts();
  }

  // ─── ComfyUI Health ──────────────────────────────────────────────────────

  async getComfyUIHealth(): Promise<{ healthy: boolean; queue: any }> {
    const healthy = await this.comfyClient.healthCheck();
    const queue = await this.comfyClient.getQueueStatus();
    return { healthy, queue };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private selectQueue(urgency: UrgencyLevel, priority?: number): string {
    if (urgency === 'critical' || priority === 1) return QUEUE_NAMES.BREAKING_PRIORITY;
    if (urgency === 'high' || priority === 2) return QUEUE_NAMES.PREMIUM_PRIORITY;
    return QUEUE_NAMES.STANDARD;
  }

  private getPriorityValue(urgency: UrgencyLevel): number {
    switch (urgency) {
      case 'critical': return PRIORITIES.BREAKING;
      case 'high': return PRIORITIES.PREMIUM;
      case 'medium': return PRIORITIES.STANDARD;
      case 'low': return PRIORITIES.BACKGROUND;
      default: return PRIORITIES.STANDARD;
    }
  }
}

export default IengineService;
