/**
 * API Proxy Utility
 * Proxies frontend API requests to the backend server
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

interface ProxyOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * Proxy a request to the backend API
 */
export async function proxyToBackend(
  path: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
  } = options;

  try {
    const url = `${BACKEND_URL}${path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Backend proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request timeout',
          message: 'Backend request timed out'
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Backend unavailable',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

/**
 * Create a proxy handler for Next.js API routes
 */
export function createProxyHandler(backendPath: string) {
  return async function handler(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const queryString = searchParams.toString();
    const path = queryString ? `${backendPath}?${queryString}` : backendPath;

    // Forward authentication headers
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    // Get request body if present
    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.json();
      } catch {
        // No body or invalid JSON
      }
    }

    return proxyToBackend(path, {
      method: request.method,
      headers,
      body,
    });
  };
}

/**
 * Proxy GraphQL requests to backend
 */
export async function proxyGraphQL(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    return proxyToBackend('/graphql', {
      method: 'POST',
      headers,
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        errors: [{ 
          message: 'Failed to proxy GraphQL request',
          extensions: { code: 'PROXY_ERROR' }
        }] 
      },
      { status: 500 }
    );
  }
}
