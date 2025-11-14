/**
 * Wallet GraphQL Operations Test Script
 * 
 * Tests all 7 wallet modal GraphQL operations
 * Run with: node backend/tests/wallet-graphql-test.js
 */

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL || 'http://localhost:3001/graphql';

// Replace with actual JWT token from your authentication system
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'your_jwt_token_here';

/**
 * Execute GraphQL query/mutation
 */
async function executeGraphQL(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GraphQL request error:', error.message);
    return { errors: [{ message: error.message }] };
  }
}

/**
 * Test 1: Convert CE to JY
 */
async function testConvertCEToJY() {
  console.log('\n=== Test 1: Convert CE to JY ===\n');

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

  const variables = {
    walletId: 'test_wallet_id', // Replace with actual wallet ID
    ceAmount: 500, // 500 CE = 5 JY
  };

  console.log('Variables:', JSON.stringify(variables, null, 2));
  const result = await executeGraphQL(mutation, variables);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.data?.convertCEToJY?.success) {
    console.log('✅ Test PASSED');
  } else {
    console.log('❌ Test FAILED');
  }
}

/**
 * Test 2: Get Whitelisted Wallets
 */
async function testGetWhitelistedWallets() {
  console.log('\n=== Test 2: Get Whitelisted Wallets ===\n');

  const query = `
    query GetWhitelistedWallets {
      getWhitelistedWallets
    }
  `;

  const result = await executeGraphQL(query);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.data?.getWhitelistedWallets) {
    console.log('✅ Test PASSED');
  } else {
    console.log('❌ Test FAILED');
  }
}

/**
 * Test 3: Deposit from Wallet
 */
async function testDepositFromWallet() {
  console.log('\n=== Test 3: Deposit from Wallet ===\n');

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

  const variables = {
    walletId: 'test_wallet_id',
    sourceAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    amount: 5.5,
    txHash: '0x123abc...',
  };

  console.log('Variables:', JSON.stringify(variables, null, 2));
  const result = await executeGraphQL(mutation, variables);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.data?.depositFromWallet) {
    console.log('✅ Test PASSED');
  } else {
    console.log('❌ Test FAILED');
  }
}

/**
 * Test 4: Create Transfer
 */
async function testCreateTransfer() {
  console.log('\n=== Test 4: Create Transfer ===\n');

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

  const variables = {
    fromWalletId: 'test_wallet_id',
    toIdentifier: 'recipient_username', // Can be username, email, or user ID
    amount: 10.0,
    transferType: 'USER',
    note: 'Test transfer',
  };

  console.log('Variables:', JSON.stringify(variables, null, 2));
  const result = await executeGraphQL(mutation, variables);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.data?.createTransfer) {
    console.log('✅ Test PASSED');
  } else {
    console.log('❌ Test FAILED');
  }
}

/**
 * Test 5: Search Users
 */
async function testSearchUsers() {
  console.log('\n=== Test 5: Search Users ===\n');

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

  const variables = {
    query: 'john',
    limit: 5,
  };

  console.log('Variables:', JSON.stringify(variables, null, 2));
  const result = await executeGraphQL(query, variables);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.data?.searchUsers) {
    console.log('✅ Test PASSED');
  } else {
    console.log('❌ Test FAILED');
  }
}

/**
 * Test 6: Get Exchange Rate
 */
async function testGetExchangeRate() {
  console.log('\n=== Test 6: Get Exchange Rate ===\n');

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

  const variables = {
    fromCurrency: 'JY',
    toCurrency: 'USD',
    amount: 10,
    provider: 'ChangeNOW',
  };

  console.log('Variables:', JSON.stringify(variables, null, 2));
  const result = await executeGraphQL(query, variables);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.data?.getExchangeRate) {
    console.log('✅ Test PASSED');
  } else {
    console.log('❌ Test FAILED');
  }
}

/**
 * Test 7: Check Swap Status
 */
async function testCheckSwapStatus() {
  console.log('\n=== Test 7: Check Swap Status ===\n');

  const query = `
    query CheckSwapStatus($walletId: ID!) {
      checkSwapStatus(walletId: $walletId) {
        success
        txHash
        error
      }
    }
  `;

  const variables = {
    walletId: 'test_wallet_id',
  };

  console.log('Variables:', JSON.stringify(variables, null, 2));
  const result = await executeGraphQL(query, variables);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.data?.checkSwapStatus) {
    console.log('✅ Test PASSED');
  } else {
    console.log('❌ Test FAILED');
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Wallet GraphQL Operations Test Suite          ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`\nGraphQL Endpoint: ${GRAPHQL_ENDPOINT}`);
  console.log('NOTE: Set TEST_AUTH_TOKEN environment variable with valid JWT\n');

  await testConvertCEToJY();
  await testGetWhitelistedWallets();
  await testDepositFromWallet();
  await testCreateTransfer();
  await testSearchUsers();
  await testGetExchangeRate();
  await testCheckSwapStatus();

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     Test Suite Complete                            ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

// Run tests
runAllTests().catch(console.error);
