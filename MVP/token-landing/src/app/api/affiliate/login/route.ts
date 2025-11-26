import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { email },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, affiliate.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if verified
    if (!affiliate.verified) {
      return NextResponse.json(
        { 
          error: 'Email not verified. Please verify your email first.',
          requiresVerification: true 
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        affiliateId: affiliate.id, 
        email: affiliate.email,
        affiliateCode: affiliate.affiliateCode 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        affiliate: {
          id: affiliate.id,
          email: affiliate.email,
          name: affiliate.name,
          affiliateCode: affiliate.affiliateCode,
          totalClicks: affiliate.totalClicks,
          totalReferrals: affiliate.totalReferrals,
          conversionRate: affiliate.conversionRate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Affiliate login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
