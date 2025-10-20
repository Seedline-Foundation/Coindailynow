/**
 * RAO Citation API Proxy - Schema Markup
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/rao-citation/schema-markup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error generating schema markup:', error);
    return NextResponse.json(
      { error: 'Failed to generate schema markup' },
      { status: 500 }
    );
  }
}
