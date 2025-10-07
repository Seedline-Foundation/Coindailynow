import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testModels() {
  // Test if models are accessible
  const auditTest = await prisma.auditEvent.findMany({ take: 1 });
  const deviceTest = await prisma.deviceTrust.findMany({ take: 1 });
  const complianceTest = await prisma.complianceReport.findMany({ take: 1 });
  
  console.log('Models are accessible!');
  
  await prisma.$disconnect();
}

testModels().catch(console.error);