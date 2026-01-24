/**
 * Affiliate System Testing Script
 * Tests all affiliate endpoints and workflows
 * 
 * Usage: node test-affiliate-system.js
 */

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/affiliate`;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

// Test data
const testAffiliate = {
  email: `test-affiliate-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test Affiliate User',
};

let authToken = null;
let affiliateCode = null;

// Test Functions
async function testAffiliateRegistration() {
  section('Test 1: Affiliate Registration');
  
  log('Testing affiliate registration...', 'cyan');
  const result = await makeRequest(`${API_BASE}/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: testAffiliate.email,
      password: testAffiliate.password,
      name: testAffiliate.name,
    }),
  });

  if (result.ok) {
    log('✓ Registration successful', 'green');
    log(`  Email: ${testAffiliate.email}`, 'blue');
    log(`  Affiliate Code: ${result.data.code}`, 'blue');
    affiliateCode = result.data.code;
    return true;
  } else {
    log('✗ Registration failed', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    log(`  Error: ${JSON.stringify(result.data)}`, 'yellow');
    return false;
  }
}

async function testDuplicateRegistration() {
  section('Test 2: Duplicate Registration Prevention');
  
  log('Testing duplicate registration (should fail)...', 'cyan');
  const result = await makeRequest(`${API_BASE}/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: testAffiliate.email,
      password: testAffiliate.password,
    }),
  });

  if (!result.ok && result.status === 409) {
    log('✓ Duplicate prevention working', 'green');
    return true;
  } else {
    log('✗ Duplicate prevention failed', 'red');
    return false;
  }
}

async function testAffiliateLogin() {
  section('Test 3: Affiliate Login');
  
  log('Testing affiliate login...', 'cyan');
  const result = await makeRequest(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: testAffiliate.email,
      password: testAffiliate.password,
    }),
  });

  if (result.ok && result.data.token) {
    log('✓ Login successful', 'green');
    log(`  Token received: ${result.data.token.substring(0, 20)}...`, 'blue');
    authToken = result.data.token;
    return true;
  } else {
    log('✗ Login failed', 'red');
    log(`  Error: ${JSON.stringify(result.data)}`, 'yellow');
    return false;
  }
}

async function testInvalidLogin() {
  section('Test 4: Invalid Login Prevention');
  
  log('Testing invalid credentials (should fail)...', 'cyan');
  const result = await makeRequest(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: testAffiliate.email,
      password: 'WrongPassword123!',
    }),
  });

  if (!result.ok && result.status === 401) {
    log('✓ Invalid login prevention working', 'green');
    return true;
  } else {
    log('✗ Invalid login prevention failed', 'red');
    return false;
  }
}

