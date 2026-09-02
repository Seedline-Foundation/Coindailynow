/**
 * Benchmark script for predictiveSeoService generateAllForecasts
 * Compares sequential processing vs batched parallel processing with batch size 10.
 */

async function simulateAsyncTask(id: string, keyword: string, delayMs: number = 20): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function runSequential(keywords: { id: string; keyword: string }[], delayMs: number) {
  const start = performance.now();
  for (const keyword of keywords) {
    try {
      await simulateAsyncTask(keyword.id, keyword.keyword, delayMs);
    } catch (error) {
      console.error(`Error generating forecast for ${keyword.keyword}:`, error);
    }
  }
  const duration = performance.now() - start;
  return duration;
}

async function runBatched(keywords: { id: string; keyword: string }[], delayMs: number, batchSize: number = 10) {
  const start = performance.now();
  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (keyword) => {
        try {
          await simulateAsyncTask(keyword.id, keyword.keyword, delayMs);
        } catch (error) {
          console.error(`Error generating forecast for ${keyword.keyword}:`, error);
        }
      })
    );
  }
  const duration = performance.now() - start;
  return duration;
}

async function main() {
  const TOTAL_KEYWORDS = 100;
  const LATENCY_PER_ITEM_MS = 20;
  const BATCH_SIZE = 10;

  const keywords = Array.from({ length: TOTAL_KEYWORDS }, (_, i) => ({
    id: `kw-${i + 1}`,
    keyword: `crypto-keyword-${i + 1}`,
  }));

  console.log(`\n=== ⚡ Predictive SEO Service Benchmark ===`);
  console.log(`Total Keywords: ${TOTAL_KEYWORDS}`);
  console.log(`Simulated Latency per Item: ${LATENCY_PER_ITEM_MS} ms`);
  console.log(`Batch Size: ${BATCH_SIZE}\n`);

  console.log('Running Sequential Baseline...');
  const seqDuration = await runSequential(keywords, LATENCY_PER_ITEM_MS);
  console.log(`Sequential execution time: ${seqDuration.toFixed(2)} ms`);

  console.log('Running Optimized Batched Execution...');
  const batchDuration = await runBatched(keywords, LATENCY_PER_ITEM_MS, BATCH_SIZE);
  console.log(`Batched execution time: ${batchDuration.toFixed(2)} ms`);

  const speedup = (seqDuration / batchDuration).toFixed(2);
  const percentSaved = (((seqDuration - batchDuration) / seqDuration) * 100).toFixed(1);

  console.log(`\n📊 Benchmark Results:`);
  console.log(`- Baseline (Sequential): ${seqDuration.toFixed(2)} ms`);
  console.log(`- Optimized (Batched):  ${batchDuration.toFixed(2)} ms`);
  console.log(`- Speedup: ${speedup}x faster`);
  console.log(`- Time Reduction: ${percentSaved}%\n`);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
