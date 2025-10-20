const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const allKeys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));

console.log('Total available models:', allKeys.length);
console.log('\nAll models:');
allKeys.forEach(key => console.log(`  - ${key}`));

console.log('\n\nChecking for Task 76 models:');
const task76Models = [
  'strategyKeyword',
  'topicCluster',
  'contentCalendarItem',
  'competitorAnalysis',
  'trendMonitor',
  'contentStrategyMetrics'
];

task76Models.forEach(model => {
  const exists = allKeys.includes(model);
  console.log(`  ${exists ? '✓' : '✗'} ${model}: ${exists ? 'FOUND' : 'MISSING'}`);
});

prisma.$disconnect();
