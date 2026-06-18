/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@coindaily/ui', '@coindaily/utils'],
  
  // Environment-specific configurations
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://app.sygn.live',
    NEXT_PUBLIC_AI_URL: process.env.NEXT_PUBLIC_AI_URL || 'https://ai.sygn.live',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://app.sygn.live',
  },

  // Image domains
  images: {
    domains: [
      'sygn.live',
      'app.sygn.live',
      'cdn.sygn.live',
      'images.unsplash.com',
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: 'https://jet.sygn.live/admin/:path*',
        permanent: true,
      },
      {
        source: '/super-admin/:path*',
        destination: 'https://jet.sygn.live/admin/:path*',
        permanent: true,
      },
      // Missing pages - redirect to home until built
      {
        source: '/learn/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/tools/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/services/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
