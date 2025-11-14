/**
 * Initialize Platform Settings
 * Creates default platform settings with JY token configuration
 * 
 * Run: npx ts-node scripts/initializePlatformSettings.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeSettings() {
  console.log('🔄 Initializing Platform Settings...\n');
  
  try {
    // Check if settings already exist
    const existing = await prisma.platformSettings.findFirst();
    
    if (existing) {
      console.log('ℹ️  Platform settings already exist:');
      console.log(`   JY Token Rate: $${existing.joyTokenUsdRate.toFixed(4)} USD`);
      console.log(`   CE Points Rate: ${existing.cePointsToJyRate} CE = 1 JY`);
      console.log(`   Platform Name: ${existing.platformName}`);
      console.log('\n✅ No action needed - settings already initialized\n');
      return;
    }
    
    // Create default settings
    const settings = await prisma.platformSettings.create({
      data: {
        joyTokenUsdRate: 1.0,
        joyTokenSymbol: 'JY',
        joyTokenName: 'JOY Token',
        cePointsToJyRate: 100,
        cePointsEnabled: true,
        defaultCurrency: 'JY',
        supportedCurrencies: 'JY,USD,EUR,KES,NGN,GHS,ZAR',
        platformName: 'CoinDaily',
        maintenanceMode: false
      }
    });
    
    console.log('✅ Platform settings initialized successfully!\n');
    console.log('📋 Default Configuration:');
    console.log(`   ├─ JY Token Rate: $${settings.joyTokenUsdRate.toFixed(2)} USD (1 JY = $1.00)`);
    console.log(`   ├─ CE Points Rate: ${settings.cePointsToJyRate} CE Points = 1 JY`);
    console.log(`   ├─ Token Symbol: ${settings.joyTokenSymbol}`);
    console.log(`   ├─ Token Name: ${settings.joyTokenName}`);
    console.log(`   ├─ Default Currency: ${settings.defaultCurrency}`);
    console.log(`   ├─ Supported Currencies: ${settings.supportedCurrencies}`);
    console.log(`   ├─ Platform Name: ${settings.platformName}`);
    console.log(`   └─ Maintenance Mode: ${settings.maintenanceMode ? 'ON' : 'OFF'}`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Super admins can now update the JY/USD rate via GraphQL');
    console.log('   2. Use mutation: updateJoyTokenRate(input: { newRate: 1.5, reason: "..." })');
    console.log('   3. All rate changes will be tracked in CurrencyRateHistory\n');
    
  } catch (error) {
    console.error('❌ Error initializing platform settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initializeSettings()
  .then(() => {
    console.log('🎉 Initialization complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
