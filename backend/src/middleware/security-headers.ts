/**
 * Security Headers Middleware
 * Implements comprehensive security headers following OWASP recommendations
 * 
 * Headers Implemented:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - X-DNS-Prefetch-Control
 * - X-Download-Options
 * - Expect-CT
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

interface ContentSecurityPolicyDirectives {
  [key: string]: string[] | string | boolean;
}

interface SecurityHeadersConfig {
  csp: {
    enabled: boolean;
    directives: ContentSecurityPolicyDirectives;
  };
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  frameOptions: 'DENY' | 'SAMEORIGIN';
  enableXssFilter: boolean;
  noSniff: boolean;
  referrerPolicy: string;
  permissionsPolicy: Record<string, string[]>;
}

const productionConfig: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js in production
        "'unsafe-eval'", // Required for development, remove in production
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        'https://fonts.googleapis.com'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:',
        'https://www.google-analytics.com',
        'https://api.coingecko.com',
        'https://assets.coingecko.com'
      ],
      connectSrc: [
        "'self'",
        'https://api.coingecko.com',
        'https://www.google-analytics.com',
        'wss://*.coindaily.com', // WebSocket connections
        'https://*.coindaily.com'
      ],
      frameSrc: [
        "'self'",
        'https://www.youtube.com',
        'https://twitter.com'
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:'],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  frameOptions: 'SAMEORIGIN',
  enableXssFilter: true,
  noSniff: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    accelerometer: ["'none'"],
    camera: ["'none'"],
    geolocation: ["'self'"],
    gyroscope: ["'none'"],
    magnetometer: ["'none'"],
    microphone: ["'none'"],
    payment: ["'none'"],
    usb: ["'none'"],
    'interest-cohort': ["'none'"] // Disable FLoC
  }
};

const developmentConfig: SecurityHeadersConfig = {
  ...productionConfig,
  csp: {
    enabled: false, // Disable in development for easier debugging
    directives: {
      ...productionConfig.csp.directives,
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'" // Allow eval in development
      ]
    }
  },
  hsts: {
    enabled: false, // Disable HSTS in development
    maxAge: 0,
    includeSubDomains: false,
    preload: false
  }
};

/**
 * Get configuration based on environment
 */
function getConfig(): SecurityHeadersConfig {
  return process.env.NODE_ENV === 'production'
    ? productionConfig
    : developmentConfig;
}

/**
 * Format Permissions-Policy header
 */
function formatPermissionsPolicy(policy: Record<string, string[]>): string {
  return Object.entries(policy)
    .map(([directive, sources]) => {
      const sourceList = sources.join(' ');
      return `${directive}=(${sourceList})`;
    })
    .join(', ');
}

/**
 * Security Headers Middleware using Helmet
 */
export function securityHeaders() {
  const config = getConfig();

  return [
    // Use Helmet for most headers
    helmet({
      contentSecurityPolicy: config.csp.enabled ? {
        directives: config.csp.directives as any
      } : false,
      
      hsts: config.hsts.enabled ? {
        maxAge: config.hsts.maxAge,
        includeSubDomains: config.hsts.includeSubDomains,
        preload: config.hsts.preload
      } : false,

      frameguard: {
        action: config.frameOptions.toLowerCase() as 'deny' | 'sameorigin'
      },

      noSniff: config.noSniff,

      xssFilter: config.enableXssFilter,

      referrerPolicy: {
        policy: config.referrerPolicy as any
      },

      dnsPrefetchControl: {
        allow: false
      },

      ieNoOpen: true,

      hidePoweredBy: true
    }),

    // Custom middleware for additional headers
    (req: Request, res: Response, next: NextFunction) => {
      // Permissions-Policy (formerly Feature-Policy)
      res.setHeader(
        'Permissions-Policy',
        formatPermissionsPolicy(config.permissionsPolicy)
      );

      // Expect-CT (Certificate Transparency)
      if (process.env.NODE_ENV === 'production') {
        res.setHeader(
          'Expect-CT',
          'max-age=86400, enforce'
        );
      }

      // X-Download-Options (IE8+ security)
      res.setHeader('X-Download-Options', 'noopen');

      // X-Permitted-Cross-Domain-Policies
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

      // Clear-Site-Data (on logout)
      if (req.path === '/api/auth/logout') {
        res.setHeader(
          'Clear-Site-Data',
          '"cache", "cookies", "storage"'
        );
      }

      // CORS headers (if needed)
      if (process.env.CORS_ENABLED === 'true') {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        const origin = req.headers.origin;

        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, PATCH, OPTIONS'
          );
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-CSRF-Token, X-Requested-With'
          );
        }
      }

      next();
    }
  ];
}

/**
 * CSP Violation Reporter Endpoint
 */
export function cspViolationReporter(req: Request, res: Response) {
  const violation = req.body['csp-report'];
  
  console.error('CSP Violation:', {
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number'],
    columnNumber: violation['column-number'],
    statusCode: violation['status-code']
  });

  // Log to monitoring service (e.g., Sentry, DataDog)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(new Error('CSP Violation'), {
    //   extra: violation
    // });
  }

  res.status(204).end();
}

/**
 * Security headers configuration for specific routes
 */
export function routeSpecificHeaders(route: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // More restrictive CSP for admin routes
    if (route.startsWith('/admin') || route.startsWith('/api/admin')) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
      );
    }

    // Allow framing for embed routes
    if (route.startsWith('/embed')) {
      res.setHeader('X-Frame-Options', 'ALLOWALL');
    }

    // Strict CSP for API routes
    if (route.startsWith('/api')) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none';"
      );
    }

    next();
  };
}

export default securityHeaders;
