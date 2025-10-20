/**
 * AMP Analytics Tracking API Route
 * Tracks pageviews from AMP pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const timestamp = searchParams.get('timestamp');

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'Missing articleId' },
        { status: 400 }
      );
    }

    // Track AMP pageview
    await prisma.analyticsEvent.create({
      data: {
        id: `amp_${articleId}_${Date.now()}`,
        sessionId: `amp_session_${Date.now()}`,
        eventType: 'AMP_PAGEVIEW',
        resourceId: articleId,
        resourceType: 'ARTICLE',
        properties: JSON.stringify({
          timestamp: timestamp || new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
        }),
        metadata: JSON.stringify({
          platform: 'AMP',
          source: 'amp-pixel',
        }),
      },
    });

    // Increment view count
    await prisma.article.update({
      where: { id: articleId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error tracking AMP pageview:', error);
    
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
