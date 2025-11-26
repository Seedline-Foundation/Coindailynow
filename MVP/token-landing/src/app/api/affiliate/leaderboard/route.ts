import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const isPublic = searchParams.get('public') === 'true';

    // Get top affiliates by total referrals
    const topAffiliates = await prisma.affiliate.findMany({
      where: {
        verified: true,
      },
      orderBy: [
        {
          totalReferrals: 'desc',
        },
        {
          conversionRate: 'desc',
        },
      ],
      take: Math.min(limit, 100), // Max 100
      select: {
        id: true,
        name: true,
        email: isPublic ? false : true, // Hide email in public leaderboard
        affiliateCode: true,
        totalClicks: true,
        totalReferrals: true,
        conversionRate: true,
        createdAt: true,
      },
    });

    // Format leaderboard data
    const leaderboard = topAffiliates.map((affiliate: any, index: number) => ({
      rank: index + 1,
      affiliateCode: affiliate.affiliateCode,
      name: affiliate.name || `Affiliate #${affiliate.affiliateCode.substring(0, 6)}`,
      ...(isPublic ? {} : { email: affiliate.email }),
      totalReferrals: affiliate.totalReferrals,
      totalClicks: affiliate.totalClicks,
      conversionRate: Math.round(affiliate.conversionRate * 100) / 100,
      joinedAt: affiliate.createdAt,
    }));

    // Get total stats
    const totalAffiliates = await prisma.affiliate.count({
      where: { verified: true },
    });

    const totalReferralsSum = await prisma.referral.count();
    const totalClicksSum = await prisma.affiliateClick.count();

    return NextResponse.json(
      {
        success: true,
        leaderboard,
        totalStats: {
          totalAffiliates,
          totalReferrals: totalReferralsSum,
          totalClicks: totalClicksSum,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to get leaderboard' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
