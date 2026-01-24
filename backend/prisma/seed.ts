import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Clean existing data
    await prisma.userEngagement.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.communityPost.deleteMany();
    await prisma.articleTranslation.deleteMany();
    await prisma.article.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    await prisma.aITask.deleteMany();
    await prisma.aIAgent.deleteMany();
    await prisma.marketData.deleteMany();
    await prisma.token.deleteMany();
    await prisma.exchangeIntegration.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
