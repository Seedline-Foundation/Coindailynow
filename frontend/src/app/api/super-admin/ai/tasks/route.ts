/**
 * AI Tasks API Route
 * Get recent AI tasks with their status
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

    if (!user || !['SUPER_ADMIN', 'TECH_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate mock task data (will integrate with real task queue)
    const generateTasks = () => {
      const agentTypes = [
        'content_generation',
        'translation',
        'image_generation',
        'sentiment_analysis',
        'moderation',
        'market_analysis',
        'seo_optimization',
        'social_media',
        'quality_review'
      ];

      const statuses: Array<'queued' | 'processing' | 'completed' | 'failed'> = [
        'completed',
        'completed',
        'completed',
        'processing',
        'processing',
        'queued',
        'queued',
        'failed'
      ];

      const priorities: Array<'low' | 'normal' | 'high' | 'urgent'> = [
        'normal',
        'normal',
        'high',
        'normal',
        'low',
        'urgent',
        'normal',
        'high'
      ];

      return Array.from({ length: 50 }, (_, i) => {
        const status = statuses[i % statuses.length];
        const createdAt = new Date(Date.now() - Math.random() * 3600000);
        const processingTime = status === 'completed' ? Math.random() * 20 + 2 : undefined;
        const completedAt = status === 'completed' 
          ? new Date(createdAt.getTime() + (processingTime || 0) * 1000).toISOString()
          : undefined;

        return {
          id: `task_${i + 1}`,
          agentType: agentTypes[Math.floor(Math.random() * agentTypes.length)],
          status,
          priority: priorities[i % priorities.length],
          createdAt: createdAt.toISOString(),
          completedAt,
          processingTime: processingTime ? parseFloat(processingTime.toFixed(1)) : undefined,
          error: status === 'failed' ? 'API rate limit exceeded' : undefined
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const tasks = generateTasks();

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_AI_TASKS',
        resource: 'ai_tasks',
        details: JSON.stringify({ entity: 'AITask', entityId: 'all' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      tasks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching AI tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
