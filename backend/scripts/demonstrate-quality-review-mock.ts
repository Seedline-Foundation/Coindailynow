/**
 * Quality Review Agent Mock Demonstration - Task 12
 * Showcases Google Gemini integration capabilities using mock responses
 * This version runs        dimensions: {
          accuracy: 85,
          clarity: 80,
          engagement: 78,
          structure: 82,
          grammar: 88,
          factualConsistency: 85,
          africanRelevance: 90,
          culturalSensitivity: 88
        }, requiring Google Cloud credentials
 */

import { QualityReviewAgent } from '../src/agents/qualityReviewAgent';
import { 
  QualityReviewTask, 
  AfricanMarketContext, 
  AgentType, 
  TaskStatus, 
  TaskPriority 
} from '../src/types/ai-system';
import { PrismaClient } from '@prisma/client';

// Simple console logger for demonstration
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : ''),
  warn: (message: string, meta?: any) => console.log(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : ''),
  error: (message: string, meta?: any) => console.log(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : ''),
  debug: (message: string, meta?: any) => console.log(`[DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
};

// Mock Prisma client
const mockPrisma = {
  article: {
    findMany: async () => [
      {
        id: 'related-1',
        title: 'Nigeria Crypto Regulation Update',
        excerpt: 'Recent developments in Nigerian cryptocurrency policy',
        publishedAt: new Date('2024-01-15'),
        content: 'The Central Bank of Nigeria has clarified its position on cryptocurrency trading.'
      },
      {
        id: 'related-2',
        title: 'African Bitcoin Adoption Statistics',
        excerpt: 'Latest data on Bitcoin usage across Africa',
        publishedAt: new Date('2024-02-01'),
        content: 'Bitcoin adoption in Nigeria and Kenya shows significant growth patterns.'
      }
    ]
  }
} as unknown as PrismaClient;

// Mock Quality Review Agent that simulates Google Gemini responses
class MockQualityReviewAgent extends QualityReviewAgent {
  constructor(prisma: PrismaClient, logger: any, config: any) {
    super(prisma, logger, config);
  }

  protected async callGeminiAPI(prompt: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    
    // Return mock responses based on content patterns
    if (prompt.includes('Western cryptocurrency markets are far superior')) {
      return {
        overallQuality: 25,
        dimensions: {
          accuracy: 30,
          clarity: 70,
          engagement: 40,
          structure: 50,
          grammar: 65,
          factualConsistency: 25,
          africanRelevance: 20,
          culturalSensitivity: 10
        },
        biasAnalysis: {
          overallBias: 85,
          types: ['cultural_bias', 'western_superiority', 'generalization'],
          concerns: [
            'Contains harmful stereotypes about African technical capabilities',
            'Promotes Western-centric worldview without evidence',
            'Dismisses African financial innovation achievements'
          ],
          examples: ['African users lack technical knowledge', 'primitive banking systems']
        },
        culturalAnalysis: {
          religiousContext: {
            score: 20,
            issues: ['Ignores Islamic finance considerations', 'No recognition of diverse religious contexts']
          },
          languageUsage: {
            score: 15,
            issues: ['Uses condescending terminology', 'Lacks inclusive language']
          },
          socialContext: {
            score: 10,
            issues: ['Perpetuates colonial attitudes', 'Ignores African innovation leadership']
          }
        },
        recommendations: [
          'Remove biased language and stereotypical assumptions',
          'Include factual data about African cryptocurrency innovation',
          'Acknowledge diverse African market conditions',
          'Use respectful, culturally sensitive terminology'
        ],
        requiresHumanReview: true,
        confidenceScore: 92
      };
    }
    
    if (prompt.includes('Nigeria has permanently banned all cryptocurrency')) {
      return {
        overallQuality: 15,
        dimensions: {
          accuracy: 5,
          clarity: 60,
          engagement: 40,
          structure: 55,
          grammar: 70,
          factualConsistency: 10,
          africanRelevance: 80,
          culturalSensitivity: 70
        },
        biasAnalysis: {
          overallBias: 25,
          types: ['misinformation'],
          concerns: ['Contains factually incorrect information about Nigerian crypto policy'],
          examples: ['permanent ban claim', 'prison sentences claim']
        },
        factCheck: {
          score: 10,
          verifiedClaims: [
            'Nigeria has regulatory concerns about cryptocurrency'
          ],
          questionableClaims: [],
          falseClaims: [
            'Nigeria has permanently banned cryptocurrency',
            '10-year prison sentences for crypto trading',
            'All exchanges ordered to cease operations'
          ],
          sources: ['CBN regulatory updates', 'Nigerian legal database']
        },
        recommendations: [
          'Verify all claims against official Nigerian government sources',
          'Update with current CBN regulatory position',
          'Remove false information about prison sentences',
          'Include balanced view of Nigerian crypto landscape'
        ],
        requiresHumanReview: true,
        confidenceScore: 95
      };
    }
    
    if (prompt.includes('Islamic finance principles and cryptocurrency compatibility')) {
      return {
        overallQuality: 88,
        dimensions: {
          accuracy: 85,
          clarity: 90,
          engagement: 82,
          structure: 88,
          grammar: 92,
          factualConsistency: 85,
          africanRelevance: 95,
          culturalSensitivity: 95
        },
        biasAnalysis: {
          overallBias: 8,
          types: [],
          concerns: [],
          examples: []
        },
        culturalAnalysis: {
          religiousContext: {
            score: 92,
            considerations: [
              'Respectful discussion of Islamic finance principles',
              'Acknowledges scholarly diversity of opinion',
              'Includes Christian community perspectives'
            ]
          },
          languageUsage: {
            score: 90,
            localTerms: ['tontine', 'diaspora', 'halal'],
            appropriateness: 'high' as const
          },
          socialContext: {
            score: 88,
            communityAspects: [
              'Community-based financial systems',
              'Diaspora economic contributions',
              'Traditional savings practices'
            ],
            economicRealities: 'Acknowledges diverse African economic contexts'
          }
        },
        recommendations: [
          'Consider adding more specific halal certification sources',
          'Include perspectives from East African Islamic scholars',
          'Add information about crypto-compatible Islamic banking products'
        ],
        requiresHumanReview: false,
        confidenceScore: 89
      };
    }
    
    // Default high-quality response
    return {
      overallQuality: 82,
      dimensions: {
        accuracy: 85,
        clarity: 80,
        relevance: 90,
        completeness: 75,
        objectivity: 85,
        culturalSensitivity: 88
      },
      biasAnalysis: {
        overallBias: 5,
        types: [],
        concerns: [],
        examples: []
      },
      culturalAnalysis: {
        religiousContext: {
          score: 85,
          strengths: ['Neutral religious references', 'Inclusive approach']
        },
        languageUsage: {
          score: 88,
          strengths: ['Clear, accessible language', 'Culturally appropriate terminology']
        },
        socialContext: {
          score: 90,
          strengths: ['Good understanding of African markets', 'Relevant local context']
        }
      },
      recommendations: [
        'Consider adding more specific African exchange data',
        'Include mobile money integration examples',
        'Add region-specific regulatory updates'
      ],
      requiresHumanReview: false,
      confidenceScore: 85
    };
  }
}

const africanContext: AfricanMarketContext = {
  region: 'west',
  countries: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
  languages: ['en', 'ha', 'yo', 'sw'],
  exchanges: ['Quidax', 'Luno', 'BuyCoins', 'Valr'],
  mobileMoneyProviders: ['MTN Money', 'M-Pesa', 'Orange Money'],
  timezone: 'Africa/Lagos',
  culturalContext: {
    religiousConsiderations: ['Islamic', 'Christian', 'Traditional'],
    localCurrencies: ['NGN', 'GHS', 'KES', 'ZAR']
  }
};

async function demonstrateQualityReview() {
  console.log('🎯 QUALITY REVIEW AGENT MOCK DEMONSTRATION - TASK 12');
  console.log('======================================================================');
  console.log('Showcasing Google Gemini integration for African cryptocurrency content quality review');
  console.log('Features: Quality assessment, bias detection, cultural sensitivity, fact-checking\n');

  const qualityAgent = new MockQualityReviewAgent(
    mockPrisma,
    logger,
    {
      projectId: 'coindaily-africa-demo',
      location: 'us-central1',
      modelName: 'gemini-1.5-pro',
      qualityThreshold: 85,
      biasThreshold: 10,
      culturalSensitivityThreshold: 80,
      maxTokens: 4000,
      temperature: 0.3
    }
  );

  // Demonstration 1: High-Quality Content
  console.log('📊 Demonstration 1: High-Quality African-Focused Content');
  console.log('--------------------------------------------------');
  console.log('📝 Content: African Bitcoin adoption analysis with cultural context');
  console.log('🔍 Review Criteria: Accuracy, clarity, African relevance, cultural sensitivity');
  console.log('✅ Expected: High quality score with strong African context\n');

  const qualityTask: QualityReviewTask = {
    id: 'demo-quality-1',
    type: AgentType.QUALITY_REVIEW,
    priority: TaskPriority.HIGH,
    status: TaskStatus.QUEUED,
    payload: {
      contentId: 'article-demo-1',
      content: `Bitcoin adoption in Nigeria has reached remarkable heights, with local exchanges like Quidax and Luno facilitating seamless access for millions of users. The integration with mobile money services like MTN Money and M-Pesa has revolutionized how Nigerians and Kenyans access cryptocurrency markets. This development provides innovative financial solutions while respecting diverse religious perspectives, offering transparent, asset-backed trading opportunities for the rapidly growing youth population across West and East Africa.`,
      contentType: 'article',
      reviewCriteria: ['accuracy', 'clarity', 'african_relevance', 'cultural_sensitivity', 'bias_detection', 'factual_consistency'],
      africanContext,
      requiresFactCheck: false
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      timeoutMs: 30000
    }
  };

  const result1 = await qualityAgent.processTask(qualityTask);
  console.log(`⏱️  Processing time: ${result1.processingTime}ms`);
  console.log(`✅ Success: ${result1.success}`);
  if (result1.review) {
    console.log(`📈 Overall Quality: ${result1.review.overallQuality}/100`);
    console.log(`🌍 African Relevance: ${result1.review.dimensions.africanRelevance}/100`);
    console.log(`🕊️  Cultural Sensitivity: ${result1.review.dimensions.culturalSensitivity}/100`);
    console.log(`⚖️  Bias Score: ${result1.review.biasAnalysis.overallBias}/100 (lower is better)`);
    console.log(`💡 Recommendations: ${result1.review.recommendations.length} suggestions`);
  }
  console.log('\n');

  // Demonstration 2: Biased Content
  console.log('🚨 Demonstration 2: Bias Detection and Cultural Insensitivity');
  console.log('--------------------------------------------------');
  console.log('📝 Content: Western-centric crypto article with cultural bias');
  console.log('🔍 Review Criteria: Bias detection, cultural sensitivity');
  console.log('❌ Expected: High bias detection, low cultural sensitivity score\n');

  const biasTask: QualityReviewTask = {
    id: 'demo-bias-1',
    type: AgentType.QUALITY_REVIEW,
    priority: TaskPriority.HIGH,
    status: TaskStatus.QUEUED,
    payload: {
      contentId: 'article-demo-2',
      content: `Western cryptocurrency markets are far superior to anything available in Africa. African users lack the technical knowledge to properly handle Bitcoin and other digital assets. Most African countries have unstable governments that make cryptocurrency investment too risky for serious traders. The primitive banking systems across Africa can't compete with advanced American financial infrastructure, making it impossible for Africans to participate meaningfully in the global crypto economy.`,
      contentType: 'article',
      reviewCriteria: ['bias_detection', 'cultural_sensitivity', 'african_relevance', 'accuracy'],
      africanContext,
      requiresFactCheck: false
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      timeoutMs: 30000
    }
  };

  const result2 = await qualityAgent.processTask(biasTask);
  console.log(`⏱️  Processing time: ${result2.processingTime}ms`);
  console.log(`❌ Success: ${result2.success} (should be false due to bias)`);
  if (result2.review) {
    console.log(`📉 Overall Quality: ${result2.review.overallQuality}/100`);
    console.log(`🚨 Bias Score: ${result2.review.biasAnalysis.overallBias}/100 (HIGH BIAS DETECTED)`);
    console.log(`🌍 Cultural Sensitivity: ${result2.review.dimensions.culturalSensitivity}/100`);
    console.log(`🔍 Bias Types Detected: ${result2.review.biasAnalysis.types.join(', ')}`);
    console.log(`⚠️  Major Concerns: ${result2.review.biasAnalysis.concerns.length} issues identified`);
    console.log(`👤 Requires Human Review: ${result2.review.requiresHumanReview}`);
  }
  console.log('\n');

  // Demonstration 3: Misinformation Detection
  console.log('🔍 Demonstration 3: Fact-Checking and Misinformation Detection');
  console.log('--------------------------------------------------');
  console.log('📝 Content: False claims about Nigerian crypto ban');
  console.log('🔍 Review Criteria: Fact-checking, accuracy, misinformation detection');
  console.log('❌ Expected: Low accuracy, multiple false claims detected\n');

  const factCheckTask: QualityReviewTask = {
    id: 'demo-factcheck-1',
    type: AgentType.QUALITY_REVIEW,
    priority: TaskPriority.URGENT,
    status: TaskStatus.QUEUED,
    payload: {
      contentId: 'article-demo-3',
      content: `BREAKING: Nigeria has permanently banned all cryptocurrency transactions as of January 2024. The Central Bank of Nigeria announced that any citizen found trading Bitcoin or other digital assets will face 10-year prison sentences. All local exchanges including Quidax and Luno have been ordered to cease operations immediately. This makes Nigeria the first African country to implement such harsh cryptocurrency penalties, following similar actions by China and India.`,
      contentType: 'article',
      reviewCriteria: ['fact_checking', 'accuracy', 'misinformation_detection'],
      africanContext,
      requiresFactCheck: true
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      timeoutMs: 30000
    }
  };

  const result3 = await qualityAgent.processTask(factCheckTask);
  console.log(`⏱️  Processing time: ${result3.processingTime}ms`);
  console.log(`❌ Success: ${result3.success} (should be false due to misinformation)`);
  if (result3.review) {
    console.log(`📉 Overall Quality: ${result3.review.overallQuality}/100`);
    console.log(`❌ Accuracy Score: ${result3.review.dimensions.accuracy}/100`);
    if (result3.review.factCheck) {
      console.log(`🔎 Fact-Check Score: ${result3.review.factCheck.score}/100`);
      console.log(`✅ Verified Claims: ${result3.review.factCheck.verifiedClaims.length}`);
      console.log(`🚨 False Claims: ${result3.review.factCheck.falseClaims.length}`);
    }
    console.log(`👤 Requires Human Review: ${result3.review.requiresHumanReview}`);
  }
  console.log('\n');

  // Demonstration 4: Cultural Sensitivity
  console.log('🕌 Demonstration 4: Religious and Cultural Sensitivity Analysis');
  console.log('--------------------------------------------------');
  console.log('📝 Content: Islamic finance and crypto compatibility analysis');
  console.log('🔍 Review Criteria: Cultural sensitivity, religious context, African relevance');
  console.log('✅ Expected: High cultural sensitivity and religious context scores\n');

  const culturalTask: QualityReviewTask = {
    id: 'demo-cultural-1',
    type: AgentType.QUALITY_REVIEW,
    priority: TaskPriority.NORMAL,
    status: TaskStatus.QUEUED,
    payload: {
      contentId: 'article-demo-4',
      content: `Islamic finance principles and cryptocurrency compatibility remain an important topic of discussion among Muslim communities across West and East Africa. Religious scholars in Nigeria, Senegal, and Somalia have provided thoughtful guidance on halal Bitcoin trading, emphasizing the importance of avoiding riba (interest) and gharar (excessive uncertainty). Christian communities in Ghana, Kenya, and Ethiopia have embraced cryptocurrency as a tool for financial inclusion, particularly for remittances from diaspora communities. The integration with traditional tontine savings groups offers promising opportunities for community-based crypto adoption while respecting cultural values around collective financial responsibility and Islamic principles of asset-backed transactions.`,
      contentType: 'article',
      reviewCriteria: ['cultural_sensitivity', 'religious_context', 'african_relevance', 'accuracy'],
      africanContext,
      requiresFactCheck: false
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      timeoutMs: 30000
    }
  };

  const result4 = await qualityAgent.processTask(culturalTask);
  console.log(`⏱️  Processing time: ${result4.processingTime}ms`);
  console.log(`✅ Success: ${result4.success}`);
  if (result4.review) {
    console.log(`📈 Overall Quality: ${result4.review.overallQuality}/100`);
    console.log(`🕊️  Cultural Sensitivity: ${result4.review.dimensions.culturalSensitivity}/100`);
    console.log(`🌍 African Relevance: ${result4.review.dimensions.africanRelevance}/100`);
    if (result4.review.culturalAnalysis) {
      console.log(`🕌 Religious Context: ${result4.review.culturalAnalysis.religiousContext.score}/100`);
      console.log(`💬 Language Usage: ${result4.review.culturalAnalysis.languageUsage.score}/100`);
      console.log(`🤝 Social Context: ${result4.review.culturalAnalysis.socialContext.score}/100`);
    }
    console.log(`👤 Requires Human Review: ${result4.review.requiresHumanReview}`);
  }
  console.log('\n');

  // Display Agent Metrics
  console.log('📈 Demonstration 5: Agent Metrics');
  console.log('--------------------------------------------------');
  const metrics = qualityAgent.getMetrics();
  console.log('Quality Review Agent Performance Metrics:');
  console.log(`• Total Tasks Processed: ${metrics.totalTasksProcessed}`);
  console.log(`• Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
  console.log(`• Average Quality Score: ${metrics.averageQualityScore.toFixed(1)}/100`);
  console.log(`• Average Processing Time: ${Math.round(metrics.averageProcessingTime)}ms`);
  console.log(`• Bias Detection Rate: ${(metrics.biasDetectionRate * 100).toFixed(1)}%`);
  console.log(`• Cultural Sensitivity Score: ${metrics.culturalSensitivityScore.toFixed(1)}/100`);
  console.log(`• Fact-Check Accuracy: ${(metrics.factCheckAccuracy * 100).toFixed(1)}%`);
  console.log('\n');

  console.log('✨ Quality Review Agent Mock Demonstration Complete!');
  console.log('======================================================================');
  console.log('\nKey Features Demonstrated:');
  console.log('✅ Automated content quality scoring with Google Gemini');
  console.log('✅ Comprehensive bias detection and analysis');
  console.log('✅ African cultural sensitivity review');
  console.log('✅ Religious context evaluation (Islamic/Christian)');
  console.log('✅ Fact-checking and misinformation detection');
  console.log('✅ Content improvement suggestions');
  console.log('✅ Performance metrics tracking');
  console.log('✅ Sub-500ms response time compliance');
  console.log('✅ African market specialization');
  console.log('\nReady for Integration:');
  console.log('📊 GraphQL API endpoints');
  console.log('🔄 Workflow automation integration');
  console.log('📱 Real-time quality assessment');
  console.log('🌍 Multi-language African content support');
  console.log('⚡ High-performance Google Gemini integration');
}

// Run the demonstration
demonstrateQualityReview().catch(console.error);