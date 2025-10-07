// Performance-focused service worker for CoinDaily
// Enhances the existing Workbox SW with custom performance optimizations

const PERFORMANCE_CACHE = 'coindaily-performance-v1';
const CRITICAL_CACHE = 'coindaily-critical-v1';

// Performance monitoring cache
const performanceMetrics = new Map();

// Install event - setup performance caching
self.addEventListener('install', (event) => {
  console.log('[Performance SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(PERFORMANCE_CACHE),
      caches.open(CRITICAL_CACHE)
    ]).then(() => {
      console.log('[Performance SW] Caches created');
      return self.skipWaiting();
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Performance SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// Enhanced fetch event with performance monitoring
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Monitor and enhance critical resource loading
  if (isCriticalResource(url.pathname)) {
    event.respondWith(handleCriticalResource(request));
  } else if (isPerformanceAsset(url.pathname)) {
    event.respondWith(handlePerformanceAsset(request));
  }
});

// Handle critical resources with performance monitoring
async function handleCriticalResource(request) {
  const startTime = performance.now();
  const url = new URL(request.url);
  
  try {
    const cache = await caches.open(CRITICAL_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Measure cache hit performance
      const endTime = performance.now();
      recordPerformanceMetric('cache-hit', endTime - startTime, url.pathname);
      return cachedResponse;
    }
    
    // Network request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const endTime = performance.now();
    
    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone());
      recordPerformanceMetric('network-success', endTime - startTime, url.pathname);
    } else {
      recordPerformanceMetric('network-error', endTime - startTime, url.pathname);
    }
    
    return networkResponse;
    
  } catch (error) {
    const endTime = performance.now();
    recordPerformanceMetric('network-timeout', endTime - startTime, url.pathname);
    
    // Return cached response if available
    const cache = await caches.open(CRITICAL_CACHE);
    const fallbackResponse = await cache.match(request);
    
    if (fallbackResponse) {
      return fallbackResponse;
    }
    
    // Return minimal error response
    return new Response('Resource temporarily unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle performance assets (CSS, JS, images)
async function handlePerformanceAsset(request) {
  const startTime = performance.now();
  const cache = await caches.open(PERFORMANCE_CACHE);
  
  try {
    // Network first for assets to ensure latest versions
    const networkResponse = await fetch(request);
    const endTime = performance.now();
    
    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone());
      recordPerformanceMetric('asset-load', endTime - startTime, request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    const endTime = performance.now();
    
    if (cachedResponse) {
      recordPerformanceMetric('asset-cache-fallback', endTime - startTime, request.url);
      return cachedResponse;
    }
    
    recordPerformanceMetric('asset-load-failed', endTime - startTime, request.url);
    throw error;
  }
}

// Record performance metrics
function recordPerformanceMetric(type, duration, resource) {
  const metric = {
    type,
    duration,
    resource,
    timestamp: Date.now()
  };
  
  // Store in memory map
  const key = `${type}-${Date.now()}`;
  performanceMetrics.set(key, metric);
  
  // Limit metrics in memory
  if (performanceMetrics.size > 1000) {
    const firstKey = performanceMetrics.keys().next().value;
    performanceMetrics.delete(firstKey);
  }
  
  // Send to analytics if available
  sendPerformanceMetric(metric);
}

// Send performance metrics to analytics
async function sendPerformanceMetric(metric) {
  try {
    // Try to send immediately
    await fetch('/api/analytics/sw-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    });
  } catch (error) {
    // Queue for background sync if network fails
    await queueMetricForSync(metric);
  }
}

// Queue metrics for background sync
async function queueMetricForSync(metric) {
  try {
    const cache = await caches.open('performance-sync-queue');
    const request = new Request(`/sync/performance/${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    });
    
    await cache.put(request, new Response(JSON.stringify(metric)));
  } catch (error) {
    console.warn('[Performance SW] Failed to queue metric:', error);
  }
}

// Background sync for queued metrics
self.addEventListener('sync', (event) => {
  if (event.tag === 'performance-metrics-sync') {
    event.waitUntil(syncQueuedMetrics());
  }
});

async function syncQueuedMetrics() {
  try {
    const cache = await caches.open('performance-sync-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const metric = await response.json();
        
        // Send to analytics
        await fetch('/api/analytics/sw-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric)
        });
        
        // Remove from queue after successful sync
        await cache.delete(request);
      } catch (error) {
        console.warn('[Performance SW] Failed to sync metric:', error);
      }
    }
  } catch (error) {
    console.error('[Performance SW] Sync failed:', error);
  }
}

// Message handling for performance data
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PERFORMANCE_METRICS') {
    // Send current metrics to client
    event.ports[0].postMessage({
      metrics: Array.from(performanceMetrics.values()),
      summary: generatePerformanceSummary()
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_PERFORMANCE_CACHE') {
    event.waitUntil(clearPerformanceCache());
  }
});

// Generate performance summary
function generatePerformanceSummary() {
  const metrics = Array.from(performanceMetrics.values());
  const summary = {
    totalRequests: metrics.length,
    averageResponseTime: 0,
    cacheHitRate: 0,
    slowRequests: 0,
    errorRate: 0
  };
  
  if (metrics.length === 0) return summary;
  
  const durations = metrics.map(m => m.duration);
  const cacheHits = metrics.filter(m => m.type === 'cache-hit').length;
  const errors = metrics.filter(m => m.type.includes('error') || m.type.includes('timeout')).length;
  const slowRequests = metrics.filter(m => m.duration > 2000).length;
  
  summary.averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
  summary.cacheHitRate = (cacheHits / metrics.length) * 100;
  summary.slowRequests = slowRequests;
  summary.errorRate = (errors / metrics.length) * 100;
  
  return summary;
}

// Clear performance cache
async function clearPerformanceCache() {
  try {
    await caches.delete(PERFORMANCE_CACHE);
    await caches.delete('performance-sync-queue');
    performanceMetrics.clear();
    console.log('[Performance SW] Performance cache cleared');
  } catch (error) {
    console.error('[Performance SW] Failed to clear cache:', error);
  }
}

// Helper functions
function isCriticalResource(pathname) {
  return pathname.includes('/critical/') ||
         pathname.includes('critical-') ||
         pathname === '/manifest.json' ||
         pathname.includes('/api/') ||
         pathname === '/' ||
         pathname === '/news' ||
         pathname === '/market';
}

function isPerformanceAsset(pathname) {
  return pathname.includes('/_next/static/') ||
         pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

// Preload critical resources
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRELOAD_CRITICAL') {
    event.waitUntil(preloadCriticalResources(event.data.urls));
  }
});

async function preloadCriticalResources(urls) {
  const cache = await caches.open(CRITICAL_CACHE);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log(`[Performance SW] Preloaded: ${url}`);
      }
    } catch (error) {
      console.warn(`[Performance SW] Failed to preload: ${url}`, error);
    }
  }
}

console.log('[Performance SW] Performance service worker loaded');