#!/usr/bin/env node

/**
 * Wallet Fraud Detection System - Test Script
 * 
 * This script verifies that the fraud detection system is properly configured and operational.
 * Run this after starting the backend server to ensure all components are working.
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint() {
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      log.success('Health endpoint is responding');
      log.info(`  Uptime: ${Math.floor(response.data.uptime)}s`);
      log.info(`  Environment: ${response.data.environment}`);
      return true;
    } else {
      log.error('Health endpoint returned unhealthy status');
      return false;
    }
  } catch (error) {
    log.error(`Health endpoint failed: ${error.message}`);
    return false;
  }
}

/**
 * Test fraud alert API (without auth - should fail)
 */
async function testFraudAlertAPINoAuth() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/fraud-alerts`);
    
    if (response.status === 401) {
      log.success('Fraud alert API is protected (401 without auth)');
      return true;
    } else {
      log.warning(`Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Fraud alert API test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test fraud alert API (with auth token)
 */
async function testFraudAlertAPIWithAuth() {
  if (ADMIN_TOKEN === 'your-admin-token-here') {
    log.warning('Skipping authenticated test (no admin token provided)');
    log.info('  Set ADMIN_TOKEN environment variable to test with auth');
    return null;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/fraud-alerts`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });
    
    if (response.status === 200) {
      log.success('Fraud alert API is accessible with admin token');
      log.info(`  Found ${response.data.alerts?.length || 0} alerts`);
      return true;
    } else if (response.status === 403) {
      log.error('Admin token is not authorized (403)');
      return false;
    } else {
      log.warning(`Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Authenticated API test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test fraud alert statistics endpoint
 */
async function testFraudStatsEndpoint() {
  if (ADMIN_TOKEN === 'your-admin-token-here') {
    log.warning('Skipping stats test (no admin token provided)');
    return null;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/fraud-alerts/stats`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });
    
    if (response.status === 200) {
      log.success('Fraud statistics endpoint is working');
      log.info(`  Total Alerts: ${response.data.totalAlerts || 0}`);
      log.info(`  Critical Alerts: ${response.data.criticalAlerts || 0}`);
      log.info(`  Auto-Frozen Wallets: ${response.data.walletsAutoFrozen || 0}`);
      return true;
    } else {
      log.warning(`Stats endpoint returned ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Stats endpoint test failed: ${error.message}`);
    return false;
  }
}

/**
 * Check if Prisma schema has fraud detection models
 */
async function checkDatabaseSchema() {
  log.info('Checking database schema (run this manually):');
  console.log('    cd backend && npx prisma db pull --preview-feature');
  console.log('    Look for: FraudAlert, WithdrawalRequest, WhitelistChange models');
  return null;
}

/**
 * Check if worker is running
 */
async function checkWorkerStatus() {
  log.info('To verify worker is running, check server logs for:');
  console.log('    "Wallet Fraud Detection Worker initialized"');
  console.log('    "Starting wallet fraud monitoring cycle"');
  return null;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('='.repeat(70));
  console.log('  Wallet Fraud Detection System - Test Suite');
  console.log('='.repeat(70));

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 1: Health endpoint
  log.section('Test 1: Server Health Check');
  const healthResult = await testHealthEndpoint();
  if (healthResult === true) results.passed++;
  else if (healthResult === false) results.failed++;
  else results.skipped++;

  // Test 2: API protection
  log.section('Test 2: API Authentication Check');
  const noAuthResult = await testFraudAlertAPINoAuth();
  if (noAuthResult === true) results.passed++;
  else if (noAuthResult === false) results.failed++;
  else results.skipped++;

  // Test 3: Authenticated API access
  log.section('Test 3: Authenticated API Access');
  const authResult = await testFraudAlertAPIWithAuth();
  if (authResult === true) results.passed++;
  else if (authResult === false) results.failed++;
  else results.skipped++;

  // Test 4: Statistics endpoint
  log.section('Test 4: Fraud Statistics Endpoint');
  const statsResult = await testFraudStatsEndpoint();
  if (statsResult === true) results.passed++;
  else if (statsResult === false) results.failed++;
  else results.skipped++;

  // Test 5: Database schema
  log.section('Test 5: Database Schema Verification');
  const schemaResult = await checkDatabaseSchema();
  if (schemaResult === true) results.passed++;
  else if (schemaResult === false) results.failed++;
  else results.skipped++;

  // Test 6: Worker status
  log.section('Test 6: Worker Status Check');
  const workerResult = await checkWorkerStatus();
  if (workerResult === true) results.passed++;
  else if (workerResult === false) results.failed++;
  else results.skipped++;

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  Test Summary');
  console.log('='.repeat(70));
  console.log(`${colors.green}Passed:${colors.reset}  ${results.passed}`);
  console.log(`${colors.red}Failed:${colors.reset}  ${results.failed}`);
  console.log(`${colors.yellow}Skipped:${colors.reset} ${results.skipped}`);
  console.log('='.repeat(70));

  if (results.failed === 0) {
    log.success('\nAll automated tests passed! ✨');
  } else {
    log.error(`\n${results.failed} test(s) failed. Please review the output above.`);
  }

  // Additional instructions
  console.log('\n' + colors.cyan + 'Next Steps:' + colors.reset);
  console.log('1. Set ADMIN_TOKEN env var to run authenticated tests');
  console.log('2. Check server logs for worker initialization');
  console.log('3. Verify database has fraud detection tables');
  console.log('4. Access admin dashboard: http://localhost:3000/admin/fraud-alerts');
  console.log('5. Trigger test fraud pattern to verify detection\n');
}

// Run tests
runAllTests().catch((error) => {
  log.error(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
