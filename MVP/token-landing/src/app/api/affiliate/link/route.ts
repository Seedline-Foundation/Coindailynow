import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token from request
function verifyToken(request: NextRequest): { affiliateId: string; email: string; affiliateCode: string } | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      affiliateId: decoded.affiliateId,
      email: decoded.email,
      affiliateCode: decoded.affiliateCode,
    };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyToken(request);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    // Get affiliate data
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: tokenData.affiliateId },
      select: {
        affiliateCode: true,
        email: true,
        name: true,
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Generate affiliate link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://token.coindaily.online';
    const affiliateLink = `${baseUrl}?ref=${affiliate.affiliateCode}`;

    return NextResponse.json(
      {
        success: true,
        affiliateCode: affiliate.affiliateCode,
        affiliateLink,
        shortCode: affiliate.affiliateCode,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get affiliate link error:', error);
    return NextResponse.json(
      { error: 'Failed to get affiliate link' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
