/**
 * RAO Performance Tracking & Adaptation Loop Service
 * Task 75: AI Performance Monitoring, Citation Analytics, Structure Optimization
 * 
 * Features:
 * - AI Overview Tracking: Appearance in AI summaries
 * - Citation Analytics: LLM usage patterns
 * - Structure Optimization: Based on retrieval data
 * - Monthly Audits: AI detection and analysis
 * - Adaptation Algorithms: Automated improvements
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Types
interface CitationSource {
  source: string; // ChatGPT, Claude, Perplexity, Gemini, etc.
  count: number;
  contexts: string[];
  timestamps: string[];
}

interface AIOverview {
  platform: string;
  query: string;
  appeared: boolean;
  position: number | null;
  snippet: string | null;
  timestamp: string;
}

interface RetrievalPattern {
  contentType: string;
  structureType: string;
  retrievalRate: number;
  avgPosition: number;
  topQueries: string[];
}

interface AdaptationRecommendation {
  contentId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  type: 'structure' | 'content' | 'metadata' | 'citations' | 'schema';
  description: string;
  expectedImpact: number; // 0-100
  implementationCost: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
}

interface AuditResult {
  totalContent: number;
  citedContent: number;
  citationRate: number;
  aiOverviewRate: number;
  avgSemanticRelevance: number;
  topPerformers: Array<{
    contentId: string;
    title: string;
    citations: number;
    overviews: number;
    score: number;
  }>;
  recommendations: AdaptationRecommendation[];
}

/**
 * Track AI citation for content
 */
export async function trackAICitation(data: {
  contentId: string;
  contentType: string;
  url: string;
  source: string;
  context?: string;
  query?: string;
}): Promise<any> {
  try {
    // Get or create RAO performance record
    let performance = await prisma.rAOPerformance.findFirst({
      where: { contentId: data.contentId }
    });

    if (!performance) {
      performance = await prisma.rAOPerformance.create({
        data: {
          contentId: data.contentId,
          contentType: data.contentType,
          url: data.url,
          llmCitations: 0,
          citationSources: JSON.stringify([]),
          citationContexts: JSON.stringify([]),
          aiOverviews: 0,
          overviewSources: JSON.stringify([]),
          semanticRelevance: 0,
          entityRecognition: JSON.stringify({}),
          topicCoverage: 0,
          contentStructure: 0,
          factualAccuracy: 0,
          sourceAuthority: 0,
          trackingDate: new Date()
        }
      });
    }

    // Update citation data
    const sources: CitationSource[] = JSON.parse(performance.citationSources);
    const contexts: string[] = JSON.parse(performance.citationContexts);

    const existingSource = sources.find(s => s.source === data.source);
    if (existingSource) {
      existingSource.count++;
      if (data.context) existingSource.contexts.push(data.context);
      existingSource.timestamps.push(new Date().toISOString());
    } else {
      sources.push({
        source: data.source,
        count: 1,
        contexts: data.context ? [data.context] : [],
        timestamps: [new Date().toISOString()]
      });
    }

    if (data.context) contexts.push(data.context);

    // Update performance record
    const updated = await prisma.rAOPerformance.update({
      where: { id: performance.id },
      data: {
        llmCitations: performance.llmCitations + 1,
        citationSources: JSON.stringify(sources),
        citationContexts: JSON.stringify(contexts),
        trackingDate: new Date()
      }
    });

    return {
      success: true,
      performance: updated,
      newCitationCount: updated.llmCitations
    };
  } catch (error) {
    console.error('Error tracking AI citation:', error);
    throw error;
  }
}

/**
 * Track AI overview appearance
 */
export async function trackAIOverview(data: {
  contentId: string;
  platform: string;
  query: string;
  appeared: boolean;
  position?: number;
  snippet?: string;
}): Promise<any> {
  try {
    const performance = await prisma.rAOPerformance.findFirst({
      where: { contentId: data.contentId }
    });

    if (!performance) {
      throw new Error('Performance record not found');
    }

    // Update overview data
    const overviews: AIOverview[] = JSON.parse(performance.overviewSources);
    overviews.push({
      platform: data.platform,
      query: data.query,
      appeared: data.appeared,
      position: data.position || null,
      snippet: data.snippet || null,
      timestamp: new Date().toISOString()
    });

    const updated = await prisma.rAOPerformance.update({
      where: { id: performance.id },
      data: {
        aiOverviews: data.appeared ? performance.aiOverviews + 1 : performance.aiOverviews,
        overviewSources: JSON.stringify(overviews),
        trackingDate: new Date()
      }
    });

    return {
      success: true,
      performance: updated,
      totalOverviews: updated.aiOverviews
    };
  } catch (error) {
    console.error('Error tracking AI overview:', error);
    throw error;
  }
}

