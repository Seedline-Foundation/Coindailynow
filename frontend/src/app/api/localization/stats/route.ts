/**
 * Localization API Proxy Routes - Task 65
 * Next.js API routes for localization system
 */

import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// GET /api/localization/stats
export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/localization/stats`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
