/**
 * Next.js API Route: AI/RAO Sitemap
 * Route: /ai-sitemap.xml
 * Serves RAO optimized sitemap for LLM crawlers
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/sitemap/ai`, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI sitemap from backend');
    }

    const xml = await response.text();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-AI-Optimized': 'true',
        'X-RAO-Enabled': 'true',
      },
    });
  } catch (error) {
    console.error('Error serving AI sitemap:', error);
    return new NextResponse('Error generating AI sitemap', { status: 500 });
  }
}
