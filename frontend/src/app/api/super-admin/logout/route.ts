/**
 * Super Admin Logout API
 * Invalidate user session and clear tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-admin-secret-key-2024';

/**
 * POST /api/super-admin/logout
 * Logout and invalidate tokens
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    // Extract user ID from token if available
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        // Token might be invalid or expired, continue with logout anyway
        console.log('Token verification failed during logout:', error);
      }
    }

    // Log logout action if we have user ID
    if (userId) {
      try {
        await prisma.auditLog.create({
          data: {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            adminId: userId,
            action: 'logout',
            resource: 'authentication',
            details: JSON.stringify({ timestamp: new Date().toISOString() }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            status: 'success',
            User: {
              connect: { id: userId }
            }
          }
        });
      } catch (error) {
        console.error('Failed to log logout action:', error);
      }
    }

    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('super_admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    response.cookies.set('super_admin_refresh', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
