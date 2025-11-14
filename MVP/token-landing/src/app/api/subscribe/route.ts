import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, listId } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY;
    const LIST_ID = listId || process.env.NEXT_PUBLIC_BREVO_LIST_ID;

    if (!BREVO_API_KEY) {
      console.error('Brevo API key not configured');
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Add contact to Brevo list
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds: [parseInt(LIST_ID || '1')],
        updateEnabled: true,
        attributes: {
          SIGNUP_SOURCE: 'joy_token_landing',
          SIGNUP_DATE: new Date().toISOString(),
        },
      }),
    });

    if (response.ok || response.status === 201) {
      return NextResponse.json({ success: true });
    }

    // Handle case where contact already exists
    if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.message?.includes('Contact already exist')) {
        return NextResponse.json({
          success: true,
          message: 'You are already on our whitelist!',
        });
      }
    }

    console.error('Brevo API error:', await response.text());
    return NextResponse.json(
      { success: false, message: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
