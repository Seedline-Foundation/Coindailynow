/**
 * Community Moderation API Route
 * Get moderation queue items
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

    if (!user || !['SUPER_ADMIN', 'CONTENT_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate mock moderation queue (will integrate with real system)
    const items = [
      {
        id: '1',
        type: 'comment' as const,
        content: 'This is spam content promoting illegal activities',
        author: 'spammer@example.com',
        authorId: 'user_123',
        reports: 12,
        reason: 'Spam and illegal content',
        status: 'pending' as const,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        flaggedAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '2',
        type: 'comment' as const,
        content: 'Offensive language and harassment towards other users',
        author: 'troll@example.com',
        authorId: 'user_456',
        reports: 8,
        reason: 'Harassment',
        status: 'pending' as const,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        flaggedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        type: 'post' as const,
        content: 'Fake news about cryptocurrency regulations',
        author: 'fakenews@example.com',
        authorId: 'user_789',
        reports: 15,
        reason: 'Misinformation',
        status: 'pending' as const,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        flaggedAt: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: '4',
        type: 'comment' as const,
        content: 'Great article! Very informative.',
        author: 'gooduser@example.com',
        authorId: 'user_101',
        reports: 0,
        reason: 'N/A',
        status: 'approved' as const,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        flaggedAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: '5',
        type: 'comment' as const,
        content: 'Scam link promoting fake investment',
        author: 'scammer@example.com',
        authorId: 'user_202',
        reports: 20,
        reason: 'Scam/Fraud',
        status: 'rejected' as const,
        createdAt: new Date(Date.now() - 18000000).toISOString(),
        flaggedAt: new Date(Date.now() - 16200000).toISOString()
      }
    ];

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_MODERATION_QUEUE',
        resource: 'moderation_queue',
        details: JSON.stringify({ entity: 'ModerationQueue', entityId: 'all' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      items,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!user || !['SUPER_ADMIN', 'CONTENT_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { itemId, action } = await request.json();

    // Log moderation action
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: `MODERATE_${action.toUpperCase()}`,
        resource: 'moderation_item',
        details: JSON.stringify({ entity: 'ModerationItem', entityId: itemId, action }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Item ${action}ed successfully`
    });
  } catch (error) {
    console.error('Error moderating item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
