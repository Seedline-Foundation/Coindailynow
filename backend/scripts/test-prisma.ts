import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing simple Prisma query...');
  try {
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users found:', users.map(u => ({ id: u.id, email: u.email })));
  } catch (error) {
    console.error('Prisma query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
