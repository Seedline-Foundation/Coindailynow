/**
 * Region Details API Proxy - Task 65
 */

import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// GET /api/localization/regions/[identifier]
export async function GET(
  request: Request,
  { params }: { params: { identifier: string } }
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/localization/regions/${params.identifier}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
