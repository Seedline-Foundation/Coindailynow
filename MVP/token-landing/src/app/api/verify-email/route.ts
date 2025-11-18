import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getWelcomeEmailTemplate } from '@/lib/email-templates';
import { formatScheduledAt, EMAIL_SEQUENCE } from '@/lib/email-scheduler';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email Verification Endpoint
 * Validates verification token, marks email as verified,
 * sends welcome email, and schedules Day 1-9 sequence
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://token.coindaily.online';
    const WHITELIST_FORM_URL = process.env.NEXT_PUBLIC_WHITELIST_FORM_URL;

    // Verify token from database
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { verificationToken: token }
    });

    if (!subscriber) {
      return NextResponse.redirect(`${SITE_URL}/?error=invalid_token`);
    }

    if (subscriber.verified) {
      return NextResponse.redirect(`${SITE_URL}/?message=already_verified`);
    }

    if (subscriber.tokenExpiresAt && new Date() > subscriber.tokenExpiresAt) {
      return NextResponse.redirect(`${SITE_URL}/?error=token_expired`);
    }

    console.log('Verifying email for:', subscriber.email);

    // Step 1: Update subscriber as verified
    await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verificationToken: null, // Clear token after verification
      }
    });

    // Step 2: Send welcome email immediately
    const welcomeEmail = getWelcomeEmailTemplate({
      email: subscriber.email,
      whitelistFormUrl: WHITELIST_FORM_URL,
      siteUrl: SITE_URL
    });

    const welcomeResponse = await resend.emails.send({
      from: 'Joy Token Team <noreply@coindaily.online>',
      to: subscriber.email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
    });

    if (welcomeResponse.error) {
      console.error('Welcome email error:', welcomeResponse.error);
    } else {
      console.log('Welcome email sent:', welcomeResponse.data?.id);
      
      // Store welcome email in database
      if (welcomeResponse.data?.id) {
        await prisma.scheduledEmail.create({
          data: {
            subscriberId: subscriber.id,
            emailType: 'welcome',
            emailSequence: 0,
            subject: welcomeEmail.subject,
            scheduledFor: new Date(),
            sentAt: new Date(),
            status: 'SENT',
            resendEmailId: welcomeResponse.data.id,
          }
        });
      }
    }

    // Step 3: Schedule Day 1-9 email sequence
    const baseTime = new Date(); // Welcome email sent now, start counting from here
    
    // Schedule all emails in the sequence using Resend's scheduledAt
    for (const emailDef of EMAIL_SEQUENCE) {
      try {
        // Calculate total hours from welcome email
        const totalHours = EMAIL_SEQUENCE
          .filter(e => e.sequence <= emailDef.sequence)
          .reduce((sum, e) => sum + e.delayHours, 0);
        
        const scheduledDate = new Date(baseTime.getTime() + totalHours * 60 * 60 * 1000);
        const scheduledAt = formatScheduledAt(scheduledDate);

        // TODO: Get actual HTML template for each day (placeholder for now)
        const emailHtml = `<h1>Day ${emailDef.sequence}: ${emailDef.subject}</h1>
<p>This is a placeholder. Replace with actual email template.</p>`;

        // Schedule email with Resend
        const scheduleResponse = await resend.emails.send({
          from: 'Joy Token Team <noreply@coindaily.online>',
          to: subscriber.email,
          subject: emailDef.subject,
          html: emailHtml,
          scheduledAt: scheduledAt
        });

        if (scheduleResponse.error) {
          console.error(`Error scheduling ${emailDef.type}:`, scheduleResponse.error);
        } else {
          console.log(`Scheduled ${emailDef.type} for ${scheduledDate.toISOString()}`);
          
          // Store in database for tracking
          if (scheduleResponse.data?.id) {
            await prisma.scheduledEmail.create({
              data: {
                subscriberId: subscriber.id,
                emailType: emailDef.type,
                emailSequence: emailDef.sequence,
                subject: emailDef.subject,
                scheduledFor: scheduledDate,
                resendEmailId: scheduleResponse.data.id,
                status: 'SENT',
              }
            });
          }
        }
      } catch (error) {
        console.error(`Failed to schedule ${emailDef.type}:`, error);
      }
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Your email has been verified successfully! Check your inbox for the welcome email.' 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Verification failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}
