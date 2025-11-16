import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    if (!RESEND_API_KEY || !AUDIENCE_ID) {
      console.error('Resend API key or Audience ID not configured');
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Add contact to Resend audience with unsubscribed status
    // This triggers the verification email
    const contactResponse = await resend.contacts.create({
      email: email,
      unsubscribed: false,
      audienceId: AUDIENCE_ID,
    });

    // Check if contact was added successfully or already exists
    if (contactResponse.data?.id || contactResponse.error?.message?.includes('already exists')) {
      return NextResponse.json({ 
        success: true,
        message: 'Verification email sent! Please check your inbox and verify your email to receive the whitelist form.'
      });
    }

    // Handle errors
    if (contactResponse.error) {
      console.error('Resend API error:', contactResponse.error);
      
      // If contact already exists, still return success
      if (contactResponse.error.message?.toLowerCase().includes('already')) {
        return NextResponse.json({
          success: true,
          message: 'You are already on our whitelist! Check your email for the form link.',
        });
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent! Please check your inbox and verify your email.'
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
