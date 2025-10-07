/**
 * Content API Route
 * Get and manage articles
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Allow super admin and content admin
    if (!['SUPER_ADMIN', 'CONTENT_ADMIN'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { author: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      const statusMap: Record<string, string> = {
        pending: 'PENDING_REVIEW',
        published: 'PUBLISHED',
        draft: 'DRAFT',
        rejected: 'REJECTED',
        archived: 'ARCHIVED',
      };
      where.status = statusMap[status] || status.toUpperCase();
    }

    // Get articles with pagination
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              username: true,
              email: true,
            },
          },
          Category: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              ArticleTranslation: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    
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
