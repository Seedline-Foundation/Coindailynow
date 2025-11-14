// Conversion Rate Optimization utilities for CoinDaily
import React, { useState, useEffect } from 'react';

// Global type declarations
declare global {
  function gtag(...args: any[]): void;
}

// A/B Testing Framework
export interface ABTestConfig {
  testId: string;
  variants: {
    id: string;
    name: string;
    weight: number; // Percentage 0-100
    component: React.ComponentType<any>;
  }[];
  conversionGoals: {
    id: string;
    name: string;
    eventName: string;
  }[];
  targeting?: {
    userAgent?: RegExp;
    location?: string[];
    referrer?: RegExp;
    newUsers?: boolean;
  };
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: number;
  converted: boolean;
  conversionGoal?: string;
}

export class ABTestManager {
  private static instance: ABTestManager;
  private tests: Map<string, ABTestConfig> = new Map();
  private userVariants: Map<string, string> = new Map();
  private results: ABTestResult[] = [];

  static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  private constructor() {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ab-test-variants');
      if (saved) {
        this.userVariants = new Map(JSON.parse(saved));
      }
    }
  }

  registerTest(config: ABTestConfig): void {
    this.tests.set(config.testId, config);
  }

  getVariant(testId: string, userId: string): string | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    // Check if user already has assigned variant
    const existingVariant = this.userVariants.get(`${testId}-${userId}`);
    if (existingVariant) {
      return existingVariant;
    }

    // Check targeting rules
    if (test.targeting && !this.meetsTargeting(test.targeting)) {
      return null;
    }

    // Assign variant based on weights
    const variant = this.assignVariant(test.variants, userId);
    if (variant) {
      this.userVariants.set(`${testId}-${userId}`, variant);
      this.saveToStorage();
    }

    return variant;
  }

  private meetsTargeting(targeting: NonNullable<ABTestConfig['targeting']>): boolean {
    if (typeof window === 'undefined') return true;

    if (targeting.userAgent && !targeting.userAgent.test(navigator.userAgent)) {
      return false;
    }

    if (targeting.referrer && !targeting.referrer.test(document.referrer)) {
      return false;
    }

    // Add more targeting logic as needed
    return true;
  }

  private assignVariant(variants: ABTestConfig['variants'], userId: string): string | null {
    const hash = this.hashString(userId);
    const random = (hash % 100) + 1; // 1-100

    let currentWeight = 0;
    for (const variant of variants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant.id;
      }
    }

    return variants[0]?.id || null;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  recordConversion(testId: string, userId: string, goalId?: string): void {
    const variantId = this.userVariants.get(`${testId}-${userId}`);
    if (!variantId) return;

    const result: ABTestResult = {
      testId,
      variantId,
      userId,
      timestamp: Date.now(),
      converted: true,
      conversionGoal: goalId
    };

    this.results.push(result);
    this.sendToAnalytics(result);
  }

  private sendToAnalytics(result: ABTestResult): void {
    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ab_test_conversion', {
        test_id: result.testId,
        variant_id: result.variantId,
        goal_id: result.conversionGoal,
        value: 1
      });
    }

    // Send to custom analytics
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      }).catch(console.error);
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'ab-test-variants',
        JSON.stringify(Array.from(this.userVariants.entries()))
      );
    }
  }

  getTestResults(testId: string): {
    variants: { [key: string]: { views: number; conversions: number; rate: number } };
    totalViews: number;
    totalConversions: number;
  } {
    const testResults = this.results.filter(r => r.testId === testId);
    const variants: { [key: string]: { views: number; conversions: number; rate: number } } = {};

    // Count views (all assigned variants)
    for (const [key, variantId] of this.userVariants.entries()) {
      if (key.startsWith(`${testId}-`)) {
        if (!variants[variantId]) {
          variants[variantId] = { views: 0, conversions: 0, rate: 0 };
        }
        variants[variantId].views++;
      }
    }

    // Count conversions
    for (const result of testResults) {
      if (variants[result.variantId]) {
        variants[result.variantId].conversions++;
      }
    }

    // Calculate rates
    for (const variantId in variants) {
      const variant = variants[variantId];
      variant.rate = variant.views > 0 ? (variant.conversions / variant.views) * 100 : 0;
    }

    const totalViews = Object.values(variants).reduce((sum, v) => sum + v.views, 0);
    const totalConversions = Object.values(variants).reduce((sum, v) => sum + v.conversions, 0);

    return { variants, totalViews, totalConversions };
  }
}

// React Hook for A/B Testing
export function useABTest(testId: string, userId: string): string | null {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const manager = ABTestManager.getInstance();
    const assignedVariant = manager.getVariant(testId, userId);
    setVariant(assignedVariant);
  }, [testId, userId]);

  return variant;
}

// A/B Test Component
interface ABTestProps {
  testId: string;
  userId: string;
  variants: { [key: string]: React.ComponentType<any> };
  fallback?: React.ComponentType<any>;
  onConversion?: (goalId?: string) => void;
}

export const ABTest: React.FC<ABTestProps> = ({
  testId,
  userId,
  variants,
  fallback: Fallback,
  onConversion
}) => {
  const variant = useABTest(testId, userId);

  useEffect(() => {
    if (variant && onConversion) {
      const manager = ABTestManager.getInstance();
      
      // Set up conversion tracking
      const trackConversion = (goalId?: string) => {
        manager.recordConversion(testId, userId, goalId);
        if (onConversion) onConversion(goalId);
      };

      // You can call trackConversion when conversion events happen
      // This is just setting up the function, actual calling should be done by components
    }
  }, [variant, testId, userId, onConversion]);

  if (!variant) {
    return Fallback ? <Fallback /> : null;
  }

  const VariantComponent = variants[variant];
  if (!VariantComponent) {
    return Fallback ? <Fallback /> : null;
  }

  return <VariantComponent onConversion={onConversion} />;
};

