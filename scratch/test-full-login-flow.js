const http = require('http');

function post(hostname, port, path, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    const req = http.request({
      hostname,
      port,
      path,
      method: 'POST',
      headers: { ...defaultHeaders, ...headers },
      timeout: 5000
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(hostname, port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname,
      port,
      path,
      method: 'GET',
      headers,
      timeout: 5000
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    console.log('--- TEST 1: Logging in as TECH_ADMIN via proxy ---');
    const loginPayload = JSON.stringify({
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            success
            user { id email role }
            tokens { accessToken }
          }
        }
      `,
      variables: {
        input: {
          email: 'tech@sygn.live',
          password: 'Tech@2024!'
        }
      }
    });

    const loginRes = await post('localhost', 3002, '/graphql', loginPayload);
    console.log('Login Status:', loginRes.statusCode);
    const data = JSON.parse(loginRes.body);
    const token = data.data?.login?.tokens?.accessToken;
    if (!token) {
      console.error('Failed to get login token!');
      return;
    }
    console.log('Successfully logged in. Token length:', token.length);

    console.log('\n--- TEST 2: Requesting /admin with valid token ---');
    const adminRes = await get('localhost', 3002, '/admin', {
      'Cookie': `admin_access_token=${token}`
    });
    console.log('Admin Page Response Status:', adminRes.statusCode);
    console.log('Admin Page Redirect Header:', adminRes.headers.location || 'none');
    if (adminRes.statusCode === 200) {
      console.log('✅ Access to /admin GRANTED successfully!');
    } else {
      console.error('❌ Access to /admin DENIED or REDIRECTED!');
    }

    console.log('\n--- TEST 3: Logging in as SUPER_ADMIN via proxy ---');
    const saLoginPayload = JSON.stringify({
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            success
            user { id email role }
            tokens { accessToken }
          }
        }
      `,
      variables: {
        input: {
          email: 'admin@sygn.live',
          password: 'Admin@2024!'
        }
      }
    });

    const saLoginRes = await post('localhost', 3002, '/graphql', saLoginPayload);
    console.log('SA Login Status:', saLoginRes.statusCode);
    const saData = JSON.parse(saLoginRes.body);
    const saToken = saData.data?.login?.tokens?.accessToken;
    if (!saToken) {
      console.error('Failed to get SA login token!');
      return;
    }
    console.log('Successfully logged in as SA. Token length:', saToken.length);

    console.log('\n--- TEST 4: Requesting /super-admin/dashboard with SA token ---');
    const saRes = await get('localhost', 3002, '/super-admin/dashboard', {
      'Cookie': `admin_access_token=${saToken}`
    });
    console.log('Super Admin Page Response Status:', saRes.statusCode);
    console.log('Super Admin Page Redirect Header:', saRes.headers.location || 'none');
    if (saRes.statusCode === 200) {
      console.log('✅ Access to /super-admin/dashboard GRANTED successfully!');
    } else {
      console.error('❌ Access to /super-admin/dashboard DENIED or REDIRECTED!');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

test();
