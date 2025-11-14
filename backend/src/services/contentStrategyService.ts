/**
 * Content Strategy Service - Task 76
 * 
 * Handles strategic content planning, keyword research, competitor analysis,
 * topic clustering, and trend monitoring for SEO domination.
 * 
 * Features:
 * - African + Global keyword research
 * - 90-day content calendar management
 * - Topic clustering for content organization
 * - Competitor gap analysis
 * - Viral trend monitoring
 * - AI-powered content recommendations
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface KeywordResearchInput {
  seedKeywords: string[];
  region?: string;
  category?: string;
  includeGlobal?: boolean;
}

interface KeywordAnalysis {
  keyword: string;
  region: string;
  category: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: string;
  trend: string;
  intent: string;
  priority: string;
  relatedKeywords: string[];
  topRankingUrls: string[];
  contentGap: any;
}

interface ContentCalendarInput {
  duration: number; // Days (90 default)
  region?: string;
  category?: string;
  articlesPerWeek?: number;
}

interface TopicClusterInput {
  pillarTopic: string;
  region?: string;
  category?: string;
  keywords: string[];
}

interface CompetitorInput {
  domain: string;
  region?: string;
  category?: string;
}

interface TrendInput {
  region?: string;
  category?: string;
  sources?: string[];
}

// ============================================================================
// KEYWORD RESEARCH & ANALYSIS
// ============================================================================

/**
 * AI-powered keyword research for African + Global markets
 */
