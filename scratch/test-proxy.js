const http = require('http');

const payload = JSON.stringify({
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

console.log('Sending proxy login request to http://localhost:3002/graphql...');

const req = http.request({
  hostname: '127.0.0.1',
  port: 3002,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  },
  timeout: 5000
}, (res) => {
  let body = '';
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
  res.setEncoding('utf8');
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Request timed out after 5s');
  req.destroy();
  process.exit(1);
});

req.write(payload);
req.end();
