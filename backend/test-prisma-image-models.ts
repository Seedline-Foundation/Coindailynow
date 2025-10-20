import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testImageModels() {
  console.log('Testing Prisma Image Models...\n');
  
  // Test OptimizedImage model
  const images = await prisma.optimizedImage.findMany({ take: 1 });
  console.log('✅ OptimizedImage model exists');
  
  // Test ImageBatch model
  const batches = await prisma.imageBatch.findMany({ take: 1 });
  console.log('✅ ImageBatch model exists');
  
  // Test ImageFormat model
  const formats = await prisma.imageFormat.findMany({ take: 1 });
  console.log('✅ ImageFormat model exists');
  
  // Test ImageWatermark model
  const watermarks = await prisma.imageWatermark.findMany({ take: 1 });
  console.log('✅ ImageWatermark model exists');
  
  // Test ImageOptimizationMetrics model
  const metrics = await prisma.imageOptimizationMetrics.findMany({ take: 1 });
  console.log('✅ ImageOptimizationMetrics model exists');
  
  console.log('\n✅ All image optimization models are accessible!');
}

testImageModels()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
