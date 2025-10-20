/**
 * RAO Citation API Proxy - Dashboard Stats
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rao-citation/dashboard/stats`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching RAO citation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RAO citation stats' },
      { status: 500 }
    );
  }
}
