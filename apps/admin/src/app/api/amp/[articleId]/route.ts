/**
 * AMP API Proxy Routes
 * Proxies all AMP-related requests to backend
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * GET /api/amp/[articleId]
 * Get AMP page data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params;
    const response = await fetch(`${BACKEND_URL}/api/amp/${articleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/amp/[articleId]
 * Invalidate AMP cache
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params;
    
    // Get auth token from request
    const authHeader = request.headers.get('Authorization');
    
    const response = await fetch(`${BACKEND_URL}/api/amp/${articleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
