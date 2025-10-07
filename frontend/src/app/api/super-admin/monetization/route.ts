/**
 * Monetization API Route
 * Provides revenue, subscription, and payment data
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
    const range = searchParams.get('range') || '30d';

    // Generate monetization data (mock for now)
    const generateTrendData = (baseValue: number, points: number) => {
      return Array.from({ length: points }, (_, i) => ({
        date: range === '7d' ? `Day ${i + 1}` :
              range === '30d' ? `Week ${Math.floor(i / 4) + 1}` :
              range === '90d' ? `Month ${Math.floor(i / 3) + 1}` :
              `Q${Math.floor(i / 3) + 1}`,
        amount: Math.floor(baseValue + (Math.random() - 0.3) * baseValue * 0.4)
      }));
    };

    const data = {
      revenue: {
        total: 45890,
        change: 15.3,
        trend: generateTrendData(6500, range === '7d' ? 7 : range === '30d' ? 12 : range === '90d' ? 12 : 12),
        mrr: 38500,
        arr: 462000
      },
      subscriptions: {
        total: 1245,
        active: 1089,
        new: 87,
        cancelled: 23,
        churnRate: 2.1,
        conversionRate: 12.5,
        byPlan: [
          { name: 'Basic', count: 456, revenue: 4560 },
          { name: 'Pro', count: 389, revenue: 19450 },
          { name: 'Premium', count: 244, revenue: 24400 }
        ]
      },
      payments: {
        total: 52340,
        successful: 2456,
        failed: 89,
        pending: 34,
        byGateway: [
          { name: 'Stripe', count: 1234, amount: 28900 },
          { name: 'M-Pesa', count: 856, amount: 15200 },
          { name: 'PayPal', count: 366, amount: 8240 }
        ]
      },
      refunds: {
        total: 12,
        amount: 890,
        rate: 1.7,
        recent: [
          {
            id: '1',
            user: 'john.doe@example.com',
            amount: 100,
            reason: 'Duplicate charge',
            date: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '2',
            user: 'jane.smith@example.com',
            amount: 250,
            reason: 'Service not as expected',
            date: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: '3',
            user: 'mike.jones@example.com',
            amount: 50,
            reason: 'Accidental purchase',
            date: new Date(Date.now() - 259200000).toISOString()
          },
          {
            id: '4',
            user: 'sarah.wilson@example.com',
            amount: 150,
            reason: 'Changed mind',
            date: new Date(Date.now() - 345600000).toISOString()
          },
          {
            id: '5',
            user: 'david.brown@example.com',
            amount: 340,
            reason: 'Technical issues',
            date: new Date(Date.now() - 432000000).toISOString()
          }
        ]
      },
      topCustomers: [
        {
          id: '1',
          name: 'Kwame Osei',
          email: 'kwame.osei@example.com',
          totalSpent: 2450,
          subscriptionTier: 'Premium'
        },
        {
          id: '2',
          name: 'Amina Hassan',
          email: 'amina.hassan@example.com',
          totalSpent: 1890,
          subscriptionTier: 'Pro'
        },
        {
          id: '3',
          name: 'Tendai Moyo',
          email: 'tendai.moyo@example.com',
          totalSpent: 1560,
          subscriptionTier: 'Premium'
        },
        {
          id: '4',
          name: 'Chioma Nwosu',
          email: 'chioma.nwosu@example.com',
          totalSpent: 1420,
          subscriptionTier: 'Pro'
        },
        {
          id: '5',
          name: 'Ahmed Ibrahim',
          email: 'ahmed.ibrahim@example.com',
          totalSpent: 1280,
          subscriptionTier: 'Pro'
        }
      ]
    };

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_MONETIZATION',
        resource: 'monetization',
        details: JSON.stringify({ entity: 'Monetization', range }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching monetization data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
