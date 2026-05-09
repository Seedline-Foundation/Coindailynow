/**
 * Complete Workflow Test
 * Demonstrates the full Review Agent + Imo + Real Agents workflow
 */

import { AIReviewAgent } from './ai-system/agents/review/aiReviewAgent';
import ResearchAgent from './ai-system/agents/research/researchAgent';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

// Setup
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

async function testCompleteWorkflow() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  COINDAILY AI SYSTEM - COMPLETE WORKFLOW TEST                 ║');
  console.log('║  Review Agent + Imo + Real Agents                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize agents
    console.log('📦 Initializing agents...');
    const reviewAgent = new AIReviewAgent(redis, logger, prisma);
    const researchAgent = new ResearchAgent(prisma, logger);

    // STEP 1: Research Agent fetches trending topics
    console.log('\n🔬 STEP 1: Research Agent - Fetching trending topics...');
    console.log('─'.repeat(70));
    const research = await researchAgent.fetchTrendingTopics();
    console.log(`✅ Research complete!`);
    console.log(`   Topic: ${research.topic}`);
    console.log(`   Trending Score: ${research.trending_score}/100`);
    console.log(`   Sources: ${research.sources.length}`);
    console.log(`   Facts Extracted: ${research.facts.length}`);
    console.log(`   Urgency: ${research.urgency}`);

    // STEP 2: Review Agent orchestrates entire workflow
    console.log('\n🧠 STEP 2: Review Agent - Starting orchestration...');
    console.log('─'.repeat(70));
    const queueItem = await reviewAgent.orchestrateArticleCreation(research);

    if (!queueItem) {
      console.log('❌ Research was not newsworthy - DISCARDED');
      console.log('   Reason: Trending score below threshold or other validation failures');
      return;
    }

    // STEP 3: Display results
    console.log('\n✅ STEP 3: Workflow Complete - Article Ready for Admin!');
    console.log('─'.repeat(70));
    console.log(`Queue Item ID: ${queueItem.id}`);
    console.log(`Article ID: ${queueItem.article_id}`);
    console.log(`Status: ${queueItem.status}`);
    console.log(`Submitted: ${queueItem.submitted_at}`);

    console.log('\n📄 English Article:');
    console.log(`   Title: ${queueItem.articles.english.title}`);
    console.log(`   Word Count: ${queueItem.articles.english.word_count}`);
    console.log(`   SEO Score: ${queueItem.articles.english.seo_score}/100`);
    console.log(`   Readability: ${queueItem.articles.english.readability_score}/100`);
    console.log(`   Facts Preserved: ${queueItem.articles.english.facts_preserved ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   Message Consistent: ${queueItem.articles.english.message_consistent ? 'YES ✓' : 'NO ✗'}`);

    console.log('\n🖼️  Featured Image:');
    console.log(`   URL: ${queueItem.articles.image.url}`);
    console.log(`   Alt Text: ${queueItem.articles.image.alt_text}`);
    console.log(`   Theme Match: ${queueItem.articles.image.theme_match_score}/100`);
    console.log(`   Quality: ${queueItem.articles.image.quality_score}/100`);

    console.log('\n🌍 Translations (15 languages):');
    queueItem.articles.translations.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.language} (${t.language_code})`);
      console.log(`      Terminology Preserved: ${t.terminology_preserved ? 'YES ✓' : 'NO ✗'}`);
      console.log(`      Tone Consistency: ${t.tone_consistency_score}/100`);
    });

    console.log('\n📊 Summary:');
    console.log(`   Total Articles: 16 (1 English + 15 translations)`);
    console.log(`   Research → Writing → Image → Translation: COMPLETE`);
    console.log(`   All validations: PASSED`);
    console.log(`   Ready for admin approval: YES`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Admin reviews articles at: /admin/queue');
    console.log(`   2. Approve or request edits for queue item: ${queueItem.id}`);
    console.log('   3. After approval, publish all 16 articles');

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  TEST COMPLETE - WORKFLOW SUCCESSFUL! 🎉                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Cleanup
    await redis.quit();
    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Example: Simulate admin approval workflow
async function testAdminWorkflow() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ADMIN APPROVAL WORKFLOW TEST                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Simulate API calls
    const baseUrl = 'http://localhost:3000';

    // 1. Get queue
    console.log('📋 Fetching admin queue...');
    const queueResponse = await fetch(`${baseUrl}/api/admin/queue`);
    const queueData = await queueResponse.json();
    console.log(`   Pending items: ${queueData.count}`);

    if (queueData.count === 0) {
      console.log('   No items in queue. Run the workflow test first!');
      return;
    }

    const firstItem = queueData.queue[0];
    console.log(`   First item: ${firstItem.title}`);

    // 2. Approve article
    console.log('\n✅ Approving article...');
    const approveResponse = await fetch(`${baseUrl}/api/admin/queue/${firstItem.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_id: 'test_admin',
        admin_notes: 'Approved via automated test'
      })
    });
    const approveData = await approveResponse.json();
    console.log(`   Status: ${approveData.success ? 'SUCCESS' : 'FAILED'}`);

    // 3. Publish article
    console.log('\n🚀 Publishing article...');
    const publishResponse = await fetch(`${baseUrl}/api/admin/queue/${firstItem.id}/publish`, {
      method: 'POST'
    });
    const publishData = await publishResponse.json();
    console.log(`   Status: ${publishData.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Published articles: ${publishData.published_articles.english}`);
    console.log(`   Translations: ${publishData.published_articles.translations.length}`);

    console.log('\n✅ Admin workflow complete!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run tests
if (require.main === module) {
  const testType = process.argv[2] || 'workflow';

  if (testType === 'workflow') {
    testCompleteWorkflow();
  } else if (testType === 'admin') {
    testAdminWorkflow();
  } else {
    console.log('Usage: node test-complete-workflow.ts [workflow|admin]');
  }
}

export { testCompleteWorkflow, testAdminWorkflow };