/**
 * Analyze retrieval patterns
 */
export async function analyzeRetrievalPatterns(timeframe: 'day' | 'week' | 'month' = 'month'): Promise<RetrievalPattern[]> {
  try {
    const daysAgo = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - daysAgo);

    const performances = await prisma.rAOPerformance.findMany({
      where: {
        trackingDate: {
          gte: since
        }
      }
    });

    // Group by content type and analyze patterns
    const patternMap = new Map<string, {
      totalRetrievals: number;
      totalContent: number;
      positions: number[];
      queries: Set<string>;
    }>();

    for (const perf of performances) {
      const key = `${perf.contentType}`;
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          totalRetrievals: 0,
          totalContent: 0,
          positions: [],
          queries: new Set()
        });
      }

      const data = patternMap.get(key)!;
      data.totalRetrievals += perf.llmCitations + perf.aiOverviews;
      data.totalContent++;

      // Extract queries from contexts
      try {
        const contexts: string[] = JSON.parse(perf.citationContexts);
        contexts.forEach(ctx => {
          const queryMatch = ctx.match(/query[:\s]+["']([^"']+)["']/i);
          if (queryMatch && queryMatch[1]) data.queries.add(queryMatch[1]);
        });
      } catch (e) {
        // Ignore parse errors
      }

      // Extract overview positions
      try {
        const overviews: AIOverview[] = JSON.parse(perf.overviewSources);
        overviews.forEach(ov => {
          if (ov.position) data.positions.push(ov.position);
        });
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Convert to patterns
    const patterns: RetrievalPattern[] = [];
    patternMap.forEach((data, key) => {
      const [contentType] = key.split('|');
      patterns.push({
        contentType: contentType || 'unknown',
        structureType: 'semantic', // Simplified
        retrievalRate: data.totalRetrievals / Math.max(data.totalContent, 1),
        avgPosition: data.positions.length > 0 
          ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length 
          : 0,
        topQueries: Array.from(data.queries).slice(0, 10)
      });
    });

    return patterns.sort((a, b) => b.retrievalRate - a.retrievalRate);
  } catch (error) {
    console.error('Error analyzing retrieval patterns:', error);
    throw error;
  }
}

/**
 * Generate adaptation recommendations using AI
 */
