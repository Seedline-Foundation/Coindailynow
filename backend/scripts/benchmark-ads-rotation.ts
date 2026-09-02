import { createCampaign, processBatchPlacements, onAdApproved, getAllCampaigns, registerInventorySlot } from '../src/agents/AdsRotationAgent';
import { redisClient } from '../src/config/redis';

async function runBenchmark() {
  console.log('=== ADS ROTATION AGENT BENCHMARK ===');

  // Register some inventory slots
  for (let i = 0; i < 20; i++) {
    await registerInventorySlot({
      id: `slot_bench_${i}`,
      location: 'homepage_hero',
      page: 'homepage',
      trafficScore: 80 + (i % 20),
      currentAdId: null,
      slotType: ['image', 'video'],
      dimensions: { width: 728, height: 90 },
      minBudgetTier: 'premium',
      isActive: true,
      fillRate: 0.2,
      avgCtr: 0.03,
      lastUpdated: new Date(),
    });
  }

  // Create 100 campaigns
  const campaignIds: string[] = [];
  console.log('Creating 100 benchmark campaigns...');
  for (let i = 0; i < 100; i++) {
    const c = await createCampaign({
      advertiserId: `adv_${i}`,
      advertiserName: `Advertiser ${i}`,
      adType: 'image',
      creativeUrl: `https://example.com/ad_${i}.png`,
      title: `Ad ${i}`,
      description: `Description ${i}`,
      targetUrl: `https://example.com/landing_${i}`,
      totalBudget: 1000,
      targeting: { sections: ['news'], regions: ['NG'] },
      scheduling: {
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
      bidAmount: 2.5,
    });
    c.status = 'active';
    await onAdApproved(c);
    campaignIds.push(c.id);
  }

  console.log(`Created ${campaignIds.length} campaigns.`);

  // Measure processBatchPlacements
  const iterations = 5;
  let totalDurationMs = 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await processBatchPlacements(campaignIds);
    const end = performance.now();
    const duration = end - start;
    totalDurationMs += duration;
    console.log(`Iteration ${i + 1}: ${duration.toFixed(2)} ms`);
  }

  const avgDurationMs = totalDurationMs / iterations;
  console.log(`Average processBatchPlacements execution time: ${avgDurationMs.toFixed(2)} ms`);

  // Measure getAllCampaigns
  const startAll = performance.now();
  const allCampaigns = await getAllCampaigns();
  const endAll = performance.now();
  console.log(`getAllCampaigns (${allCampaigns.length} campaigns): ${(endAll - startAll).toFixed(2)} ms`);

  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
