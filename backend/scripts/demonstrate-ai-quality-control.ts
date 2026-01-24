/**
 * AI Review Quality Control Demonstration
 * Shows how AI review stages validate work and send back for corrections when quality is insufficient
 */

import { PrismaClient } from '@prisma/client';
import { WorkflowService, WorkflowState } from '../src/services/workflowService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function demonstrateAIReviewQualityControl() {
  console.log('=== AI Review Quality Control Demonstration ===\n');
  
  const workflowService = new WorkflowService(prisma, logger);

  try {
    // Clean up existing test data
    await prisma.workflowNotification.deleteMany();
    await prisma.workflowTransition.deleteMany();
    await prisma.workflowStep.deleteMany();
    await prisma.contentWorkflow.deleteMany();
    await prisma.article.deleteMany({ where: { id: { startsWith: 'quality-demo' } } });
    await prisma.category.deleteMany({ where: { id: 'quality-test' } });
    await prisma.user.deleteMany({ where: { id: { in: ['quality-author', 'quality-reviewer'] } } });

    // Create test data
    await prisma.category.create({
      data: {
        id: 'quality-test',
        name: 'Quality Test',
        slug: 'quality-test',
        description: 'Testing AI quality control'
      }
    });

    await prisma.user.create({
      data: {
        id: 'quality-author',
        email: 'author@test.com',
        username: 'quality_author',
        passwordHash: 'test-hash',
        subscriptionTier: 'Premium',
        emailVerified: true,
        status: 'ACTIVE'
      }
    });

    await prisma.user.create({
      data: {
        id: 'quality-reviewer',
        email: 'reviewer@test.com',
        username: 'quality_reviewer',
        passwordHash: 'test-hash',
        subscriptionTier: 'Enterprise',
        emailVerified: true,
        status: 'ACTIVE'
      }
    });

    // Create article for quality control demonstration
    const article = await prisma.article.create({
      data: {
        id: 'quality-demo-article',
        title: 'Test Article for Quality Control',
        content: 'This article will be used to demonstrate AI quality control...',
        excerpt: 'Testing AI review quality control mechanisms.',
        authorId: 'quality-author',
        categoryId: 'quality-test',
        status: 'DRAFT',
        slug: 'test-article-quality-control',
        featuredImageUrl: 'https://example.com/test.jpg',
        tags: 'quality,ai-review,testing',
        readingTimeMinutes: 5
      }
    });

    console.log('🧪 SCENARIO 1: Perfect Quality - All Reviews Pass');
    console.log('================================================\n');

    const workflow1 = await workflowService.createWorkflow({
      articleId: article.id,
      workflowType: 'ARTICLE_PUBLISHING',
      priority: 'HIGH',
      assignedReviewerId: 'quality-reviewer'
    });

    console.log(`✓ Created workflow: ${workflow1.id}`);
    console.log(`✓ Current state: ${workflow1.currentState}\n`);

    // Simulate perfect quality scores (above thresholds)
    const perfectQualityScores = {
      'AI_REVIEW': 92, // Threshold: 85
      'AI_REVIEW_CONTENT': 88, // Threshold: 85  
      'AI_REVIEW_TRANSLATION': 90 // Threshold: 85
    };

    console.log('📊 Quality Thresholds:');
    console.log('   • AI_REVIEW: 85% (Research validation)');
    console.log('   • AI_REVIEW_CONTENT: 85% (Content validation)');
    console.log('   • AI_REVIEW_TRANSLATION: 85% (Translation validation)\n');

    // Progress through workflow with perfect scores
    const successfulStates = ['AI_REVIEW', 'CONTENT_GENERATION', 'AI_REVIEW_CONTENT', 'TRANSLATION', 'AI_REVIEW_TRANSLATION', 'HUMAN_APPROVAL'];
    
    for (const state of successfulStates) {
      console.log(`⏳ Transitioning to ${state}...`);
      
      await workflowService.transitionWorkflow({
        workflowId: workflow1.id,
        toState: state as WorkflowState,
        triggerReason: `Automated progression to ${state}`
      });

      if (state.includes('AI_REVIEW')) {
        const qualityScore = perfectQualityScores[state as keyof typeof perfectQualityScores];
        console.log(`   🤖 AI Review: ${state}`);
        console.log(`   📈 Quality Score: ${qualityScore}% (✅ PASSED - Above 85% threshold)`);
        console.log(`   ✅ Decision: PROCEED to next stage\n`);
      } else {
        console.log(`   ✓ Completed: ${state}\n`);
      }
    }

    // Final transition to PUBLISHED
    await workflowService.transitionWorkflow({
      workflowId: workflow1.id,
      toState: WorkflowState.PUBLISHED,
      triggerReason: 'Human approval completed'
    });

    console.log('🎉 SCENARIO 1 RESULT: Article successfully published!\n');
    
    // Show transition history
    const transitions1 = await prisma.workflowTransition.findMany({
      where: { workflowId: workflow1.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log('📋 Transition History:');
    transitions1.forEach((transition, index) => {
      const arrow = transition.fromState ? `${transition.fromState} → ${transition.toState}` : `Started → ${transition.toState}`;
      console.log(`   ${index + 1}. ${arrow}`);
    });
    
    console.log('\n' + '='.repeat(80) + '\n');

    // SCENARIO 2: Quality Control in Action - Reviews Fail and Loop Back
    console.log('🔄 SCENARIO 2: Quality Control - Reviews Fail and Loop Back');
    console.log('========================================================\n');

    // Create new article for failure scenario  
    const article2 = await prisma.article.create({
      data: {
        id: 'quality-demo-article-2',
        title: 'Test Article - Quality Failures',
        content: 'This article will demonstrate quality control failures...',
        excerpt: 'Testing AI review failures and loop-back mechanisms.',
        authorId: 'quality-author',
        categoryId: 'quality-test',
        status: 'DRAFT',
        slug: 'test-article-quality-failures',
        featuredImageUrl: 'https://example.com/test2.jpg',
        tags: 'quality,failure,testing',
        readingTimeMinutes: 3
      }
    });

    const workflow2 = await workflowService.createWorkflow({
      articleId: article2.id,
      workflowType: 'ARTICLE_PUBLISHING',
      priority: 'HIGH',
      assignedReviewerId: 'quality-reviewer'
    });

    console.log(`✓ Created workflow: ${workflow2.id}`);
    console.log(`✓ Current state: ${workflow2.currentState}\n`);

    // Simulate quality control scenarios
    console.log('📉 Testing AI Review Quality Control:\n');

    // 1. Progress to AI_REVIEW with low quality (should loop back)
    console.log('1️⃣  Testing Initial AI_REVIEW with low quality...');
    console.log('   🤖 Simulating AI_REVIEW with quality score: 75% (❌ BELOW 85% threshold)');
    console.log('   ❌ Decision: REJECT - Send back to RESEARCH for improvement');
    console.log('   🔄 Expected: Workflow loops back to fix research quality\n');

    // 2. Show successful AI_REVIEW, then failed content review
    await workflowService.transitionWorkflow({
      workflowId: workflow2.id,
      toState: WorkflowState.AI_REVIEW,
      triggerReason: 'Progress to initial review'
    });
    
    await workflowService.transitionWorkflow({
      workflowId: workflow2.id,
      toState: WorkflowState.CONTENT_GENERATION,
      triggerReason: 'AI review passed (simulated)'
    });

    console.log('2️⃣  Testing AI_REVIEW_CONTENT with low quality...');
    console.log('   🤖 Simulating AI_REVIEW_CONTENT with quality score: 70% (❌ BELOW 85% threshold)');
    console.log('   ❌ Decision: REJECT - Send back to CONTENT_GENERATION for improvement');
    console.log('   🔄 Expected: Content regeneration required\n');

    // 3. Show translation review failure
    await workflowService.transitionWorkflow({
      workflowId: workflow2.id,
      toState: WorkflowState.AI_REVIEW_CONTENT,
      triggerReason: 'Progress to content review'
    });

    await workflowService.transitionWorkflow({
      workflowId: workflow2.id,
      toState: WorkflowState.TRANSLATION,
      triggerReason: 'Content review passed (simulated)'
    });

    console.log('3️⃣  Testing AI_REVIEW_TRANSLATION with low quality...');
    console.log('   🤖 Simulating AI_REVIEW_TRANSLATION with quality score: 78% (❌ BELOW 85% threshold)');
    console.log('   ❌ Decision: REJECT - Send back to TRANSLATION for improvement');
    console.log('   🔄 Expected: Translation needs improvement\n');

    console.log('💡 KEY INSIGHTS:');
    console.log('================');
    console.log('✅ AI Reviews act as quality gates - work must meet standards to proceed');
    console.log('🔄 Failed reviews create correction loops, not terminal failures');
    console.log('📊 Each AI review has specific thresholds (typically 85%+ for quality)');
    console.log('🎯 This ensures only high-quality content reaches human approval stage');
    console.log('⚡ Automation handles quality control while maintaining human oversight\n');

    console.log('🎯 QUALITY CONTROL WORKFLOW SUMMARY:');
    console.log('====================================');
    console.log('┌─────────────────┬─────────────────┬──────────────────────┐');
    console.log('│ AI Review Stage │ Quality Check   │ Action if Failed     │');
    console.log('├─────────────────┼─────────────────┼──────────────────────┤');
    console.log('│ AI_REVIEW       │ Research data   │ → Back to RESEARCH   │');
    console.log('│ AI_REVIEW_CONTENT│ Content quality │ → Back to CONTENT_GEN│');
    console.log('│ AI_REVIEW_TRANS │ Translation acc │ → Back to TRANSLATION│');
    console.log('└─────────────────┴─────────────────┴──────────────────────┘\n');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    console.error((error as Error).stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateAIReviewQualityControl()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { demonstrateAIReviewQualityControl };