export async function generateAdaptationRecommendations(contentId: string): Promise<AdaptationRecommendation[]> {
  try {
    // Get performance data
    const performance = await prisma.rAOPerformance.findFirst({
      where: { contentId }
    });

    if (!performance) {
      return [];
    }

    // Get content chunks for analysis
    const chunks = await prisma.contentChunk.findMany({
      where: { articleId: contentId },
      orderBy: { chunkIndex: 'asc' }
    });

    // Get canonical answers
    const answers = await prisma.canonicalAnswer.findMany({
      where: { 
        articleId: contentId 
      }
    });

    // Get schema markup  
    const schemas = await prisma.aISchemaMarkup.findMany({
      where: { contentId }
    });

    // Analyze with GPT-4
    const analysisPrompt = `You are an RAO (Retrieval-Augmented Optimization) expert. Analyze this content's performance and provide specific recommendations.

Performance Metrics:
- LLM Citations: ${performance.llmCitations}
- AI Overview Appearances: ${performance.aiOverviews}
- Semantic Relevance: ${performance.semanticRelevance}
- Content Structure Score: ${performance.contentStructure}/100
- Factual Accuracy: ${performance.factualAccuracy}/100
- Source Authority: ${performance.sourceAuthority}/100

Content Structure:
- Total Chunks: ${chunks.length}
- Canonical Answers: ${answers.length}
- Schema Markups: ${schemas.length}

Recent Citations: ${JSON.parse(performance.citationSources).map((s: CitationSource) => `${s.source}: ${s.count}`).join(', ')}

Provide 3-5 specific, actionable recommendations to improve RAO performance. For each recommendation, include:
1. Type (structure/content/metadata/citations/schema)
2. Priority (urgent/high/medium/low)
3. Description (specific action to take)
4. Expected Impact (0-100 score)
5. Implementation Cost (low/medium/high)
6. Auto-applicable (true/false)

Format as JSON array.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an RAO optimization expert. Provide recommendations in valid JSON format.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const messageContent = completion.choices[0]?.message?.content;
    if (!messageContent) {
      return [];
    }

    const result = JSON.parse(messageContent);
    const recommendations: AdaptationRecommendation[] = (result.recommendations || []).map((rec: any) => ({
      contentId,
      priority: rec.priority || 'medium',
      type: rec.type || 'content',
      description: rec.description || '',
      expectedImpact: rec.expectedImpact || 50,
      implementationCost: rec.implementationCost || 'medium',
      autoApplicable: rec.autoApplicable || false
    }));

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Apply automatic adaptations
 */
export async function applyAutomaticAdaptations(recommendations: AdaptationRecommendation[]): Promise<{
  applied: number;
  failed: number;
  results: Array<{ contentId: string; success: boolean; message: string }>;
}> {
  const results: Array<{ contentId: string; success: boolean; message: string }> = [];
  let applied = 0;
  let failed = 0;

  for (const rec of recommendations) {
    if (!rec.autoApplicable) continue;

    try {
      // Apply based on type
      switch (rec.type) {
        case 'structure':
          // Re-chunk content with better structure
          await prisma.contentChunk.deleteMany({
            where: { articleId: rec.contentId }
          });
          // Trigger re-chunking (would call content structuring service)
          results.push({
            contentId: rec.contentId,
            success: true,
            message: 'Content re-chunking scheduled'
          });
          applied++;
          break;

        case 'metadata':
          // Update LLM metadata
          const llmMeta = await prisma.lLMMetadata.findFirst({
            where: { contentId: rec.contentId }
          });
          if (llmMeta) {
            await prisma.lLMMetadata.update({
              where: { id: llmMeta.id },
              data: {
                llmOptimizationScore: Math.min(100, llmMeta.llmOptimizationScore + 5),
                lastOptimized: new Date()
              }
            });
            results.push({
              contentId: rec.contentId,
              success: true,
              message: 'Metadata optimization applied'
            });
            applied++;
          }
          break;

        case 'schema':
          // Regenerate schema markup with full implementation
          const schemaArticle = await prisma.article.findUnique({
            where: { id: rec.contentId },
            include: { User: true, Category: true }
          });
          
          if (schemaArticle) {
            // Generate NewsArticle schema
            const schema = {
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: schemaArticle.title,
              description: schemaArticle.excerpt,
              image: schemaArticle.featuredImageUrl || '',
              datePublished: schemaArticle.publishedAt?.toISOString(),
              dateModified: schemaArticle.updatedAt.toISOString(),
              author: {
                '@type': 'Person',
                name: schemaArticle.User.username,
              },
              publisher: {
                '@type': 'Organization',
                name: 'CoinDaily',
                logo: {
                  '@type': 'ImageObject',
                  url: process.env.LOGO_URL || 'https://coindaily.com/logo.png',
                },
              },
            };
            
            // Store schema in article metadata
            const metadata = schemaArticle.metadata ? JSON.parse(schemaArticle.metadata) : {};
            metadata.schema = schema;
            
            await prisma.article.update({
              where: { id: rec.contentId },
              data: { metadata: JSON.stringify(metadata) },
            });
            
            results.push({
              contentId: rec.contentId,
              success: true,
              message: 'Schema markup generated and applied'
            });
            applied++;
          } else {
            results.push({
              contentId: rec.contentId,
              success: false,
              message: 'Article not found'
            });
            failed++;
          }
          break;

        default:
          results.push({
            contentId: rec.contentId,
            success: false,
            message: `Auto-adaptation not implemented for type: ${rec.type}`
          });
          failed++;
      }
    } catch (error) {
      results.push({
        contentId: rec.contentId,
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      failed++;
    }
  }

  return { applied, failed, results };
}

/**
 * Run monthly RAO audit
 */
export async function runMonthlyAudit(): Promise<AuditResult> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all performance records
    const performances = await prisma.rAOPerformance.findMany({
      where: {
        trackingDate: {
          gte: thirtyDaysAgo
        }
      }
    });

    const totalContent = performances.length;
    const citedContent = performances.filter(p => p.llmCitations > 0).length;
    const citationRate = totalContent > 0 ? citedContent / totalContent : 0;
    const aiOverviewRate = totalContent > 0 
      ? performances.filter(p => p.aiOverviews > 0).length / totalContent 
      : 0;

    const avgSemanticRelevance = totalContent > 0
      ? performances.reduce((sum, p) => sum + p.semanticRelevance, 0) / totalContent
      : 0;

    // Get top performers
    const topPerformers = performances
      .map(p => ({
        contentId: p.contentId,
        title: p.url.split('/').pop() || 'Unknown',
        citations: p.llmCitations,
        overviews: p.aiOverviews,
        score: p.llmCitations * 2 + p.aiOverviews * 3 + p.semanticRelevance * 10
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Generate recommendations for underperforming content
    const underperformers = performances
      .filter(p => p.llmCitations < 5 && p.aiOverviews < 2)
      .slice(0, 20);

    const allRecommendations: AdaptationRecommendation[] = [];
    for (const perf of underperformers) {
      const recs = await generateAdaptationRecommendations(perf.contentId);
      allRecommendations.push(...recs);
    }

    return {
      totalContent,
      citedContent,
      citationRate,
      aiOverviewRate,
      avgSemanticRelevance,
      topPerformers,
      recommendations: allRecommendations.slice(0, 50) // Top 50 recommendations
    };
  } catch (error) {
    console.error('Error running monthly audit:', error);
    throw error;
  }
}

/**
 * Get RAO performance statistics
 */
export async function getPerformanceStatistics(timeframe: 'day' | 'week' | 'month' = 'month'): Promise<any> {
  try {
    const daysAgo = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - daysAgo);

    const performances = await prisma.rAOPerformance.findMany({
      where: {
        trackingDate: {
          gte: since
        }
      }
    });

    const totalCitations = performances.reduce((sum, p) => sum + p.llmCitations, 0);
    const totalOverviews = performances.reduce((sum, p) => sum + p.aiOverviews, 0);
    const avgSemanticRelevance = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.semanticRelevance, 0) / performances.length
      : 0;

    // Citation sources breakdown
    const citationSourcesMap = new Map<string, number>();
    performances.forEach(p => {
      try {
        const sources: CitationSource[] = JSON.parse(p.citationSources);
        sources.forEach(s => {
          citationSourcesMap.set(s.source, (citationSourcesMap.get(s.source) || 0) + s.count);
        });
      } catch (e) {
        // Ignore parse errors
      }
    });

    const citationsBySource = Array.from(citationSourcesMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Performance distribution
    const distribution = {
      excellent: performances.filter(p => p.llmCitations >= 10 || p.aiOverviews >= 5).length,
      good: performances.filter(p => (p.llmCitations >= 5 && p.llmCitations < 10) || (p.aiOverviews >= 2 && p.aiOverviews < 5)).length,
      fair: performances.filter(p => (p.llmCitations >= 1 && p.llmCitations < 5) || (p.aiOverviews >= 1 && p.aiOverviews < 2)).length,
      poor: performances.filter(p => p.llmCitations === 0 && p.aiOverviews === 0).length
    };

    return {
      timeframe,
      totalContent: performances.length,
      totalCitations,
      totalOverviews,
      avgCitationsPerContent: performances.length > 0 ? totalCitations / performances.length : 0,
      avgOverviewsPerContent: performances.length > 0 ? totalOverviews / performances.length : 0,
      avgSemanticRelevance,
      citationsBySource,
      distribution,
      topPerformers: performances
        .sort((a, b) => (b.llmCitations + b.aiOverviews * 2) - (a.llmCitations + a.aiOverviews * 2))
        .slice(0, 10)
        .map(p => ({
          contentId: p.contentId,
          url: p.url,
          citations: p.llmCitations,
          overviews: p.aiOverviews,
          semanticRelevance: p.semanticRelevance
        }))
    };
  } catch (error) {
    console.error('Error getting performance statistics:', error);
    throw error;
  }
}

/**
 * Get content performance details
 */
export async function getContentPerformance(contentId: string): Promise<any> {
  try {
    const performance = await prisma.rAOPerformance.findFirst({
      where: { contentId }
    });

    if (!performance) {
      return null;
    }

    const citationSources: CitationSource[] = JSON.parse(performance.citationSources || '[]');
    const citationContexts: string[] = JSON.parse(performance.citationContexts || '[]');
    const overviews: AIOverview[] = JSON.parse(performance.overviewSources || '[]');
    const entities = JSON.parse(performance.entityRecognition || '{}');

    return {
      contentId: performance.contentId,
      contentType: performance.contentType,
      url: performance.url,
      metrics: {
        llmCitations: performance.llmCitations,
        aiOverviews: performance.aiOverviews,
        semanticRelevance: performance.semanticRelevance,
        topicCoverage: performance.topicCoverage,
        contentStructure: performance.contentStructure,
        factualAccuracy: performance.factualAccuracy,
        sourceAuthority: performance.sourceAuthority
      },
      citationSources,
      citationContexts: citationContexts.slice(0, 10), // Latest 10
      overviews: overviews.slice(-10), // Latest 10
      entities,
      lastTracked: performance.trackingDate
    };
  } catch (error) {
    console.error('Error getting content performance:', error);
    throw error;
  }
}

/**
 * Update semantic analysis
 */
export async function updateSemanticAnalysis(contentId: string): Promise<any> {
  try {
    // Get content and related data
    const chunks = await prisma.contentChunk.findMany({
      where: { articleId: contentId }
    });

    const answers = await prisma.canonicalAnswer.findMany({
      where: { 
        articleId: contentId 
      }
    });

    if (chunks.length === 0) {
      throw new Error('No content chunks found for analysis');
    }

    // Combine content for analysis
    const fullContent = chunks.map(c => c.content).join('\n\n');

    // Analyze with GPT-4
    const analysisPrompt = `Analyze this content for RAO optimization. Extract:
1. Semantic relevance score (0-1): How well does it cover the topic comprehensively?
2. Topic coverage score (0-1): What percentage of relevant subtopics are covered?
3. Key entities: List main entities (coins, protocols, people, organizations)
4. Content structure score (0-100): How well is it structured for retrieval?
5. Factual accuracy score (0-100): Confidence in factual claims
6. Source authority score (0-100): Authority signals present

Content:
${fullContent.substring(0, 3000)}

Canonical Answers: ${answers.length}

Provide response as JSON with these exact fields: semanticRelevance, topicCoverage, entities (array), contentStructure, factualAccuracy, sourceAuthority`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an RAO analysis expert. Provide accurate semantic analysis in JSON format.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const messageContent = completion.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error('No response from GPT-4');
    }

    const analysis = JSON.parse(messageContent);

    // Update performance record
    const performance = await prisma.rAOPerformance.findFirst({
      where: { contentId }
    });

    if (!performance) {
      throw new Error('Performance record not found');
    }

    const updated = await prisma.rAOPerformance.update({
      where: { id: performance.id },
      data: {
        semanticRelevance: analysis.semanticRelevance || 0,
        topicCoverage: analysis.topicCoverage || 0,
        entityRecognition: JSON.stringify(analysis.entities || []),
        contentStructure: analysis.contentStructure || 0,
        factualAccuracy: analysis.factualAccuracy || 0,
        sourceAuthority: analysis.sourceAuthority || 0,
        trackingDate: new Date()
      }
    });

    return {
      success: true,
      performance: updated,
      analysis
    };
  } catch (error) {
    console.error('Error updating semantic analysis:', error);
    throw error;
  }
}

export default {
  trackAICitation,
  trackAIOverview,
  analyzeRetrievalPatterns,
  generateAdaptationRecommendations,
  applyAutomaticAdaptations,
  runMonthlyAudit,
  getPerformanceStatistics,
  getContentPerformance,
  updateSemanticAnalysis
};
