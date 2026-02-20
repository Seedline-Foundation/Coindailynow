'use client';

import { useEffect } from 'react';
import { performanceMonitor, measurePageLoad } from '@/utils/performance';
import { initializeCRO } from '@/utils/cro';

export default function PerformanceProvider() {
  useEffect(() => {
    const isLocalDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Initialize performance monitoring
    measurePageLoad();
    
    // Initialize conversion rate optimization
    initializeCRO();
    
    // Preload critical resources (production only)
    if (!isLocalDev && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: 'PRELOAD_CRITICAL',
          urls: [
            '/critical/critical-home.css',
            '/critical/critical-news.css',
            '/critical/critical-market.css'
          ]
        });
      });
    }

    // In local development, remove stale service workers/caches to avoid chunk mismatch errors
    if (isLocalDev && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {});

      if ('caches' in window) {
        caches.keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => {});
      }
    }

    // Register service worker (non-local only)
    if (!isLocalDev && 'serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
          console.log('SW registered: ', registration);
        }).catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    // Report initial performance metrics
    window.addEventListener('load', function() {
      if (window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          // Send metrics to analytics
          fetch('/api/analytics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'navigation',
              metrics: {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstByte: navigation.responseStart - navigation.requestStart
              },
              url: window.location.href,
              timestamp: Date.now()
            })
          }).catch(console.error);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      performanceMonitor.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}
