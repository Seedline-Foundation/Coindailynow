import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Admin Middleware - IP Whitelist Verification
 * 
 * ⚠️ SECURITY: This is a secondary check. Primary IP blocking happens at nginx level.
 * This middleware provides an additional layer of protection within the application.
 * 
 * In production, the nginx geo module blocks non-whitelisted IPs with a 444 response
 * (connection closed without response) before they even reach this middleware.
 */

// Whitelisted IPs - CONFIGURE IN ENVIRONMENT VARIABLES
const getWhitelistedIPs = (): Set<string> => {
  const ips = process.env.ADMIN_WHITELISTED_IPS || '';
  const ipList = ips.split(',').map(ip => ip.trim()).filter(Boolean);
  
  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    ipList.push('127.0.0.1', '::1', 'localhost');
  }
  
  return new Set(ipList);
};

// CEO-only IPs - Additional restriction for /admin/CEO routes
const getCEOIPs = (): Set<string> => {
  const ips = process.env.CEO_WHITELISTED_IPS || '';
  const ipList = ips.split(',').map(ip => ip.trim()).filter(Boolean);
  
  if (process.env.NODE_ENV === 'development') {
    ipList.push('127.0.0.1', '::1', 'localhost');
  }
  
  return new Set(ipList);
};

// Routes that require authentication
const PROTECTED_ROUTES = ['/admin', '/admin/CEO', '/admin/funds', '/admin/contracts'];

// CEO-only routes
const CEO_ONLY_ROUTES = ['/admin/CEO', '/admin/funds', '/admin/contracts'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown';
  
  // Log access attempt (in production, this goes to secure logging)
  console.log(`[ADMIN ACCESS] ${new Date().toISOString()} | IP: ${clientIP} | Path: ${pathname}`);
  
  // Skip static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  const whitelistedIPs = getWhitelistedIPs();
  const ceoIPs = getCEOIPs();
  
  // Check if IP is whitelisted (bypass if ADMIN_WHITELISTED_IPS is set to BYPASS_ALL)
  const bypassWhitelist = process.env.ADMIN_WHITELISTED_IPS === 'BYPASS_ALL';
  if (!bypassWhitelist && !whitelistedIPs.has(clientIP)) {
    console.log(`[ADMIN BLOCKED] IP ${clientIP} not whitelisted. Path: ${pathname}`);
    
    // Return a generic 404 to not reveal the existence of the admin panel
    return new NextResponse('Not Found', { status: 404 });
  }
  
  // Additional check for CEO-only routes
  if (CEO_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    if (!ceoIPs.has(clientIP)) {
      console.log(`[CEO BLOCKED] IP ${clientIP} not authorized for CEO routes. Path: ${pathname}`);
      
      // Redirect to main admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Admin-IP', clientIP);
  response.headers.set('X-Admin-Timestamp', new Date().toISOString());
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
