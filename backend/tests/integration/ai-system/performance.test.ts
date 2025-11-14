/**
 * AI System Performance Tests
 * Tests database performance for ContentWorkflow and AITask models
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

describe('AI System Performance Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    await prisma.aITask.deleteMany({});
    await prisma.workflowStep.deleteMany({});
    await prisma.contentWorkflow.deleteMany({});
    
    const user = await prisma.user.create({
      data: {
        id: 'perf-test-user',
        email: 'perftest@test.com',
        username: 'perftest',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        emailVerified: true,
        updatedAt: new Date(),
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.aITask.deleteMany({});
    await prisma.workflowStep.deleteMany({});
    await prisma.contentWorkflow.deleteMany({});
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  test('should query workflows in under 500ms', async () => {
    const start = performance.now();
    const workflows = await prisma.contentWorkflow.findMany({ take: 20 });
    const duration = performance.now() - start;
    
    console.log('Query duration: ' + duration.toFixed(2) + 'ms');
    expect(duration).toBeLessThan(500);
  });
});
