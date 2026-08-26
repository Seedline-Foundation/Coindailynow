import { aiContentPipelineService } from '../../src/services/aiContentPipelineService';
import { UnifiedNewsItem } from '../../src/services/unifiedNewsAggregator';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    systemConfiguration: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
    },
    contentPipeline: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../src/lib/redis', () => ({
  getRedis: () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    lpush: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
  }),
}));

jest.mock('../../src/services/rssFeedAggregator', () => ({
  fetchAllFeeds: jest.fn().mockResolvedValue([]),
  markArticleAsPublished: jest.fn().mockResolvedValue(undefined),
  isAlreadyPublished: jest.fn().mockResolvedValue(false),
}));

describe('AIContentPipelineService - processNewsItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process news items and initiate article pipeline for each', async () => {
    const mockInitiate = jest.spyOn(aiContentPipelineService, 'initiateArticlePipeline')
      .mockImplementation(async (req) => ({
        pipelineId: 'pipeline_123',
        articleId: '',
        status: 'initiated',
        currentStage: 'initialization',
        progress: 0,
        startedAt: new Date(),
        errors: [],
        stages: [],
      }));

    const newsItems: UnifiedNewsItem[] = [
      {
        id: 'news_1',
        title: 'Bitcoin Hits $100k',
        description: 'Bitcoin reaches milestone',
        pubDate: new Date(),
        source: 'CoinDesk',
        sourceUrl: 'https://coindesk.com',
        region: 'GLOBAL',
        category: 'crypto',
        type: 'rss',
        priority: 85, // breaking
      },
      {
        id: 'news_2',
        title: 'Ethereum Upgrade Completed',
        description: 'New network upgrade',
        pubDate: new Date(),
        source: 'CoinDesk',
        sourceUrl: 'https://coindesk.com',
        region: 'GLOBAL',
        category: 'crypto',
        type: 'rss',
        priority: 50, // medium
      },
    ];

    const results = await aiContentPipelineService.processNewsItems(newsItems);

    expect(results).toHaveLength(2);
    expect(mockInitiate).toHaveBeenCalledTimes(2);
    expect(mockInitiate).toHaveBeenNthCalledWith(1, {
      topic: 'Bitcoin Hits $100k',
      urgency: 'breaking',
      autoPublish: true,
    });
    expect(mockInitiate).toHaveBeenNthCalledWith(2, {
      topic: 'Ethereum Upgrade Completed',
      urgency: 'medium',
      autoPublish: true,
    });

    mockInitiate.mockRestore();
  });

  it('should gracefully handle errors when initiating pipeline for an item', async () => {
    const mockInitiate = jest.spyOn(aiContentPipelineService, 'initiateArticlePipeline')
      .mockRejectedValueOnce(new Error('Topic already published'))
      .mockResolvedValueOnce({
        pipelineId: 'pipeline_456',
        articleId: '',
        status: 'initiated',
        currentStage: 'initialization',
        progress: 0,
        startedAt: new Date(),
        errors: [],
        stages: [],
      });

    const newsItems: UnifiedNewsItem[] = [
      {
        id: 'news_1',
        title: 'Duplicate News Title',
        description: 'Existing story',
        pubDate: new Date(),
        source: 'RSS',
        sourceUrl: 'https://example.com',
        region: 'GLOBAL',
        category: 'crypto',
        type: 'rss',
        priority: 70, // high
      },
      {
        id: 'news_2',
        title: 'Fresh News Title',
        description: 'Brand new story',
        pubDate: new Date(),
        source: 'RSS',
        sourceUrl: 'https://example.com',
        region: 'GLOBAL',
        category: 'crypto',
        type: 'rss',
        priority: 30, // low
      },
    ];

    const results = await aiContentPipelineService.processNewsItems(newsItems);

    expect(results).toHaveLength(1);
    expect(results[0].pipelineId).toBe('pipeline_456');

    mockInitiate.mockRestore();
  });
});
