import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Clean existing data using TRUNCATE CASCADE to handle foreign key constraints
    const tables = [
      'User', 'SubscriptionPlan', 'AIAgent', 'AITask', 'MarketData', 
      'Token', 'ExchangeIntegration', 'Category'
    ];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch (err) {
        console.warn(`Warning: Could not truncate table ${table}:`, err);
      }
    }

    // Create default super admin
    const passwordHash = await bcrypt.hash('adminpassword', 10);
    await prisma.user.create({
      data: {
        id: 'super-admin-id',
        email: 'admin@coindaily.online',
        username: 'superadmin',
        passwordHash,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        emailVerified: true
      }
    });
    console.log('Seeded super admin user: admin@coindaily.online / adminpassword');

    // Create demo user
    const userPasswordHash = await bcrypt.hash('User@2024', 10);
    await prisma.user.create({
      data: {
        id: 'demo-user-id',
        email: 'user@coindaily.africa',
        username: 'demouser',
        passwordHash: userPasswordHash,
        role: 'USER',
        firstName: 'Demo',
        lastName: 'User',
        status: 'ACTIVE',
        emailVerified: true
      }
    });
    console.log('Seeded demo user: user@coindaily.africa / User@2024');

    // Create demo editor
    const editorPasswordHash = await bcrypt.hash('Editor@2024', 10);
    await prisma.user.create({
      data: {
        id: 'demo-editor-id',
        email: 'editor@coindaily.africa',
        username: 'demoeditor',
        passwordHash: editorPasswordHash,
        role: 'EDITOR',
        firstName: 'Demo',
        lastName: 'Editor',
        status: 'ACTIVE',
        emailVerified: true
      }
    });
    console.log('Seeded demo editor: editor@coindaily.africa / Editor@2024');

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
