process.env.VAPID_SUBJECT = 'mailto:admin@sygn.live';
process.env.VAPID_PUBLIC_KEY = 'BPfa0kobE7j8uADvQ0gVz3G7Fyomh3w2paKlnZhy9oI7O4fa03T1Gzki0a1ZUGEpjhwKoJPL5OEPAqGL5JJgpzc';
process.env.VAPID_PRIVATE_KEY = 'DwO0XxO_tAbgJxmA8ng0r-_2vHkU6NfNEQWy5Sinocs';

/**
 * Benchmark Script for Engagement Service Milestones & Top Users query optimization
 */

async function runBenchmark() {
  console.log('🚀 Running Engagement Analytics Benchmark...\n');

  // Generate mock milestone records (e.g. 20 items)
  const milestoneCount = 20;
  const recentMilestoneData = Array.from({ length: milestoneCount }, (_, i) => ({
    id: `m-${i}`,
    userId: `user-${i % 5}`, // 5 unique users across 20 milestones
    type: 'ARTICLES_READ',
    threshold: 10 * (i + 1),
    achieved: true,
    achievedAt: new Date(),
  }));

  // Mock DB Latency in ms per sequential roundtrip query
  const SIMULATED_DB_LATENCY_MS = 10;

  // Mock user retrieval
  const mockUserDb = new Map(
    Array.from({ length: 5 }, (_, i) => [
      `user-${i}`,
      { id: `user-${i}`, username: `user_${i}`, avatarUrl: `https://avatar.com/${i}.png` },
    ])
  );

  let unoptimizedQueryCount = 0;
  let optimizedQueryCount = 0;

  // 1. Sequential / Serial approach (N+1 database roundtrips)
  const startUnoptimized = performance.now();
  const unoptimizedResult = [];
  for (const milestone of recentMilestoneData) {
    unoptimizedQueryCount++;
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DB_LATENCY_MS));
    const user = mockUserDb.get(milestone.userId) || null;
    unoptimizedResult.push({ ...milestone, User: user ? { username: user.username, avatarUrl: user.avatarUrl } : null });
  }
  const durationUnoptimized = performance.now() - startUnoptimized;

  // 2. Optimized approach (Batch query via findMany with WHERE id IN (...))
  const startOptimized = performance.now();
  const milestoneUserIds = Array.from(new Set(recentMilestoneData.map((m) => m.userId)));
  optimizedQueryCount++; // 1 batch query
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DB_LATENCY_MS));

  const users = milestoneUserIds
    .map((id) => mockUserDb.get(id))
    .filter(Boolean)
    .map((u) => ({ id: u!.id, username: u!.username, avatarUrl: u!.avatarUrl }));

  const userMap = new Map(users.map((u) => [u.id, { username: u.username, avatarUrl: u.avatarUrl }]));
  const optimizedResult = recentMilestoneData.map((milestone) => ({
    ...milestone,
    User: userMap.get(milestone.userId) || null,
  }));
  const durationOptimized = performance.now() - startOptimized;

  console.log('---------------------------------------------------------');
  console.log(`Unoptimized (N+1 sequential): ${unoptimizedQueryCount} DB queries, ${durationUnoptimized.toFixed(2)} ms`);
  console.log(`Optimized (Batch):           ${optimizedQueryCount} DB query,   ${durationOptimized.toFixed(2)} ms`);
  console.log(
    `Latency Reduction: ${(((durationUnoptimized - durationOptimized) / durationUnoptimized) * 100).toFixed(2)}%`
  );
  console.log(
    `Query Reduction:   ${(((unoptimizedQueryCount - optimizedQueryCount) / unoptimizedQueryCount) * 100).toFixed(2)}%`
  );
  console.log('---------------------------------------------------------\n');

  // Verify accuracy
  if (JSON.stringify(unoptimizedResult) === JSON.stringify(optimizedResult)) {
    console.log('✅ Verification PASSED: Both approaches produced identical output.');
  } else {
    console.error('❌ Verification FAILED: Outputs differed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runBenchmark().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
