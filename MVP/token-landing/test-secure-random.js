/**
 * Secure Random Affiliate Code Generator Test
 * Verifies that the crypto-based affiliate code generator works correctly,
 * produces 8-character strings, contains only specified characters, and has high entropy.
 */

const crypto = require('crypto');

function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
}

function runTests() {
  console.log('Running secure random affiliate code generator tests...');
  const sampleSize = 1000;
  const codes = new Set();
  const allowedChars = /^[A-Z0-9]{8}$/;

  for (let i = 0; i < sampleSize; i++) {
    const code = generateAffiliateCode();

    // Verify length and allowed characters
    if (!allowedChars.test(code)) {
      console.error(`FAIL: Generated invalid code: "${code}"`);
      process.exit(1);
    }

    codes.add(code);
  }

  // Verify entropy / uniqueness
  if (codes.size !== sampleSize) {
    console.error(`FAIL: High collision rate! Only ${codes.size}/${sampleSize} unique codes generated.`);
    process.exit(1);
  }

  console.log(`SUCCESS: Successfully generated ${sampleSize} secure random affiliate codes.`);
  console.log('Sample codes:');
  const sampleCodes = Array.from(codes).slice(0, 5);
  sampleCodes.forEach(code => console.log(`  - ${code}`));
}

runTests();
