/**
 * Super Admin Middleware
 * Authentication and authorization for super admin routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  // Only apply to super admin routes
  if (!request.nextUrl.pathname.startsWith('/super-admin')) {
    return NextResponse.next();
  }

  // Allow access to login page without authentication
  if (request.nextUrl.pathname === '/super-admin/login') {
    return NextResponse.next();
  }

  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('super_admin_token')?.value;

    if (!token) {
      return redirectToLogin(request);
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, secret);

    // Check if user has super admin role
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check token expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return redirectToLogin(request);
    }

    // Add user info to headers for downstream consumption
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions || []));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Super admin middleware error:', error);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/super-admin/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/api/super-admin/:path*'
  ]
};