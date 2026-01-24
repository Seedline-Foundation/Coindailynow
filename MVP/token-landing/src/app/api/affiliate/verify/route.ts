import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find affiliate with this token
    const affiliate = await prisma.affiliate.findUnique({
      where: { verificationToken: token },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (affiliate.tokenExpiresAt && affiliate.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 410 }
      );
    }

    // Check if already verified
    if (affiliate.verified) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Update affiliate as verified
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verificationToken: null,
        tokenExpiresAt: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully. You can now login.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
