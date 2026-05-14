import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Admin Middleware - IP Whitelist + JWT Verification (S1-6)
 *
 * ⚠️ SECURITY: This is a secondary check. Primary IP blocking happens at nginx level.
 * This middleware provides an additional layer of protection within the application.
 *
 * JWT check: validates token structure and expiry in Edge middleware (fast, no crypto
 * verification needed — the full server-side verification happens in the layout's
 * GraphQL call). This prevents rendering admin pages for expired/missing tokens.
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

// Routes that DON'T require authentication (public pages)
const PUBLIC_ROUTES = ['/login', '/admin/login'];

// CEO-only routes — require SUPER_ADMIN role
const CEO_ONLY_ROUTES = ['/admin/CEO', '/admin/funds', '/admin/contracts'];

// Role-based route guards (S1-3)
// Maps route prefixes to the roles allowed to access them
const ROLE_ROUTE_GUARDS: Record<string, string[]> = {
  '/admin/CEO':         ['SUPER_ADMIN'],
  '/admin/funds':       ['SUPER_ADMIN'],
  '/admin/contracts':   ['SUPER_ADMIN'],
  '/admin/security':    ['SUPER_ADMIN', 'ADMIN', 'TECH_ADMIN'],
  '/admin/audit':       ['SUPER_ADMIN', 'ADMIN'],
  '/admin/system':      ['SUPER_ADMIN', 'ADMIN', 'TECH_ADMIN'],
  '/admin/settings':    ['SUPER_ADMIN', 'ADMIN'],
  '/admin/monetization':['SUPER_ADMIN', 'ADMIN', 'MARKETING_ADMIN'],
  '/admin/users':       ['SUPER_ADMIN', 'ADMIN'],
  '/admin/compliance':  ['SUPER_ADMIN', 'ADMIN'],
  '/admin/ecommerce':   ['SUPER_ADMIN', 'ADMIN', 'MARKETING_ADMIN'],
  '/admin/distribution':['SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN'],
  '/admin/seo':         ['SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN'],
  '/admin/analytics':   ['SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN'],
  '/admin/ai':          ['SUPER_ADMIN', 'ADMIN', 'TECH_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content':     ['SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN'],
  '/admin/community':   ['SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN'],
  // /admin (dashboard) is accessible to all authenticated admin roles
};

/**
 * Decode a JWT payload in Edge runtime (no Node.js crypto needed).
 * Returns null if the token is malformed or expired.
 */
function decodeJwtPayload(token: string): { exp?: number; role?: string; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Edge-safe base64url decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Check if a role is allowed to access a given pathname.
 * Returns true if no guard is defined for the path (default: allow).
 */
function isRoleAllowed(pathname: string, role: string | undefined): boolean {
  if (!role) return false;

  // Check route guards from most specific to least
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTE_GUARDS)) {
    if (pathname.startsWith(routePrefix)) {
      return allowedRoles.includes(role);
    }
  }

  // No specific guard — allow any authenticated admin role
  return true;
}

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

  // Check if IP is whitelisted (BYPASS_ALL only works in development)
  const bypassWhitelist = process.env.NODE_ENV === 'development' && process.env.ADMIN_WHITELISTED_IPS === 'BYPASS_ALL';
  if (!bypassWhitelist && !whitelistedIPs.has(clientIP)) {
    console.log(`[ADMIN BLOCKED] IP ${clientIP} not whitelisted. Path: ${pathname}`);
    // Return a generic 404 to not reveal the existence of the admin panel
    return new NextResponse('Not Found', { status: 404 });
  }

  // Additional check for CEO-only routes (IP-level)
  if (CEO_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    if (!ceoIPs.has(clientIP)) {
      console.log(`[CEO BLOCKED] IP ${clientIP} not authorized for CEO routes. Path: ${pathname}`);
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // ---- JWT validation (S1-6) ----
  // Skip JWT check for public routes (login pages)
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r || pathname === r + '/');
  if (!isPublicRoute && pathname.startsWith('/admin')) {
    // Read token from cookie or authorization header
    // In Next.js, cookies are the primary mechanism for middleware
    const token = request.cookies.get('admin_access_token')?.value;

    // Also check authorization header (for programmatic access)
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const jwt = token || headerToken;

    if (!jwt) {
      // No token — redirect to login
      console.log(`[ADMIN AUTH] No JWT token for ${pathname}. Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = decodeJwtPayload(jwt);
    if (!payload) {
      console.log(`[ADMIN AUTH] Malformed JWT for ${pathname}. Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log(`[ADMIN AUTH] Expired JWT for ${pathname}. Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based route guard (S1-3)
    if (!isRoleAllowed(pathname, payload.role)) {
      console.log(`[ADMIN RBAC] Role ${payload.role} not allowed for ${pathname}. Redirecting to /admin`);
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Add security headers (never expose client IP in response headers)
  const response = NextResponse.next();
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
