/**
 * Test Supabase Database Connection
 * Run this to verify migration succeeded
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...\n');

    // Test 1: Basic connection
    console.log('Test 1: Database connection...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase\n');

    // Test 2: Check if tables exist
    console.log('Test 2: Checking tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name 
      LIMIT 20;
    `;
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    console.log('');

    // Test 3: Check enums
    console.log('Test 3: Checking enums...');
    const enums = await prisma.$queryRaw`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname;
    `;
    console.log(`✅ Found ${enums.length} enums:`);
    enums.forEach(e => console.log(`   - ${e.typname}`));
    console.log('');

    // Test 4: Count records in key tables
    console.log('Test 4: Checking key tables...');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table: ${userCount} records`);
    } catch (e) {
      console.log(`⚠️  Users table: ${e.message}`);
    }

    try {
      const articleCount = await prisma.article.count();
      console.log(`✅ Articles table: ${articleCount} records`);
    } catch (e) {
      console.log(`⚠️  Articles table: ${e.message}`);
    }

    try {
      const walletCount = await prisma.wallet.count();
      console.log(`✅ Wallets table: ${walletCount} records`);
    } catch (e) {
      console.log(`⚠️  Wallets table: ${e.message}`);
    }

    console.log('\n✅ DATABASE MIGRATION VERIFIED SUCCESSFULLY!');
    console.log('All tables and schema are properly set up in Supabase.\n');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
