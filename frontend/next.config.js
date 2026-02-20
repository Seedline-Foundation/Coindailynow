const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = require('next-pwa')({
  dest: 'public',
  // Service worker can cause stale chunk caching during local dev, leading to
  // runtime errors like "Cannot read properties of undefined (reading 'call')".
  // Disable PWA in non-production.
  disable: process.env.NODE_ENV !== 'production',
  register: process.env.NODE_ENV === 'production',
  skipWaiting: process.env.NODE_ENV === 'production',
  runtimeCaching: [
    // Images: CacheFirst — 30-day max age, 60 entry limit
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      // API Responses (/api/v1/*): NetworkFirst — 3-second timeout, 5-minute cache fallback, 50 entry limit
      urlPattern: /^https?:\/\/(api\.coindaily\.africa|localhost:4000)\/api\/v1\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint - ignore errors for production build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Output as standalone for deployment
  output: 'standalone',

  // Performance optimizations for African networks
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['localhost', 'api.coindaily.africa', 'cdn.coindaily.africa'],
    loader: 'custom',
    loaderFile: './src/utils/cdn-image-loader.js'
  },

  // Experimental features for performance
  experimental: {
    gzipSize: true,
    esmExternals: true,
    serverComponentsExternalPackages: ['sharp']
  },

  // Webpack optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev) {
      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
  
  // API configuration
  async rewrites() {
    // Temporarily disable API proxy to fix login page rendering
    return [];
    
    // Original proxy configuration (disabled for now)
    /*
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://api.coindaily.africa/:path*'
          : 'http://localhost:4000/:path*'
      }
    ];
    */
  },

  // Performance and Security headers
  async headers() {
    // In development, do not set aggressive caching headers on Next.js chunks.
    // Otherwise the browser may reuse stale /_next/static/* files and crash at runtime
    // (e.g., "Cannot read properties of undefined (reading 'call')").
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          // Security headers for ALL routes
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
            { key: 'X-DNS-Prefetch-Control', value: 'on' },
          ]
        },
      ];
    }

    return [
      {
        // Security headers for ALL routes (no Cache-Control here — only on static)
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ]
      },
      {
        // Immutable cache for built static assets
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=31536000'
          }
        ]
      },
      {
        // Dynamic pages — short cache, must revalidate
        source: '/:path((?!_next|static|api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      },
    ];
  },

};

module.exports = withPWA(withBundleAnalyzer(nextConfig));