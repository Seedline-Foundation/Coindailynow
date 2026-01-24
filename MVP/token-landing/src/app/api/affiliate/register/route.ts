import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/affiliate/verify?token=${verificationToken}`;
    
    let emailSent = false;
    let emailError = null;
    
    try {
      const result = await resend.emails.send({
        from: 'JOY Token Affiliate <noreply@coindaily.online>',
        to: email,
        subject: 'Verify Your Affiliate Account - JOY Token',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">JOY Token Affiliate Program</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #667eea; margin-top: 0;">Verify Your Email Address</h2>
                
                <p>Hi ${name || 'there'},</p>
                
                <p>Thank you for joining the JOY Token Affiliate Program! Please verify your email address to activate your account and start earning commissions.</p>
                
                <p><strong>Your Affiliate Code:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px;">${affiliate.affiliateCode}</code></p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="background: #fff; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 14px;">
                  ${verificationUrl}
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  This verification link will expire in 24 hours.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  If you didn't create this account, please ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      });
      
      console.log('Verification email sent successfully:', result);
      emailSent = true;
    } catch (error) {
      emailError = error;
      console.error('Failed to send verification email:', error);
      console.error('Email error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : '',
        resendApiKey: process.env.RESEND_API_KEY ? 'Set (hidden)' : 'NOT SET',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent 
          ? 'Affiliate registered successfully. Please check your email to verify your account.'
          : 'Affiliate registered successfully. However, we could not send the verification email. Please contact support.',
        code: affiliate.affiliateCode,
        affiliate: {
          id: affiliate.id,
          email: affiliate.email,
          name: affiliate.name,
          code: affiliate.affiliateCode,
          verified: affiliate.verified,
        },
        requiresVerification: true,
        emailSent,
        emailError: emailError ? (emailError instanceof Error ? emailError.message : 'Unknown error') : null,
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
