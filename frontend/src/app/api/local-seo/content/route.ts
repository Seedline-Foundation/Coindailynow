/**
 * Local Content API Proxy
 * Next.js API route for local content management
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetCity = searchParams.get('targetCity');
    const targetCountry = searchParams.get('targetCountry');
    const contentType = searchParams.get('contentType');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const queryParams = new URLSearchParams();
    if (targetCity) queryParams.append('targetCity', targetCity);
    if (targetCountry) queryParams.append('targetCountry', targetCountry);
    if (contentType) queryParams.append('contentType', contentType);

    const response = await fetch(
      `${backendUrl}/api/local-seo/content?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Local content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch local content', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    const response = await fetch(`${backendUrl}/api/local-seo/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Create local content API error:', error);
    return NextResponse.json(
      { error: 'Failed to create local content', details: error.message },
      { status: 500 }
    );
  }
}
