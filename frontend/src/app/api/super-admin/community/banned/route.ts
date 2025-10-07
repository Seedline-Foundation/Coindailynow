/**
 * Banned Users API Route
 * Get list of banned users
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

    // Generate mock banned users (will integrate with real system)
    const users = [
      {
        id: 'user_123',
        username: 'spammer_user',
        email: 'spammer@example.com',
        reason: 'Repeated spam violations',
        bannedBy: 'admin@coindaily.africa',
        bannedAt: new Date(Date.now() - 86400000).toISOString(),
        permanent: true,
        violationCount: 15
      },
      {
        id: 'user_456',
        username: 'troll_account',
        email: 'troll@example.com',
        reason: 'Harassment and hate speech',
        bannedBy: 'admin@coindaily.africa',
        bannedAt: new Date(Date.now() - 172800000).toISOString(),
        expiresAt: new Date(Date.now() + 604800000).toISOString(),
        permanent: false,
        violationCount: 8
      },
      {
        id: 'user_789',
        username: 'fake_news',
        email: 'fakenews@example.com',
        reason: 'Spreading misinformation',
        bannedBy: 'admin@coindaily.africa',
        bannedAt: new Date(Date.now() - 259200000).toISOString(),
        expiresAt: new Date(Date.now() + 1209600000).toISOString(),
        permanent: false,
        violationCount: 5
      }
    ];

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_BANNED_USERS',
        resource: 'banned_users',
        details: JSON.stringify({ entity: 'BannedUsers', entityId: 'all' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching banned users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
