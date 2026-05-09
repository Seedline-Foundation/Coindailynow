/**
 * LM Studio Integration Test
 * Tests lmStudioClient.ts against local or server LM Studio instance
 */

declare const process: {
  exit(code?: number): never;
  env: Record<string, string | undefined>;
};

import lmStudioClient from './backend/src/services/lmStudioClient';

async function testLMStudio() {
  console.log('=================================================');
  console.log('LM Studio Backend Integration Test');
  console.log('=================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Health Check
  console.log('Test 1: Health Check');
  console.log('-------------------');
  try {
    const healthy = await lmStudioClient.healthCheck();
    
    if (healthy) {
      console.log('✓ PASSED - LM Studio is running and healthy\n');
      passedTests++;
    } else {
      console.log('✗ FAILED - LM Studio not responding\n');
      failedTests++;
      console.log('Make sure LM Studio is running:');
      console.log('1. Open LM Studio');
      console.log('2. Load a model (Llama 3.1 8B recommended)');
      console.log('3. Click "Start Server"\n');
      return;
    }
  } catch (error: any) {
    console.log(`✗ FAILED - ${error.message}\n`);
    failedTests++;
    return;
  }

  // Test 2: Get Available Models
  console.log('Test 2: Get Available Models');
  console.log('----------------------------');
  try {
    const models = await lmStudioClient.getModels();
    console.log(`✓ PASSED - Found ${models.length} model(s):`);
    models.forEach(model => console.log(`  - ${model}`));
    console.log('');
    passedTests++;
  } catch (error: any) {
    console.log(`✗ FAILED - ${error.message}\n`);
    failedTests++;
  }

  // Test 3: Article Rewrite
  console.log('Test 3: Article Rewrite');
  console.log('----------------------');
  console.log('Generating (may take 30-60 seconds)...');
  
  try {
    const startTime = Date.now();
    const result = await lmStudioClient.rewriteArticle(
      'Bitcoin Price Surges to $52,000',
      `Bitcoin's price has surged to $52,000 amid growing institutional adoption. 
      Major companies are now adding Bitcoin to their balance sheets, signaling increased 
      confidence in the cryptocurrency. Analysts predict further growth as the market 
      matures and regulatory clarity improves.`,
      'Bitcoin'
    );
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✓ PASSED - Article rewritten successfully');
    console.log(`  Title: ${result.title}`);
    console.log(`  Excerpt: ${result.excerpt.substring(0, 80)}...`);
    console.log(`  Keywords: ${result.keywords.join(', ')}`);
    console.log(`  Content length: ${result.content.length} characters`);
    console.log(`  Time taken: ${duration} seconds\n`);
    passedTests++;
  } catch (error: any) {
    console.log(`✗ FAILED - ${error.message}\n`);
    failedTests++;
  }

  // Test 4: Headline Optimization
  console.log('Test 4: Headline Optimization');
  console.log('-----------------------------');
  
  try {
    const result = await lmStudioClient.optimizeHeadline(
      'Crypto Market Goes Up Today',
      'Market Analysis'
    );

    console.log('✓ PASSED - Headline optimized');
    console.log(`  Original: "Crypto Market Goes Up Today"`);
    console.log(`  Optimized: "${result.headline}"`);
    console.log(`  Score: ${result.score}/100`);
    console.log(`  Alternatives:`);
    result.suggestions.forEach(s => console.log(`    - "${s}"`));
    console.log('');
    passedTests++;
  } catch (error: any) {
    console.log(`✗ FAILED - ${error.message}\n`);
    failedTests++;
  }

  // Test 5: Categorization
  console.log('Test 5: Content Categorization');
  console.log('------------------------------');
  
  try {
    const categories = ['Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Africa', 'Regulation'];
    const result = await lmStudioClient.categorize(
      'Kenya Launches Digital Shilling on Blockchain',
      'Kenya has announced plans to launch a central bank digital currency (CBDC) called the digital shilling...',
      categories
    );

    console.log('✓ PASSED - Content categorized');
    console.log(`  Category: ${result.category}`);
    console.log(`  Tags: ${result.tags.join(', ')}`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
    passedTests++;
  } catch (error: any) {
    console.log(`✗ FAILED - ${error.message}\n`);
    failedTests++;
  }

  // Test 6: Quality Review
  console.log('Test 6: Quality Review');
  console.log('---------------------');
  
  try {
    const result = await lmStudioClient.reviewQuality(
      `<h1>Bitcoin Adoption Grows in Africa</h1>
      <p>Bitcoin adoption is increasing rapidly across African nations, particularly in Nigeria, 
      Kenya, and South Africa. The rise of mobile money platforms like M-Pesa has created a 
      strong foundation for cryptocurrency adoption.</p>
      <p>Experts predict that Africa will become a major hub for crypto innovation in the coming years.</p>`,
      {
        title: 'Bitcoin Adoption Grows in Africa',
        category: 'Africa',
        source: 'CoinDaily Research'
      }
    );

    console.log('✓ PASSED - Quality review completed');
    console.log(`  Score: ${result.score}/100`);
    console.log(`  Approved: ${result.approved ? 'YES ✓' : 'NO ✗'}`);
    
    if (result.issues.length > 0) {
      console.log(`  Issues:`);
      result.issues.forEach(i => console.log(`    - ${i}`));
    }
    
    if (result.suggestions.length > 0) {
      console.log(`  Suggestions:`);
      result.suggestions.forEach(s => console.log(`    - ${s}`));
    }
    console.log('');
    passedTests++;
  } catch (error: any) {
    console.log(`✗ FAILED - ${error.message}\n`);
    failedTests++;
  }

  // Test 7: SEO Metadata Generation
  console.log('Test 7: SEO Metadata Generation');
  console.log('-------------------------------');
  
  try {
    const result = await lmStudioClient.generateSEOMetadata(
      'Bitcoin Hits All-Time High of $65,000',
      'Bitcoin has reached a new all-time high of $65,000, driven by institutional demand...'
    );

    console.log('✓ PASSED - SEO metadata generated');
    console.log(`  Meta Title: ${result.metaTitle}`);
    console.log(`  Meta Description: ${result.metaDescription}`);
    console.log(`  Keywords: ${result.keywords.join(', ')}\n`);
    passedTests++;
  } catch (error: any) {
    console.log(`✗ FAILED - ${error.message}\n`);
    failedTests++;
  }

  // Summary
  console.log('=================================================');
  console.log('Test Summary');
  console.log('=================================================');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests} ✓`);
  console.log(`Failed: ${failedTests} ✗`);
  console.log('');

  if (failedTests === 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Update contentAutomationService.ts to use lmStudioClient');
    console.log('2. Test with real feed sources');
    console.log('3. Monitor performance for 48 hours');
    console.log('4. Deploy to production');
    console.log('');
    console.log('Monthly Savings: ~€300 (replacing GPT-4 for content)');
  } else {
    console.log(`⚠ ${failedTests} test(s) failed. Please fix issues before deploying.`);
  }
  
  console.log('=================================================');
}

// Run tests
testLMStudio().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
