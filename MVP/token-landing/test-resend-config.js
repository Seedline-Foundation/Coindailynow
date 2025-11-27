/**
 * Test Resend API Configuration
 * This script verifies your Resend setup and checks if emails are being sent
 */

const { Resend } = require('resend');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

async function testResendConfig() {
  console.log('\n=== Testing Resend Configuration ===\n');
  
  // Test 1: Check API Key
  console.log('1. Checking API Key...');
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    return;
  }
  console.log('✅ API Key found:', process.env.RESEND_API_KEY.substring(0, 15) + '...');
  
  // Test 2: Check Audience ID
  console.log('\n2. Checking Audience ID...');
  if (!AUDIENCE_ID) {
    console.error('❌ RESEND_AUDIENCE_ID not found in .env.local');
    return;
  }
  console.log('✅ Audience ID found:', AUDIENCE_ID);
  
  // Test 3: Get Audience Details
  console.log('\n3. Fetching Audience Details...');
  try {
    const audience = await resend.audiences.get(AUDIENCE_ID);
    console.log('✅ Audience Details:');
    console.log('   Name:', audience.data?.name);
    console.log('   Created:', audience.data?.created_at);
    console.log('\n⚠️  IMPORTANT: Check if Double Opt-In is enabled in Resend Dashboard');
    console.log('   Go to: https://resend.com/audiences/' + AUDIENCE_ID);
    console.log('   Settings → Double Opt-In → Must be ENABLED for verification emails');
  } catch (error) {
    console.error('❌ Failed to fetch audience:', error.message);
    return;
  }
  
  // Test 4: Add Test Contact
  console.log('\n4. Testing Contact Creation...');
  const testEmail = `test-${Date.now()}@example.com`;
  try {
    const contact = await resend.contacts.create({
      email: testEmail,
      unsubscribed: false,
      audienceId: AUDIENCE_ID,
    });
    
    if (contact.data?.id) {
      console.log('✅ Test contact created successfully!');
      console.log('   Contact ID:', contact.data.id);
      console.log('\n📧 If Double Opt-In is enabled, a verification email should be sent to:', testEmail);
    } else if (contact.error) {
      console.error('❌ Error creating contact:', contact.error.message);
    }
  } catch (error) {
    console.error('❌ Failed to create contact:', error.message);
  }
  
  // Test 5: Check for existing automations
  console.log('\n5. Checking Email Automations...');
  console.log('⚠️  Manual Check Required:');
  console.log('   Go to: https://resend.com/automations');
  console.log('   You need TWO automations:');
  console.log('   1. Verification Email (automatic via Double Opt-In)');
  console.log('   2. Welcome Email (triggered by "Contact Verified Email" event)');
  
  console.log('\n=== Test Complete ===\n');
  console.log('Next Steps:');
  console.log('1. Enable Double Opt-In in Resend Dashboard → Audiences → Settings');
  console.log('2. Create Welcome Email automation (see RESEND_AUTOMATION_CONFIRMATION.md)');
  console.log('3. Test with a real email address\n');
}

testResendConfig().catch(console.error);
