/**
 * Custom CDN Image Loader for Next.js
 * Implements CDN optimization for all Next.js Image components
 */

export default function cdnImageLoader({ src, width, quality }) {
  // Don't optimize already optimized URLs
  if (src.startsWith('/api/cdn/') || src.includes('cdn.coindaily.africa')) {
    return src;
  }

  // Build optimization parameters
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', width.toString());
  
  // African network optimization - reduce quality for better performance
  const isAfricanOptimized = process.env.NEXT_PUBLIC_AFRICAN_OPTIMIZATION === 'true';
  const optimizedQuality = isAfricanOptimized ? Math.min(quality || 75, 75) : quality || 80;
  params.set('q', optimizedQuality.toString());
  
  // Prefer WebP for better compression
  params.set('f', 'webp');
  params.set('progressive', 'true');
  
  if (isAfricanOptimized) {
    params.set('african', 'true');
  }

  // Use local CDN endpoint for development, real CDN for production
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://cdn.coindaily.africa'
    : '';

  return `${baseUrl}/api/cdn/optimize?${params.toString()}`;
}