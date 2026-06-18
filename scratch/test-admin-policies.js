const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:3010/api/super-admin/crypto-policies', {
      headers: {
        'Authorization': 'Bearer mock_super_admin_token_test_123',
        'Content-Type': 'application/json'
      }
    });
    console.log('STATUS CODE:', res.status);
    const data = await res.json();
    console.log('DATA KEYS:', Object.keys(data));
    console.log('COUNTRIES COUNT:', data.countries?.length);
    console.log('SOURCE:', data.source);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
