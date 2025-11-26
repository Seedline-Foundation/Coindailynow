import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateCode = searchParams.get('ref');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || undefined;

    if (!affiliateCode) {
      return NextResponse.json(
        { error: 'Affiliate code is required' },
        { status: 400 }
      );
    }

    // Find affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Invalid affiliate code' },
        { status: 404 }
      );
    }

    // Record the click
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
        referer,
      },
    });

    // Update total clicks count
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalClicks: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Click tracked successfully',
        affiliateCode,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
