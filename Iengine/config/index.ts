/**
 * Iengine Configuration
 * Central configuration for the Visual Intelligence Engine.
 */

export interface IengineConfig {
  comfyui: {
    url: string;
    wsUrl: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  backend: {
    url: string;
    serviceToken: string;
  };
  cdn: {
    provider: string;
    publicUrl: string;
    bucket: string;
  };
  generation: {
    maxConcurrency: number;
    defaultTimeout: number;
    maxRetries: number;
    enableQualityScoring: boolean;
    enableThumbnailGeneration: boolean;
    enableUpscaling: boolean;
  };
  quality: {
    clipScoringUrl: string;
    aestheticScoringUrl: string;
    minOverallScore: number;
    autoRejectArtifacts: boolean;
  };
  workers: {
    gpuCount: number;
    concurrencyPerGpu: number;
  };
}

export function loadConfig(): IengineConfig {
  return {
    comfyui: {
      url: process.env.COMFYUI_URL || 'http://localhost:8188',
      wsUrl: (process.env.COMFYUI_URL || 'http://localhost:8188')
        .replace('http://', 'ws://')
        .replace('https://', 'wss://'),
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.IENGINE_REDIS_DB || '2'),
    },
    backend: {
      url: process.env.BACKEND_API_URL || 'http://localhost:4000',
      serviceToken: process.env.IENGINE_SERVICE_TOKEN || process.env.AI_PIPELINE_SERVICE_TOKEN || '',
    },
    cdn: {
      provider: process.env.CDN_PROVIDER || 'backblaze-b2',
      publicUrl: process.env.CDN_URL || process.env.CFIS_PUBLIC_MEDIA_BASE || 'https://cdn.sygn.live',
      bucket: process.env.CDN_BUCKET || 'coindaily-media',
    },
    generation: {
      maxConcurrency: parseInt(process.env.IENGINE_MAX_CONCURRENCY || '2'),
      defaultTimeout: parseInt(process.env.IENGINE_DEFAULT_TIMEOUT || '120000'),
      maxRetries: parseInt(process.env.IENGINE_MAX_RETRIES || '3'),
      enableQualityScoring: process.env.IENGINE_QUALITY_SCORING !== 'false',
      enableThumbnailGeneration: process.env.IENGINE_THUMBNAILS !== 'false',
      enableUpscaling: process.env.IENGINE_UPSCALING !== 'false',
    },
    quality: {
      clipScoringUrl: process.env.CLIP_SCORING_URL || 'http://localhost:8100/score',
      aestheticScoringUrl: process.env.AESTHETIC_SCORING_URL || 'http://localhost:8101/score',
      minOverallScore: parseFloat(process.env.IENGINE_MIN_QUALITY || '0.72'),
      autoRejectArtifacts: process.env.IENGINE_AUTO_REJECT !== 'false',
    },
    workers: {
      gpuCount: parseInt(process.env.IENGINE_GPU_COUNT || '1'),
      concurrencyPerGpu: parseInt(process.env.IENGINE_CONCURRENCY_PER_GPU || '1'),
    },
  };
}

export default loadConfig;
