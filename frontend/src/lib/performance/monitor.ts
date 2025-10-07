/**
 * Performance Monitoring for Super Admin Dashboard
 * Tracks loading times, API response times, and user interactions
 */

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  cacheHitRate?: number;
}

interface PerformanceConfig {
  enableLogging: boolean;
  reportToAnalytics: boolean;
  slowThreshold: number; // ms
}

const defaultConfig: PerformanceConfig = {
  enableLogging: process.env.NODE_ENV === 'development',
  reportToAnalytics: false,
  slowThreshold: 1000, // 1 second
};

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metrics: Map<string, PerformanceMetrics> = new Map();

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(operationId: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.logMetric(operationId, { pageLoadTime: duration } as PerformanceMetrics);

      if (this.config.enableLogging) {
        console.log(`⏱️ ${operationId}: ${duration.toFixed(2)}ms`);
      }

      if (duration > this.config.slowThreshold) {
        console.warn(`🐌 Slow operation detected: ${operationId} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Record API response time
   */
  recordApiResponse(operationId: string, responseTime: number, cached: boolean = false): void {
    const metrics: Partial<PerformanceMetrics> = {
      apiResponseTime: responseTime,
    };

    if (cached) {
      metrics.cacheHitRate = 100;
    }

    this.logMetric(operationId, metrics as PerformanceMetrics);

    if (this.config.enableLogging) {
      const cacheIndicator = cached ? ' (cached)' : '';
      console.log(`🌐 ${operationId}: ${responseTime.toFixed(2)}ms${cacheIndicator}`);
    }
  }

  /**
   * Record render time
   */
  recordRenderTime(componentName: string, renderTime: number): void {
    this.logMetric(`${componentName}_render`, { renderTime } as PerformanceMetrics);

    if (this.config.enableLogging) {
      console.log(`🎨 ${componentName} render: ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Record user interaction time
   */
  recordInteraction(interactionId: string, interactionTime: number): void {
    this.logMetric(interactionId, { interactionTime } as PerformanceMetrics);

    if (this.config.enableLogging) {
      console.log(`👆 ${interactionId}: ${interactionTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Log metric to internal storage and external services
   */
  private logMetric(operationId: string, metrics: PerformanceMetrics): void {
    this.metrics.set(operationId, { ...this.metrics.get(operationId), ...metrics });

    if (this.config.reportToAnalytics && typeof window !== 'undefined') {
      // Send to analytics service
      if ((window as any).gtag) {
        (window as any).gtag('event', 'performance_metric', {
          operation_id: operationId,
          ...metrics,
        });
      }
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalOperations: number;
    averageResponseTime: number;
    slowestOperation: string;
    cacheHitRate: number;
  } {
    const metrics = Array.from(this.metrics.values());
    const totalOperations = metrics.length;

    if (totalOperations === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        slowestOperation: '',
        cacheHitRate: 0,
      };
    }

    const responseTimes = metrics
      .map(m => m.apiResponseTime || m.pageLoadTime || 0)
      .filter(time => time > 0);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const slowestOperation = Array.from(this.metrics.entries())
      .reduce((slowest, [id, metric]) => {
        const time = metric.apiResponseTime || metric.pageLoadTime || 0;
        return time > (slowest.time || 0) ? { id, time } : slowest;
      }, { id: '', time: 0 });

    const cacheHits = metrics.filter(m => m.cacheHitRate === 100).length;
    const cacheHitRate = totalOperations > 0 ? (cacheHits / totalOperations) * 100 : 0;

    return {
      totalOperations,
      averageResponseTime,
      slowestOperation: slowestOperation.id,
      cacheHitRate,
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hooks for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const renderStartRef = useRef<number>();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current;
      performanceMonitor.recordRenderTime(componentName, renderTime);

      if (renderTime > 100) { // 100ms threshold for slow renders
        setIsSlow(true);
      }
    }
  });

  const trackInteraction = (interactionId: string) => {
    const startTime = performance.now();
    return () => {
      const interactionTime = performance.now() - startTime;
      performanceMonitor.recordInteraction(`${componentName}_${interactionId}`, interactionTime);
    };
  };

  return { isSlow, trackInteraction };
}

// Hook for API performance monitoring
export function useApiPerformance(operationId: string) {
  const startApiCall = () => {
    const startTime = performance.now();
    return (cached: boolean = false) => {
      const responseTime = performance.now() - startTime;
      performanceMonitor.recordApiResponse(operationId, responseTime, cached);
    };
  };

  return { startApiCall };
}

// Hook for page load performance
export function usePageLoadPerformance(pageName: string) {
  useEffect(() => {
    const endTiming = performanceMonitor.startTiming(`${pageName}_page_load`);
    return endTiming;
  }, [pageName]);
}