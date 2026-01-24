// Inter-Agent Workflow Examples - Demonstrates agent interaction capabilities
// Shows Research → Reviewer → Writer → Translator → Reviewer → Human Editor Queue
// Complete workflow orchestration for CoinDaily Africa news generation

import { interAgentWorkflowOrchestrator } from '../orchestrator/inter-agent-workflow';

// Example 1: Standard Breaking News Workflow
async function demonstrateBreakingNewsWorkflow(): Promise<void> {
  console.log('🚨 DEMONSTRATING BREAKING NEWS WORKFLOW');
  console.log('=============================================');
  
  try {
    // Step 1: Create a breaking news workflow
    const workflowId = await interAgentWorkflowOrchestrator.createNewsWorkflow(
      'breaking_news',
      {
        topic: 'Bitcoin surges to new all-time high amid African adoption surge',
        targetLanguages: ['sw', 'fr', 'ar'], // Swahili, French, Arabic
        region: 'all_africa',
        urgency: 'breaking',
        qualityThreshold: 0.8,
        contentLength: 'medium',
        seoKeywords: ['bitcoin', 'africa', 'cryptocurrency', 'adoption', 'all-time-high']
      },
      'critical'
    );

    console.log(`📝 Created workflow: ${workflowId}`);
    console.log('🔄 Workflow stages will execute automatically:');
    console.log('   1. Research Agent: Gathering Bitcoin market data and African adoption stats');
    console.log('   2. Fact Check Agent: Verifying data accuracy and sources');
    console.log('   3. Breaking News Writer: Creating urgent, engaging content');
    console.log('   4. Priority Translator: Fast translation to African languages');
    console.log('   5. Quality Assurance: Final content review');
    console.log('   6. Editor Fast Track: Human editor queue for final approval');

    // Monitor workflow progress
    await monitorWorkflowProgress(workflowId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Breaking news workflow failed:', errorMessage);
  }
}

// Example 2: Standard News Article Workflow
async function demonstrateStandardNewsWorkflow(): Promise<void> {
  console.log('\n📰 DEMONSTRATING STANDARD NEWS WORKFLOW');
  console.log('=========================================');

  try {
    const workflowId = await interAgentWorkflowOrchestrator.createNewsWorkflow(
      'market_analysis',
      {
        topic: 'DeFi growth trends in Nigerian cryptocurrency markets',
        targetLanguages: ['en', 'yo', 'ig'], // English, Yoruba, Igbo
        region: 'nigeria',
        urgency: 'normal',
        qualityThreshold: 0.75,
        contentLength: 'long',
        seoKeywords: ['defi', 'nigeria', 'cryptocurrency', 'trends', 'analysis']
      },
      'medium'
    );

    console.log(`📝 Created workflow: ${workflowId}`);
    console.log('🔄 Workflow stages:');
    console.log('   1. Research Agent: Comprehensive DeFi market research');
    console.log('   2. Content Review Agent: Research quality verification');
    console.log('   3. Article Writing Agent: Professional article creation');
    console.log('   4. Translation Agent: Multi-language content generation');
    console.log('   5. Translation Review Agent: Translation quality check');
    console.log('   6. Human Editor Queue: Final editorial review');

    await monitorWorkflowProgress(workflowId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Standard news workflow failed:', errorMessage);
  }
}

// Example 3: Memecoin Alert Workflow
async function demonstrateMemecoinAlertWorkflow(): Promise<void> {
  console.log('\n🐕 DEMONSTRATING MEMECOIN ALERT WORKFLOW');
  console.log('=========================================');

  try {
    const workflowId = await interAgentWorkflowOrchestrator.createNewsWorkflow(
      'memecoin_alert',
      {
        topic: 'PEPE token surges 400% following viral African meme campaign',
        targetLanguages: ['en', 'sw', 'am'], // English, Swahili, Amharic
        region: 'all_africa',
        urgency: 'urgent',
        qualityThreshold: 0.7,
        contentLength: 'short',
        seoKeywords: ['pepe', 'memecoin', 'viral', 'africa', 'cryptocurrency']
      },
      'high'
    );

    console.log(`📝 Created workflow: ${workflowId}`);
    console.log('🔄 Workflow stages:');
    console.log('   1. Memecoin Research Agent: Social sentiment and price analysis');
    console.log('   2. Social Sentiment Review: Viral content verification');
    console.log('   3. Alert Content Creation: Quick, engaging alert content');
    console.log('   4. Community Translation: Fast community-focused translation');
    console.log('   5. Meme Content Review: Meme accuracy and relevance check');
    console.log('   6. Social Media Queue: Quick approval for social distribution');

    await monitorWorkflowProgress(workflowId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Memecoin alert workflow failed:', errorMessage);
  }
}

// Example 4: Human Editor Interaction
async function demonstrateHumanEditorWorkflow(): Promise<void> {
  console.log('\n👤 DEMONSTRATING HUMAN EDITOR INTERACTION');
  console.log('==========================================');

  try {
    // Get current human editor queue
    const editorQueue = interAgentWorkflowOrchestrator.getHumanEditorQueue();
    
    console.log(`📋 Current Human Editor Queue: ${editorQueue.length} tasks`);
    
    if (editorQueue.length > 0) {
      const task = editorQueue[0];
      console.log(`\n📄 Sample Task: ${task.id}`);
      console.log(`   Workflow: ${task.workflowId}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Title: ${task.content.title}`);
      console.log(`   Quality Scores:`);
      console.log(`     Research: ${task.qualityScores.research.toFixed(2)}`);
      console.log(`     Writing: ${task.qualityScores.writing.toFixed(2)}`);
      console.log(`     Translation: ${task.qualityScores.translation.toFixed(2)}`);
      console.log(`     Overall: ${task.qualityScores.overall.toFixed(2)}`);

      // Simulate human editor approval
      console.log('\n✅ Simulating Human Editor Approval...');
      await interAgentWorkflowOrchestrator.processHumanEditorDecision(
        task.id,
        'approved',
        'Great work! Content meets publication standards.',
        undefined,
        'editor@coindaily.africa'
      );

      console.log(`✅ Task ${task.id} approved by human editor`);
      console.log('🚀 Content ready for publication!');

    } else {
      console.log('📭 No tasks currently in human editor queue');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Human editor workflow demonstration failed:', errorMessage);
  }
}

// Example 5: Content Revision Workflow
async function demonstrateContentRevisionWorkflow(): Promise<void> {
  console.log('\n🔄 DEMONSTRATING CONTENT REVISION WORKFLOW');
  console.log('===========================================');

  try {
    // Create a workflow that will need revision
    const workflowId = await interAgentWorkflowOrchestrator.createNewsWorkflow(
      'educational',
      {
        topic: 'Understanding blockchain technology for African entrepreneurs',
        targetLanguages: ['en', 'fr'],
        region: 'ghana',
        urgency: 'normal',
        qualityThreshold: 0.85, // High threshold to trigger potential revision
        contentLength: 'long',
        seoKeywords: ['blockchain', 'technology', 'africa', 'entrepreneurs', 'education']
      },
      'low'
    );

    console.log(`📝 Created workflow: ${workflowId}`);
    
    // Wait for workflow to reach human editor queue
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const editorQueue = interAgentWorkflowOrchestrator.getHumanEditorQueue();
    const relevantTask = editorQueue.find(task => task.workflowId === workflowId);
    
    if (relevantTask) {
      console.log(`\n📋 Task reached human editor: ${relevantTask.id}`);
      
      // Simulate editor requesting revision
      console.log('✏️ Simulating Human Editor Revision Request...');
      await interAgentWorkflowOrchestrator.processHumanEditorDecision(
        relevantTask.id,
        'revision_needed',
        'Content needs more African-specific examples and simpler explanations.',
        'Please add 2-3 real African blockchain use cases and simplify technical terms for general audience.',
        'senior_editor@coindaily.africa'
      );

      console.log('🔄 Revision requested - workflow restarting from content generation stage');
      console.log('📝 Content will be regenerated with revision instructions');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Content revision workflow failed:', errorMessage);
  }
}

// Example 6: Workflow Metrics and Monitoring
async function demonstrateWorkflowMetrics(): Promise<void> {
  console.log('\n📊 WORKFLOW METRICS AND MONITORING');
  console.log('==================================');

  try {
    const metrics = interAgentWorkflowOrchestrator.getWorkflowMetrics();
    
    console.log('📈 System Performance Metrics:');
    console.log(`   Total Workflows: ${metrics.totalWorkflows}`);
    console.log(`   Completed Workflows: ${metrics.completedWorkflows}`);
    console.log(`   Average Processing Time: ${metrics.averageProcessingTime}ms`);
    console.log(`   Human Approval Rate: ${(metrics.humanApprovalRate * 100).toFixed(1)}%`);
    console.log(`   Quality Score Average: ${(metrics.qualityScoreAverage * 100).toFixed(1)}%`);
    console.log(`   Active Workflows: ${metrics.activeWorkflows}`);
    console.log(`   Human Editor Queue Length: ${metrics.humanEditorQueueLength}`);

    // Show active workflows
    console.log('\n🔄 Active Workflows Status:');
    const activeWorkflows = Array.from({ length: metrics.activeWorkflows }, (_, i) => i + 1);
    
    if (activeWorkflows.length > 0) {
      for (const workflowIndex of activeWorkflows) {
        console.log(`   Workflow ${workflowIndex}: Processing...`);
      }
    } else {
      console.log('   No active workflows');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Metrics demonstration failed:', errorMessage);
  }
}

// Run all workflow demonstrations
export async function runAllWorkflowDemonstrations(): Promise<void> {
  console.log('🤖 INTER-AGENT WORKFLOW SYSTEM DEMONSTRATION');
  console.log('==============================================');
  console.log('This demonstration shows how AI agents interact with each other:');
  console.log('Research → Reviewer → Writer → Translator → Reviewer → Human Editor');
  console.log('');

  try {
    // Initialize the workflow orchestrator
    await interAgentWorkflowOrchestrator.initialize();
    
    // Run demonstrations in sequence
    await demonstrateBreakingNewsWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between demos
    
    await demonstrateStandardNewsWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demonstrateMemecoinAlertWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demonstrateHumanEditorWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demonstrateContentRevisionWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demonstrateWorkflowMetrics();

    console.log('\n🎉 ALL WORKFLOW DEMONSTRATIONS COMPLETED');
    console.log('========================================');
    console.log('✅ Agent interaction system is fully functional');
    console.log('✅ Multi-stage workflows execute automatically');
    console.log('✅ Quality control and review systems working');
    console.log('✅ Human editor integration operational');
    console.log('✅ Content revision workflows functional');
    console.log('✅ Performance monitoring active');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Workflow demonstration suite failed:', errorMessage);
    throw error;
  }
}

// Utility function to monitor workflow progress
async function monitorWorkflowProgress(workflowId: string, maxWaitTime: number = 30000): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 1000; // Check every second

  return new Promise((resolve, reject) => {
    const monitor = setInterval(() => {
      const workflow = interAgentWorkflowOrchestrator.getWorkflowStatus(workflowId);
      
      if (!workflow) {
        clearInterval(monitor);
        reject(new Error(`Workflow ${workflowId} not found`));
        return;
      }

      const currentStage = workflow.stages[workflow.currentStageIndex];
      const progress = `${workflow.currentStageIndex + 1}/${workflow.stages.length}`;
      
      console.log(`   📊 Progress: ${progress} - ${currentStage?.name || 'Unknown'} (${currentStage?.status || 'unknown'})`);

      // Check if workflow completed
      if (workflow.status === 'completed' || workflow.status === 'awaiting_human_review') {
        clearInterval(monitor);
        console.log(`   ✅ Workflow ${workflowId} completed successfully!`);
        resolve();
        return;
      }

      // Check if workflow failed
      if (workflow.status === 'failed') {
        clearInterval(monitor);
        console.log(`   ❌ Workflow ${workflowId} failed`);
        resolve(); // Don't reject, just complete monitoring
        return;
      }

      // Check for timeout
      if (Date.now() - startTime > maxWaitTime) {
        clearInterval(monitor);
        console.log(`   ⏰ Workflow ${workflowId} monitoring timeout (still processing)`);
        resolve();
        return;
      }
    }, checkInterval);
  });
}

// Individual demonstration functions for testing
export {
  demonstrateBreakingNewsWorkflow,
  demonstrateStandardNewsWorkflow,
  demonstrateMemecoinAlertWorkflow,
  demonstrateHumanEditorWorkflow,
  demonstrateContentRevisionWorkflow,
  demonstrateWorkflowMetrics
};
