const http = require('http');

function post(path, payload, token) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'POST',
      headers,
      timeout: 5000
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
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

async function run() {
  try {
    const loginPayload = JSON.stringify({
      query: `
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
      `,
      variables: {
        input: {
          email: 'admin@sygn.live',
          password: 'adminpassword'
        }
      }
    });

    console.log('Sending login request...');
    const loginRes = await post('/graphql', loginPayload);
    console.log('Login response:', JSON.stringify(loginRes, null, 2));

    const loginData = loginRes.body.data?.login;
    if (!loginData?.success) {
      console.error('Login failed in response!');
      return;
    }

    const token = loginData.tokens.accessToken;
    console.log('Obtained token. Verifying token via "me" query...');

    const mePayload = JSON.stringify({
      query: '{ me { success user { id email role } error { code message } } }'
    });

    const meRes = await post('/graphql', mePayload, token);
    console.log('Me query response:', JSON.stringify(meRes, null, 2));

  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

run();
