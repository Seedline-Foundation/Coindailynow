/**
 * Workflow Orchestration API Proxy - Workflows
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    
    if (searchParams.get('status')) params.append('status', searchParams.get('status')!);
    if (searchParams.get('workflowType')) params.append('workflowType', searchParams.get('workflowType')!);
    if (searchParams.get('isActive')) params.append('isActive', searchParams.get('isActive')!);
    if (searchParams.get('search')) params.append('search', searchParams.get('search')!);

    const response = await fetch(`${API_BASE_URL}/api/workflow-orchestration/workflows?${params}`, {
      method: 'GET',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/workflow-orchestration/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
