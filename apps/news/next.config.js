/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coindaily/ui', '@coindaily/utils'],
  
  // Environment-specific configurations
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://app.coindaily.online',
    NEXT_PUBLIC_AI_URL: process.env.NEXT_PUBLIC_AI_URL || 'https://ai.coindaily.online',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://app.coindaily.online',
  },

  // Image domains
  images: {
    domains: [
      'coindaily.online',
      'app.coindaily.online',
      'cdn.coindaily.online',
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
        destination: 'https://jet.coindaily.online/admin/:path*',
        permanent: true,
      },
      {
        source: '/super-admin/:path*',
        destination: 'https://jet.coindaily.online/admin/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
