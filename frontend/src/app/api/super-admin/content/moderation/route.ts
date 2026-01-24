import { NextRequest, NextResponse } from 'next/server';

const checkAuth = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  return !!(authHeader && authHeader.startsWith('Bearer '));
};

export async function GET(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const severity = searchParams.get('severity') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock moderation data - replace with actual database call
    const moderationItems = [
      {
        id: '1',
        contentId: 'article_123',
        contentType: 'article',
        title: 'Suspicious Bitcoin Investment Scheme Promises 500% Returns',
        author: {
          id: 'user_456',
          name: 'Anonymous User',
          email: 'user456@example.com',
          reputation: 2.1
        },
        flaggedBy: 'AI Moderation System',
        flagReason: 'Potential financial fraud/scam content',
        severity: 'high',
        status: 'pending',
        confidence: 0.92,
        detectedIssues: [
          'Unrealistic financial promises',
          'Lacking regulatory disclaimers',
          'Suspicious website links',
          'Unverified claims'
        ],
        content: {
          excerpt: 'This revolutionary Bitcoin investment platform guarantees 500% returns in just 30 days with zero risk...',
          wordCount: 850,
          images: 3,
          links: 8,
          externalLinks: 5
        },
        aiAnalysis: {
          scamProbability: 0.89,
          sentimentScore: 0.75,
          readabilityScore: 0.82,
          factCheckScore: 0.12,
          flags: [
            'financial_fraud',
            'unrealistic_claims',
            'missing_disclaimers',
            'suspicious_links'
          ]
        },
        reports: [
          {
            id: 'report_1',
            reportedBy: 'user_789',
            reason: 'Misleading investment advice',
            description: 'This article promotes an obvious scam. The returns promised are impossible.',
            timestamp: '2024-11-04T09:30:00Z'
          },
          {
            id: 'report_2',
            reportedBy: 'user_890',
            reason: 'Spam/Scam content',
            description: 'Similar content was posted multiple times with different author names.',
            timestamp: '2024-11-04T10:15:00Z'
          }
        ],
        flaggedAt: '2024-11-04T08:45:00Z',
        reviewedAt: null,
        reviewer: null,
        actionTaken: null,
        notes: null
      },
      {
        id: '2',
        contentId: 'comment_789',
        contentType: 'comment',
        title: 'Comment on "Ethereum Price Prediction"',
        author: {
          id: 'user_321',
          name: 'CryptoTrader2024',
          email: 'trader@example.com',
          reputation: 4.2
        },
        flaggedBy: 'Community Report',
        flagReason: 'Abusive language and harassment',
        severity: 'medium',
        status: 'reviewing',
        confidence: 0.78,
        detectedIssues: [
          'Offensive language',
          'Personal attacks',
          'Off-topic content'
        ],
        content: {
          excerpt: 'You people are so stupid if you believe this garbage. The author is clearly an idiot who...',
          wordCount: 45,
          images: 0,
          links: 0,
          externalLinks: 0
        },
        aiAnalysis: {
          toxicityScore: 0.84,
          sentimentScore: -0.76,
          readabilityScore: 0.65,
          factCheckScore: null,
          flags: [
            'abusive_language',
            'personal_attacks',
            'harassment'
          ]
        },
        reports: [
          {
            id: 'report_3',
            reportedBy: 'user_555',
            reason: 'Harassment',
            description: 'This user is being abusive and attacking other community members.',
            timestamp: '2024-11-04T11:20:00Z'
          }
        ],
        flaggedAt: '2024-11-04T11:25:00Z',
        reviewedAt: '2024-11-04T12:00:00Z',
        reviewer: 'moderator_001',
        actionTaken: null,
        notes: 'Under review for policy violation'
      },
      {
        id: '3',
        contentId: 'article_456',
        contentType: 'article',
        title: 'African Central Bank Digital Currencies: Progress Update',
        author: {
          id: 'user_654',
          name: 'Financial Analyst',
          email: 'analyst@example.com',
          reputation: 7.8
        },
        flaggedBy: 'AI Moderation System',
        flagReason: 'Potential misinformation',
        severity: 'low',
        status: 'approved',
        confidence: 0.45,
        detectedIssues: [
          'Unverified statistics',
          'Missing source citations'
        ],
        content: {
          excerpt: 'Recent developments in Central Bank Digital Currencies across Africa show significant progress...',
          wordCount: 1200,
          images: 2,
          links: 12,
          externalLinks: 8
        },
        aiAnalysis: {
          scamProbability: 0.05,
          sentimentScore: 0.15,
          readabilityScore: 0.88,
          factCheckScore: 0.72,
          flags: [
            'missing_sources',
            'unverified_statistics'
          ]
        },
        reports: [],
        flaggedAt: '2024-11-04T07:30:00Z',
        reviewedAt: '2024-11-04T08:15:00Z',
        reviewer: 'moderator_002',
        actionTaken: 'approved_with_edits',
        notes: 'Approved after adding proper source citations'
      },
      {
        id: '4',
        contentId: 'article_789',
        contentType: 'article',
        title: 'Illegal Crypto Trading Methods for Tax Evasion',
        author: {
          id: 'user_999',
          name: 'Anonymous',
          email: 'anonymous@protonmail.com',
          reputation: 1.0
        },
        flaggedBy: 'AI Moderation System',
        flagReason: 'Illegal activity promotion',
        severity: 'critical',
        status: 'rejected',
        confidence: 0.96,
        detectedIssues: [
          'Promotes illegal activities',
          'Tax evasion guidance',
          'Regulatory violations',
          'Harmful financial advice'
        ],
        content: {
          excerpt: 'Here are proven methods to hide your crypto profits from tax authorities using these techniques...',
          wordCount: 950,
          images: 1,
          links: 15,
          externalLinks: 10
        },
        aiAnalysis: {
          scamProbability: 0.78,
          sentimentScore: -0.45,
          readabilityScore: 0.79,
          factCheckScore: 0.22,
          flags: [
            'illegal_activity',
            'tax_evasion',
            'regulatory_violation',
            'harmful_advice'
          ]
        },
        reports: [
          {
            id: 'report_4',
            reportedBy: 'user_111',
            reason: 'Illegal content',
            description: 'This article promotes illegal tax evasion methods.',
            timestamp: '2024-11-04T06:45:00Z'
          }
        ],
        flaggedAt: '2024-11-04T06:30:00Z',
        reviewedAt: '2024-11-04T07:00:00Z',
        reviewer: 'moderator_003',
        actionTaken: 'content_removed',
        notes: 'Content removed for promoting illegal activities. User warned.'
      }
    ];

    // Filter based on status and severity
    let filteredItems = moderationItems;
    
    if (status !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === status);
    }
    
    if (severity !== 'all') {
      filteredItems = filteredItems.filter(item => item.severity === severity);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total: moderationItems.length,
      pending: moderationItems.filter(item => item.status === 'pending').length,
      reviewing: moderationItems.filter(item => item.status === 'reviewing').length,
      approved: moderationItems.filter(item => item.status === 'approved').length,
      rejected: moderationItems.filter(item => item.status === 'rejected').length,
      critical: moderationItems.filter(item => item.severity === 'critical').length,
      high: moderationItems.filter(item => item.severity === 'high').length,
      medium: moderationItems.filter(item => item.severity === 'medium').length,
      low: moderationItems.filter(item => item.severity === 'low').length,
      avgConfidence: (moderationItems.reduce((sum, item) => sum + item.confidence, 0) / moderationItems.length).toFixed(2)
    };

    return NextResponse.json({
      items: paginatedItems,
      stats,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        pages: Math.ceil(filteredItems.length / limit)
      }
    });
  } catch (error) {
    console.error('Moderation fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, itemId, ...data } = await request.json();

    // Handle different moderation actions
    switch (action) {
      case 'approve':
        // TODO: Implement content approval
        console.log('Approving content:', itemId, data);
        return NextResponse.json({ success: true, message: 'Content approved' });
        
      case 'reject':
        // TODO: Implement content rejection
        console.log('Rejecting content:', itemId, data);
        return NextResponse.json({ success: true, message: 'Content rejected' });
        
      case 'escalate':
        // TODO: Implement escalation to human moderator
        console.log('Escalating content:', itemId, data);
        return NextResponse.json({ success: true, message: 'Content escalated for review' });
        
      case 'ban_user':
        // TODO: Implement user ban
        console.log('Banning user:', data.userId, data);
        return NextResponse.json({ success: true, message: 'User banned' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json(
      { error: 'Failed to process moderation action' },
      { status: 500 }
    );
  }
}