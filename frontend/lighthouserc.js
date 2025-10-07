/**
 * Lighthouse Performance Testing Configuration
 * Session 3: Testing & Validation - Lighthouse audit (target >90)
 */

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/articles',
        'http://localhost:3000/market',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Performance metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Accessibility
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'button-name': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        
        // Best practices
        'errors-in-console': 'warn',
        'uses-http2': 'error',
        'uses-passive-event-listeners': 'warn',
        'no-document-write': 'error',
        'uses-text-compression': 'error',
        
        // SEO
        'meta-description': 'error',
        'http-status-code': 'error',
        'font-size': 'error',
        'crawlable-anchors': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
