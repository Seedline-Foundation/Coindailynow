/**
 * Distribution API Proxy - Campaign Status Update
 * Task 64: Next.js API route
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/distribution/campaigns/${params.id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update campaign status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign status' },
      { status: 500 }
    );
  }
}
