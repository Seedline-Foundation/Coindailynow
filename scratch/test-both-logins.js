const http = require('http');

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3002,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 5000
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    req.write(payload);
    req.end();
  });
}

const loginMutation = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      user {
        id
        email
        role
      }
      tokens {
        accessToken
        refreshToken
      }
      error {
        code
        message
      }
    }
  }
`;

async function runTests() {
  console.log('--- TESTING SUPER ADMIN LOGIN ---');
  const saPayload = JSON.stringify({
    query: loginMutation,
    variables: {
      input: {
        email: 'admin@sygn.live',
        password: 'adminpassword'
      }
    }
  });

  try {
    const res = await post('/graphql', saPayload);
    console.log('Super Admin Proxy Login Response:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Super Admin test failed:', err.message);
  }

  console.log('\n--- TESTING EDITOR LOGIN ---');
  const edPayload = JSON.stringify({
    query: loginMutation,
    variables: {
      input: {
        email: 'editor@sygn.live',
        password: 'Editor@2024'
      }
    }
  });

  try {
    const res = await post('/graphql', edPayload);
    console.log('Editor Proxy Login Response:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Editor test failed:', err.message);
  }
}

runTests();
