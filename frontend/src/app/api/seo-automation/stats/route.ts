// Next.js API Route: SEO Automation Stats
// GET /api/seo-automation/stats

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/seo-automation/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth token if present
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching SEO automation stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch SEO automation stats',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
