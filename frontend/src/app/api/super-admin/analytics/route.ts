/**
 * Analytics API Route
 * Provides real-time platform analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get time range from query
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Generate analytics data (mock for now - will integrate with real analytics system)
    const generateTrendData = (baseValue: number, points: number) => {
      return Array.from({ length: points }, (_, i) => ({
        time: range === '24h' ? `${i * 2}:00` :
              range === '7d' ? `Day ${i + 1}` :
              range === '30d' ? `Week ${Math.floor(i / 4) + 1}` :
              `Month ${Math.floor(i / 3) + 1}`,
        value: Math.floor(baseValue + (Math.random() - 0.5) * baseValue * 0.3)
      }));
    };

    const analytics = {
      traffic: {
        total: 245680,
        change: 12.5,
        trend: generateTrendData(35000, range === '24h' ? 12 : range === '7d' ? 7 : range === '30d' ? 12 : 12)
      },
      users: {
        total: 18543,
        active: 3421,
        new: 234,
        trend: generateTrendData(500, range === '24h' ? 12 : range === '7d' ? 7 : range === '30d' ? 12 : 12)
      },
      content: {
        views: 189234,
        engagement: 68,
        avgTimeOnPage: 245,
        trend: generateTrendData(27000, range === '24h' ? 12 : range === '7d' ? 7 : range === '30d' ? 12 : 12)
      },
      revenue: {
        total: 45890,
        mrr: 38500,
        change: 8.3,
        trend: generateTrendData(6500, range === '24h' ? 12 : range === '7d' ? 7 : range === '30d' ? 12 : 12)
      },
      topArticles: [
        {
          id: '1',
          title: 'Bitcoin Surges Past $45,000 Amid Institutional Interest',
          views: 12543,
          engagement: 78
        },
        {
          id: '2',
          title: 'Ethereum 2.0 Update: What African Investors Need to Know',
          views: 9821,
          engagement: 72
        },
        {
          id: '3',
          title: 'Nigerian Crypto Adoption Reaches All-Time High',
          views: 8234,
          engagement: 85
        },
        {
          id: '4',
          title: 'Top 10 Memecoins to Watch in 2024',
          views: 7654,
          engagement: 65
        },
        {
          id: '5',
          title: 'M-Pesa Integration: Bridging Traditional and Crypto Finance',
          views: 6891,
          engagement: 81
        }
      ],
      geography: [
        { country: 'Nigeria', users: 5234, percentage: 28 },
        { country: 'Kenya', users: 3892, percentage: 21 },
        { country: 'South Africa', users: 3421, percentage: 18 },
        { country: 'Ghana', users: 2156, percentage: 12 },
        { country: 'Uganda', users: 1834, percentage: 10 },
        { country: 'Others', users: 2006, percentage: 11 }
      ]
    };

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_ANALYTICS',
        resource: 'analytics',
        details: JSON.stringify({ entity: 'Analytics', range }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
