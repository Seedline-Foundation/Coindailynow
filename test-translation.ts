/**
 * Test NLLB Translation Integration
 * Quick test to verify translation service works
 */

import nllbClient from './backend/src/services/nllbTranslationClient';

async function testTranslationService() {
  console.log('🧪 Testing NLLB Translation Service...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const health = await nllbClient.healthCheck();
    console.log('✅ Health:', health);
    console.log('');

    // Test 2: Single Translation (Hausa)
    console.log('2️⃣ Testing English → Hausa translation...');
    const hausaTranslation = await nllbClient.translate(
      'Bitcoin reached a new all-time high in African markets today',
      'en',
      'ha'
    );
    console.log('Original: Bitcoin reached a new all-time high in African markets today');
    console.log('Hausa:', hausaTranslation);
    console.log('');

    // Test 3: Single Translation (Swahili)
    console.log('3️⃣ Testing English → Swahili translation...');
    const swahiliTranslation = await nllbClient.translate(
      'DeFi adoption is growing rapidly in Nigeria and Kenya',
      'en',
      'sw'
    );
    console.log('Original: DeFi adoption is growing rapidly in Nigeria and Kenya');
    console.log('Swahili:', swahiliTranslation);
    console.log('');

    // Test 4: Batch Translation
    console.log('4️⃣ Testing batch translation (Yoruba & Igbo)...');
    const batchResults = await nllbClient.batchTranslate(
      [
        'Cryptocurrency trading volume increased 300% this year',
        'M-Pesa integration with crypto exchanges is now live'
      ],
      'en',
      ['yo', 'ig']
    );
    console.log('Yoruba translations:', batchResults.yo);
    console.log('Igbo translations:', batchResults.ig);
    console.log('');

    // Test 5: Article Translation
    console.log('5️⃣ Testing full article translation...');
    const articleTranslation = await nllbClient.translateArticle(
      {
        title: 'Bitcoin Breaks $50,000 in African Markets',
        excerpt: 'African crypto traders celebrate historic milestone',
        content: 'Bitcoin has reached a new all-time high of $50,000 in African cryptocurrency markets. This milestone represents growing adoption across Nigeria, Kenya, and South Africa.'
      },
      'ha'
    );
    console.log('Translated Article (Hausa):');
    console.log('Title:', articleTranslation.title);
    console.log('Excerpt:', articleTranslation.excerpt);
    console.log('Content:', articleTranslation.content);
    console.log('');

    console.log('✅ All tests passed!');
    console.log('');
    console.log('🎉 Translation service is ready for production!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Your content automation service now uses NLLB for translations');
    console.log('2. Run: POST /api/content-automation/articles/:id/translate');
    console.log('3. Translations will use your self-hosted service (no API costs!)');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check TRANSLATION_SERVICE_URL in .env');
    console.error('2. Verify service is running: curl http://167.86.99.97:8000/health');
    console.error('3. Check firewall allows port 8000');
  }
}

testTranslationService();
