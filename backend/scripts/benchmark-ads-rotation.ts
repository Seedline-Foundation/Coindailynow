/**
 * Benchmark Script for AdsRotationAgent.getAllInventorySlots
 * Compares execution time for retrieving inventory slots.
 */

import { getAllInventorySlots, registerInventorySlot } from '../src/agents/AdsRotationAgent';
import { redisClient } from '../src/config/redis';

async function runBenchmark() {
  console.log('⚡ Running AdsRotationAgent Benchmark...\n');

  // Ensure Redis client is ready if using real redis, or memory cache if mock
  if (redisClient.connect && !redisClient.isOpen && !redisClient.isReady) {
    try {
      await redisClient.connect();
    } catch {
      // ignore connection error if offline fallback is active
    }
  }

  // Clear index
  await redisClient.del('ads:inventory:index');

  // Populate 100 inventory slots
  const NUM_SLOTS = 100;
  console.log(`Setting up ${NUM_SLOTS} mock inventory slots in Redis cache...`);

  for (let i = 0; i < NUM_SLOTS; i++) {
    await registerInventorySlot({
      id: `slot_bench_${i}`,
      location: 'article_inline',
      page: 'articles',
      trafficScore: 80,
      currentAdId: null,
      slotType: ['image'],
      dimensions: { width: 300, height: 250 },
      minBudgetTier: 'standard',
      isActive: true,
      fillRate: 0.2,
      avgCtr: 0.02,
      lastUpdated: new Date(),
    });
  }

  // Warmup run
  await getAllInventorySlots();

  // Measure time over multiple iterations
  const ITERATIONS = 100;
  console.log(`Executing getAllInventorySlots ${ITERATIONS} times...`);

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const slots = await getAllInventorySlots();
    if (slots.length !== NUM_SLOTS) {
      console.error(`Unexpected slot count: got ${slots.length}, expected ${NUM_SLOTS}`);
    }
  }
  const end = performance.now();

  const totalTimeMs = end - start;
  const avgTimePerCallMs = totalTimeMs / ITERATIONS;

  console.log('\n📊 Benchmark Results:');
  console.log(`   Slots fetched per call: ${NUM_SLOTS}`);
  console.log(`   Iterations:             ${ITERATIONS}`);
  console.log(`   Total time:             ${totalTimeMs.toFixed(2)} ms`);
  console.log(`   Average latency / call: ${avgTimePerCallMs.toFixed(3)} ms`);

  // Cleanup
  await redisClient.del('ads:inventory:index');
  for (let i = 0; i < NUM_SLOTS; i++) {
    await redisClient.del(`ads:inventory:slot_bench_${i}`);
  }

  if (redisClient.quit) {
    await redisClient.quit();
  }
}

if (require.main === module) {
  runBenchmark().catch((err) => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}
