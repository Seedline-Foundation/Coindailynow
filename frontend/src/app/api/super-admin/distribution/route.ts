import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if user has required permissions
      if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'MARKETING_ADMIN') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      // Mock distribution data (replace with real data from your email/push/social media services)
      const distributionData = {
        metrics: {
          totalCampaigns: 145,
          activeCampaigns: 23,
          totalRecipients: 45678,
          avgOpenRate: 24.5,
          avgClickRate: 3.8,
          avgConversionRate: 1.2,
          emailsSent: 125890,
          pushSent: 89234,
          socialPosts: 456,
          rssSubscribers: 12456
        },
        campaigns: [
          {
            id: '1',
            title: 'Bitcoin Surge Alert - Price Above $50k',
            type: 'email' as const,
            status: 'sent' as const,
            channels: ['email', 'push'],
            scheduledFor: '2024-10-01 09:00',
            sentAt: '2024-10-01 09:02',
            recipients: 12456,
            opened: 3045,
            clicked: 456,
            conversions: 89,
            createdBy: 'John Doe'
          },
          {
            id: '2',
            title: 'Weekly Crypto Newsletter - African Markets',
            type: 'email' as const,
            status: 'sent' as const,
            channels: ['email'],
            scheduledFor: '2024-10-02 10:00',
            sentAt: '2024-10-02 10:01',
            recipients: 8934,
            opened: 2234,
            clicked: 334,
            conversions: 45,
            createdBy: 'Jane Smith'
          },
          {
            id: '3',
            title: 'New Memecoin Alert: PEPE Rising',
            type: 'push' as const,
            status: 'sent' as const,
            channels: ['push', 'social'],
            scheduledFor: '2024-10-03 14:30',
            sentAt: '2024-10-03 14:32',
            recipients: 5678,
            opened: 1234,
            clicked: 189,
            conversions: 23,
            createdBy: 'Alice Johnson'
          },
          {
            id: '4',
            title: 'Ethereum 2.0 Staking Guide',
            type: 'email' as const,
            status: 'scheduled' as const,
            channels: ['email', 'social'],
            scheduledFor: '2024-10-06 08:00',
            recipients: 15678,
            opened: 0,
            clicked: 0,
            conversions: 0,
            createdBy: 'Bob Wilson'
          },
          {
            id: '5',
            title: 'Nigeria Crypto Regulation Update',
            type: 'social' as const,
            status: 'draft' as const,
            channels: ['facebook', 'twitter', 'linkedin'],
            scheduledFor: '2024-10-07 12:00',
            recipients: 23456,
            opened: 0,
            clicked: 0,
            conversions: 0,
            createdBy: 'Carol Martinez'
          },
          {
            id: '6',
            title: 'M-Pesa Crypto Integration Announcement',
            type: 'email' as const,
            status: 'sent' as const,
            channels: ['email', 'push', 'social'],
            scheduledFor: '2024-09-28 11:00',
            sentAt: '2024-09-28 11:03',
            recipients: 18934,
            opened: 4567,
            clicked: 678,
            conversions: 134,
            createdBy: 'David Lee'
          },
          {
            id: '7',
            title: 'Top 10 Crypto Wallets for Africa',
            type: 'social' as const,
            status: 'scheduled' as const,
            channels: ['twitter', 'facebook', 'instagram'],
            scheduledFor: '2024-10-08 15:00',
            recipients: 34567,
            opened: 0,
            clicked: 0,
            conversions: 0,
            createdBy: 'Emma Davis'
          },
          {
            id: '8',
            title: 'DeFi Yield Farming Masterclass',
            type: 'email' as const,
            status: 'failed' as const,
            channels: ['email'],
            scheduledFor: '2024-10-04 10:00',
            recipients: 9876,
            opened: 0,
            clicked: 0,
            conversions: 0,
            createdBy: 'Frank Miller'
          }
        ],
        socialPosts: [
          {
            id: '1',
            content: '🚀 Bitcoin just crossed $50k! African markets showing strong adoption. Read our analysis: [link] #Bitcoin #CryptoAfrica',
            platforms: ['twitter', 'facebook', 'linkedin'] as const,
            status: 'published' as const,
            publishedAt: '2024-10-01 12:00',
            reach: 12456,
            engagement: 1234,
            clicks: 345
          },
          {
            id: '2',
            content: '📊 Weekly Market Report: Top 5 memecoins gaining traction in Nigeria. PEPE up 45%, DOGE steady. Full report available now! #Memecoin #Nigeria',
            platforms: ['twitter', 'linkedin'] as const,
            status: 'published' as const,
            publishedAt: '2024-10-02 09:30',
            reach: 8934,
            engagement: 892,
            clicks: 234
          },
          {
            id: '3',
            content: '💡 How to buy Bitcoin with M-Pesa in Kenya - Step-by-step guide for beginners. Safe, fast, and reliable exchanges compared. #MPesa #Kenya #Bitcoin',
            platforms: ['facebook', 'instagram'] as const,
            status: 'published' as const,
            publishedAt: '2024-10-03 15:45',
            reach: 15678,
            engagement: 1567,
            clicks: 456
          },
          {
            id: '4',
            content: '🔥 BREAKING: South Africa announces new crypto-friendly regulations. What this means for traders and investors. Analysis inside. #SouthAfrica #CryptoNews',
            platforms: ['twitter', 'facebook', 'linkedin', 'instagram'] as const,
            status: 'scheduled' as const,
            scheduledFor: '2024-10-06 10:00',
            reach: 0,
            engagement: 0,
            clicks: 0
          },
          {
            id: '5',
            content: '📈 Ethereum staking rewards comparison: Best platforms for African users. APY rates, security, and ease of use analyzed. #Ethereum #Staking',
            platforms: ['linkedin', 'twitter'] as const,
            status: 'draft' as const,
            reach: 0,
            engagement: 0,
            clicks: 0
          },
          {
            id: '6',
            content: '🌍 Cryptocurrency adoption in Ghana reaches all-time high. Mobile money integration driving growth. Exclusive interview with local experts. #Ghana #CryptoAdoption',
            platforms: ['facebook', 'twitter'] as const,
            status: 'published' as const,
            publishedAt: '2024-10-04 14:20',
            reach: 9876,
            engagement: 987,
            clicks: 298
          }
        ]
      };

      // Create audit log
      // await prisma.auditLog.create({
      //   data: {
      //     userId: decoded.userId,
      //     action: 'VIEW_DISTRIBUTION_DATA',
      //     details: 'Accessed multi-channel distribution console',
      //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      //     userAgent: request.headers.get('user-agent') || 'unknown'
      //   }
      // });

      return NextResponse.json(distributionData);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Distribution data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
