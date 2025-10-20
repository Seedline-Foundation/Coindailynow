/**
 * Distribution API Proxy - Rewards Creation
 * Task 64: Next.js API route
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/distribution/rewards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create reward API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reward' },
      { status: 500 }
    );
  }
}
