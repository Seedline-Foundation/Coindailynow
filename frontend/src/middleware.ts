import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware — Server-side route protection
 * 
 * Protects authenticated routes (/user/*, /dashboard/*) and premium content
 * by checking for auth token before rendering. Redirects to login if missing.
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/user',
  '/dashboard',
  '/settings',
  '/profile',
  '/wallet',
  '/notifications',
  '/subscriptions',
];

// Routes that should redirect authenticated users away (e.g., login page)
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/login',
  '/register',
];

// Public routes that never need auth checks
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/api/',
  '/_next/',
  '/static/',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public/static/API routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route) || pathname === route)) {
    return NextResponse.next();
  }

  // Check for auth token in cookies or Authorization header
  const authToken = request.cookies.get('authToken')?.value 
    || request.headers.get('authorization')?.replace('Bearer ', '');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register pages
  if (isAuthRoute && authToken) {
    return NextResponse.redirect(new URL('/user/dashboard', request.url));
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
