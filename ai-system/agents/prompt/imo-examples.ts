/// <reference types="node" />
// Imo Prompt Agent - Usage Examples
// Demonstrates all capabilities of the Imo prompt engineering system

import { imoService } from './imo-service';
import { imoImageAgent } from './imo-image-agent';
import { imoContentAgent } from './imo-content-agent';
import { imoTranslationAgent } from './imo-translation-agent';
import { ragService } from './rag-service';

/**
 * Example 1: Generate Hero Image for Article
 * Uses negative prompting to ensure high-quality output
 */
async function exampleHeroImage() {
  console.log('📸 Example 1: Hero Image Generation\n');

  const result = await imoImageAgent.generateArticleHeroImage(
    'Bitcoin Adoption Surges in Nigeria as Naira Weakens',
    'Nigerian crypto adoption reaches all-time high as local currency faces pressure. P2P trading volumes on Binance and Paxful hit record levels.',
    'market-analysis',
    ['Bitcoin', 'Nigeria', 'adoption', 'Naira']
  );

  console.log('Generated Image URL:', result.imageUrl);
  console.log('Optimized Prompt:', result.prompt);
  console.log('Negative Prompt:', result.negativePrompt);
  console.log('Quality Score:', result.metadata.promptQuality);
  console.log('Processing Time:', result.metadata.processingTime, 'ms\n');
}

/**
 * Example 2: SEO Article Generation (Writer-Editor Pattern)
 * Two-step process: Research/Outline → Write
 */
async function exampleSEOArticle() {
  console.log('📝 Example 2: SEO Article Generation (Writer-Editor Pattern)\n');

  const result = await imoContentAgent.generateArticle({
    type: 'seo',
    topic: 'Bitcoin Staking: A Complete Guide for African Investors',
    keywords: ['Bitcoin staking', 'crypto staking Africa', 'passive income crypto', 'BTC yield'],
    targetAudience: 'beginner',
    wordCount: 1500,
    africanFocus: true,
    useRAG: true  // Enable real-time web research
  });

  console.log('Article Preview (first 500 chars):', result.content.substring(0, 500));
  console.log('\nOutline:', result.outline);
  console.log('\nMetadata:');
  console.log('  - Word Count:', result.metadata.wordCount);
  console.log('  - SEO Score:', result.metadata.seoScore);
  console.log('  - Readability:', result.metadata.readabilityScore);
  console.log('  - Keywords Used:', result.metadata.keywordsUsed);
  console.log('  - RAG Sources:', result.ragSources?.length || 0);
  console.log('  - Strategy:', result.metadata.promptStrategy);
  console.log('Processing Time:', result.metadata.processingTime, 'ms\n');
}

/**
 * Example 3: Translation with 2-Step Chaining
 * Step 1: Extract terminology and tone
 * Step 2: Translate with preserved context
 */
async function exampleTranslation() {
  console.log('🌍 Example 3: Translation with 2-Step Chaining\n');

  const article = `
    Bitcoin has seen a remarkable surge in adoption across Nigeria, 
    with DeFi protocols and P2P exchanges reporting record volumes. 
    The weakening Naira has pushed many citizens towards cryptocurrency 
    as a store of value. Binance Africa and local exchanges like Quidax 
    are witnessing unprecedented growth in new user registrations.
  `;

  const result = await imoTranslationAgent.translate({
    text: article,
    sourceLanguage: 'en',
    targetLanguage: 'ha', // Hausa
    contentType: 'article',
    useLLM: true
  });

  console.log('Original (English):', article.trim());
  console.log('\nTranslated (Hausa):', result.translatedText);
  console.log('\nChain Steps:');
  console.log('  - Preserved Terms:', result.chainSteps?.terminology);
  console.log('  - Detected Tone:', result.chainSteps?.tone);
  console.log('  - Cultural Context:', result.chainSteps?.culturalContext);
  console.log('\nQuality Score:', result.metadata.qualityScore);
  console.log('Method:', result.metadata.method);
  console.log('Processing Time:', result.metadata.processingTime, 'ms\n');
}

/**
 * Example 4: Batch Translation to Multiple African Languages
 */
async function exampleBatchTranslation() {
  console.log('🌐 Example 4: Batch Translation\n');

  const headline = 'Ethereum ETF Approval Could Trigger African Crypto Boom';
  
  const results = await imoTranslationAgent.batchTranslate(
    headline,
    'en',
    ['sw', 'ha', 'yo', 'zu', 'fr'], // Swahili, Hausa, Yoruba, Zulu, French
    true
  );

  console.log('Original:', headline);
  console.log('\nTranslations:');
  results.forEach((result, lang) => {
    console.log(`  ${lang}: ${result.translatedText}`);
  });
  console.log('');
}

/**
 * Example 5: RAG-Enhanced Search Response
 * Fetches real-time context from web before generating response
 */
