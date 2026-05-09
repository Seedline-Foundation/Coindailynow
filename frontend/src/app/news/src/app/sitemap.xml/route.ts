/**
 * Next.js API Route: Sitemap Index
 * Route: /sitemap.xml
 * Serves the main sitemap index
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/sitemap`, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sitemap from backend');
    }

    const xml = await response.text();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error serving sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
