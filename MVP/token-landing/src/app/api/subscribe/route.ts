import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';
import { getVerificationEmailTemplate } from '@/lib/email-templates';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Subscribe endpoint - Now sends verification email instead of welcome
 * User must verify email before receiving welcome email and sequence
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://token.coindaily.online';

    if (!RESEND_API_KEY || !AUDIENCE_ID) {
      console.error('Resend API key or Audience ID not configured');
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const verificationUrl = `${SITE_URL}/verify-email?token=${verificationToken}`;

    // Check if subscriber already exists
    const existingSubscriber = await prisma.emailSubscriber.findUnique({
      where: { email }
    });

    if (existingSubscriber) {
      if (existingSubscriber.verified) {
        return NextResponse.json({
          success: false,
          message: 'This email is already verified and subscribed.'
        }, { status: 400 });
      }

      // Update existing unverified subscriber with new token
      await prisma.emailSubscriber.update({
        where: { email },
        data: {
          verificationToken,
          tokenExpiresAt,
          ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      });
    } else {
      // Create new subscriber
      await prisma.emailSubscriber.create({
        data: {
          email,
          verificationToken,
          tokenExpiresAt,
          verified: false,
          source: 'homepage',
          ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      });
    }

    // Step 1: Add contact to Resend audience (unverified)
    const contactResponse = await resend.contacts.create({
      email: email,
      unsubscribed: false,
      audienceId: AUDIENCE_ID,
    });

    // Check for errors (except "already exists")
    if (contactResponse.error && !contactResponse.error.message?.toLowerCase().includes('already')) {
      console.error('Resend API error:', contactResponse.error);
      return NextResponse.json(
        { success: false, message: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    // Step 2: Send verification email
    const verificationEmail = getVerificationEmailTemplate({
      email,
      verificationUrl,
      siteUrl: SITE_URL
    });

    const emailResponse = await resend.emails.send({
      from: 'Joy Token Team <noreply@coindaily.online>',
      to: email,
      subject: verificationEmail.subject,
      html: verificationEmail.html,
    });

    // Check if email was sent successfully
    if (emailResponse.error) {
      console.error('Verification email sending error:', emailResponse.error);
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Verification email sent successfully:', emailResponse.data?.id);

    return NextResponse.json({ 
      success: true,
      message: 'Please check your email to verify your address.',
      requiresVerification: true
    });

  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}
