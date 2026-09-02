import engagementService from '../src/services/engagementService';
import prisma from '../src/lib/prisma';

let queryCount = 0;

// Override prisma methods directly
(prisma.userBehavior.count as any) = () => {
  queryCount++;
  return Promise.resolve(100);
};

(prisma.userBehavior.aggregate as any) = () => {
  queryCount++;
  return Promise.resolve({ _avg: { engagementScore: 80 } });
};

(prisma.userBehavior.findMany as any) = () => {
  queryCount++;
  return Promise.resolve(
    Array.from({ length: 10 }, (_, i) => ({
      id: `ub_${i}`,
      userId: `user_${i}`,
      engagementScore: 100 - i,
    }))
  );
};

(prisma.readingReward.aggregate as any) = () => {
  queryCount++;
  return Promise.resolve({ _sum: { pointsEarned: 5000 }, _count: 100 });
};

(prisma.pWAInstall.count as any) = () => {
  queryCount++;
  return Promise.resolve(25);
};

(prisma.pushSubscription.count as any) = () => {
  queryCount++;
  return Promise.resolve(50);
};

(prisma.voiceArticle.count as any) = () => {
  queryCount++;
  return Promise.resolve(12);
};

(prisma.engagementMilestone.findMany as any) = () => {
  queryCount++;
  return Promise.resolve(
    Array.from({ length: 20 }, (_, i) => ({
      id: `m_${i}`,
      userId: `user_${i % 10}`,
      type: 'ARTICLES_READ',
      threshold: 10,
      achieved: true,
      achievedAt: new Date(),
    }))
  );
};

(prisma.user.findUnique as any) = ({ where }: any) => {
  queryCount++;
  return Promise.resolve({
    id: where.id,
    username: `Username_${where.id}`,
    email: `${where.id}@example.com`,
    avatarUrl: `https://example.com/avatar_${where.id}.png`,
  });
};

(prisma.user.findMany as any) = ({ where }: any) => {
  queryCount++;
  const ids: string[] = where?.id?.in || [];
  return Promise.resolve(
    ids.map((id) => ({
      id,
      username: `Username_${id}`,
      email: `${id}@example.com`,
      avatarUrl: `https://example.com/avatar_${id}.png`,
    }))
  );
};

async function runBenchmark() {
  console.log('--- Running Engagement Analytics Benchmark ---');
  queryCount = 0;
  const iterations = 1000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    await engagementService.getEngagementAnalytics();
  }

  const duration = performance.now() - start;
  const avgQueriesPerCall = queryCount / iterations;

  console.log(`Total time for ${iterations} iterations: ${duration.toFixed(2)} ms`);
  console.log(`Average execution time per call: ${(duration / iterations).toFixed(3)} ms`);
  console.log(`Average DB query roundtrips per call: ${avgQueriesPerCall}`);
  console.log('---------------------------------------------');
}

runBenchmark();
