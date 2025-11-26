import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, affiliateCode } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Check if email already exists in referrals
    const existingReferral = await prisma.referral.findFirst({
      where: { referredEmail: email },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Email already referred' },
        { status: 409 }
      );
    }

    // If affiliate code provided, validate and create referral
    if (affiliateCode) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { affiliateCode },
      });

      if (!affiliate) {
        return NextResponse.json(
          { error: 'Invalid affiliate code' },
          { status: 404 }
        );
      }

      // Create referral
      const referral = await prisma.referral.create({
        data: {
          affiliateId: affiliate.id,
          referredEmail: email,
          referredName: name || null,
          ipAddress,
          userAgent,
          whitelistStatus: 'PENDING',
        },
      });

      // Update affiliate total referrals
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          totalReferrals: {
            increment: 1,
          },
          // Update conversion rate
          conversionRate: {
            set: affiliate.totalClicks > 0 
              ? ((affiliate.totalReferrals + 1) / affiliate.totalClicks) * 100
              : 0,
          },
        },
      });

      // Mark click as converted if exists
      const recentClick = await prisma.affiliateClick.findFirst({
        where: {
          affiliateId: affiliate.id,
          ipAddress: ipAddress || 'unknown',
          converted: false,
        },
        orderBy: {
          clickedAt: 'desc',
        },
      });

      if (recentClick) {
        await prisma.affiliateClick.update({
          where: { id: recentClick.id },
          data: {
            converted: true,
            convertedAt: new Date(),
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Referral recorded successfully',
          referral: {
            id: referral.id,
            affiliateCode,
            status: referral.whitelistStatus,
          },
        },
        { status: 201 }
      );
    }

    // No affiliate code - just acknowledge the submission
    return NextResponse.json(
      {
        success: true,
        message: 'Whitelist submission received',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Whitelist submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process whitelist submission' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
