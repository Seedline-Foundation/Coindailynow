/**
 * Community Analytics API Route
 * Get community moderation analytics
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

    if (!user || !['SUPER_ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate mock analytics (will integrate with real system)
    const analytics = {
      totalComments: 45678,
      totalReports: 234,
      totalBans: 45,
      activeUsers: 12456,
      moderationRate: 95.5,
      responseTime: 12,
      topReasons: [
        { reason: 'Spam', count: 89 },
        { reason: 'Harassment', count: 56 },
        { reason: 'Misinformation', count: 42 },
        { reason: 'Scam/Fraud', count: 28 },
        { reason: 'Hate Speech', count: 19 }
      ],
      trend: Array.from({ length: 7 }, (_, i) => ({
        date: `Day ${i + 1}`,
        reports: Math.floor(Math.random() * 30 + 20),
        bans: Math.floor(Math.random() * 8 + 2)
      }))
    };

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_COMMUNITY_ANALYTICS',
        resource: 'community_analytics',
        details: JSON.stringify({ entity: 'CommunityAnalytics', entityId: 'all' }),
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
    console.error('Error fetching community analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
