/**
 * Entities Search API Route
 * GET /api/embedding/entities
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || '';
    const limit = searchParams.get('limit') || '20';

    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (type) params.append('type', type);
    params.append('limit', limit);

    const response = await fetch(`${BACKEND_URL}/api/embedding/entities?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}
