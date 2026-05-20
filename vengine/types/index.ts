export interface VideoScript {
  articleId: string;
  title: string;
  hook: string;
  keyPoints: Array<{
    text: string;
    duration: number;
    visualDescription: string;
  }>;
  cta: string;
  totalDuration: number;
  format: 'SHORT' | 'LONG' | 'EXPLAINER' | 'SOCIAL_CLIP';
  orientation: 'VERTICAL' | 'LANDSCAPE';
}

export interface VideoGenerationConfig {
  provider: 'WAN21' | 'COGVIDEOX' | 'KLING' | 'RUNWAY';
  resolution: string;
  duration: number;
  fps: number;
  style?: string;
}

export interface VideoJob {
  id: string;
  articleId?: string;
  title: string;
  jobType: 'SHORT' | 'LONG' | 'EXPLAINER' | 'SOCIAL_CLIP';
  status: VideoJobStatus;
  script?: VideoScript;
  config?: VideoGenerationConfig;
  output?: VideoOutput;
  error?: string;
  createdAt: Date;
}

export type VideoJobStatus =
  | 'PENDING'
  | 'SCRIPTING'
  | 'GENERATING'
  | 'COMPOSING'
  | 'REVIEW'
  | 'PUBLISHED'
  | 'FAILED';

export interface VideoOutput {
  videoUrl: string;
  thumbnailUrl?: string;
  captionsUrl?: string;
  duration: number;
  resolution: string;
  fileSize: number;
}

export interface VideoDistribution {
  platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM_REELS' | 'TWITTER' | 'LINKEDIN';
  url?: string;
  publishedAt?: Date;
  views: number;
  likes: number;
  shares: number;
}

export interface VideoMetrics {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  platforms: VideoDistribution[];
  engagementRate: number;
}
