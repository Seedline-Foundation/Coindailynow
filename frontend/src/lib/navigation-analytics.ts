// Navigation Analytics Tracking System
// Implements FR-048: Navigation analytics tracking

interface NavigationEvent {
  event_type: 'navigation_click' | 'navigation_dropdown_open' | 'navigation_search' | 'breadcrumb_click';
  timestamp: number;
  user_agent: string;
  page_url: string;
  referrer: string;
  session_id: string;
  [key: string]: any;
}

class NavigationAnalytics {
  private static instance: NavigationAnalytics;
  private events: NavigationEvent[] = [];
  private sessionId: string;
  private isInitialized = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): NavigationAnalytics {
    if (!NavigationAnalytics.instance) {
      NavigationAnalytics.instance = new NavigationAnalytics();
    }
    return NavigationAnalytics.instance;
  }

  public init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    
    // Send analytics data every 30 seconds
    setInterval(() => {
      this.flush();
    }, 30000);

    // Send analytics data before page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Send analytics data when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  public trackEvent(eventType: NavigationEvent['event_type'], data: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    const event: NavigationEvent = {
      event_type: eventType,
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      referrer: document.referrer,
      session_id: this.sessionId,
      ...data
    };

    this.events.push(event);

    // If we have too many events, flush immediately
    if (this.events.length >= 50) {
      this.flush();
    }
  }

  public flush(): void {
    if (this.events.length === 0 || typeof window === 'undefined') return;

    const eventsToSend = [...this.events];
    this.events = [];

    // Send to analytics endpoint
    this.sendAnalytics(eventsToSend);
  }

  private async sendAnalytics(events: NavigationEvent[]): Promise<void> {
    try {
      // Use sendBeacon for reliable delivery
      if (navigator.sendBeacon) {
        const data = JSON.stringify({ events, type: 'navigation' });
        navigator.sendBeacon('/api/analytics/navigation', data);
      } else {
        // Fallback to fetch
        await fetch('/api/analytics/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events, type: 'navigation' }),
          keepalive: true
        });
      }
    } catch (error) {
      console.warn('Failed to send navigation analytics:', error);
      // Add events back to queue for retry
      this.events.unshift(...events);
    }
  }

  private generateSessionId(): string {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get analytics summary for debugging
  public getAnalyticsSummary(): {
    totalEvents: number;
    eventTypes: Record<string, number>;
    sessionId: string;
  } {
    const eventTypes: Record<string, number> = {};
    
    this.events.forEach(event => {
      eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventTypes,
      sessionId: this.sessionId
    };
  }
}

// Export singleton instance
export const navigationAnalytics = NavigationAnalytics.getInstance();

// Convenience function for tracking navigation events
export function trackEvent(eventType: NavigationEvent['event_type'], data: Record<string, any> = {}): void {
  navigationAnalytics.trackEvent(eventType, data);
}

// Initialize analytics (call this in your app initialization)
export function initNavigationAnalytics(): void {
  navigationAnalytics.init();
}

// Navigation-specific event tracking functions
export const trackNavigationClick = (label: string, href: string, category?: string) => {
  trackEvent('navigation_click', { label, href, category });
};

export const trackDropdownOpen = (menuId: string, menuLabel: string) => {
  trackEvent('navigation_dropdown_open', { menu_id: menuId, menu_label: menuLabel });
};

export const trackNavigationSearch = (query: string, resultsCount?: number) => {
  trackEvent('navigation_search', { query, results_count: resultsCount });
};

export const trackBreadcrumbClick = (label: string, href?: string, level?: number) => {
  trackEvent('breadcrumb_click', { label, href, breadcrumb_level: level });
};

// Performance metrics for navigation
export interface NavigationPerformanceMetrics {
  dropdown_open_time: number;
  search_input_delay: number;
  mobile_menu_toggle_time: number;
  navigation_render_time: number;
}

export function trackNavigationPerformance(metrics: Partial<NavigationPerformanceMetrics>): void {
  trackEvent('navigation_click', { 
    type: 'performance',
    metrics 
  });
}