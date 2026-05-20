export const VENGINE_CONFIG = {
  providers: {
    WAN21: {
      name: 'Wan2.1',
      description: 'Open-source video generation (Apache 2.0)',
      endpoint: process.env.WAN21_ENDPOINT || 'http://localhost:8090',
      maxDuration: 15,
      supportedResolutions: ['1080x1920', '1920x1080', '720x1280'],
      costPerSecond: 0,
    },
    COGVIDEOX: {
      name: 'CogVideoX',
      description: 'Open-source text-to-video (Apache 2.0)',
      endpoint: process.env.COGVIDEOX_ENDPOINT || 'http://localhost:8091',
      maxDuration: 10,
      supportedResolutions: ['720x1280', '1280x720'],
      costPerSecond: 0,
    },
    KLING: {
      name: 'Kling AI',
      description: 'Cloud API video generation',
      endpoint: 'https://api.klingai.com',
      apiKey: process.env.KLING_API_KEY,
      maxDuration: 60,
      supportedResolutions: ['1080x1920', '1920x1080'],
      costPerSecond: 0.05,
    },
    RUNWAY: {
      name: 'Runway ML',
      description: 'Cloud API video generation',
      endpoint: 'https://api.runwayml.com',
      apiKey: process.env.RUNWAY_API_KEY,
      maxDuration: 30,
      supportedResolutions: ['1080x1920', '1920x1080', '1080x1080'],
      costPerSecond: 0.10,
    },
  },

  distribution: {
    YOUTUBE: {
      enabled: !!process.env.YOUTUBE_API_KEY,
      apiKey: process.env.YOUTUBE_API_KEY,
      channelId: process.env.YOUTUBE_CHANNEL_ID,
    },
    TIKTOK: {
      enabled: !!process.env.TIKTOK_API_KEY,
      apiKey: process.env.TIKTOK_API_KEY,
    },
    INSTAGRAM_REELS: {
      enabled: !!process.env.INSTAGRAM_ACCESS_TOKEN,
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    },
    TWITTER: {
      enabled: !!process.env.TWITTER_API_KEY,
      apiKey: process.env.TWITTER_API_KEY,
    },
  },

  defaults: {
    shortDuration: 60,
    longDuration: 180,
    fps: 30,
    defaultProvider: 'WAN21' as const,
    watermark: true,
    captionsEnabled: true,
    backgroundMusicEnabled: true,
  },

  queue: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    maxConcurrent: 3,
    retryAttempts: 3,
    retryDelay: 30000,
  },
};
