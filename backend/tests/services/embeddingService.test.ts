import { storeRecognizedEntities } from '../../src/services/embeddingService';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    recognizedEntity: {
      findMany: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    entityMention: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../src/lib/redis', () => ({
  getRedis: () => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  }),
}));

describe('EmbeddingService - storeRecognizedEntities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return early and perform zero queries if entities list is empty', async () => {
    await storeRecognizedEntities('article-123', 'article', []);
    expect(prisma.recognizedEntity.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should batch insert new entities and mentions in a single transaction', async () => {
    const mockEntities = [
      {
        type: 'coin',
        name: 'Bitcoin',
        normalizedName: 'bitcoin',
        confidence: 0.95,
        category: 'cryptocurrency',
        metadata: { symbol: 'BTC' },
      },
      {
        type: 'protocol',
        name: 'Ethereum',
        normalizedName: 'ethereum',
        confidence: 0.90,
      },
    ];

    // No existing entities
    (prisma.recognizedEntity.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    await storeRecognizedEntities('article-123', 'article', mockEntities);

    // 1. Fetching existing entities
    expect(prisma.recognizedEntity.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.recognizedEntity.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { normalizedName: 'bitcoin', entityType: 'coin' },
          { normalizedName: 'ethereum', entityType: 'protocol' },
        ],
      },
    });

    // 2. Creating both new entities and their mentions
    expect(prisma.recognizedEntity.createMany).toHaveBeenCalledTimes(1);
    const createdEntities = (prisma.recognizedEntity.createMany as jest.Mock).mock.calls[0][0].data;
    expect(createdEntities).toHaveLength(2);
    expect(createdEntities[0].name).toBe('Bitcoin');
    expect(createdEntities[1].name).toBe('Ethereum');

    expect(prisma.entityMention.createMany).toHaveBeenCalledTimes(1);
    const createdMentions = (prisma.entityMention.createMany as jest.Mock).mock.calls[0][0].data;
    expect(createdMentions).toHaveLength(2);

    expect(prisma.recognizedEntity.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should batch update existing entities and insert new mentions in a single transaction', async () => {
    const mockEntities = [
      {
        type: 'coin',
        name: 'Bitcoin',
        normalizedName: 'bitcoin',
        confidence: 0.98,
      },
    ];

    // Bitcoin already exists
    const existingBitcoin = {
      id: 'existing-btc-id',
      entityType: 'coin',
      name: 'Bitcoin',
      normalizedName: 'bitcoin',
      confidence: 0.90,
      mentionCount: 5,
    };
    (prisma.recognizedEntity.findMany as jest.Mock).mockResolvedValue([existingBitcoin]);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    await storeRecognizedEntities('article-123', 'article', mockEntities);

    // 1. Fetching existing entities
    expect(prisma.recognizedEntity.findMany).toHaveBeenCalledTimes(1);

    // 2. No createMany for entities, but update should be called for Bitcoin
    expect(prisma.recognizedEntity.createMany).not.toHaveBeenCalled();
    expect(prisma.recognizedEntity.update).toHaveBeenCalledTimes(1);
    expect(prisma.recognizedEntity.update).toHaveBeenCalledWith({
      where: { id: 'existing-btc-id' },
      data: {
        mentionCount: { increment: 1 },
        lastMentionedAt: expect.any(Date),
        confidence: 0.98,
      },
    });

    // 3. Mention should still be created
    expect(prisma.entityMention.createMany).toHaveBeenCalledTimes(1);
    const createdMentions = (prisma.entityMention.createMany as jest.Mock).mock.calls[0][0].data;
    expect(createdMentions).toHaveLength(1);
    expect(createdMentions[0].entityId).toBe('existing-btc-id');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should handle duplicate entities in the same batch by aggregating occurrences and updating with highest confidence', async () => {
    const mockEntities = [
      {
        type: 'coin',
        name: 'Bitcoin',
        normalizedName: 'bitcoin',
        confidence: 0.85,
      },
      {
        type: 'coin',
        name: 'Bitcoin',
        normalizedName: 'bitcoin',
        confidence: 0.95,
      },
    ];

    (prisma.recognizedEntity.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    await storeRecognizedEntities('article-123', 'article', mockEntities);

    // 1. Fetching existing entities
    expect(prisma.recognizedEntity.findMany).toHaveBeenCalledTimes(1);

    // 2. Only 1 unique entity should be created, with mentionCount = 2 and confidence = 0.95 (highest)
    expect(prisma.recognizedEntity.createMany).toHaveBeenCalledTimes(1);
    const createdEntities = (prisma.recognizedEntity.createMany as jest.Mock).mock.calls[0][0].data;
    expect(createdEntities).toHaveLength(1);
    expect(createdEntities[0].name).toBe('Bitcoin');
    expect(createdEntities[0].mentionCount).toBe(2);
    expect(createdEntities[0].confidence).toBe(0.95);

    // 3. Mentions created should still be 2 (one for each occurrence)
    expect(prisma.entityMention.createMany).toHaveBeenCalledTimes(1);
    const createdMentions = (prisma.entityMention.createMany as jest.Mock).mock.calls[0][0].data;
    expect(createdMentions).toHaveLength(2);
    expect(createdMentions[0].entityId).toBe(createdEntities[0].id);
    expect(createdMentions[1].entityId).toBe(createdEntities[0].id);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