export async function researchKeywords(input: KeywordResearchInput) {
  const startTime = Date.now();
  
  try {
    const { seedKeywords, region = 'GLOBAL', category = 'CRYPTO', includeGlobal = true } = input;
    
    // Use GPT-4 to generate comprehensive keyword analysis
    const prompt = `You are an expert SEO strategist specializing in cryptocurrency and blockchain content for African markets.
    
Given these seed keywords: ${seedKeywords.join(', ')}
Region: ${region}
Category: ${category}
Include Global Keywords: ${includeGlobal}

Generate a comprehensive keyword research analysis with:

1. PRIMARY KEYWORDS (5-10): High-value keywords we should target immediately
2. SECONDARY KEYWORDS (10-20): Supporting keywords for topic clusters
3. LONG-TAIL KEYWORDS (15-25): Specific, low-competition phrases
4. AFRICAN-SPECIFIC KEYWORDS (10-15): Keywords unique to African crypto markets
5. GLOBAL BLOCKCHAIN KEYWORDS (10-15): Universal crypto/blockchain terms

For each keyword provide:
- Search volume estimate (monthly)
- Difficulty score (0-100)
- Competition level (LOW/MEDIUM/HIGH)
- Trend status (RISING/FALLING/STABLE/VIRAL)
- Search intent (INFORMATIONAL/TRANSACTIONAL/NAVIGATIONAL)
- Priority (LOW/MEDIUM/HIGH/CRITICAL)
- Related keywords (3-5)
- Content gap opportunity (what's missing in current top results)

Focus on:
- African crypto exchanges (Luno, Quidax, BuyCoins, Valr)
- Mobile money integration (M-Pesa, MTN Money, Orange Money)
- African memecoin trends
- Regulatory news (Nigeria, Kenya, South Africa)
- Local payment methods
- Regional crypto adoption

Return as JSON array with structure:
{
  "keywords": [
    {
      "keyword": "string",
      "searchVolume": number,
      "difficulty": number,
      "competition": "LOW|MEDIUM|HIGH",
      "trend": "RISING|FALLING|STABLE|VIRAL",
      "intent": "INFORMATIONAL|TRANSACTIONAL|NAVIGATIONAL",
      "priority": "LOW|MEDIUM|HIGH|CRITICAL",
      "relatedKeywords": ["string"],
      "contentGap": "string describing opportunity"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    const analysis = JSON.parse(content || '{"keywords":[]}');
    
    // Save keywords to database
    const savedKeywords = [];
    for (const kw of analysis.keywords) {
      const saved = await prisma.strategyKeyword.upsert({
        where: { keyword: kw.keyword },
        update: {
          region,
          category,
          searchVolume: kw.searchVolume || 0,
          difficulty: kw.difficulty || 50,
          cpc: 0.0, // Would integrate with real API
          competition: kw.competition || 'MEDIUM',
          trend: kw.trend || 'STABLE',
          intent: kw.intent || 'INFORMATIONAL',
          priority: kw.priority || 'MEDIUM',
          relatedKeywords: JSON.stringify(kw.relatedKeywords || []),
          contentGap: JSON.stringify({ opportunity: kw.contentGap }),
          lastAnalyzedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          id: `kw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          keyword: kw.keyword,
          region,
          category,
          searchVolume: kw.searchVolume || 0,
          difficulty: kw.difficulty || 50,
          cpc: 0.0,
          competition: kw.competition || 'MEDIUM',
          trend: kw.trend || 'STABLE',
          intent: kw.intent || 'INFORMATIONAL',
          priority: kw.priority || 'MEDIUM',
          relatedKeywords: JSON.stringify(kw.relatedKeywords || []),
          contentGap: JSON.stringify({ opportunity: kw.contentGap }),
          lastAnalyzedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      savedKeywords.push(saved);
    }
    
    return {
      success: true,
      keywords: savedKeywords,
      count: savedKeywords.length,
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('Keyword research error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Get keyword recommendations based on existing content
 */
export async function getKeywordRecommendations(filters?: {
  region?: string;
  category?: string;
  priority?: string;
  limit?: number;
}) {
  try {
    const keywords = await prisma.strategyKeyword.findMany({
      where: {
        ...(filters?.region && { region: filters.region }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.priority && { priority: filters.priority }),
        status: 'ACTIVE',
      },
      orderBy: [
        { priority: 'desc' },
        { searchVolume: 'desc' },
        { difficulty: 'asc' },
      ],
      take: filters?.limit || 50,
    });
    
    return {
      success: true,
      keywords,
      count: keywords.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// TOPIC CLUSTERING
// ============================================================================

/**
 * Create topic clusters for SEO content organization
 */
export async function createTopicCluster(input: TopicClusterInput) {
  try {
    const { pillarTopic, region = 'GLOBAL', category = 'CRYPTO', keywords } = input;
    
    // Use GPT-4 to analyze cluster strategy
    const prompt = `Create a topic cluster strategy for:
Pillar Topic: ${pillarTopic}
Region: ${region}
Category: ${category}
Keywords: ${keywords.join(', ')}

Provide:
1. Cluster description (2-3 sentences)
2. Target audience
3. Content strategy (how to organize content)
4. Internal linking strategy
5. Cluster quality score (0-100)
6. SEO recommendations

Return as JSON:
{
  "description": "string",
  "targetAudience": "string",
  "contentStrategy": "string",
  "seoMetrics": {
    "recommendedArticles": number,
    "linkingStrategy": "string",
    "priorityLevel": "LOW|MEDIUM|HIGH|CRITICAL"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    const analysis = JSON.parse(content || '{}');
    
    // Create cluster
    const cluster = await prisma.topicCluster.create({
      data: {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: pillarTopic,
        pillarTopic,
        region,
        category,
        description: analysis.description,
        targetAudience: analysis.targetAudience,
        contentStrategy: JSON.stringify(analysis.contentStrategy),
        seoMetrics: JSON.stringify(analysis.seoMetrics),
        keywordIds: JSON.stringify(keywords),
        clusterScore: 75, // Initial score
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    return {
      success: true,
      cluster,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all topic clusters with statistics
 */
export async function getTopicClusters(filters?: {
  region?: string;
  category?: string;
  status?: string;
}) {
  try {
    const clusters = await prisma.topicCluster.findMany({
      where: {
        ...(filters?.region && { region: filters.region }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        Keywords: true,
        ContentCalendarItems: true,
      },
      orderBy: {
        clusterScore: 'desc',
      },
    });
    
    return {
      success: true,
      clusters,
      count: clusters.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// CONTENT CALENDAR
// ============================================================================

/**
 * Generate 90-day content calendar
 */
export async function generateContentCalendar(input: ContentCalendarInput) {
  const startTime = Date.now();
  
  try {
    const {
      duration = 90,
      region = 'GLOBAL',
      category = 'CRYPTO',
      articlesPerWeek = 5,
    } = input;
    
    // Get available keywords
    const keywords = await prisma.strategyKeyword.findMany({
      where: {
        region,
        category,
        status: 'ACTIVE',
      },
      orderBy: [
        { priority: 'desc' },
        { searchVolume: 'desc' },
      ],
      take: articlesPerWeek * (duration / 7),
    });
    
    if (keywords.length === 0) {
      return {
        success: false,
        error: 'No keywords available. Run keyword research first.',
      };
    }
    
    // Generate calendar items
    const calendarItems = [];
    const startDate = new Date();
    let keywordIndex = 0;
    
    for (let day = 0; day < duration; day++) {
      // Publish on weekdays only (Mon-Fri)
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      const dayOfWeek = currentDate.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
      
      const keyword = keywords[keywordIndex % keywords.length];
      if (!keyword) continue; // Skip if no keyword available
      keywordIndex++;
      
      // Use GPT-4 to generate content brief
      const brief = await generateContentBrief(keyword.keyword, region, category);
      
      const item = await prisma.contentCalendarItem.create({
        data: {
          id: `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: brief.title,
          slug: brief.slug,
          contentType: 'ARTICLE',
          region,
          category,
          primaryKeywordId: keyword.id,
          targetAudience: brief.targetAudience,
          contentBrief: JSON.stringify(brief),
          outline: JSON.stringify(brief.outline),
          status: 'PLANNED',
          priority: keyword.priority,
          scheduledDate: currentDate,
          estimatedReadTime: brief.estimatedReadTime || 5,
          wordCount: brief.wordCount || 1000,
          keywords: JSON.stringify([keyword.keyword, ...(brief.relatedKeywords || [])]),
          contentGoals: JSON.stringify(brief.goals),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      calendarItems.push(item);
    }
    
    return {
      success: true,
      items: calendarItems,
      count: calendarItems.length,
      duration,
      articlesPerWeek,
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('Content calendar generation error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Generate detailed content brief for a keyword
 */
async function generateContentBrief(keyword: string, region: string, category: string) {
  const prompt = `Create a detailed content brief for an article targeting:
Keyword: ${keyword}
Region: ${region}
Category: ${category}

Provide:
1. Compelling title (60 chars max, includes keyword)
2. URL-friendly slug
3. Target audience description
4. Content outline (5-7 main sections)
5. Related keywords to include (5-10)
6. Estimated read time (minutes)
7. Target word count
8. Content goals (what reader should learn/do)
9. Key takeaways (3-5 points)

Focus on African crypto context where relevant.

Return as JSON:
{
  "title": "string",
  "slug": "string",
  "targetAudience": "string",
  "outline": ["section1", "section2", ...],
  "relatedKeywords": ["keyword1", ...],
  "estimatedReadTime": number,
  "wordCount": number,
  "goals": ["goal1", ...],
  "keyTakeaways": ["point1", ...]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }
  
  return JSON.parse(content || '{}');
}

/**
 * Get content calendar items with filters
 */
export async function getContentCalendar(filters?: {
  region?: string;
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const items = await prisma.contentCalendarItem.findMany({
      where: {
        ...(filters?.region && { region: filters.region }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && filters?.endDate && {
          scheduledDate: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        PrimaryKeyword: true,
        TopicCluster: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });
    
    return {
      success: true,
      items,
      count: items.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// COMPETITOR ANALYSIS
// ============================================================================

/**
 * Analyze competitor for strategic insights
 */
export async function analyzeCompetitor(input: CompetitorInput) {
  const startTime = Date.now();
  
  try {
    const { domain, region = 'GLOBAL', category = 'NEWS' } = input;
    
    // Use GPT-4 for competitor analysis
    const prompt = `Analyze this competitor in the crypto news/media space:
Domain: ${domain}
Region: ${region}
Category: ${category}

Provide comprehensive SWOT analysis and competitive intelligence:

1. STRENGTHS: What they do well (5-10 points)
2. WEAKNESSES: Where they fall short (5-10 points)
3. CONTENT GAPS: Topics they don't cover that we can dominate (10-15 topics)
4. TOP KEYWORDS: Estimated top-ranking keywords (20-30)
5. CONTENT TYPES: Formats they use (articles, videos, podcasts, etc.)
6. PUBLISHING SCHEDULE: How often they publish
7. TARGET AUDIENCE: Who they serve
8. MONETIZATION: How they make money
9. COMPETITIVE ADVANTAGE: What would give us an edge (5-10 points)
10. THREAT LEVEL: LOW/MEDIUM/HIGH/CRITICAL

Return as JSON:
{
  "competitorName": "string",
  "domainAuthority": number (0-100),
  "monthlyTraffic": number,
  "strengths": ["point1", ...],
  "weaknesses": ["point1", ...],
  "contentGaps": ["topic1", ...],
  "topKeywords": ["keyword1", ...],
  "contentTypes": ["type1", ...],
  "publishingSchedule": "description",
  "targetAudience": "description",
  "monetizationStrategy": "description",
  "swotAnalysis": "summary",
  "competitiveAdvantage": ["advantage1", ...],
  "threatLevel": "LOW|MEDIUM|HIGH|CRITICAL"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    const analysis = JSON.parse(content || '{}');
    
    // Save to database
    const competitor = await prisma.competitorAnalysis.upsert({
      where: { domain },
      update: {
        competitorName: analysis.competitorName,
        region,
        category,
        domainAuthority: analysis.domainAuthority || 50,
        monthlyTraffic: analysis.monthlyTraffic || 0,
        strengths: JSON.stringify(analysis.strengths),
        weaknesses: JSON.stringify(analysis.weaknesses),
        contentGaps: JSON.stringify(analysis.contentGaps),
        topKeywords: JSON.stringify(analysis.topKeywords),
        contentTypes: JSON.stringify(analysis.contentTypes),
        publishingSchedule: analysis.publishingSchedule,
        targetAudience: analysis.targetAudience,
        monetizationStrategy: analysis.monetizationStrategy,
        swotAnalysis: analysis.swotAnalysis,
        competitiveAdvantage: JSON.stringify(analysis.competitiveAdvantage),
        threatLevel: analysis.threatLevel || 'MEDIUM',
        lastAnalyzedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        competitorName: analysis.competitorName,
        domain,
        region,
        category,
        domainAuthority: analysis.domainAuthority || 50,
        monthlyTraffic: analysis.monthlyTraffic || 0,
        strengths: JSON.stringify(analysis.strengths),
        weaknesses: JSON.stringify(analysis.weaknesses),
        contentGaps: JSON.stringify(analysis.contentGaps),
        topKeywords: JSON.stringify(analysis.topKeywords),
        contentTypes: JSON.stringify(analysis.contentTypes),
        publishingSchedule: analysis.publishingSchedule,
        targetAudience: analysis.targetAudience,
        monetizationStrategy: analysis.monetizationStrategy,
        swotAnalysis: analysis.swotAnalysis,
        competitiveAdvantage: JSON.stringify(analysis.competitiveAdvantage),
        threatLevel: analysis.threatLevel || 'MEDIUM',
        lastAnalyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    return {
      success: true,
      competitor,
      analysis,
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('Competitor analysis error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Get competitor gap analysis
 */
export async function getCompetitorGaps() {
  try {
    const competitors = await prisma.competitorAnalysis.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        domainAuthority: 'desc',
      },
    });
    
    // Aggregate all content gaps
    const allGaps: string[] = [];
    const gapFrequency: { [key: string]: number } = {};
    
    for (const comp of competitors) {
      if (comp.contentGaps) {
        try {
          const gaps = JSON.parse(comp.contentGaps);
          gaps.forEach((gap: string) => {
            allGaps.push(gap);
            gapFrequency[gap] = (gapFrequency[gap] || 0) + 1;
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    // Sort gaps by frequency (most common = biggest opportunity)
    const prioritizedGaps = Object.entries(gapFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([gap, frequency]) => ({ gap, frequency }));
    
    return {
      success: true,
      competitors: competitors.length,
      totalGaps: allGaps.length,
      uniqueGaps: prioritizedGaps.length,
      topGaps: prioritizedGaps.slice(0, 20),
      allCompetitors: competitors,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// TREND MONITORING
// ============================================================================

/**
 * Monitor viral trends for content opportunities
 */
export async function monitorTrends(input: TrendInput = {}) {
  const startTime = Date.now();
  
  try {
    const { region = 'GLOBAL', category = 'CRYPTO', sources = ['AI_DETECTION'] } = input;
    
    // Use GPT-4 to identify current trends
    const prompt = `Identify the top viral trends in cryptocurrency for:
Region: ${region}
Category: ${category}

Analyze current trends across:
- Twitter/X hashtags and viral topics
- Reddit discussions (r/cryptocurrency, r/bitcoin, etc.)
- Google Trends
- News headlines
- African crypto communities

For each trend provide:
1. Trend name/topic
2. Trend type (KEYWORD, TOPIC, COIN, EVENT, INFLUENCER)
3. Viral potential score (0-100)
4. Velocity (EXPLODING, RISING, STABLE, DECLINING)
5. Estimated search volume
6. Sentiment (-1 to 1)
7. Content opportunities (3-5 article ideas)
8. Related keywords
9. Key influencers driving the trend
10. Predicted duration (days)

Focus on:
- New memecoin launches
- Regulatory news
- Exchange listings
- African crypto adoption stories
- Payment integration news
- DeFi protocols gaining traction

Return top 15-20 trends as JSON:
{
  "trends": [
    {
      "trendName": "string",
      "trendType": "KEYWORD|TOPIC|COIN|EVENT|INFLUENCER",
      "trendScore": number,
      "velocity": "EXPLODING|RISING|STABLE|DECLINING",
      "searchVolume": number,
      "sentimentScore": number,
      "contentOpportunity": ["idea1", ...],
      "relatedKeywords": ["keyword1", ...],
      "influencers": ["influencer1", ...],
      "predictedDuration": number
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    const analysis = JSON.parse(content || '{"trends":[]}');
    
    // Save trends to database
    const savedTrends = [];
    for (const trend of analysis.trends) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (trend.predictedDuration || 7));
      
      const saved = await prisma.trendMonitor.create({
        data: {
          id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          trendType: trend.trendType || 'TOPIC',
          trendName: trend.trendName,
          region,
          category,
          source: 'AI_DETECTION',
          trendScore: trend.trendScore || 50,
          velocity: trend.velocity || 'RISING',
          searchVolume: trend.searchVolume || 0,
          sentimentScore: trend.sentimentScore || 0,
          contentOpportunity: JSON.stringify(trend.contentOpportunity),
          relatedKeywords: JSON.stringify(trend.relatedKeywords),
          influencers: JSON.stringify(trend.influencers),
          predictedDuration: trend.predictedDuration || 7,
          status: 'ACTIVE',
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      savedTrends.push(saved);
    }
    
    return {
      success: true,
      trends: savedTrends,
      count: savedTrends.length,
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('Trend monitoring error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Get active trends with filters
 */
export async function getActiveTrends(filters?: {
  region?: string;
  category?: string;
  trendType?: string;
  velocity?: string;
  minScore?: number;
}) {
  try {
    const trends = await prisma.trendMonitor.findMany({
      where: {
        ...(filters?.region && { region: filters.region }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.trendType && { trendType: filters.trendType }),
        ...(filters?.velocity && { velocity: filters.velocity }),
        ...(filters?.minScore && { trendScore: { gte: filters.minScore } }),
        status: 'ACTIVE',
        expiresAt: { gte: new Date() },
      },
      orderBy: [
        { trendScore: 'desc' },
        { detectedAt: 'desc' },
      ],
      take: 50,
    });
    
    return {
      success: true,
      trends,
      count: trends.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// METRICS & ANALYTICS
// ============================================================================

/**
 * Get comprehensive strategy dashboard statistics
 */
export async function getStrategyStatistics(dateRange?: {
  startDate: Date;
  endDate: Date;
}) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const start = dateRange?.startDate || thirtyDaysAgo;
    const end = dateRange?.endDate || now;
    
    // Keywords
    const totalKeywords = await prisma.strategyKeyword.count();
    const activeKeywords = await prisma.strategyKeyword.count({
      where: { status: 'ACTIVE' },
    });
    
    const keywordsByRegion = await prisma.strategyKeyword.groupBy({
      by: ['region'],
      where: { status: 'ACTIVE' },
      _count: true,
    });
    
    const keywordsByPriority = await prisma.strategyKeyword.groupBy({
      by: ['priority'],
      where: { status: 'ACTIVE' },
      _count: true,
    });
    
    // Topic Clusters
    const totalClusters = await prisma.topicCluster.count();
    const activeClusters = await prisma.topicCluster.count({
      where: { status: 'ACTIVE' },
    });
    
    // Content Calendar
    const plannedContent = await prisma.contentCalendarItem.count({
      where: {
        scheduledDate: { gte: start, lte: end },
      },
    });
    
    const publishedContent = await prisma.contentCalendarItem.count({
      where: {
        status: 'PUBLISHED',
        publishedDate: { gte: start, lte: end },
      },
    });
    
    const contentByStatus = await prisma.contentCalendarItem.groupBy({
      by: ['status'],
      where: {
        scheduledDate: { gte: start, lte: end },
      },
      _count: true,
    });
    
    // Competitors
    const competitorsTracked = await prisma.competitorAnalysis.count({
      where: { status: 'ACTIVE' },
    });
    
    const competitorsByThreat = await prisma.competitorAnalysis.groupBy({
      by: ['threatLevel'],
      where: { status: 'ACTIVE' },
      _count: true,
    });
    
    // Trends
    const activeTrends = await prisma.trendMonitor.count({
      where: {
        status: 'ACTIVE',
        expiresAt: { gte: now },
      },
    });
    
    const trendsByVelocity = await prisma.trendMonitor.groupBy({
      by: ['velocity'],
      where: {
        status: 'ACTIVE',
        expiresAt: { gte: now },
      },
      _count: true,
    });
    
    const actionedTrends = await prisma.trendMonitor.count({
      where: {
        isActioned: true,
        detectedAt: { gte: start },
      },
    });
    
    return {
      success: true,
      dateRange: { start, end },
      keywords: {
        total: totalKeywords,
        active: activeKeywords,
        byRegion: keywordsByRegion,
        byPriority: keywordsByPriority,
      },
      topicClusters: {
        total: totalClusters,
        active: activeClusters,
      },
      contentCalendar: {
        planned: plannedContent,
        published: publishedContent,
        byStatus: contentByStatus,
      },
      competitors: {
        tracked: competitorsTracked,
        byThreat: competitorsByThreat,
      },
      trends: {
        active: activeTrends,
        byVelocity: trendsByVelocity,
        actioned: actionedTrends,
      },
    };
  } catch (error: any) {
    console.error('Strategy statistics error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update calendar item status
 */
export async function updateCalendarItem(
  itemId: string,
  updates: {
    status?: string;
    assignedTo?: string;
    seoScore?: number;
    qualityScore?: number;
    articleId?: string;
    notes?: string;
  }
) {
  try {
    const item = await prisma.contentCalendarItem.update({
      where: { id: itemId },
      data: {
        ...updates,
        ...(updates.status === 'PUBLISHED' && { publishedDate: new Date() }),
        updatedAt: new Date(),
      },
    });
    
    return {
      success: true,
      item,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  researchKeywords,
  getKeywordRecommendations,
  createTopicCluster,
  getTopicClusters,
  generateContentCalendar,
  getContentCalendar,
  analyzeCompetitor,
  getCompetitorGaps,
  monitorTrends,
  getActiveTrends,
  getStrategyStatistics,
  updateCalendarItem,
};
