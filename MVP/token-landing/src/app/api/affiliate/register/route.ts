import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate unique affiliate code
function generateAffiliateCode(): string {
  // Generate a random 8-character code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { email },
    });

    if (existingAffiliate) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate unique affiliate code
    let affiliateCode = generateAffiliateCode();
    
    // Ensure code is unique (max 10 attempts)
    let attempts = 0;
    let codeExists = await prisma.affiliate.findUnique({
      where: { affiliateCode },
    });
    
    while (codeExists && attempts < 10) {
      affiliateCode = generateAffiliateCode();
      codeExists = await prisma.affiliate.findUnique({
        where: { affiliateCode },
      });
      attempts++;
    }
    
    if (codeExists) {
      return NextResponse.json(
        { error: 'Failed to generate unique affiliate code. Please try again.' },
        { status: 500 }
      );
    }

    // Create affiliate
    const affiliate = await prisma.affiliate.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        affiliateCode,
        verificationToken,
        tokenExpiresAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        affiliateCode: true,
        verified: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Affiliate registered successfully',
        code: affiliate.affiliateCode,
        affiliate: {
          id: affiliate.id,
          email: affiliate.email,
          name: affiliate.name,
          code: affiliate.affiliateCode,
          verified: affiliate.verified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Affiliate registration error:', error);
    
    // More detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to register affiliate',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
