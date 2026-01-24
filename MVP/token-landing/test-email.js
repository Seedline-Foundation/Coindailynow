/**
 * Test script for Resend email functionality
 * Tests the new email sending implementation
 */

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🧪 Testing Resend Email Functionality\n');
  console.log('Configuration:');
  console.log('- API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  console.log('- Audience ID:', process.env.RESEND_AUDIENCE_ID);
  console.log('- Whitelist Form:', process.env.NEXT_PUBLIC_WHITELIST_FORM_URL);
  console.log('- Site URL:', process.env.NEXT_PUBLIC_SITE_URL || 'https://token.coindaily.online');
  console.log('\n---\n');

  const testEmail = 'test@example.com'; // Replace with your actual email for testing

  try {
    // Step 1: Add contact to audience
    console.log('Step 1: Adding contact to Resend audience...');
    const contactResponse = await resend.contacts.create({
      email: testEmail,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });

    if (contactResponse.error) {
      if (contactResponse.error.message?.toLowerCase().includes('already')) {
        console.log('✅ Contact already exists (expected for testing)');
      } else {
        console.error('❌ Contact creation failed:', contactResponse.error);
        return;
      }
    } else {
      console.log('✅ Contact added successfully:', contactResponse.data?.id);
    }

    // Step 2: Send welcome email
    console.log('\nStep 2: Sending welcome email...');
    const emailResponse = await resend.emails.send({
      from: 'Joy Token Team <noreply@coindaily.online>',
      to: testEmail,
      subject: '🎉 Welcome to Joy Token - Complete Your Whitelist Application',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #6366f1;">
            <h1 style="color: #6366f1;">🎉 Welcome to Joy Token!</h1>
            <p>Thank you for your interest in the Joy Token presale.</p>
            <p><strong>Next Step:</strong> Complete your whitelist application:</p>
            <a href="${process.env.NEXT_PUBLIC_WHITELIST_FORM_URL}" 
               style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0;">
              Complete Whitelist Application
            </a>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
              This is a test email from the Joy Token system.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error('❌ Email sending failed:', emailResponse.error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('   Email ID:', emailResponse.data?.id);
    console.log('\n---\n');
    console.log('✨ TEST COMPLETE - Check the inbox for:', testEmail);
    console.log('📧 You should receive a welcome email with the whitelist form link');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmail();
