const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Check if AnalyticsEvent table exists by trying to query it
    const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`;
    console.log('Tables in database:', result);
    
    // Try to access analyticsEvent
    try {
      const analyticsEvents = await prisma.analyticsEvent.findMany({ take: 1 });
      console.log('analyticsEvent model exists and accessible');
    } catch (e) {
      console.log('analyticsEvent model not accessible:', e.message);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();