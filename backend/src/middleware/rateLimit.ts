import rateLimit from 'express-rate-limit';

// Rate limiting configuration based on user tier
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Check user subscription tier for rate limits
    const userTier = req.user?.subscriptionTier;

    switch (userTier) {
      case 'enterprise':
        return 10000; // 10,000 requests per 15 minutes
      case 'premium':
        return 1000; // 1,000 requests per 15 minutes
      case 'free':
      default:
        return 100; // 100 requests per 15 minutes
    }
  },
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
});