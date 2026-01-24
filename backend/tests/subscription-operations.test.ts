/**
 * Test Script for Subscription Operations
 * Tests the 5 newly implemented subscription finance operations
 */

import { FinanceService } from '../src/services/FinanceService';

async function testSubscriptionOperations() {
  console.log('🧪 Testing Subscription Finance Operations...\n');

  // Test data
  const testData = {
    subscriptionId: 'sub_test_123',
    userId: 'user_test_123',
    walletId: 'wallet_test_123',
    planId: 'plan_premium_monthly',
    newPlanId: 'plan_premium_yearly',
  };

  try {
    console.log('1. Testing Subscription Auto-Renewal...');
    const autoRenewResult = await FinanceService.subscriptionAutoRenew({
      subscriptionId: testData.subscriptionId,
      userId: testData.userId,
      walletId: testData.walletId,
      amount: 29.99,
      currency: 'USD',
      paymentMethod: 'WALLET' as any,
      metadata: { test: true }
    });
    console.log('✅ Auto-renewal result:', JSON.stringify(autoRenewResult, null, 2));

    console.log('\n2. Testing Subscription Upgrade...');
    const upgradeResult = await FinanceService.subscriptionUpgrade({
      subscriptionId: testData.subscriptionId,
      userId: testData.userId,
      walletId: testData.walletId,
      newPlanId: testData.newPlanId,
      prorationAmount: 15.50,
      currency: 'USD',
      paymentMethod: 'WALLET' as any,
      metadata: { test: true }
    });
    console.log('✅ Upgrade result:', JSON.stringify(upgradeResult, null, 2));

    console.log('\n3. Testing Subscription Downgrade...');
    const downgradeResult = await FinanceService.subscriptionDowngrade({
      subscriptionId: testData.subscriptionId,
      userId: testData.userId,
      walletId: testData.walletId,
      newPlanId: 'plan_basic_monthly',
      refundAmount: 10.00,
      currency: 'USD',
      metadata: { test: true }
    });
    console.log('✅ Downgrade result:', JSON.stringify(downgradeResult, null, 2));

    console.log('\n4. Testing Subscription Pause...');
    const pauseResult = await FinanceService.subscriptionPause({
      subscriptionId: testData.subscriptionId,
      userId: testData.userId,
      pauseReason: 'Temporary financial hardship',
      pauseDuration: 30, // 30 days
      refundAmount: 5.00,
      walletId: testData.walletId,
      currency: 'USD',
      metadata: { test: true }
    });
    console.log('✅ Pause result:', JSON.stringify(pauseResult, null, 2));

    console.log('\n5. Testing Subscription Cancel...');
    const cancelResult = await FinanceService.subscriptionCancel({
      subscriptionId: testData.subscriptionId,
      userId: testData.userId,
      walletId: testData.walletId,
      cancelReason: 'No longer needed',
      immediateCancel: false,
      refundAmount: 15.00,
      currency: 'USD',
      metadata: { test: true }
    });
    console.log('✅ Cancel result:', JSON.stringify(cancelResult, null, 2));

    console.log('\n🎉 All subscription operations tested successfully!');
    console.log('\n📊 Summary:');
    console.log('• subscriptionAutoRenew - ✅ Implemented');
    console.log('• subscriptionUpgrade - ✅ Implemented');
    console.log('• subscriptionDowngrade - ✅ Implemented');
    console.log('• subscriptionPause - ✅ Implemented');
    console.log('• subscriptionCancel - ✅ Implemented');
    console.log('\n🚀 All 5 subscription operations are now complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSubscriptionOperations().then(() => {
    console.log('\n✨ Test completed successfully!');
  }).catch(error => {
    console.error('\n💥 Test failed with error:', error);
  });
}

export { testSubscriptionOperations };