import { NextResponse } from 'next/server';

/**
 * Run Full Technical SEO Audit API Proxy
 * POST /api/technical-seo/audit/full
 */
export async function POST() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/api/technical-seo/audit/full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Technical SEO full audit error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
