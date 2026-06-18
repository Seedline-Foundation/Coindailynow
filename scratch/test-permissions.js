const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/super-admin/permissions', {
      headers: {
        'Authorization': 'Bearer mock_super_admin_token_test_123',
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    console.log('SUCCESS:', data.success);
    console.log('CATEGORIES TYPE:', typeof data.categories, Array.isArray(data.categories) ? 'ARRAY' : 'NOT ARRAY');
    console.log('FIRST CATEGORY:', JSON.stringify(data.categories[0] || data.categories, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
