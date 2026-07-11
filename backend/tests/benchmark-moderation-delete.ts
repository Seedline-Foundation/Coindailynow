import prisma from '../src/lib/prisma';

async function setupAndMeasure() {
  console.log('--- Benchmarking Bulk Moderation Delete (Baseline vs Optimized Idea) ---');

  // Let's generate 50 mock entries
  const numItems = 50;
  console.log(`Creating ${numItems} mock ModerationQueue items in the database...`);

  const itemIds: string[] = [];
  for (let i = 0; i < numItems; i++) {
    const item = await prisma.moderationQueue.create({
      data: {
        contentType: 'article',
        contentId: `test-content-${i}`,
        content: `This is a test article content number ${i}`,
        authorId: 'test-author-id',
        authorRole: 'USER',
        status: 'PENDING',
        priority: 1
      }
    });
    itemIds.push(item.id);
  }

  console.log(`Successfully created ${numItems} items.`);

  // Measure baseline: N+1 delete loop
  console.log('Measuring baseline: loop with separate delete queries...');
  const startBaseline = Date.now();
  for (const queueId of itemIds) {
    await prisma.moderationQueue.delete({
      where: { id: queueId }
    });
  }
  const endBaseline = Date.now();
  const baselineDuration = endBaseline - startBaseline;
  console.log(`Baseline loop took: ${baselineDuration}ms`);

  // Let's create another 50 mock entries to measure the optimized deleteMany strategy
  console.log(`Creating another ${numItems} mock items for optimized measurement...`);
  const optIds: string[] = [];
  for (let i = 0; i < numItems; i++) {
    const item = await prisma.moderationQueue.create({
      data: {
        contentType: 'article',
        contentId: `test-content-opt-${i}`,
        content: `This is an optimized test article content number ${i}`,
        authorId: 'test-author-id',
        authorRole: 'USER',
        status: 'PENDING',
        priority: 1
      }
    });
    optIds.push(item.id);
  }

  console.log('Measuring optimized: single deleteMany query...');
  const startOpt = Date.now();
  await prisma.moderationQueue.deleteMany({
    where: { id: { in: optIds } }
  });
  const endOpt = Date.now();
  const optDuration = endOpt - startOpt;
  console.log(`Optimized deleteMany took: ${optDuration}ms`);

  const speedup = (baselineDuration / optDuration).toFixed(2);
  console.log(`Speedup factor: ${speedup}x faster!`);
}

setupAndMeasure()
  .then(() => {
    console.log('Benchmark finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during benchmark:', err);
    process.exit(1);
  });
