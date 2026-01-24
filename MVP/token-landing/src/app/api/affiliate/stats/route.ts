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

    // Get affiliate stats
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: tokenData.affiliateId },
      include: {
        referrals: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        clickTracking: {
          orderBy: {
            clickedAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const totalReferrals = affiliate.referrals.length;
    const totalConversions = affiliate.referrals.filter((r: any) => r.converted).length;
    const approvedReferrals = affiliate.referrals.filter((r: any) => r.whitelistStatus === 'APPROVED').length;
    const pendingReferrals = affiliate.referrals.filter((r: any) => r.whitelistStatus === 'PENDING').length;
    const rejectedReferrals = affiliate.referrals.filter((r: any) => r.whitelistStatus === 'REJECTED').length;
    const totalTokensEarned = affiliate.referrals
      .filter((r: any) => r.converted)
      .reduce((sum: number, r: any) => sum + (r.tokensEarned || 0), 0);

    // Calculate conversion rate
    const conversionRate = affiliate.totalClicks > 0 
      ? (totalConversions / affiliate.totalClicks) * 100 
      : 0;

    // Get recent activity
    const recentClicks = affiliate.clickTracking.slice(0, 10).map((click: any) => ({
      id: click.id,
      ipAddress: click.ipAddress,
      clickedAt: click.clickedAt,
      converted: click.converted,
    }));

    const recentReferrals = affiliate.referrals.slice(0, 10).map((referral: any) => ({
      id: referral.id,
      email: referral.referredEmail,
      name: referral.referredName,
      status: referral.whitelistStatus,
      converted: referral.converted,
      tokensPurchased: referral.tokensPurchased || 0,
      tokensEarned: referral.tokensEarned || 0,
      createdAt: referral.createdAt,
      approvedAt: referral.approvedAt,
      convertedAt: referral.convertedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        stats: {
          affiliateCode: affiliate.affiliateCode,
          totalClicks: affiliate.totalClicks,
          totalReferrals,
          totalConversions,
          totalTokensEarned: Math.round(totalTokensEarned * 100) / 100,
          approvedReferrals,
          pendingReferrals,
          rejectedReferrals,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        recentClicks,
        recentReferrals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get affiliate stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
