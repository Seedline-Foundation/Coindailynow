import { verifyAndPersist, SocialHandleInput } from '../src/services/influencerVerificationService';

class MockPrisma {
  public callCount = 0;
  public simulatedDelayMs = 15; // simulated network/DB roundtrip delay in ms

  private async delay() {
    this.callCount++;
    await new Promise(resolve => setTimeout(resolve, this.simulatedDelayMs));
  }

  public influencerSocialHandle = {
    findMany: async () => {
      await this.delay();
      return [
        { id: 'h1', platform: 'twitter', handle: '@old_test' }
      ];
    },
    update: () => {
      // Return update operational object
      this.callCount++;
      return { type: 'update' };
    },
    createMany: () => {
      this.callCount++;
      return { type: 'createMany' };
    }
  };

  public influencerVerification = {
    deleteMany: async () => {
      this.callCount++;
      return { count: 1 };
    },
    createMany: () => {
      this.callCount++;
      return { type: 'createMany' };
    }
  };

  public influencerPartnerProfile = {
    update: () => {
      this.callCount++;
      return { type: 'update' };
    }
  };

  public async $transaction(ops: any[]) {
    // A single transaction is a single database roundtrip!
    this.callCount++;
    await new Promise(resolve => setTimeout(resolve, this.simulatedDelayMs));
    return ops;
  }
}

// Emulate original N+1 implementation to compare
async function originalVerifyAndPersist(
  prisma: any,
  profileId: string,
  handles: SocialHandleInput[]
): Promise<void> {
  const isOrganic = true;
  // Upsert loop (N+1)
  for (const h of handles) {
    prisma.callCount++;
    await new Promise(resolve => setTimeout(resolve, prisma.simulatedDelayMs));
    // simulate internal prisma upsert behavior
  }

  // Delete verifications
  prisma.callCount++;
  await new Promise(resolve => setTimeout(resolve, prisma.simulatedDelayMs));

  // Store verifications sequentially (N+1)
  for (let i = 0; i < 5; i++) {
    prisma.callCount++;
    await new Promise(resolve => setTimeout(resolve, prisma.simulatedDelayMs));
  }

  // Update profile
  prisma.callCount++;
  await new Promise(resolve => setTimeout(resolve, prisma.simulatedDelayMs));
}

async function runBenchmark() {
  console.log('⚡ Starting Influencer Verification N+1 Query Benchmark ⚡\n');

  const handles: SocialHandleInput[] = [
    { platform: 'twitter', handle: '@test', profileUrl: 'url', followers: 25000, avgViews: 0, watchHours: 0, engagementRate: 2.5 },
    { platform: 'youtube', handle: 'yt_test', profileUrl: 'url', followers: 30000, avgViews: 150000, watchHours: 6000, engagementRate: 4.2 },
    { platform: 'tiktok', handle: 'tk_test', profileUrl: 'url', followers: 50000, avgViews: 200000, watchHours: 0, engagementRate: 5.0 },
    { platform: 'instagram', handle: 'ig_test', profileUrl: 'url', followers: 40000, avgViews: 0, watchHours: 0, engagementRate: 3.5 }
  ];

  const profileId = 'influencer-profile-123';

  // Benchmark Original Implementation
  console.log('--- Benchmarking Original Implementation (N+1 Loops) ---');
  const originalPrisma = new MockPrisma();
  const originalStart = Date.now();
  await originalVerifyAndPersist(originalPrisma, profileId, handles);
  const originalDuration = Date.now() - originalStart;
  console.log(`Original DB Roundtrips (estimated): ${originalPrisma.callCount}`);
  console.log(`Original Total Time: ${originalDuration}ms\n`);

  // Benchmark Optimized Implementation
  console.log('--- Benchmarking Optimized Implementation (Bulk + Transaction) ---');
  const optimizedPrisma = new MockPrisma();
  const optimizedStart = Date.now();
  await verifyAndPersist(optimizedPrisma as any, profileId, handles);
  const optimizedDuration = Date.now() - optimizedStart;
  console.log(`Optimized DB Roundtrips: ${optimizedPrisma.callCount}`);
  console.log(`Optimized Total Time: ${optimizedDuration}ms\n`);

  // Comparison
  const roundtripDiff = originalPrisma.callCount - optimizedPrisma.callCount;
  const speedupPercent = ((originalDuration - optimizedDuration) / originalDuration * 100).toFixed(2);
  const latencyReduction = originalDuration - optimizedDuration;

  console.log('📊 BENCHMARK RESULTS SUMMARY:');
  console.log(`- Database Roundtrips Reduced from ${originalPrisma.callCount} to ${optimizedPrisma.callCount} (Saved ${roundtripDiff} roundtrips)`);
  console.log(`- Execution latency dropped from ${originalDuration}ms to ${optimizedDuration}ms`);
  console.log(`- Relative performance boost / latency reduction: ${speedupPercent}% faster (Saved ${latencyReduction}ms per verification run)`);
}

runBenchmark().catch(console.error);
