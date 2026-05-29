/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@coindaily/ui', '@coindaily/utils'],
  experimental: {
    externalDir: true,
  },
  
  // Environment-specific configurations
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : 'https://app.coindaily.online',
    NEXT_PUBLIC_AI_URL: process.env.NEXT_PUBLIC_AI_URL || 'https://ai.coindaily.online',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://app.coindaily.online',
    NEXT_PUBLIC_ADMIN_MODE: 'true',
  },

  // Image domains
  images: {
    domains: [
      'coindaily.online',
      'app.coindaily.online',
      'cdn.coindaily.online',
    ],
  },

  // Strict security headers for admin
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const connectSrc = isProd
      ? "connect-src 'self' https://app.coindaily.online wss://app.coindaily.online;"
      : "connect-src 'self' http://localhost:4000 ws://localhost:4000 http://localhost:3002 ws://localhost:3002;";

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          { 
            key: 'Content-Security-Policy', 
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; ${connectSrc} frame-ancestors 'none';`
          },
        ],
      },
    ];
  },

  // S1-1 / S1-2: canonical routes under src/app — legacy paths redirect
  async redirects() {
    return [
      { source: '/super-admin/login', destination: '/login?role=super', permanent: true },
      { source: '/admin/login', destination: '/login?role=super', permanent: true },
      { source: '/admin/admin/:path*', destination: '/admin/:path*', permanent: true },
      { source: '/admin/withdrawals', destination: '/admin/finance', permanent: true },
      { source: '/admin/traffic-cop', destination: '/admin/fraud-alerts', permanent: true },
    ];
  },

  // Proxy API and GraphQL requests to backend in development
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) return [];
    return [
      {
        source: '/graphql',
        destination: 'http://localhost:4000/graphql',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },

  poweredByHeader: false,
};

module.exports = nextConfig;
