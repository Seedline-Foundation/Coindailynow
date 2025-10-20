/**
 * Local SEO Statistics API Proxy
 * Next.js API route for frontend-backend communication
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/local-seo/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Local SEO statistics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch local SEO statistics', details: error.message },
      { status: 500 }
    );
  }
}
