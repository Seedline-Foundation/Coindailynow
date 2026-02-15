/** @type {import('next').NextConfig} */

// Windows drive letter normalization plugin
// Ensures all resolved paths use uppercase drive letter (C:\ not c:\)
class NormalizeDriveLetterPlugin {
  apply(resolver) {
    resolver.hooks.result.tap('NormalizeDriveLetter', (request) => {
      if (request && request.path && typeof request.path === 'string') {
        if (/^[a-z]:\\/.test(request.path)) {
          request.path = request.path.charAt(0).toUpperCase() + request.path.slice(1);
        }
      }
      return request;
    });
  }
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coindaily/ui'],
  
  // Comprehensive Windows drive letter casing fix
  webpack: (config) => {
    config.resolve.symlinks = false;

    // Apply drive letter normalization on Windows
    if (process.platform === 'win32') {
      // Normalize context path
      if (config.context && /^[a-z]:\\/.test(config.context)) {
        config.context = config.context.charAt(0).toUpperCase() + config.context.slice(1);
      }
      // Normalize output path
      if (config.output && config.output.path && /^[a-z]:\\/.test(config.output.path)) {
        config.output.path = config.output.path.charAt(0).toUpperCase() + config.output.path.slice(1);
      }
      // Normalize resolve modules
      if (config.resolve.modules) {
        config.resolve.modules = config.resolve.modules.map((m) =>
          typeof m === 'string' && /^[a-z]:\\/.test(m) ? m.charAt(0).toUpperCase() + m.slice(1) : m
        );
      }
      // Disable context caching to prevent casing mismatches
      config.resolve.cacheWithContext = false;
      // Add resolver plugins for both module and loader resolution
      config.resolve.plugins = [...(config.resolve.plugins || []), new NormalizeDriveLetterPlugin()];
      config.resolveLoader = config.resolveLoader || {};
      config.resolveLoader.plugins = [...(config.resolveLoader.plugins || []), new NormalizeDriveLetterPlugin()];
    }

    return config;
  },
  
  // Environment-specific configurations
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://app.coindaily.online',
    NEXT_PUBLIC_AI_URL: process.env.NEXT_PUBLIC_AI_URL || 'https://ai.coindaily.online',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://app.coindaily.online',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jet.coindaily.online',
  },

  // Image domains
  images: {
    domains: [
      'coindaily.online',
      'app.coindaily.online',
      'cdn.coindaily.online',
    ],
  },

  // Security headers
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
};

module.exports = nextConfig;
