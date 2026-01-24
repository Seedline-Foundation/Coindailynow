// Enhanced Pipeline Example - Research → Review → Content → Review → Translation → Review → Human Editor
// Demonstrates the new Google-powered review agent integration

import { interAgentWorkflowOrchestrator } from '../orchestrator/inter-agent-workflow';
import { googleReviewAgent } from '../agents/review/google-review-agent';

// Interface definitions for type safety
interface TaskData {
  id: string;
  topic: string;
  requirements: {
    qualityThreshold: number;
    targetLanguages: string[];
    contentLength: 'short' | 'medium' | 'long';
    urgency: 'normal' | 'breaking' | 'urgent';
  };
}

interface ResearchResult {
  title: string;
  summary: string;
  data: Record<string, string>;
  sources: string[];
  timestamp: string;
}

interface ContentResult {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  seoData: Record<string, unknown>;
}

// Example 1: Market Analysis Workflow with Enhanced Review Pipeline
export async function demonstrateEnhancedPipeline() {
  console.log('🚀 Starting Enhanced Pipeline Demo: Research → Review → Content → Review → Translation → Review → Human Editor');

  try {
    // Create a market analysis workflow with enhanced review pipeline
    const workflowId = await interAgentWorkflowOrchestrator.createNewsWorkflow(
      'market_analysis',
      {
        topic: 'Bitcoin adoption surge in Nigeria drives mobile money integration',
        targetLanguages: ['en', 'ha', 'yo'], // English, Hausa, Yoruba
        region: 'nigeria',
        urgency: 'normal',
        qualityThreshold: 0.75,
        contentLength: 'medium',
        seoKeywords: ['bitcoin', 'nigeria', 'mobile money', 'cryptocurrency', 'adoption']
      },
      'high'
    );

    console.log(`✅ Enhanced pipeline workflow created: ${workflowId}`);

    // Monitor the enhanced pipeline execution
    console.log('📊 Pipeline Stages:');
    console.log('  1️⃣ Research Phase - Market data collection');
    console.log('  2️⃣ Research Review - Google-powered validation');
    console.log('  3️⃣ Content Generation - Article creation');
    console.log('  4️⃣ Content Review - Google quality assessment');
    console.log('  5️⃣ Translation Phase - Multi-language adaptation');
    console.log('  6️⃣ Translation Review - Language quality check');
    console.log('  7️⃣ Human Editor Queue - Final human oversight');

    // Wait for completion with monitoring
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const status = await interAgentWorkflowOrchestrator.getWorkflowStatus(workflowId);
      
      if (!status) {
        console.log('❌ Workflow not found');
        break;
      }
      
      const progress = Math.round((status.currentStageIndex / status.stages.length) * 100);
      console.log(`📊 Workflow Status: ${status.status} - Progress: ${progress}%`);
      
      if (status.status === 'completed') {
        console.log('🎉 Enhanced workflow completed successfully!');
        return status;
      }
      
      if (status.status === 'failed') {
        console.log('❌ Workflow failed');
        throw new Error('Workflow failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Workflow timeout after 60 seconds');
  } catch (error) {
    console.error('❌ Enhanced pipeline failed:', error);
    throw error;
  }
}

// Example 2: Breaking News Pipeline with Expedited Review
export async function demonstrateBreakingNewsPipeline() {
  console.log('⚡ Starting Breaking News Pipeline with Enhanced Reviews');

  try {
    const workflowId = await interAgentWorkflowOrchestrator.createNewsWorkflow(
      'breaking_news',
      {
        topic: 'Central Bank of Nigeria announces digital naira pilot program',
        targetLanguages: ['en', 'ha'],
        region: 'nigeria',
        urgency: 'breaking',
        qualityThreshold: 0.85,
        contentLength: 'short',
        seoKeywords: ['digital naira', 'nigeria', 'central bank', 'cbdc']
      },
      'critical'
    );

    console.log(`⚡ Breaking news pipeline initiated: ${workflowId}`);
    
    // Enhanced monitoring for breaking news
    const monitoringInterval = setInterval(async () => {
      const status = await interAgentWorkflowOrchestrator.getWorkflowStatus(workflowId);
      if (status) {
        const progress = Math.round((status.currentStageIndex / status.stages.length) * 100);
        console.log(`📡 Status: ${status.status} - ${progress}%`);
        
        if (status.completedAt) {
          clearInterval(monitoringInterval);
          console.log('🚨 Breaking news published!');
        }
      }
    }, 5000);

    return workflowId;
  } catch (error) {
    console.error('❌ Breaking news pipeline failed:', error);
    throw error;
  }
}

// Example 3: Manual Review Integration
export async function demonstrateManualReviewIntegration() {
  console.log('🔍 Demonstrating Manual Google Review Integration');

  const sampleContent = {
    title: 'Nigeria Leads Africa in Cryptocurrency Adoption According to New Survey',
    content: `Lagos, Nigeria - A comprehensive survey by the African Blockchain Association reveals that Nigeria continues to lead the continent in cryptocurrency adoption, with over 35% of the adult population having used digital currencies in the past year.

The study, conducted across 15 African countries, highlights Nigeria's progressive stance on digital finance and the growing integration of cryptocurrencies into everyday transactions.

Key findings include:
- 35% adoption rate in Nigeria vs 18% continental average
- Mobile money integration driving accessibility
- Youth demographics leading adoption (18-35 age group)
- Remittances and cross-border payments as primary use cases

The Central Bank of Nigeria's recent regulatory clarity has provided additional confidence for both users and businesses looking to integrate cryptocurrency solutions.`,
    metadata: {
      author: 'AI Content System',
      category: 'market-analysis',
      region: 'nigeria',
      priority: 'normal'
    }
  };

  try {
    // Direct Google review agent call
    const reviewResult = await googleReviewAgent.reviewContent({
      reviewType: 'content',
      content: sampleContent,
      metadata: {
        expectedQuality: 0.8,
        urgency: 'medium',
        keywords: ['bitcoin', 'nigeria', 'adoption', 'survey']
      },
      qualityThreshold: 0.8
    });

    console.log('📊 Google Review Results:');
    console.log(`  📈 Quality Score: ${reviewResult.qualityScore}`);
    console.log(`  ✅ Approval Status: ${reviewResult.approved ? 'APPROVED' : 'NEEDS_REVISION'}`);
    console.log(`  📝 Feedback: ${reviewResult.feedback}`);
    
    if (reviewResult.suggestions && reviewResult.suggestions.length > 0) {
      console.log('💡 Suggestions:');
      reviewResult.suggestions.forEach((suggestion, index) => {
        console.log(`    ${index + 1}. ${suggestion}`);
      });
    }

    if (reviewResult.issues && reviewResult.issues.length > 0) {
      console.log('⚠️ Issues Found:');
      reviewResult.issues.forEach((issue, index) => {
        console.log(`    ${index + 1}. ${issue.type} (${issue.severity}): ${issue.description}`);
      });
    }

    return reviewResult;
  } catch (error) {
    console.error('❌ Manual review failed:', error);
    throw error;
  }
}

// Example 4: Pipeline Monitoring and Analytics
export async function demonstratePipelineMonitoring() {
  console.log('📊 Pipeline Performance Monitoring Dashboard');

  try {
    // Simulate getting workflow statistics
    const mockStats = {
      totalWorkflows: 45,
      completed: 38,
      inProgress: 5,
      failed: 2,
      averageProcessingTime: 450,
      reviewMetrics: {
        totalReviews: 152,
        approvalRate: 87.5,
        averageQualityScore: 0.82,
        averageReviewTime: 125
      }
    };
    
    console.log('📈 Pipeline Performance (Last 24 Hours):');
    console.log(`  🔄 Total Workflows: ${mockStats.totalWorkflows}`);
    console.log(`  ✅ Completed: ${mockStats.completed}`);
    console.log(`  ⏳ In Progress: ${mockStats.inProgress}`);
    console.log(`  ❌ Failed: ${mockStats.failed}`);
    console.log(`  ⚡ Avg Processing Time: ${mockStats.averageProcessingTime}ms`);

    // Review agent performance
    console.log('\n🤖 Google Review Agent Performance:');
    console.log(`  📊 Reviews Conducted: ${mockStats.reviewMetrics.totalReviews}`);
    console.log(`  ✅ Approval Rate: ${mockStats.reviewMetrics.approvalRate}%`);
    console.log(`  📈 Avg Quality Score: ${mockStats.reviewMetrics.averageQualityScore}`);
    console.log(`  ⏱️ Avg Review Time: ${mockStats.reviewMetrics.averageReviewTime}ms`);

    return mockStats;
  } catch (error) {
    console.error('❌ Monitoring dashboard failed:', error);
    throw error;
  }
}

// Main demonstration runner
export async function runEnhancedPipelineDemo() {
  console.log('🎬 Enhanced Pipeline Demonstration Suite');
  console.log('=' .repeat(60));

  try {
    // Run all demonstrations
    console.log('\n1️⃣ Enhanced Pipeline Demo');
    await demonstrateEnhancedPipeline();

    console.log('\n2️⃣ Breaking News Pipeline Demo');
    await demonstrateBreakingNewsPipeline();

    console.log('\n3️⃣ Manual Review Integration Demo');
    await demonstrateManualReviewIntegration();

    console.log('\n4️⃣ Pipeline Monitoring Demo');
    await demonstratePipelineMonitoring();

    console.log('\n🎉 All demonstrations completed successfully!');
    console.log('🔄 Enhanced pipeline is ready for production use');
    
  } catch (error) {
    console.error('❌ Demonstration suite failed:', error);
  }
}

// Enhanced Pipeline Task Flow Example
export async function demonstrateTaskPassingFlow() {
  console.log('🔄 Demonstrating Enhanced Task Passing Flow');

  interface TaskData {
    id: string;
    topic: string;
    requirements: {
      qualityThreshold: number;
      targetLanguages: string[];
      contentLength: 'short' | 'medium' | 'long';
      urgency: 'normal' | 'breaking' | 'urgent';
    };
  }

  interface ResearchResult {
    title: string;
    summary: string;
    data: Record<string, string>;
    sources: string[];
    timestamp: string;
  }

  interface ContentResult {
    title: string;
    content: string;
    metadata: Record<string, unknown>;
    seoData: Record<string, unknown>;
  }

  try {
    // Simulate task progression through enhanced pipeline
    const task: TaskData = {
      id: 'task-' + Date.now(),
      topic: 'Ethereum network upgrade reduces transaction fees in Lagos',
      requirements: {
        qualityThreshold: 0.8,
        targetLanguages: ['en', 'ha'],
        contentLength: 'medium',
        urgency: 'normal'
      }
    };

    console.log('📋 Task Created:', task.id);

    // Stage 1: Research
    console.log('\n1️⃣ Research Stage');
    const researchResult: ResearchResult = await simulateResearchStage(task);
    console.log('  ✅ Research completed:', researchResult.summary);

    // Stage 2: Research Review (Google)
    console.log('\n2️⃣ Research Review Stage (Google-powered)');
    const researchReview = await googleReviewAgent.reviewContent({
      reviewType: 'research',
      content: researchResult,
      metadata: {
        expectedQuality: task.requirements.qualityThreshold,
        urgency: 'medium',
        context: { stage: 'research_review' }
      },
      qualityThreshold: task.requirements.qualityThreshold
    });
    console.log(`  📊 Research Quality Score: ${researchReview.qualityScore}`);
    console.log(`  ✅ Research Approved: ${researchReview.approved}`);

    // Stage 3: Content Generation
    console.log('\n3️⃣ Content Generation Stage');
    const contentResult: ContentResult = await simulateContentStage(task, researchResult);
    console.log('  ✅ Content generated:', contentResult.title);

    // Stage 4: Content Review (Google)
    console.log('\n4️⃣ Content Review Stage (Google-powered)');
    const contentReview = await googleReviewAgent.reviewContent({
      reviewType: 'content',
      content: contentResult,
      metadata: {
        expectedQuality: task.requirements.qualityThreshold,
        urgency: 'medium',
        context: { 
          stage: 'content_review',
          previousStages: { research_data: researchResult, research_review: researchReview }
        }
      },
      qualityThreshold: task.requirements.qualityThreshold
    });
    console.log(`  📊 Content Quality Score: ${contentReview.qualityScore}`);
    console.log(`  ✅ Content Approved: ${contentReview.approved}`);

    // Stage 5: Translation
    console.log('\n5️⃣ Translation Stage');
    const translationResult = await simulateTranslationStage(task, contentResult);
    console.log('  ✅ Translations completed:', Object.keys(translationResult).join(', '));

    // Stage 6: Translation Review (Google)
    console.log('\n6️⃣ Translation Review Stage (Google-powered)');
    const translationReview = await googleReviewAgent.reviewContent({
      reviewType: 'translation',
      content: translationResult,
      metadata: {
        expectedQuality: task.requirements.qualityThreshold,
        urgency: 'medium',
        context: { 
          stage: 'translation_review',
          previousStages: { 
            research_data: researchResult, 
            research_review: researchReview,
            content: contentResult,
            content_review: contentReview
          }
        }
      },
      qualityThreshold: task.requirements.qualityThreshold
    });
    console.log(`  📊 Translation Quality Score: ${translationReview.qualityScore}`);
    console.log(`  ✅ Translation Approved: ${translationReview.approved}`);

    // Stage 7: Human Editor Queue
    console.log('\n7️⃣ Human Editor Queue');
    const humanEditorTask = {
      id: task.id,
      content: contentResult,
      translations: translationResult,
      qualityScores: {
        overall: (researchReview.qualityScore + contentReview.qualityScore + translationReview.qualityScore) / 3,
        research: researchReview.qualityScore,
        content: contentReview.qualityScore,
        translation: translationReview.qualityScore
      },
      reviews: {
        research: researchReview,
        content: contentReview,
        translation: translationReview
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('  👤 Task added to human editor queue');
    console.log(`  📊 Overall Quality Score: ${humanEditorTask.qualityScores.overall.toFixed(2)}`);
    console.log('  🎯 Ready for final human review and publishing');

    return humanEditorTask;
  } catch (error) {
    console.error('❌ Task passing flow demonstration failed:', error);
    throw error;
  }
}

// Helper simulation functions
async function simulateResearchStage(task: TaskData): Promise<ResearchResult> {
  return {
    title: task.topic,
    summary: 'Comprehensive market research completed with current data',
    data: {
      marketTrends: 'Ethereum fees reduced by 40% post-upgrade',
      localImpact: 'Lagos crypto traders report significant cost savings',
      technicalDetails: 'EIP-4844 implementation successful'
    },
    sources: ['CoinDesk', 'Local Crypto Exchange Data', 'Technical Documentation'],
    timestamp: new Date().toISOString()
  };
}

async function simulateContentStage(task: TaskData, researchData: ResearchResult): Promise<ContentResult> {
  return {
    title: `${task.topic} - Impact Analysis`,
    content: `Detailed article content based on research data from ${researchData.sources.join(', ')}...`,
    metadata: {
      wordCount: 800,
      readingTime: '3 minutes',
      category: 'market-analysis',
      tags: ['ethereum', 'fees', 'lagos', 'upgrade']
    },
    seoData: {
      metaDescription: 'Ethereum network upgrade significantly reduces transaction fees for Lagos-based crypto traders',
      keywords: ['ethereum', 'transaction fees', 'lagos', 'network upgrade']
    }
  };
}

async function simulateTranslationStage(task: TaskData, contentData: ContentResult): Promise<Record<string, unknown>> {
  const translations: Record<string, unknown> = {};
  
  for (const lang of task.requirements.targetLanguages) {
    if (lang === 'en') continue; // Skip English as it's the source
    
    translations[lang] = {
      title: `${contentData.title} (${lang})`,
      content: `Translated content in ${lang}...`,
      metadata: {
        ...contentData.metadata,
        language: lang,
        translatedFrom: 'en'
      }
    };
  }
  
  return translations;
}

// No need to redeclare interfaces - they're already defined at the top
