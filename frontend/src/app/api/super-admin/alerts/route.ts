/**
 * Super Admin Alerts API
 * 
 * System alerts and notifications management
 */

import { NextRequest, NextResponse } from 'next/server';

interface Alert {
  id: string;
  type: 'SECURITY' | 'PERFORMANCE' | 'SYSTEM' | 'CONTENT';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

/**
 * GET /api/super-admin/alerts
 * Fetch system alerts
 */
export async function GET(request: NextRequest) {
  try {
    // Mock alert data
    const alerts: Alert[] = [
      {
        id: '1',
        type: 'SECURITY',
        severity: 'high',
        title: 'Multiple Failed Login Attempts',
        message: 'Detected 5 failed login attempts from IP 192.168.1.1',
        source: 'Auth System',
        isAcknowledged: false,
        createdAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        id: '2',
        type: 'PERFORMANCE',
        severity: 'medium',
        title: 'API Response Time Degradation',
        message: 'Average response time increased to 800ms',
        source: 'Monitoring',
        isAcknowledged: false,
        createdAt: new Date('2024-01-15T09:15:00Z')
      },
      {
        id: '3',
        type: 'SYSTEM',
        severity: 'low',
        title: 'Database Backup Completed',
        message: 'Daily backup completed successfully',
        source: 'Backup System',
        isAcknowledged: true,
        acknowledgedBy: 'admin@coindaily.africa',
        acknowledgedAt: new Date('2024-01-15T08:00:00Z'),
        createdAt: new Date('2024-01-15T07:00:00Z')
      }
    ];

    return NextResponse.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/super-admin/alerts
 * Acknowledge an alert
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, acknowledgedBy } = body;

    if (!alertId || !acknowledgedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: alertId,
        isAcknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
