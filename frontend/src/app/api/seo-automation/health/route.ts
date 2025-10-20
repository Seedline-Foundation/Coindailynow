// Next.js API Route: SEO Automation Health Check
// GET /api/seo-automation/health

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/seo-automation/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error checking SEO automation health:', error);
    return NextResponse.json(
      {
        error: 'Failed to check SEO automation health',
        message: error.message,
        health: {
          status: 'offline',
          integrations: {
            googleSearchConsole: false,
            ahrefs: false,
            semrush: false,
          },
          monitoring: {
            rankTracking: false,
            brokenLinks: false,
            internalLinks: false,
            schemaValidation: false,
          },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}
