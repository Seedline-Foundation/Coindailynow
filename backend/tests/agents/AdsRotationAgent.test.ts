import adsAgent, {
  createCampaign,
  onAdApproved,
  selectAd,
  processBatchPlacements,
  getAllCampaigns,
  getAdvertiserCampaigns,
  getSystemHealthReport,
  dailyReset,
  retrainAllActiveCampaignModels,
  registerInventorySlot,
} from '../../src/agents/AdsRotationAgent';

describe('AdsRotationAgent', () => {
  beforeEach(async () => {
    // Register inventory slot
    await registerInventorySlot({
      id: `slot_test_1`,
      location: 'homepage_hero',
      page: 'homepage',
      trafficScore: 90,
      currentAdId: null,
      slotType: ['image', 'video'],
      dimensions: { width: 728, height: 90 },
      minBudgetTier: 'premium',
      isActive: true,
      fillRate: 0.2,
      avgCtr: 0.03,
      lastUpdated: new Date(),
    });
  });

  it('should create and approve campaign', async () => {
    const campaign = await createCampaign({
      advertiserId: 'adv_test_1',
      advertiserName: 'Test Advertiser',
      adType: 'image',
      creativeUrl: 'https://example.com/ad.png',
      title: 'Test Ad',
      description: 'Test Description',
      targetUrl: 'https://example.com',
      totalBudget: 500,
      targeting: { sections: ['news'], regions: ['NG'] },
      scheduling: {
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
      bidAmount: 2.0,
    });

    expect(campaign.id).toBeDefined();
    expect(campaign.status).toBe('pending');

    const result = await onAdApproved(campaign);
    expect(result.success).toBe(true);
    expect(result.campaignId).toBe(campaign.id);
  });

  it('should process batch placements in bulk using getCampaigns', async () => {
    const campaignIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const c = await createCampaign({
        advertiserId: `adv_batch_${i}`,
        advertiserName: `Batch Advertiser ${i}`,
        adType: 'image',
        creativeUrl: `https://example.com/ad_${i}.png`,
        title: `Batch Ad ${i}`,
        description: `Batch Description ${i}`,
        targetUrl: `https://example.com/${i}`,
        totalBudget: 1000,
        targeting: { sections: [], regions: ['NG'] },
        scheduling: {
          startDate: new Date(Date.now() - 3600000).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        },
        bidAmount: 3.0,
      });
      c.status = 'active';
      await onAdApproved(c);
      campaignIds.push(c.id);
    }

    const batchResult = await processBatchPlacements(campaignIds);
    expect(batchResult.processed).toBe(5);
    expect(batchResult.succeeded).toBe(5);

    const allCampaigns = await getAllCampaigns();
    expect(allCampaigns.length).toBeGreaterThanOrEqual(5);

    const advertiserCampaigns = await getAdvertiserCampaigns('adv_batch_0');
    expect(advertiserCampaigns.length).toBe(1);

    const health = await getSystemHealthReport();
    expect(health.totalActiveCampaigns).toBeGreaterThanOrEqual(5);

    await dailyReset();
    const retrainResult = await retrainAllActiveCampaignModels();
    expect(retrainResult.total).toBeGreaterThanOrEqual(5);
  });
});
