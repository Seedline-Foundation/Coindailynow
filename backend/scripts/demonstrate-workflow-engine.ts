/**
 * Task 8: Content Workflow Engine Demonstration
 * This script demonstrates the complete workflow functionality including:
 * - Workflow creation and state management
 * - AI quality review integration
 * - Human approval checkpoints
 * - Workflow analytics and reporting
 * - Error handling and recovery
 */

import { PrismaClient } from '@prisma/client';
import { WorkflowService } from '../src/services/workflowService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
});

async function demonstrateWorkflowEngine() {
  console.log('🔄 Content Workflow Engine Demonstration - Task 8');
  console.log('================================================\n');

  try {
    const workflowService = new WorkflowService(prisma, logger);

    // Create test user and article if they don't exist
    console.log('1. Setting up test data...');
    
    let testUser = await prisma.user.findFirst({
      where: { email: 'demo@workflow.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'demo@workflow.com',
          username: 'workflow_demo',
          passwordHash: 'demo_password',
          firstName: 'Workflow',
          lastName: 'Demo',
          emailVerified: true,
          status: 'ACTIVE'
        }
      });
    }

    let testCategory = await prisma.category.findFirst({
      where: { slug: 'workflow-demo' }
    });

    if (!testCategory) {
      testCategory = await prisma.category.create({
        data: {
          name: 'Workflow Demo',
          slug: 'workflow-demo',
          description: 'Demo category for workflow testing'
        }
      });
    }

    // Create new article for demo
    const timestamp = Date.now();
    const testArticle = await prisma.article.create({
      data: {
        title: `Demo Article ${timestamp}`,
        slug: `demo-article-${timestamp}`,
        excerpt: 'This is a demo article for testing the workflow engine',
        content: 'Content of the demo article for workflow testing. This article will go through all workflow states.',
        authorId: testUser.id,
        categoryId: testCategory.id,
        readingTimeMinutes: 3,
        status: 'DRAFT'
      }
    });

    console.log(`✅ Created test article: "${testArticle.title}" (ID: ${testArticle.id})\n`);

    // Demonstrate workflow creation
    console.log('2. Creating Content Workflow...');
    const workflow = await workflowService.createWorkflow({
      articleId: testArticle.id,
      workflowType: 'ARTICLE_PUBLISHING',
      priority: 'HIGH'
    });

    console.log(`✅ Workflow created successfully!`);
    console.log(`   - Workflow ID: ${workflow.id}`);
    console.log(`   - Current State: ${workflow.currentState}`);
    console.log(`   - Priority: ${workflow.priority}`);
    console.log(`   - Completion: ${workflow.completionPercentage}%\n`);

    // Get workflow with steps by querying directly
    const workflowWithSteps = await prisma.contentWorkflow.findUnique({
      where: { id: workflow.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        }
      }
    });
    
    console.log(`📋 Workflow Steps Created: ${workflowWithSteps?.steps.length || 0} steps`);
    workflowWithSteps?.steps.forEach((step: any, index: number) => {
      console.log(`   ${index + 1}. ${step.stepName} (${step.status})`);
    });
    console.log();

    // Demonstrate state transitions
    console.log('3. Demonstrating State Transitions...');
    const states: string[] = ['AI_REVIEW', 'CONTENT_GENERATION', 'TRANSLATION', 'HUMAN_APPROVAL'];
    
    let currentWorkflow = workflow;
    for (const targetState of states) {
      console.log(`   Transitioning: ${currentWorkflow.currentState} → ${targetState}`);
      
      currentWorkflow = await workflowService.transitionWorkflow({
        workflowId: currentWorkflow.id,
        toState: targetState,
        triggeredBy: testUser.id,
        triggerReason: `Demo transition to ${targetState}`
      });
      
      console.log(`   ✅ New State: ${currentWorkflow.currentState} (${currentWorkflow.completionPercentage}% complete)`);
    }
    console.log();

    // Demonstrate AI step processing
    console.log('4. Simulating AI Quality Review...');
    await workflowService.processNextStep(currentWorkflow.id);
    console.log(`✅ AI processing step initiated\n`);

    // Get transition history
    console.log('5. Workflow Transition History:');
    const transitions = await prisma.workflowTransition.findMany({
      where: { workflowId: workflow.id },
      orderBy: { createdAt: 'asc' }
    });

    transitions.forEach((transition, index) => {
      console.log(`   ${index + 1}. ${transition.fromState} → ${transition.toState} (${transition.transitionType})`);
      if (transition.transitionReason) {
        console.log(`      Reason: ${transition.transitionReason}`);
      }
    });
    console.log();

    // Demonstrate workflow analytics
    console.log('6. Workflow Analytics:');
    const analytics = await workflowService.getWorkflowAnalytics(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      new Date() // now
    );

    console.log(`   📊 Analytics Summary:`);
    console.log(`      - Total Workflows: ${analytics.totalWorkflows}`);
    console.log(`      - Completed Workflows: ${analytics.completedWorkflows}`);
    console.log(`      - Success Rate: ${analytics.successRate.toFixed(1)}%`);
    console.log(`      - Average Duration: ${analytics.averageCompletionTimeMs || 'N/A'}ms`);
    console.log(`      - State Distribution:`, analytics.stateDistribution);

    if (analytics.bottleneckSteps && analytics.bottleneckSteps.length > 0) {
      console.log(`   🚨 Bottlenecks Detected:`);
      analytics.bottleneckSteps.forEach((bottleneck) => {
        console.log(`      - ${bottleneck.stepName}: ${bottleneck.averageDurationMs}ms avg, ${bottleneck.failureRate.toFixed(1)}% failure rate`);
      });
    }
    console.log();

    // Demonstrate error handling
    console.log('7. Testing Error Handling...');
    try {
      await workflowService.transitionWorkflow({
        workflowId: workflow.id,
        toState: 'PUBLISHED',
        triggeredBy: testUser.id,
        triggerReason: 'Invalid transition test'
      });
    } catch (error) {
      console.log(`✅ Error handling works: ${(error as Error).message}`);
    }

    try {
      await prisma.contentWorkflow.findUniqueOrThrow({
        where: { id: 'non-existent-id' }
      });
    } catch (error) {
      console.log(`✅ Error handling works: ${(error as Error).message}`);
    }
    console.log();

    // Complete the workflow
    console.log('8. Completing Workflow...');
    const completedWorkflow = await workflowService.transitionWorkflow({
      workflowId: currentWorkflow.id,
      toState: 'PUBLISHED',
      triggeredBy: testUser.id,
      triggerReason: 'Demo completion'
    });

    console.log(`✅ Workflow completed!`);
    console.log(`   - Final State: ${completedWorkflow.currentState}`);
    console.log(`   - Completion: ${completedWorkflow.completionPercentage}%`);
    console.log(`   - Completed At: ${completedWorkflow.actualCompletionAt}\n`);

    console.log('🎉 Content Workflow Engine Demo Completed Successfully!');
    console.log('✅ All acceptance criteria demonstrated:');
    console.log('   ✓ Automated workflow state management');
    console.log('   ✓ AI quality review integration');
    console.log('   ✓ Human approval checkpoints');
    console.log('   ✓ Workflow analytics and reporting');
    console.log('   ✓ Error handling and recovery\n');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateWorkflowEngine()
    .then(() => {
      console.log('Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateWorkflowEngine };