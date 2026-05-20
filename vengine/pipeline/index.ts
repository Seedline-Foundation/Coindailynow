import ScriptAgent from '../agents/scriptAgent';
import VideoGenAgent from '../agents/videoGenAgent';
import DistributionAgent from '../agents/distributionAgent';
import { VideoScript, VideoJobStatus } from '../types';
import { VENGINE_CONFIG } from '../config';

/**
 * Vengine Pipeline - Orchestrates the video generation workflow.
 * 
 * Flow: Article → Script Agent → Video Gen Agent → Composition → Distribution
 * 
 * Similar to the iengine image pipeline but for video content.
 */
export class VenginePipeline {
  private scriptAgent = ScriptAgent;
  private videoGenAgent = VideoGenAgent;
  private distributionAgent = DistributionAgent;

  /**
   * Process an article through the full video pipeline.
   */
  async processArticle(article: {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
  }): Promise<{
    shortVideo: any;
    longVideo?: any;
    status: VideoJobStatus;
  }> {
    const shortScript = await this.scriptAgent.generateShortScript(article);

    const config = this.videoGenAgent.selectProvider({
      preferFree: true,
      minDuration: shortScript.totalDuration,
    });

    const shortOutput = await this.videoGenAgent.generateVideo(shortScript, config);

    const distributions = await this.distributionAgent.distribute(shortOutput, {
      title: article.title,
      description: `${article.title} - CoinDaily`,
      tags: article.tags,
      category: article.category,
    });

    return {
      shortVideo: {
        script: shortScript,
        output: shortOutput,
        distributions,
      },
      status: 'PUBLISHED',
    };
  }

  /**
   * Get pipeline status and stats.
   */
  getStatus() {
    return {
      providers: Object.entries(VENGINE_CONFIG.providers).map(([key, p]) => ({
        id: key,
        name: p.name,
        description: p.description,
        maxDuration: p.maxDuration,
        costPerSecond: p.costPerSecond,
        available: key === 'WAN21' || key === 'COGVIDEOX' || !!p.apiKey,
      })),
      distribution: Object.entries(VENGINE_CONFIG.distribution).map(([key, d]) => ({
        platform: key,
        enabled: d.enabled,
      })),
      defaults: VENGINE_CONFIG.defaults,
    };
  }
}

export default new VenginePipeline();
