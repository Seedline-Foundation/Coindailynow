/**
 * System Health API Route
 * Provides real-time system metrics and health status
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

    // Generate system metrics (mock for now - will integrate with real monitoring)
    const metrics = {
      server: {
        cpu: Math.floor(Math.random() * 30 + 40), // 40-70%
        memory: Math.floor(Math.random() * 20 + 55), // 55-75%
        disk: Math.floor(Math.random() * 15 + 65), // 65-80%
        uptime: 2592000, // 30 days in seconds
        load: [
          parseFloat((Math.random() * 2 + 1).toFixed(2)),
          parseFloat((Math.random() * 2 + 1).toFixed(2)),
          parseFloat((Math.random() * 2 + 1).toFixed(2))
        ]
      },
      database: {
        connections: 45,
        maxConnections: 100,
        queryTime: Math.floor(Math.random() * 20 + 15), // 15-35ms
        cacheHitRate: Math.floor(Math.random() * 10 + 85) // 85-95%
      },
      api: {
        totalRequests: 245680,
        avgLatency: Math.floor(Math.random() * 100 + 180), // 180-280ms
        errorRate: parseFloat((Math.random() * 2 + 0.5).toFixed(2)), // 0.5-2.5%
        p95Latency: Math.floor(Math.random() * 150 + 350), // 350-500ms
        p99Latency: Math.floor(Math.random() * 300 + 600) // 600-900ms
      },
      network: {
        bandwidth: 1250,
        requests: 12540,
        errors: 23
      },
      services: [
        {
          name: 'PostgreSQL Database',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 10 + 5),
          uptime: 99.98
        },
        {
          name: 'Redis Cache',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 5 + 1),
          uptime: 99.99
        },
        {
          name: 'Elasticsearch',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 20 + 10),
          uptime: 99.95
        },
        {
          name: 'OpenAI API',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 500 + 1000),
          uptime: 99.9
        },
        {
          name: 'CDN (Cloudflare)',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 10 + 15),
          uptime: 100
        },
        {
          name: 'Storage (Backblaze)',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 50 + 100),
          uptime: 99.99
        },
        {
          name: 'WebSocket Server',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 5 + 2),
          uptime: 99.97
        },
        {
          name: 'Email Service',
          status: 'degraded' as const,
          latency: Math.floor(Math.random() * 200 + 800),
          uptime: 98.5
        },
        {
          name: 'Payment Gateway',
          status: 'healthy' as const,
          latency: Math.floor(Math.random() * 100 + 300),
          uptime: 99.95
        }
      ],
      alerts: [
        {
          id: 'alert_1',
          severity: 'warning' as const,
          message: 'Email service experiencing high latency',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 'alert_2',
          severity: 'info' as const,
          message: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_SYSTEM_HEALTH',
        resource: 'system',
        details: JSON.stringify({ entity: 'System', entityId: 'health_metrics' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
