/**
 * Next.js API Route: Articles Sitemap
 * Route: /sitemap-articles.xml
 * Serves all published articles sitemap
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/sitemap/articles`, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch articles sitemap from backend');
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
    console.error('Error serving articles sitemap:', error);
    return new NextResponse('Error generating articles sitemap', { status: 500 });
  }
}
