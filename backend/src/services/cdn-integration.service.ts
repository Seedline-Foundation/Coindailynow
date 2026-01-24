/**
 * CDN Integration for Backend
 * Integrates CDN services with the main Express application
 */

import { Redis } from 'ioredis';
import { CDNService, createCDNService } from '../services/cdn.service';
import { ImageOptimizationService, createImageOptimizationService } from '../services/image-optimization.service';
import { createCDNRoutes } from '../api/cdn.routes';
import { Express } from 'express';

export interface CDNIntegration {
  cdnService: CDNService;
  imageService: ImageOptimizationService;
  initialize: () => Promise<void>;
  mountRoutes: (app: Express) => void;
  startMonitoring: () => void;
}

/**
 * Initialize CDN services and integration
 */
export async function initializeCDN(redis: Redis): Promise<CDNIntegration> {
  console.log('🚀 Initializing CDN & Asset Optimization system...');

  // Create services
  const cdnService = createCDNService(redis);
  const imageService = createImageOptimizationService(redis);

  const integration: CDNIntegration = {
    cdnService,
    imageService,

    /**
     * Initialize CDN system
     */
    async initialize(): Promise<void> {
      try {
        console.log('📡 Configuring CDN system...');

        // Initialize Cloudflare CDN (if configured)
        const cloudflareInitialized = await cdnService.initializeCloudflare();
        if (cloudflareInitialized) {
          console.log('✅ Cloudflare CDN initialized successfully');
          
          // Configure African market targeting
          await cdnService.configureAfricanCaching();
          console.log('🌍 African market caching rules configured');

          // Configure edge caching
          await cdnService.configureEdgeCaching();
          console.log('⚡ Edge caching rules configured');
        } else {
          console.log('⚠️  Cloudflare CDN not configured - running in local mode');
        }

        console.log('✅ CDN system initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize CDN system:', error);
        throw error;
      }
    },

    /**
     * Mount CDN routes to Express app
     */
    mountRoutes(app: Express): void {
      const cdnRoutes = createCDNRoutes(cdnService, imageService, redis);
      app.use('/api/cdn', cdnRoutes);
      console.log('🛣️  CDN routes mounted at /api/cdn');
    },

    /**
     * Start performance monitoring
     */
    startMonitoring(): void {
      // Start CDN performance monitoring
      cdnService.monitorPerformance();
      console.log('📊 CDN performance monitoring started');

      // Schedule cache cleanup
      setInterval(async () => {
        try {
          const cleaned = await imageService.cleanupCache();
          if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
          }
        } catch (error) {
          console.error('Failed to cleanup cache:', error);
        }
      }, 24 * 60 * 60 * 1000); // Run daily

      console.log('🔄 Cache cleanup scheduled (daily)');
    }
  };

  return integration;
}

/**
 * Environment configuration for CDN
 */
export function validateCDNEnvironment(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for Cloudflare configuration
  if (!process.env.CLOUDFLARE_ZONE_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    warnings.push('Cloudflare credentials not configured - CDN will run in local mode');
  }

  // Check CDN base URL
  if (!process.env.CDN_BASE_URL) {
    warnings.push('CDN_BASE_URL not configured - using default local URL');
  }

  // Validate CDN settings
  if (process.env.CDN_ENABLED === 'true') {
    if (!process.env.CLOUDFLARE_ZONE_ID) {
      errors.push('CDN_ENABLED is true but CLOUDFLARE_ZONE_ID is not configured');
    }
    if (!process.env.CLOUDFLARE_API_TOKEN) {
      errors.push('CDN_ENABLED is true but CLOUDFLARE_API_TOKEN is not configured');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Add CDN environment variables to .env file
 */
export function generateCDNEnvironmentConfig(): string {
  return `
# CDN Configuration
CDN_ENABLED=false
CDN_BASE_URL=http://localhost:3000
AFRICAN_OPTIMIZATION=true

# Cloudflare Configuration (Optional - Set to enable CDN)
# CLOUDFLARE_ZONE_ID=your_zone_id_here
# CLOUDFLARE_API_TOKEN=your_api_token_here
# CLOUDFLARE_EMAIL=your_email_here
# CLOUDFLARE_API_KEY=your_api_key_here

# Image Optimization
MAX_IMAGE_SIZE=10485760
IMAGE_QUALITY_DEFAULT=80
IMAGE_QUALITY_AFRICAN=75
IMAGE_CACHE_TTL=604800
`;
}

export default {
  initializeCDN,
  validateCDNEnvironment,
  generateCDNEnvironmentConfig
};