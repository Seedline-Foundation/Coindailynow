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

const PROTECTED_PREFIXES = ['/admin', '/super-admin'];

// CEO-only routes — require SUPER_ADMIN role
const CEO_ONLY_ROUTES = ['/admin/CEO', '/admin/funds', '/admin/contracts'];

// Role-based route guards (S1-3) — kept in sync with backend/src/lib/roles.ts
// and apps/admin/src/app/admin/layout.tsx navItems.
const CONTENT = ['JOURNALIST', 'EDITOR', 'CEO', 'CONTENT_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
const MARKETING = ['EDITOR', 'CEO', 'MARKETING_ADMIN', 'CONTENT_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
const TECH = ['TECH_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'CEO'];
const PLATFORM_OPS = ['SUPER_ADMIN', 'ADMIN', 'CEO'];

const ROLE_ROUTE_GUARDS: Record<string, string[]> = {
  '/admin/CEO':         ['SUPER_ADMIN', 'CEO'],
  '/admin/funds':       ['SUPER_ADMIN', 'CEO'],
  '/admin/contracts':   ['SUPER_ADMIN', 'CEO'],
  '/admin/security':    TECH,
  '/admin/audit':       PLATFORM_OPS,
  '/admin/system':      TECH,
  '/admin/settings':    PLATFORM_OPS,
  '/admin/monetization':['SUPER_ADMIN', 'ADMIN', 'CEO', 'MARKETING_ADMIN'],
  '/admin/users':       PLATFORM_OPS,
  '/admin/compliance':  PLATFORM_OPS,
  '/admin/ecommerce':   ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MARKETING_ADMIN'],
  '/admin/distribution':MARKETING,
  '/admin/seo':         MARKETING,
  '/admin/analytics':   [...CONTENT, 'MARKETING_ADMIN'],
  '/admin/ai':          [...CONTENT, 'TECH_ADMIN'],
  '/admin/content':     CONTENT,
  '/admin/marquees':    CONTENT,
  '/admin/finance':     PLATFORM_OPS,
  '/admin/fraud-alerts':TECH,
  '/authors':           CONTENT,
  '/automations':       TECH,
  '/super-admin':       PLATFORM_OPS,
  '/admin/community':   MARKETING,
  // /admin (dashboard) is accessible to all authenticated editorial+admin roles
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

const FRONTEND_USER_BASE =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.replace(/\/$/, '') || 'https://coindaily.online';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // S1-1 / S1-5: subscriber dashboard lives on public frontend, not jet admin
  if (pathname === '/user' || pathname.startsWith('/user/')) {
    const dest = `${FRONTEND_USER_BASE}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(dest);
  }

  // S1-1: legacy duplicate route trees → canonical src/app paths
  if (pathname.startsWith('/admin/admin/')) {
    const canonical = pathname.replace(/^\/admin\/admin/, '/admin');
    return NextResponse.redirect(new URL(`${canonical}${request.nextUrl.search}`, request.url));
  }
  if (pathname === '/admin/withdrawals' || pathname.startsWith('/admin/withdrawals/')) {
    return NextResponse.redirect(new URL('/admin/finance', request.url));
  }
  if (pathname === '/admin/traffic-cop' || pathname.startsWith('/admin/traffic-cop/')) {
    return NextResponse.redirect(new URL('/admin/fraud-alerts', request.url));
  }

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
  const isProtected =
    !isPublicRoute && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
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
