// Test script to add sample subscribers to the waitlist
// Run with: node test-waitlist.js

const API_URL = 'http://localhost:3001/api/waitlist/subscribe';

const sampleEmails = [
  'john.doe@example.com',
  'jane.smith@example.com',
  'crypto.trader@example.com',
  'african.investor@example.com',
  'memecoin.enthusiast@example.com'
];

async function testWaitlist() {
  console.log('🧪 Testing Waitlist Subscription API\n');
  
  for (const email of sampleEmails) {
    try {
      console.log(`Testing: ${email}...`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: ${data.message}\n`);
      } else {
        console.log(`⚠️  ${response.status}: ${data.error}\n`);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
  
  // Get stats
  try {
    console.log('📊 Fetching waitlist statistics...\n');
    const statsResponse = await fetch('http://localhost:3001/api/waitlist/stats');
    const stats = await statsResponse.json();
    console.log(`Total subscribers: ${stats.count} 🎉\n`);
  } catch (error) {
    console.log(`❌ Error fetching stats: ${error.message}\n`);
  }
}

testWaitlist().catch(console.error);
