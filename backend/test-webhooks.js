/**
 * Webhook Test Script for Wallet Callbacks
 * 
 * Tests YellowCard deposit and ChangeNOW swap webhooks
 * 
 * Usage:
 *   node test-webhooks.js deposit
 *   node test-webhooks.js swap
 *   node test-webhooks.js both
 */

const crypto = require('crypto');
const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const YELLOWCARD_SECRET = process.env.YELLOWCARD_WEBHOOK_SECRET || 'test_yellowcard_secret';
const CHANGENOW_SECRET = process.env.CHANGENOW_WEBHOOK_SECRET || 'test_changenow_secret';

// Test data
const TEST_USER_ID = 'test_user_123';
const TEST_WALLET_ID = 'test_wallet_456';

/**
 * Generate HMAC-SHA256 signature for YellowCard
 */
function generateYellowCardSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Generate HMAC-SHA512 signature for ChangeNOW
 */
function generateChangeNOWSignature(payload, secret) {
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Test YellowCard deposit callback
 */
async function testDepositCallback() {
  console.log('\n📥 Testing YellowCard Deposit Callback...\n');

  const payload = {
    transaction_id: `yc_test_${Date.now()}`,
    user_id: TEST_USER_ID,
    wallet_id: TEST_WALLET_ID,
    amount: '10.5',
    currency: 'JY',
    status: 'completed',
    tx_hash: `0x${crypto.randomBytes(32).toString('hex')}`,
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };

  const signature = generateYellowCardSignature(payload, YELLOWCARD_SECRET);

  try {
    const response = await axios.post(
      `${BASE_URL}/api/wallet/deposit/callback`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-yellowcard-signature': signature
        }
      }
    );

    console.log('✅ Deposit callback successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Deposit callback failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test ChangeNOW swap callback
 */
async function testSwapCallback() {
  console.log('\n🔄 Testing ChangeNOW Swap Callback...\n');

  const payload = {
    id: `cn_test_${Date.now()}`,
    user_id: TEST_USER_ID,
    wallet_id: TEST_WALLET_ID,
    fromAmount: '10',
    fromCurrency: 'JY',
    toAmount: '5.00',
    toCurrency: 'USD',
    status: 'finished',
    payoutHash: `0x${crypto.randomBytes(32).toString('hex')}`,
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };

  const signature = generateChangeNOWSignature(payload, CHANGENOW_SECRET);

  try {
    const response = await axios.post(
      `${BASE_URL}/api/wallet/swap/callback`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-changenow-signature': signature
        }
      }
    );

    console.log('✅ Swap callback successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Swap callback failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test invalid signature
 */
async function testInvalidSignature() {
  console.log('\n🔒 Testing Invalid Signature (should fail)...\n');

  const payload = {
    transaction_id: `yc_test_invalid_${Date.now()}`,
    user_id: TEST_USER_ID,
    wallet_id: TEST_WALLET_ID,
    amount: '10.5',
    currency: 'JY',
    status: 'completed',
    tx_hash: `0x${crypto.randomBytes(32).toString('hex')}`,
  };

  const invalidSignature = 'invalid_signature_12345';

  try {
    await axios.post(
      `${BASE_URL}/api/wallet/deposit/callback`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-yellowcard-signature': invalidSignature
        }
      }
    );

    console.error('❌ Test failed - invalid signature was accepted!');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Invalid signature correctly rejected!');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

/**
 * Main test runner
 */
async function main() {
  const testType = process.argv[2] || 'both';

  console.log('====================================');
  console.log('   Wallet Webhook Test Suite');
  console.log('====================================');
  console.log(`API URL: ${BASE_URL}`);
  console.log(`Test Type: ${testType}`);
  console.log('====================================');

  let results = {
    passed: 0,
    failed: 0
  };

  // Test deposit callback
  if (testType === 'deposit' || testType === 'both') {
    const depositResult = await testDepositCallback();
    if (depositResult) results.passed++;
    else results.failed++;
  }

  // Test swap callback
  if (testType === 'swap' || testType === 'both') {
    const swapResult = await testSwapCallback();
    if (swapResult) results.passed++;
    else results.failed++;
  }

  // Test invalid signature
  if (testType === 'both' || testType === 'security') {
    const securityResult = await testInvalidSignature();
    if (securityResult) results.passed++;
    else results.failed++;
  }

  // Summary
  console.log('\n====================================');
  console.log('           Test Summary');
  console.log('====================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);
  console.log('====================================\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testDepositCallback,
  testSwapCallback,
  testInvalidSignature
};