// Heat map and User Behavior Tracking
export class HeatmapTracker {
  private static instance: HeatmapTracker;
  private events: Array<{
    type: 'click' | 'scroll' | 'hover' | 'focus';
    x: number;
    y: number;
    element: string;
    timestamp: number;
    page: string;
  }> = [];

  static getInstance(): HeatmapTracker {
    if (!HeatmapTracker.instance) {
      HeatmapTracker.instance = new HeatmapTracker();
    }
    return HeatmapTracker.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  private initializeTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      this.trackEvent('click', event);
    });

    // Track scroll
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent('scroll', {
          clientX: window.scrollX,
          clientY: window.scrollY,
          target: document.documentElement
        } as any);
      }, 100);
    });

    // Track hover (throttled)
    let hoverTimeout: NodeJS.Timeout;
    document.addEventListener('mousemove', (event) => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        this.trackEvent('hover', event);
      }, 200);
    });
  }

  private trackEvent(type: 'click' | 'scroll' | 'hover' | 'focus', event: any): void {
    const element = this.getElementSelector(event.target);
    
    this.events.push({
      type,
      x: event.clientX || 0,
      y: event.clientY || 0,
      element,
      timestamp: Date.now(),
      page: window.location.pathname
    });

    // Limit events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }

    // Send to server periodically
    if (this.events.length % 50 === 0) {
      this.sendEvents();
    }
  }

  private getElementSelector(element: Element): string {
    if (!element) return 'unknown';
    
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const tagName = element.tagName.toLowerCase();
    
    return `${tagName}${id}${className}`;
  }

  private sendEvents(): void {
    if (this.events.length === 0) return;

    fetch('/api/analytics/heatmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: this.events.slice(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      })
    }).catch(console.error);

    this.events = [];
  }
}

// Form Optimization Tracker
export class FormOptimizer {
  private static instance: FormOptimizer;
  private formMetrics: Map<string, {
    views: number;
    starts: number;
    completions: number;
    abandonments: { [field: string]: number };
    timeToComplete: number[];
    errors: { [field: string]: number };
  }> = new Map();

  static getInstance(): FormOptimizer {
    if (!FormOptimizer.instance) {
      FormOptimizer.instance = new FormOptimizer();
    }
    return FormOptimizer.instance;
  }

  trackFormView(formId: string): void {
    const metrics = this.formMetrics.get(formId) || {
      views: 0,
      starts: 0,
      completions: 0,
      abandonments: {},
      timeToComplete: [],
      errors: {}
    };
    
    metrics.views++;
    this.formMetrics.set(formId, metrics);
  }

  trackFormStart(formId: string): void {
    const metrics = this.formMetrics.get(formId);
    if (metrics) {
      metrics.starts++;
    }
  }

  trackFormCompletion(formId: string, timeToComplete: number): void {
    const metrics = this.formMetrics.get(formId);
    if (metrics) {
      metrics.completions++;
      metrics.timeToComplete.push(timeToComplete);
    }
  }

  trackFormError(formId: string, fieldName: string): void {
    const metrics = this.formMetrics.get(formId);
    if (metrics) {
      metrics.errors[fieldName] = (metrics.errors[fieldName] || 0) + 1;
    }
  }

  trackFormAbandonment(formId: string, lastField: string): void {
    const metrics = this.formMetrics.get(formId);
    if (metrics) {
      metrics.abandonments[lastField] = (metrics.abandonments[lastField] || 0) + 1;
    }
  }

  getFormMetrics(formId: string) {
    const metrics = this.formMetrics.get(formId);
    if (!metrics) return null;

    const conversionRate = metrics.views > 0 ? (metrics.completions / metrics.views) * 100 : 0;
    const completionRate = metrics.starts > 0 ? (metrics.completions / metrics.starts) * 100 : 0;
    const avgTimeToComplete = metrics.timeToComplete.length > 0 
      ? metrics.timeToComplete.reduce((a, b) => a + b, 0) / metrics.timeToComplete.length 
      : 0;

    return {
      ...metrics,
      conversionRate,
      completionRate,
      avgTimeToComplete
    };
  }
}

// React Hook for Form Optimization
export function useFormOptimization(formId: string) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const optimizer = FormOptimizer.getInstance();

  useEffect(() => {
    optimizer.trackFormView(formId);
  }, [formId, optimizer]);

  const trackStart = () => {
    setStartTime(Date.now());
    optimizer.trackFormStart(formId);
  };

  const trackCompletion = () => {
    if (startTime) {
      const timeToComplete = Date.now() - startTime;
      optimizer.trackFormCompletion(formId, timeToComplete);
    }
  };

  const trackError = (fieldName: string) => {
    optimizer.trackFormError(formId, fieldName);
  };

  const trackAbandonment = (lastField: string) => {
    optimizer.trackFormAbandonment(formId, lastField);
  };

  return {
    trackStart,
    trackCompletion,
    trackError,
    trackAbandonment
  };
}

// Global CRO initialization
export function initializeCRO(): void {
  if (typeof window !== 'undefined') {
    // Initialize tracking systems
    HeatmapTracker.getInstance();
    
    // Track page views for CRO
    const trackPageView = () => {
      fetch('/api/analytics/page-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: document.referrer,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    };

    trackPageView();
    
    // Track on route changes (for SPA)
    let currentPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        trackPageView();
      }
    }, 1000);
  }
}
