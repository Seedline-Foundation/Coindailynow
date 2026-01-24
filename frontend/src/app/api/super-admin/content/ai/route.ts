import { NextRequest, NextResponse } from 'next/server';

const checkAuth = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  return authHeader && authHeader.startsWith('Bearer ');
};

export async function GET(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock AI content data - replace with actual database call
    const aiContent = [
      {
        id: '1',
        title: 'Bitcoin Price Analysis: Technical Patterns Suggest Bullish Momentum',
        type: 'article',
        status: 'generated',
        priority: 'high',
        aiModel: 'gpt-4-turbo',
        agent: 'Content Generation Agent',
        promptTokens: 1250,
        completionTokens: 3400,
        cost: 0.12,
        quality: {
          score: 0.92,
          readability: 0.89,
          accuracy: 0.95,
          originality: 0.88
        },
        content: {
          summary: 'Technical analysis reveals strong bullish indicators for Bitcoin with potential targets above $70,000.',
          wordCount: 1200,
          readingTime: 5,
          tags: ['bitcoin', 'technical-analysis', 'price-prediction', 'crypto-market'],
          language: 'en'
        },
        seo: {
          title: 'Bitcoin Price Analysis: Bulls Target $70K as Technical Patterns Emerge',
          description: 'Latest Bitcoin technical analysis shows bullish momentum building with key support levels holding strong.',
          keywords: ['bitcoin price', 'btc analysis', 'crypto technical analysis', 'bitcoin prediction'],
          score: 0.91
        },
        generatedAt: '2024-11-04T10:30:00Z',
        reviewedAt: null,
        publishedAt: null,
        reviewer: null,
        estimatedViews: 15000,
        estimatedEngagement: 0.08
      },
      {
        id: '2',
        title: 'Ethereum Layer 2 Solutions: Comparing Arbitrum vs Optimism Performance',
        type: 'analysis',
        status: 'reviewing',
        priority: 'medium',
        aiModel: 'gpt-4-turbo',
        agent: 'Market Analysis Agent',
        promptTokens: 980,
        completionTokens: 2800,
        cost: 0.09,
        quality: {
          score: 0.88,
          readability: 0.91,
          accuracy: 0.87,
          originality: 0.85
        },
        content: {
          summary: 'Comprehensive comparison of Ethereum Layer 2 scaling solutions focusing on transaction costs and throughput.',
          wordCount: 950,
          readingTime: 4,
          tags: ['ethereum', 'layer-2', 'arbitrum', 'optimism', 'scaling'],
          language: 'en'
        },
        seo: {
          title: 'Ethereum Layer 2 Battle: Arbitrum vs Optimism Performance Analysis 2024',
          description: 'Compare Arbitrum and Optimism Layer 2 solutions for Ethereum scaling.',
          keywords: ['ethereum layer 2', 'arbitrum vs optimism', 'eth scaling', 'l2 comparison'],
          score: 0.89
        },
        generatedAt: '2024-11-04T09:15:00Z',
        reviewedAt: '2024-11-04T11:20:00Z',
        publishedAt: null,
        reviewer: 'AI Quality Agent',
        estimatedViews: 8500,
        estimatedEngagement: 0.12
      },
      {
        id: '3',
        title: 'African Crypto Adoption: Nigeria Leads Mobile Payment Revolution',
        type: 'news',
        status: 'approved',
        priority: 'high',
        aiModel: 'gpt-4-turbo',
        agent: 'Regional Content Agent',
        promptTokens: 1100,
        completionTokens: 3200,
        cost: 0.11,
        quality: {
          score: 0.94,
          readability: 0.93,
          accuracy: 0.96,
          originality: 0.91
        },
        content: {
          summary: 'Nigeria emerges as leader in African cryptocurrency adoption driven by mobile payment integration.',
          wordCount: 1350,
          readingTime: 6,
          tags: ['africa', 'nigeria', 'mobile-payments', 'crypto-adoption', 'fintech'],
          language: 'en'
        },
        seo: {
          title: 'Nigeria Leads African Crypto Revolution: Mobile Payment Adoption Soars',
          description: 'How Nigeria is driving cryptocurrency adoption across Africa through mobile payment innovations.',
          keywords: ['nigeria crypto', 'african crypto adoption', 'mobile payments africa', 'crypto nigeria'],
          score: 0.95
        },
        generatedAt: '2024-11-04T08:45:00Z',
        reviewedAt: '2024-11-04T10:15:00Z',
        publishedAt: '2024-11-04T12:00:00Z',
        reviewer: 'Human Editor',
        estimatedViews: 22000,
        estimatedEngagement: 0.15
      },
      {
        id: '4',
        title: 'DeFi Yield Farming: Risk Assessment for High-APY Protocols',
        type: 'guide',
        status: 'error',
        priority: 'low',
        aiModel: 'gpt-4-turbo',
        agent: 'DeFi Analysis Agent',
        promptTokens: 850,
        completionTokens: 0,
        cost: 0.03,
        quality: {
          score: 0,
          readability: 0,
          accuracy: 0,
          originality: 0
        },
        content: null,
        seo: null,
        generatedAt: '2024-11-04T11:30:00Z',
        reviewedAt: null,
        publishedAt: null,
        reviewer: null,
        error: 'API rate limit exceeded. Retry scheduled.',
        estimatedViews: 0,
        estimatedEngagement: 0
      }
    ];

    // Filter content based on status and priority
    let filteredContent = aiContent;
    
    if (status !== 'all') {
      filteredContent = filteredContent.filter(item => item.status === status);
    }
    
    if (priority !== 'all') {
      filteredContent = filteredContent.filter(item => item.priority === priority);
    }

    // Transform data to match frontend interface
    const transformedContent = filteredContent.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      aiModel: item.aiModel,
      generatedBy: item.agent,
      status: item.status.toUpperCase(),
      qualityScore: Math.round((item.quality?.score || 0) * 100),
      readabilityScore: Math.round((item.quality?.readability || 0) * 100),
      seoScore: Math.round((item.seo?.score || 0) * 100),
      wordCount: item.content?.wordCount || 0,
      generatedAt: item.generatedAt,
      reviewedAt: item.reviewedAt,
      reviewedBy: item.reviewer,
      category: item.type || 'uncategorized',
      tags: item.content?.tags || []
    }));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContent = transformedContent.slice(startIndex, endIndex);

    // Calculate summary statistics
    const stats = {
      total: aiContent.length,
      generated: aiContent.filter(item => item.status === 'generated').length,
      reviewing: aiContent.filter(item => item.status === 'reviewing').length,
      approved: aiContent.filter(item => item.status === 'approved').length,
      published: aiContent.filter(item => item.status === 'published').length,
      errors: aiContent.filter(item => item.status === 'error').length,
      pending: aiContent.filter(item => item.status === 'generated' || item.status === 'reviewing').length,
      totalCost: parseFloat(aiContent.reduce((sum, item) => sum + item.cost, 0).toFixed(2)),
      avgQuality: aiContent.length > 0 ? (aiContent.reduce((sum, item) => sum + (item.quality?.score || 0), 0) / aiContent.length) * 100 : 0,
      avgReadability: aiContent.length > 0 ? (aiContent.reduce((sum, item) => sum + (item.quality?.readability || 0), 0) / aiContent.length) * 100 : 0
    };

    return NextResponse.json({
      contents: paginatedContent,
      stats,
      pagination: {
        page,
        limit,
        total: transformedContent.length,
        pages: Math.ceil(transformedContent.length / limit)
      }
    });
  } catch (error) {
    console.error('AI content fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, contentId, ...data } = await request.json();

    // Handle different actions
    switch (action) {
      case 'approve':
        // TODO: Implement content approval
        console.log('Approving content:', contentId);
        return NextResponse.json({ success: true, message: 'Content approved' });
        
      case 'reject':
        // TODO: Implement content rejection
        console.log('Rejecting content:', contentId, data.reason);
        return NextResponse.json({ success: true, message: 'Content rejected' });
        
      case 'regenerate':
        // TODO: Implement content regeneration
        console.log('Regenerating content:', contentId);
        return NextResponse.json({ success: true, message: 'Content regeneration started' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI content action error:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}