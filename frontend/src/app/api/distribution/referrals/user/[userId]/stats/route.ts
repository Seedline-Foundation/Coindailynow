/**
 * Distribution API Proxy - Referral Stats
 * Task 64: Next.js API route
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/distribution/referrals/user/${params.userId}/stats`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Referral stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referral stats' },
      { status: 500 }
    );
  }
}
