/**
 * Mobile Money Provider Seeding Script
 * Task 15: Mobile Money Integration - Database Seeding
 * 
 * Seeds the database with African mobile money provider configurations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMobileMoneyProviders() {
  console.log('🌱 Seeding mobile money providers...');

  const providers = [
    {
      id: 'mpesa_ke',
      name: 'M-Pesa Kenya',
      code: 'MPESA',
      displayName: 'M-Pesa',
      country: 'KE',
      currency: 'KES',
      apiEndpoint: 'https://sandbox.safaricom.co.ke',
      isActive: true,
      supportedCurrencies: 'KES',
      minAmount: 100, // 1 KES
      maxAmount: 15000000, // 150,000 KES
      fixedFee: 0,
      percentageFee: 0.0,
      timeout: 300,
      webhookSecret: process.env.MPESA_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'mpesa_tz',
      name: 'M-Pesa Tanzania',
      code: 'MPESA_TZ',
      displayName: 'M-Pesa Tanzania',
      country: 'TZ',
      currency: 'TZS',
      apiEndpoint: 'https://openapi.m-pesa.com',
      isActive: true,
      supportedCurrencies: 'TZS',
      minAmount: 500, // 5 TZS
      maxAmount: 500000000, // 5,000,000 TZS
      fixedFee: 0,
      percentageFee: 0.0,
      timeout: 300,
      webhookSecret: process.env.MPESA_TZ_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'orange_money_ci',
      name: 'Orange Money Côte d\'Ivoire',
      code: 'ORANGE_MONEY_CI',
      displayName: 'Orange Money',
      country: 'CI',
      currency: 'XOF',
      apiEndpoint: 'https://api.orange.com',
      isActive: true,
      supportedCurrencies: 'XOF',
      minAmount: 100, // 1 XOF
      maxAmount: 200000000, // 2,000,000 XOF
      fixedFee: 0,
      percentageFee: 1.5,
      timeout: 300,
      webhookSecret: process.env.ORANGE_MONEY_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'orange_money_sn',
      name: 'Orange Money Senegal',
      code: 'ORANGE_MONEY_SN',
      displayName: 'Orange Money',
      country: 'SN',
      currency: 'XOF',
      apiEndpoint: 'https://api.orange.com',
      isActive: true,
      supportedCurrencies: 'XOF',
      minAmount: 100,
      maxAmount: 200000000,
      fixedFee: 0,
      percentageFee: 1.5,
      timeout: 300,
      webhookSecret: process.env.ORANGE_MONEY_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'mtn_money_gh',
      name: 'MTN Money Ghana',
      code: 'MTN_MONEY_GH',
      displayName: 'MTN Mobile Money',
      country: 'GH',
      currency: 'GHS',
      apiEndpoint: 'https://api.mtn.com/v1',
      isActive: true,
      supportedCurrencies: 'GHS',
      minAmount: 100, // 1 GHS
      maxAmount: 200000, // 2,000 GHS
      fixedFee: 0,
      percentageFee: 1.0,
      timeout: 300,
      webhookSecret: process.env.MTN_MONEY_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'mtn_money_ug',
      name: 'MTN Money Uganda',
      code: 'MTN_MONEY_UG',
      displayName: 'MTN Mobile Money',
      country: 'UG',
      currency: 'UGX',
      apiEndpoint: 'https://api.mtn.com/v1',
      isActive: true,
      supportedCurrencies: 'UGX',
      minAmount: 500, // 5 UGX
      maxAmount: 500000000, // 5,000,000 UGX
      fixedFee: 0,
      percentageFee: 1.0,
      timeout: 300,
      webhookSecret: process.env.MTN_MONEY_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'ecocash_zw',
      name: 'EcoCash Zimbabwe',
      code: 'ECOCASH',
      displayName: 'EcoCash',
      country: 'ZW',
      currency: 'USD',
      apiEndpoint: 'https://api.ecocash.co.zw',
      isActive: true,
      supportedCurrencies: 'USD,ZWL',
      minAmount: 100, // $0.01
      maxAmount: 100000, // $1,000
      fixedFee: 0,
      percentageFee: 2.0,
      timeout: 300,
      webhookSecret: process.env.ECOCASH_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'airtel_money_ke',
      name: 'Airtel Money Kenya',
      code: 'AIRTEL_MONEY',
      displayName: 'Airtel Money',
      country: 'KE',
      currency: 'KES',
      apiEndpoint: 'https://openapi.airtel.africa',
      isActive: true,
      supportedCurrencies: 'KES',
      minAmount: 100,
      maxAmount: 14000000, // 140,000 KES
      fixedFee: 0,
      percentageFee: 0.75,
      timeout: 300,
      webhookSecret: process.env.AIRTEL_MONEY_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'tigo_pesa_tz',
      name: 'Tigo Pesa Tanzania',
      code: 'TIGO_PESA',
      displayName: 'Tigo Pesa',
      country: 'TZ',
      currency: 'TZS',
      apiEndpoint: 'https://api.tigo.co.tz',
      isActive: true,
      supportedCurrencies: 'TZS',
      minAmount: 500,
      maxAmount: 300000000, // 3,000,000 TZS
      fixedFee: 0,
      percentageFee: 1.2,
      timeout: 300,
      webhookSecret: process.env.TIGO_PESA_WEBHOOK_SECRET || 'test-secret'
    },
    {
      id: 'vodafone_cash_gh',
      name: 'Vodafone Cash Ghana',
      code: 'VODAFONE_CASH',
      displayName: 'Vodafone Cash',
      country: 'GH',
      currency: 'GHS',
      apiEndpoint: 'https://api.vodafone.com.gh',
      isActive: true,
      supportedCurrencies: 'GHS',
      minAmount: 100,
      maxAmount: 500000, // 5,000 GHS
      fixedFee: 0,
      percentageFee: 1.25,
      timeout: 300,
      webhookSecret: process.env.VODAFONE_CASH_WEBHOOK_SECRET || 'test-secret'
    }
  ];

  for (const provider of providers) {
    try {
      await prisma.mobileMoneyProvider.upsert({
        where: { id: provider.id },
        update: {
          ...provider,
          updatedAt: new Date()
        },
        create: {
          ...provider,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Seeded provider: ${provider.displayName} (${provider.country})`);
    } catch (error) {
      console.error(`❌ Failed to seed provider ${provider.displayName}:`, error);
    }
  }

  console.log('🌱 Mobile money provider seeding completed');
}

// Run seeding if called directly
if (require.main === module) {
  seedMobileMoneyProviders()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}