/**
 * Admins API Route
 * Get and manage admin users
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');

    // Build where clause - only admin roles
    const where: any = {
      role: {
        in: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN', 'TECH_ADMIN']
      }
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    // Get admins with audit log count
    const admins = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            AuditLog: true,
          },
        },
      },
    });

    return NextResponse.json({ admins });

  } catch (error) {
    console.error('Error fetching admins:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
