/**
 * Wallet Webhook Test Script
 * 
 * Tests YellowCard and ChangeNOW webhook callbacks with mock data
 * Run with: node backend/tests/wallet-webhook-test.js
 */

const crypto = require('crypto');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Mock webhook secrets (use actual secrets from .env in production)
const YELLOWCARD_SECRET = process.env.YELLOWCARD_WEBHOOK_SECRET || 'test_yellowcard_secret';
const CHANGENOW_SECRET = process.env.CHANGENOW_WEBHOOK_SECRET || 'test_changenow_secret';

/**
 * Generate HMAC signature for YellowCard webhook
 */
function generateYellowCardSignature(payload) {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', YELLOWCARD_SECRET)
    .update(payloadString)
    .digest('hex');
}

/**
 * Generate HMAC signature for ChangeNOW webhook
 */
function generateChangeNOWSignature(payload) {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha512', CHANGENOW_SECRET)
    .update(payloadString)
    .digest('hex');
}

/**
 * Test YellowCard deposit callback
 */
async function testYellowCardDeposit() {
  console.log('\n=== Testing YellowCard Deposit Callback ===\n');

  const payload = {
    transaction_id: `yc_test_${Date.now()}`,
    user_id: 'test_user_id', // Replace with actual user ID from your database
    wallet_id: 'test_wallet_id', // Replace with actual wallet ID
    amount: '10.50',
    currency: 'JY',
    status: 'completed',
    tx_hash: `0x${crypto.randomBytes(32).toString('hex')}`,
    metadata: {
      payment_method: 'mobile_money',
      network: 'binance_smart_chain',
    },
  };

  const signature = generateYellowCardSignature(payload);

  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Signature:', signature);

  try {
    const response = await fetch(`${API_BASE_URL}/api/wallet/deposit/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-yellowcard-signature': signature,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ YellowCard deposit test PASSED');
    } else {
      console.log('❌ YellowCard deposit test FAILED');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

/**
 * Test ChangeNOW swap callback
 */
async function testChangeNOWSwap() {
  console.log('\n=== Testing ChangeNOW Swap Callback ===\n');

  const payload = {
    id: `cn_test_${Date.now()}`,
    user_id: 'test_user_id', // Replace with actual user ID
    wallet_id: 'test_wallet_id', // Replace with actual wallet ID
    fromAmount: '10',
    fromCurrency: 'USD',
    toAmount: '20.00',
    toCurrency: 'JY',
    status: 'finished',
    payoutHash: `0x${crypto.randomBytes(32).toString('hex')}`,
    metadata: {
      exchange: 'changenow',
      network: 'ethereum',
    },
  };

  const signature = generateChangeNOWSignature(payload);

  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Signature:', signature);

  try {
    const response = await fetch(`${API_BASE_URL}/api/wallet/swap/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-changenow-signature': signature,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ ChangeNOW swap test PASSED');
    } else {
      console.log('❌ ChangeNOW swap test FAILED');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

/**
 * Test invalid signature (should fail)
 */
async function testInvalidSignature() {
  console.log('\n=== Testing Invalid Signature (Should Fail) ===\n');

  const payload = {
    transaction_id: `yc_invalid_${Date.now()}`,
    user_id: 'test_user_id',
    wallet_id: 'test_wallet_id',
    amount: '5.00',
    currency: 'JY',
    status: 'completed',
    tx_hash: '0x123',
  };

  const invalidSignature = 'invalid_signature_12345';

  console.log('Using invalid signature:', invalidSignature);

  try {
    const response = await fetch(`${API_BASE_URL}/api/wallet/deposit/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-yellowcard-signature': invalidSignature,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('✅ Invalid signature test PASSED (correctly rejected)');
    } else {
      console.log('❌ Invalid signature test FAILED (should have been rejected)');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Wallet Webhook Integration Tests              ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`\nAPI Base URL: ${API_BASE_URL}`);
  console.log('NOTE: Update user_id and wallet_id with actual values from your database\n');

  await testYellowCardDeposit();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests

  await testChangeNOWSwap();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testInvalidSignature();

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     Test Suite Complete                            ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

// Run tests
runAllTests().catch(console.error);