async function exampleRAGSearch() {
  console.log('🔍 Example 5: RAG-Enhanced Search\n');

  const result = await imoService.generateSearchResponsePrompt({
    userQuery: 'What is the current state of crypto regulation in Kenya?',
    maxSources: 5
  });

  console.log('Generated Prompt for LLM:');
  console.log(Array.isArray(result.prompt) ? result.prompt[0] : result.prompt);
  console.log('\nRAG Context:');
  console.log('  - Sources Used:', result.ragContext?.sourcesUsed);
  console.log('  - Confidence:', result.ragContext?.confidenceScore);
  console.log('Processing Time:', result.processingTime, 'ms\n');
}

/**
 * Example 6: Video Prompt with Negative Prompting
 * Includes negative prompts to avoid CPU rendering artifacts
 */
async function exampleVideoPrompt() {
  console.log('🎬 Example 6: Video Prompt with Negative Prompting\n');

  const result = await imoService.generateVideoPrompt({
    topic: 'Bitcoin price chart animation with African market highlights',
    duration: 'short',
    style: 'modern data visualization'
  });

  console.log('Positive Prompt:', result.prompt);
  console.log('\nNegative Prompt (prevents quality issues):');
  console.log(result.negativePrompt);
  console.log('\nExpected Quality:', result.quality.expectedQuality);
  console.log('');
}

/**
 * Example 7: Social Media Content
 */
async function exampleSocialContent() {
  console.log('📱 Example 7: Social Media Content\n');

  const result = await imoContentAgent.generateSocialPost(
    'Solana hits new all-time high as African traders pile in',
    'twitter',
    'https://coindaily.africa/solana-ath'
  );

  console.log('Generated Tweet:', result.post);
  console.log('Hashtags:', result.hashtags);
  console.log('Processing Time:', result.processingTime, 'ms\n');
}

/**
 * Example 8: Article Summary
 */
async function exampleSummary() {
  console.log('📋 Example 8: Article Summary\n');

  const article = `
    The African cryptocurrency market has experienced unprecedented growth in 2024,
    with Nigeria, Kenya, and South Africa leading the charge. Peer-to-peer trading
    volumes have surged by over 200% compared to the previous year, driven by
    economic uncertainty and increasing smartphone penetration. Local exchanges
    like Luno, Quidax, and Yellow Card have expanded their services to meet
    growing demand. Regulatory frameworks are evolving, with several countries
    implementing crypto-friendly policies to attract investment and innovation.
    The integration of mobile money services with crypto platforms has made
    digital assets more accessible to millions of previously unbanked citizens.
  `;

  const result = await imoContentAgent.generateSummary(article, 'bullet_points');

  console.log('Summary:');
  console.log(result.summary);
  console.log('Processing Time:', result.processingTime, 'ms\n');
}

/**
 * Example 9: Direct Imo Prompt Generation
 * Shows low-level API for custom use cases
 */
async function exampleDirectPrompt() {
  console.log('⚙️ Example 9: Direct Imo Prompt Generation\n');

  // Initialize Imo
  await imoService.initialize();

  // Generate a chained prompt for custom workflow
  const result = await imoService.generateArticlePrompt({
    topic: 'How to buy Bitcoin in Ghana using mobile money',
    keywords: ['buy Bitcoin Ghana', 'mobile money crypto', 'MTN Money Bitcoin'],
    targetAudience: 'beginner',
    wordCount: 1000,
    africanFocus: true
  });

  console.log('Strategy:', result.strategy);
  console.log('Steps:', result.steps?.length);
  
  if (result.steps) {
    result.steps.forEach((step, i) => {
      console.log(`\n  Step ${i + 1}: ${step.purpose}`);
      console.log(`  Prompt preview: ${step.prompt.substring(0, 100)}...`);
    });
  }

  console.log('\nModel Config Suggestion:', result.modelConfig);
  console.log('Quality Assessment:', result.quality);
  console.log('');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('IMO PROMPT AGENT - USAGE EXAMPLES');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Note: In production, these would make real API calls
    // For testing, some may require API keys to be configured
    
    await exampleDirectPrompt();
    // await exampleHeroImage();      // Requires OPENAI_API_KEY
    // await exampleSEOArticle();     // Requires OPENAI_API_KEY
    // await exampleTranslation();    // Requires OPENAI_API_KEY
    // await exampleBatchTranslation();
    // await exampleRAGSearch();
    await exampleVideoPrompt();
    // await exampleSocialContent();
    // await exampleSummary();

  } catch (error) {
    console.error('Example failed:', error);
  }

  console.log('='.repeat(60));
  console.log('Examples completed!');
  console.log('='.repeat(60));
}

// Export for testing
export {
  exampleHeroImage,
  exampleSEOArticle,
  exampleTranslation,
  exampleBatchTranslation,
  exampleRAGSearch,
  exampleVideoPrompt,
  exampleSocialContent,
  exampleSummary,
  exampleDirectPrompt,
  runAllExamples
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
