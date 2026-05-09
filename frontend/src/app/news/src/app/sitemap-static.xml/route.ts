/**
 * Next.js API Route: Static Pages Sitemap
 * Route: /sitemap-static.xml
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/sitemap/static`, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch static sitemap from backend');
    }

    const xml = await response.text();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Error serving static sitemap:', error);
    return new NextResponse('Error generating static sitemap', { status: 500 });
  }
}