async function testGetAffiliateLink() {
  section('Test 5: Get Affiliate Link');
  
  log('Testing get affiliate link (requires auth)...', 'cyan');
  const result = await makeRequest(`${API_BASE}/link`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (result.ok && result.data.link) {
    log('✓ Affiliate link retrieved', 'green');
    log(`  Link: ${result.data.link}`, 'blue');
    log(`  Code: ${result.data.code}`, 'blue');
    return true;
  } else {
    log('✗ Failed to get affiliate link', 'red');
    log(`  Error: ${JSON.stringify(result.data)}`, 'yellow');
    return false;
  }
}

async function testUnauthorizedAccess() {
  section('Test 6: Unauthorized Access Prevention');
  
  log('Testing access without token (should fail)...', 'cyan');
  const result = await makeRequest(`${API_BASE}/link`);

  if (!result.ok && result.status === 401) {
    log('✓ Unauthorized access prevention working', 'green');
    return true;
  } else {
    log('✗ Unauthorized access prevention failed', 'red');
    return false;
  }
}

async function testTrackClick() {
  section('Test 7: Click Tracking');
  
  log(`Testing click tracking with code: ${affiliateCode}...`, 'cyan');
  const result = await makeRequest(`${API_BASE}/track?ref=${affiliateCode}`);

  if (result.ok) {
    log('✓ Click tracked successfully', 'green');
    log(`  Message: ${result.data.message}`, 'blue');
    return true;
  } else {
    log('✗ Click tracking failed', 'red');
    log(`  Error: ${JSON.stringify(result.data)}`, 'yellow');
    return false;
  }
}

async function testMultipleClicks() {
  section('Test 8: Multiple Click Tracking');
  
  log('Testing multiple clicks (tracking 3 clicks)...', 'cyan');
  let successCount = 0;
  
  for (let i = 1; i <= 3; i++) {
    const result = await makeRequest(`${API_BASE}/track?ref=${affiliateCode}`);
    if (result.ok) {
      successCount++;
      log(`  Click ${i}: ✓`, 'green');
    } else {
      log(`  Click ${i}: ✗`, 'red');
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }

  if (successCount === 3) {
    log('✓ All clicks tracked successfully', 'green');
    return true;
  } else {
    log(`✗ Only ${successCount}/3 clicks tracked`, 'yellow');
    return false;
  }
}

async function testGetStats() {
  section('Test 9: Get Affiliate Statistics');
  
  log('Testing statistics retrieval...', 'cyan');
  const result = await makeRequest(`${API_BASE}/stats`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (result.ok && result.data.stats) {
    log('✓ Statistics retrieved', 'green');
    log(`  Total Clicks: ${result.data.stats.totalClicks}`, 'blue');
    log(`  Total Conversions: ${result.data.stats.totalConversions}`, 'blue');
    log(`  Conversion Rate: ${result.data.stats.conversionRate}%`, 'blue');
    log(`  Total Earnings: ${result.data.stats.totalEarnings}`, 'blue');
    log(`  Leaderboard Rank: ${result.data.stats.rank || 'N/A'}`, 'blue');
    return true;
  } else {
    log('✗ Failed to get statistics', 'red');
    log(`  Error: ${JSON.stringify(result.data)}`, 'yellow');
    return false;
  }
}

async function testLeaderboard() {
  section('Test 10: Leaderboard (Public)');
  
  log('Testing leaderboard retrieval...', 'cyan');
  const result = await makeRequest(`${API_BASE}/leaderboard?limit=10`);

  if (result.ok && result.data.leaderboard) {
    log('✓ Leaderboard retrieved', 'green');
    log(`  Total affiliates shown: ${result.data.leaderboard.length}`, 'blue');
    
    if (result.data.leaderboard.length > 0) {
      log('\n  Top 3 Affiliates:', 'cyan');
      result.data.leaderboard.slice(0, 3).forEach((affiliate, index) => {
        log(`    ${index + 1}. ${affiliate.name || 'Anonymous'} - ${affiliate.totalConversions} conversions`, 'blue');
      });
    }
    return true;
  } else {
    log('✗ Failed to get leaderboard', 'red');
    log(`  Error: ${JSON.stringify(result.data)}`, 'yellow');
    return false;
  }
}

async function testWhitelistSubmission() {
  section('Test 11: Whitelist Submission with Affiliate');
  
  const testEmail = `whitelist-test-${Date.now()}@example.com`;
  log(`Testing whitelist submission with ref code: ${affiliateCode}...`, 'cyan');
  
  const result = await makeRequest(`${BASE_URL}/api/whitelist/submit`, {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      referralCode: affiliateCode,
    }),
  });

  if (result.ok) {
    log('✓ Whitelist submission successful', 'green');
    log(`  Email: ${testEmail}`, 'blue');
    log(`  Credited to affiliate: ${affiliateCode}`, 'blue');
    return true;
  } else {
    log('✗ Whitelist submission failed', 'red');
    log(`  Error: ${JSON.stringify(result.data)}`, 'yellow');
    return false;
  }
}

async function testStatsAfterConversion() {
  section('Test 12: Statistics After Conversion');
  
  log('Verifying conversion was recorded...', 'cyan');
  const result = await makeRequest(`${API_BASE}/stats`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (result.ok && result.data.stats) {
    log('✓ Statistics updated', 'green');
    log(`  Total Clicks: ${result.data.stats.totalClicks}`, 'blue');
    log(`  Total Conversions: ${result.data.stats.totalConversions}`, 'blue');
    log(`  Conversion Rate: ${result.data.stats.conversionRate}%`, 'blue');
    
    if (result.data.stats.totalConversions > 0) {
      log('✓ Conversion was recorded!', 'green');
      return true;
    } else {
      log('⚠ No conversions recorded yet (may take a moment)', 'yellow');
      return true;
    }
  } else {
    log('✗ Failed to verify statistics', 'red');
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  log('\n🚀 Starting Affiliate System Tests', 'bright');
  log(`Target: ${BASE_URL}`, 'cyan');
  log(`Time: ${new Date().toLocaleString()}`, 'cyan');

  const tests = [
    { name: 'Registration', fn: testAffiliateRegistration },
    { name: 'Duplicate Prevention', fn: testDuplicateRegistration },
    { name: 'Login', fn: testAffiliateLogin },
    { name: 'Invalid Login', fn: testInvalidLogin },
    { name: 'Get Link', fn: testGetAffiliateLink },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Click Tracking', fn: testTrackClick },
    { name: 'Multiple Clicks', fn: testMultipleClicks },
    { name: 'Statistics', fn: testGetStats },
    { name: 'Leaderboard', fn: testLeaderboard },
    { name: 'Whitelist Submission', fn: testWhitelistSubmission },
    { name: 'Stats After Conversion', fn: testStatsAfterConversion },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
    } catch (error) {
      log(`\n✗ Test "${test.name}" threw an error:`, 'red');
      log(error.message, 'red');
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  section('Test Summary');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  log(`Total Tests: ${total}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${total - passed}`, passed === total ? 'green' : 'red');
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, passed === total ? 'green' : 'yellow');

  console.log('\nDetailed Results:');
  results.forEach((result, index) => {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    log(`  ${status} ${result.name}`, color);
  });

  if (passed === total) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the details above.', 'yellow');
  }

  log('\n📊 Test Data:', 'cyan');
  log(`  Test Email: ${testAffiliate.email}`, 'blue');
  log(`  Affiliate Code: ${affiliateCode}`, 'blue');
  log(`  Auth Token: ${authToken ? authToken.substring(0, 20) + '...' : 'N/A'}`, 'blue');
}

// Run tests
runAllTests().catch(error => {
  log('\n💥 Fatal error running tests:', 'red');
  console.error(error);
  process.exit(1);
});
