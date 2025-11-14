/**
 * GraphQL Wallet Modal Operations Test Script
 * 
 * Tests all 7 wallet modal GraphQL queries and mutations
 * 
 * Usage:
 *   node test-graphql-wallet.js
 */

const axios = require('axios');

// Configuration
const GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:3001/graphql';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'your_test_jwt_token_here';

// Test wallet IDs (replace with actual test data)
const TEST_WALLET_ID = 'test_wallet_123';
const TEST_SOURCE_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

/**
 * Execute GraphQL query/mutation
 */
async function executeGraphQL(query, variables = {}) {
  try {
    const response = await axios.post(
      GRAPHQL_URL,
      {
        query,
        variables
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors, null, 2));
    }

    return response.data.data;
  } catch (error) {
    if (error.response) {
      console.error('GraphQL Error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Test 1: Get Whitelisted Wallets
 */
async function testGetWhitelistedWallets() {
  console.log('\n📋 Test 1: Get Whitelisted Wallets\n');

  const query = `
    query GetWhitelistedWallets {
      getWhitelistedWallets
    }
  `;

  try {
    const result = await executeGraphQL(query);
    console.log('✅ Success!');
    console.log('Whitelisted addresses:', result.getWhitelistedWallets);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Search Users
 */
async function testSearchUsers() {
  console.log('\n🔍 Test 2: Search Users\n');

  const query = `
    query SearchUsers($query: String!, $limit: Int) {
      searchUsers(query: $query, limit: $limit) {
        id
        username
        displayName
        avatar
        role
      }
    }
  `;

  try {
    const result = await executeGraphQL(query, {
      query: 'john',
      limit: 5
    });
    console.log('✅ Success!');
    console.log(`Found ${result.searchUsers.length} users:`);
    result.searchUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.displayName}) - ${user.role}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Get Exchange Rate
 */
async function testGetExchangeRate() {
  console.log('\n💱 Test 3: Get Exchange Rate\n');

  const query = `
    query GetExchangeRate(
      $fromCurrency: String!
      $toCurrency: String!
      $amount: Float!
      $provider: PaymentProvider!
    ) {
      getExchangeRate(
        fromCurrency: $fromCurrency
        toCurrency: $toCurrency
        amount: $amount
        provider: $provider
      ) {
        fromCurrency
        toCurrency
        rate
        fee
        estimatedTime
        provider
      }
    }
  `;

  try {
    const result = await executeGraphQL(query, {
      fromCurrency: 'JY',
      toCurrency: 'USD',
      amount: 10,
      provider: 'ChangeNOW'
    });
    console.log('✅ Success!');
    console.log('Exchange rate:', JSON.stringify(result.getExchangeRate, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Check Swap Status
 */
async function testCheckSwapStatus() {
  console.log('\n🔄 Test 4: Check Swap Status\n');

  const query = `
    query CheckSwapStatus($walletId: ID!) {
      checkSwapStatus(walletId: $walletId) {
        success
        txHash
        error
      }
    }
  `;

  try {
    const result = await executeGraphQL(query, {
      walletId: TEST_WALLET_ID
    });
    console.log('✅ Success!');
    console.log('Swap status:', JSON.stringify(result.checkSwapStatus, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Convert CE to JY
 */
async function testConvertCEToJY() {
  console.log('\n🔄 Test 5: Convert CE to JY\n');

  const mutation = `
    mutation ConvertCEToJY($walletId: ID!, $ceAmount: Float!) {
      convertCEToJY(walletId: $walletId, ceAmount: $ceAmount) {
        success
        jyAmount
        transactionId
        error
      }
    }
  `;

  try {
    const result = await executeGraphQL(mutation, {
      walletId: TEST_WALLET_ID,
      ceAmount: 500  // 500 CE = 5 JY
    });
    console.log('✅ Success!');
    console.log('Conversion result:', JSON.stringify(result.convertCEToJY, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 6: Deposit from Wallet
 */
async function testDepositFromWallet() {
  console.log('\n💰 Test 6: Deposit from Wallet\n');

  const mutation = `
    mutation DepositFromWallet(
      $walletId: ID!
      $sourceAddress: String!
      $amount: Float!
      $txHash: String
    ) {
      depositFromWallet(
        walletId: $walletId
        sourceAddress: $sourceAddress
        amount: $amount
        txHash: $txHash
      ) {
        success
        txHash
        transactionId
        error
      }
    }
  `;

  try {
    const result = await executeGraphQL(mutation, {
      walletId: TEST_WALLET_ID,
      sourceAddress: TEST_SOURCE_ADDRESS,
      amount: 5.5,
      txHash: '0xabc123...'
    });
    console.log('✅ Success!');
    console.log('Deposit result:', JSON.stringify(result.depositFromWallet, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 7: Create Transfer
 */
async function testCreateTransfer() {
  console.log('\n💸 Test 7: Create Transfer\n');

  const mutation = `
    mutation CreateTransfer(
      $fromWalletId: ID!
      $toIdentifier: String!
      $amount: Float!
      $transferType: TransferType!
      $note: String
    ) {
      createTransfer(
        fromWalletId: $fromWalletId
        toIdentifier: $toIdentifier
        amount: $amount
        transferType: $transferType
        note: $note
      ) {
        success
        txId
        error
      }
    }
  `;

  try {
    const result = await executeGraphQL(mutation, {
      fromWalletId: TEST_WALLET_ID,
      toIdentifier: 'recipient@example.com',
      amount: 2.5,
      transferType: 'USER',
      note: 'Test transfer'
    });
    console.log('✅ Success!');
    console.log('Transfer result:', JSON.stringify(result.createTransfer, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('====================================');
  console.log('   GraphQL Wallet Modal Tests');
  console.log('====================================');
  console.log(`GraphQL URL: ${GRAPHQL_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '[SET]' : '[NOT SET]'}`);
  console.log('====================================');

  if (AUTH_TOKEN === 'your_test_jwt_token_here') {
    console.warn('\n⚠️  WARNING: Using placeholder auth token!');
    console.warn('Set TEST_AUTH_TOKEN environment variable with a valid JWT.\n');
  }

  const tests = [
    { name: 'Get Whitelisted Wallets', fn: testGetWhitelistedWallets },
    { name: 'Search Users', fn: testSearchUsers },
    { name: 'Get Exchange Rate', fn: testGetExchangeRate },
    { name: 'Check Swap Status', fn: testCheckSwapStatus },
    { name: 'Convert CE to JY', fn: testConvertCEToJY },
    { name: 'Deposit from Wallet', fn: testDepositFromWallet },
    { name: 'Create Transfer', fn: testCreateTransfer }
  ];

  let results = {
    passed: 0,
    failed: 0
  };

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) results.passed++;
      else results.failed++;
    } catch (error) {
      console.error(`\n❌ ${test.name} threw an error:`, error.message);
      results.failed++;
    }
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
  testGetWhitelistedWallets,
  testSearchUsers,
  testGetExchangeRate,
  testCheckSwapStatus,
  testConvertCEToJY,
  testDepositFromWallet,
  testCreateTransfer
};
