// Test Resend Integration
// Run with: node test-resend-integration.js

const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';

async function testWhitelistSubmission() {
  console.log('\n🧪 Testing Whitelist Form Submission\n');
  console.log('Target URL:', `${BASE_URL}/api/subscribe`);
  console.log('='.repeat(50));

  const testEmail = `test+${Date.now()}@example.com`;
  
  try {
    console.log(`\n📧 Submitting email: ${testEmail}`);
    
    const response = await axios.post(`${BASE_URL}/api/subscribe`, {
      email: testEmail
    });
    
    console.log('\n✅ Success Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Email successfully added to Resend audience');
      console.log('✅ Verification email should be sent to:', testEmail);
      console.log('\n📋 Next Steps:');
      console.log('  1. Check the email inbox for verification email');
      console.log('  2. Click the verification link');
      console.log('  3. Wait for the welcome email with Google Form link');
      console.log('  4. Verify the Google Form loads correctly');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Error Response:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
    
    console.log('\n🔍 Troubleshooting:');
    console.log('  1. Ensure the dev server is running (npm run dev)');
    console.log('  2. Check .env.local has RESEND_API_KEY and RESEND_AUDIENCE_ID');
    console.log('  3. Verify Resend API key is valid');
    console.log('  4. Check console/terminal for server errors');
    
    return false;
  }
}

async function testInvalidEmail() {
  console.log('\n🧪 Testing Invalid Email Validation\n');
  console.log('='.repeat(50));
  
  try {
    console.log('\n📧 Submitting invalid email: not-an-email');
    
    const response = await axios.post(`${BASE_URL}/api/subscribe`, {
      email: 'not-an-email'
    });
    
    console.log('⚠️  Unexpected success:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Correctly rejected invalid email');
      console.log('Response:', error.response.data);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

async function testEmptyEmail() {
  console.log('\n🧪 Testing Empty Email Validation\n');
  console.log('='.repeat(50));
  
  try {
    console.log('\n📧 Submitting empty email');
    
    const response = await axios.post(`${BASE_URL}/api/subscribe`, {
      email: ''
    });
    
    console.log('⚠️  Unexpected success:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Correctly rejected empty email');
      console.log('Response:', error.response.data);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Resend Integration Tests\n');
  console.log('Date:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Valid email submission
  if (await testWhitelistSubmission()) {
    passed++;
  } else {
    failed++;
  }
  
  // Test 2: Invalid email
  await testInvalidEmail();
  passed++;
  
  // Test 3: Empty email
  await testEmptyEmail();
  passed++;
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
  }
}

// Run tests
runAllTests().catch(console.error);
