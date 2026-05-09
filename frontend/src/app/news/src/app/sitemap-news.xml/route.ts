/**
 * Next.js API Route: News Sitemap
 * Route: /sitemap-news.xml
 * Serves Google News compliant sitemap
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/sitemap/news`, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch news sitemap from backend');
    }

    const xml = await response.text();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    });
  } catch (error) {
    console.error('Error serving news sitemap:', error);
    return new NextResponse('Error generating news sitemap', { status: 500 });
  }
}
