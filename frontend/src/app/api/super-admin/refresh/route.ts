/**
 * Super Admin Refresh Token API
 * Get a new access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-admin-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

/**
 * POST /api/super-admin/refresh
 * Refresh access token
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    const cookieRefreshToken = request.cookies.get('super_admin_refresh')?.value;
    
    const tokenToVerify = refreshToken || cookieRefreshToken;

    if (!tokenToVerify) {
      return NextResponse.json(
        { success: false, error: 'Refresh token required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(tokenToVerify, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    if (decoded.type !== 'refresh') {
      return NextResponse.json(
        { success: false, error: 'Invalid token type' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const adminRoles = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN', 'TECH_ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response = NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
      }
    });

    // Update token cookie
    response.cookies.set('super_admin_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Token refresh failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
