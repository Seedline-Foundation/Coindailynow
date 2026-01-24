/**
 * Distribution API Proxy - User Rewards
 * Task 64: Next.js API route
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = new URLSearchParams();
    
    if (searchParams.get('rewardType')) queryParams.append('rewardType', searchParams.get('rewardType')!);
    if (searchParams.get('limit')) queryParams.append('limit', searchParams.get('limit')!);

    const response = await fetch(
      `${BACKEND_URL}/api/distribution/rewards/user/${params.userId}?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User rewards API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user rewards' },
      { status: 500 }
    );
  }
}
