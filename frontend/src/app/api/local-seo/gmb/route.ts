/**
 * GMB Profiles API Proxy
 * Next.js API route for GMB profile management
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const isVerified = searchParams.get('isVerified');
    const profileStatus = searchParams.get('profileStatus');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const queryParams = new URLSearchParams();
    if (country) queryParams.append('country', country);
    if (city) queryParams.append('city', city);
    if (isVerified) queryParams.append('isVerified', isVerified);
    if (profileStatus) queryParams.append('profileStatus', profileStatus);

    const response = await fetch(
      `${backendUrl}/api/local-seo/gmb?${queryParams.toString()}`,
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
    console.error('GMB profiles API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GMB profiles', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    const response = await fetch(`${backendUrl}/api/local-seo/gmb`, {
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
    console.error('Create GMB profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to create GMB profile', details: error.message },
      { status: 500 }
    );
  }
}
