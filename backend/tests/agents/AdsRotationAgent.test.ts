import adsRotationAgent, {
  getAllInventorySlots,
  registerInventorySlot,
  validateCreative,
  getViewabilityConfig,
  AdCampaign,
} from '../../src/agents/AdsRotationAgent';
import { redisClient } from '../../src/config/redis';

describe('AdsRotationAgent', () => {
  beforeEach(async () => {
    // Clear in-memory / redis state for inventory
    await redisClient.del('ads:inventory:index');
  });

  describe('getAllInventorySlots', () => {
    it('returns default slots when no slots index exists in Redis', async () => {
      const slots = await getAllInventorySlots();
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('id');
      expect(slots[0].lastUpdated).toBeInstanceOf(Date);
    });

    it('returns slots from Redis when index and slot data exist', async () => {
      const slot1 = {
        id: 'test_slot_1',
        location: 'homepage_hero' as const,
        page: 'homepage',
        trafficScore: 90,
        currentAdId: null,
        slotType: ['image' as const],
        dimensions: { width: 728, height: 90 },
        minBudgetTier: 'premium' as const,
        isActive: true,
        fillRate: 0.1,
        avgCtr: 0.02,
        lastUpdated: new Date(),
      };

      const slot2 = {
        id: 'test_slot_2',
        location: 'article_top' as const,
        page: 'articles',
        trafficScore: 80,
        currentAdId: null,
        slotType: ['image' as const],
        dimensions: { width: 300, height: 250 },
        minBudgetTier: 'standard' as const,
        isActive: true,
        fillRate: 0.2,
        avgCtr: 0.015,
        lastUpdated: new Date(),
      };

      await registerInventorySlot(slot1);
      await registerInventorySlot(slot2);

      const slots = await getAllInventorySlots();
      expect(slots.length).toBe(2);

      const found1 = slots.find((s) => s.id === 'test_slot_1');
      const found2 = slots.find((s) => s.id === 'test_slot_2');

      expect(found1).toBeDefined();
      expect(found2).toBeDefined();
      expect(found1?.lastUpdated).toBeInstanceOf(Date);
      expect(found2?.lastUpdated).toBeInstanceOf(Date);
    });

    it('handles missing or expired slot keys gracefully', async () => {
      // Set index pointing to a slot ID that doesn't exist in Redis
      await redisClient.set('ads:inventory:index', JSON.stringify(['non_existent_slot']));

      const slots = await getAllInventorySlots();
      // Should fall back to default inventory slots
      expect(slots.length).toBeGreaterThan(0);
      expect(slots.some((s) => s.id === 'non_existent_slot')).toBe(false);
    });
  });

  describe('validateCreative', () => {
    it('validates a valid image campaign', () => {
      const campaign: AdCampaign = {
        id: 'camp_1',
        advertiserId: 'adv_1',
        advertiserName: 'Test Advertiser',
        adType: 'image',
        creativeUrl: 'https://example.com/banner.png',
        title: 'Test Ad',
        description: 'Test Description',
        targetUrl: 'https://example.com',
        totalBudget: 1000,
        remainingBudget: 1000,
        dailyCap: 100,
        dailySpent: 0,
        status: 'pending',
        currentTier: 'premium',
        rotationStrategy: 'optimized',
        pacingMode: 'even',
        targeting: {
          sections: ['news'],
          regions: ['NG'],
          languages: ['en'],
          devices: ['desktop'],
          newsletterAllowed: true,
          audienceSegments: [],
          contextualKeywords: ['crypto'],
        },
        scheduling: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          timezone: 'Africa/Lagos',
        },
        frequencyCap: {
          maxImpressionsPerUser: 10,
          maxImpressionsPerUserPerDay: 3,
          maxClicksPerUserPerDay: 2,
          windowHours: 168,
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          viewableImpressions: 0,
          totalSpent: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          viewabilityRate: 0,
          burnRate: 0,
          remainingImpressions: 0,
          bestCreativeIndex: 0,
          creativePerformance: [],
        },
        createdAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        priority: 50,
        bidAmount: 2.0,
      };

      const result = validateCreative(campaign);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('getViewabilityConfig', () => {
    it('returns MRC Video standard config for video ad type', () => {
      const config = getViewabilityConfig('video', { width: 640, height: 360 });
      expect(config.standard).toBe('MRC Video');
      expect(config.threshold).toBe(50);
      expect(config.continuousSeconds).toBe(2);
    });
  });
});
