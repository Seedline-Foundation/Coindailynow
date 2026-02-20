/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@coindaily/ui', '@coindaily/utils'],
  
  // Environment-specific configurations
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://app.coindaily.online',
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://app.coindaily.online wss://app.coindaily.online; frame-ancestors 'none';"
          },
        ],
      },
    ];
  },

  // No public redirects - this is a secured system
  poweredByHeader: false,
};

module.exports = nextConfig;
