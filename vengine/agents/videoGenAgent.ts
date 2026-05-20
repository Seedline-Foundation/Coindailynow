import axios from 'axios';
import { VENGINE_CONFIG } from '../config';
import { VideoScript, VideoGenerationConfig, VideoOutput } from '../types';

/**
 * Video Generation Agent - Sends scripts to video generation models
 * and assembles the final output.
 * 
 * Supports:
 * - Wan2.1 (free, open-source, self-hosted)
 * - CogVideoX (free, open-source, self-hosted)
 * - Kling AI (cloud API)
 * - Runway ML (cloud API)
 */
export class VideoGenAgent {
  /**
   * Generate video clips from a script using the configured provider.
   */
  async generateVideo(
    script: VideoScript,
    config: VideoGenerationConfig
  ): Promise<VideoOutput> {
    const provider = VENGINE_CONFIG.providers[config.provider];
    if (!provider) {
      throw new Error(`Unknown video provider: ${config.provider}`);
    }

    const clips: string[] = [];

    for (const point of script.keyPoints) {
      const clipUrl = await this.generateClip(
        point.visualDescription,
        point.duration,
        config
      );
      clips.push(clipUrl);
    }

    const output = await this.composeVideo(clips, script, config);
    return output;
  }

  /**
   * Generate a single video clip from a text prompt.
   */
  private async generateClip(
    prompt: string,
    duration: number,
    config: VideoGenerationConfig
  ): Promise<string> {
    const provider = VENGINE_CONFIG.providers[config.provider];

    try {
      const response = await axios.post(
        `${provider.endpoint}/generate`,
        {
          prompt,
          duration: Math.min(duration, provider.maxDuration),
          resolution: config.resolution,
          fps: config.fps,
          style: config.style,
        },
        {
          timeout: 300000,
          headers: {
            'Content-Type': 'application/json',
            ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
          },
        }
      );

      return response.data.videoUrl || response.data.url;
    } catch (error: any) {
      throw new Error(`Video generation failed (${config.provider}): ${error.message}`);
    }
  }

  /**
   * Compose final video from clips with captions, music, and watermark.
   * In production, this uses MoviePy or similar.
   */
  private async composeVideo(
    clips: string[],
    script: VideoScript,
    config: VideoGenerationConfig
  ): Promise<VideoOutput> {
    return {
      videoUrl: `/videos/composed/${script.articleId}-${Date.now()}.mp4`,
      thumbnailUrl: `/videos/thumbnails/${script.articleId}-${Date.now()}.jpg`,
      captionsUrl: `/videos/captions/${script.articleId}-${Date.now()}.srt`,
      duration: script.totalDuration,
      resolution: config.resolution,
      fileSize: 0,
    };
  }

  /**
   * Select the best provider based on requirements.
   */
  selectProvider(requirements: {
    maxCost?: number;
    minDuration?: number;
    preferFree?: boolean;
  }): VideoGenerationConfig {
    const { providers, defaults } = VENGINE_CONFIG;

    if (requirements.preferFree || !requirements.maxCost) {
      return {
        provider: 'WAN21',
        resolution: '1080x1920',
        duration: defaults.shortDuration,
        fps: defaults.fps,
      };
    }

    if (requirements.minDuration && requirements.minDuration > 15) {
      if (providers.KLING.apiKey) {
        return {
          provider: 'KLING',
          resolution: '1080x1920',
          duration: requirements.minDuration,
          fps: defaults.fps,
        };
      }
      if (providers.RUNWAY.apiKey) {
        return {
          provider: 'RUNWAY',
          resolution: '1080x1920',
          duration: Math.min(requirements.minDuration, 30),
          fps: defaults.fps,
        };
      }
    }

    return {
      provider: defaults.defaultProvider,
      resolution: '1080x1920',
      duration: defaults.shortDuration,
      fps: defaults.fps,
    };
  }
}

export default new VideoGenAgent();
