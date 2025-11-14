/**
 * Custom React Hooks for Finance Analytics
 * Real-time data fetching with caching and error handling
 */

import { useQuery, useMutation, QueryResult } from '@apollo/client';
import { 
  GET_ANALYTICS_DASHBOARD,
  GET_TOKEN_VELOCITY_METRICS,
  GET_STAKING_METRICS,
  GET_CONVERSION_METRICS,
  GET_REVENUE_METRICS,
  GET_USER_EARNING_METRICS,
  GET_SYSTEM_HEALTH,
  GET_PERFORMANCE_HISTORY,
  RUN_LOAD_TEST,
  GENERATE_USER_REPORT,
  GENERATE_SYSTEM_REPORT,
} from '@/graphql/analytics';

// Analytics Dashboard Hook
export function useAnalyticsDashboard() {
  return useQuery(GET_ANALYTICS_DASHBOARD, {
    pollInterval: 30000, // Refresh every 30 seconds
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      console.error('Analytics Dashboard Error:', error);
    },
  });
}

// Token Velocity Hook
export function useTokenVelocity(days: number = 30) {
  return useQuery(GET_TOKEN_VELOCITY_METRICS, {
    variables: { days },
    pollInterval: 60000, // Refresh every minute
    fetchPolicy: 'cache-and-network',
  });
}

// Staking Metrics Hook
export function useStakingMetrics() {
  return useQuery(GET_STAKING_METRICS, {
    pollInterval: 45000, // Refresh every 45 seconds
    fetchPolicy: 'cache-and-network',
  });
}

// Conversion Analytics Hook
export function useConversionAnalytics(days: number = 30) {
  return useQuery(GET_CONVERSION_METRICS, {
    variables: { days },
    pollInterval: 60000,
    fetchPolicy: 'cache-and-network',
  });
}

// Revenue Breakdown Hook
export function useRevenueBreakdown(startDate?: Date, endDate?: Date) {
  return useQuery(GET_REVENUE_METRICS, {
    variables: { startDate, endDate },
    pollInterval: 120000, // Refresh every 2 minutes
    fetchPolicy: 'cache-and-network',
  });
}

// User Earning Analysis Hook
export function useUserEarningAnalysis(limit: number = 100) {
  return useQuery(GET_USER_EARNING_METRICS, {
    variables: { limit },
    pollInterval: 300000, // Refresh every 5 minutes
    fetchPolicy: 'cache-and-network',
  });
}

// System Health Hook
export function useSystemHealth() {
  return useQuery(GET_SYSTEM_HEALTH, {
    pollInterval: 10000, // Refresh every 10 seconds for real-time monitoring
    fetchPolicy: 'network-only',
  });
}

// Performance Metrics Hook
export function usePerformanceMetrics(hours: number = 24) {
  return useQuery(GET_PERFORMANCE_HISTORY, {
    variables: { hours },
    pollInterval: 30000,
    fetchPolicy: 'cache-and-network',
  });
}

// Load Test Hook (Mutation)
export function useRunLoadTest() {
  return useMutation(RUN_LOAD_TEST, {
    onCompleted: (data) => {
      console.log('Load test completed:', data);
    },
    onError: (error) => {
      console.error('Load test error:', error);
    },
  });
}

// Generate User Report Hook (Mutation)
export function useGenerateUserReport() {
  return useMutation(GENERATE_USER_REPORT, {
    onError: (error) => {
      console.error('User report generation error:', error);
    },
  });
}

// Generate System Report Hook (Mutation)
export function useGenerateSystemReport() {
  return useMutation(GENERATE_SYSTEM_REPORT, {
    onError: (error) => {
      console.error('System report generation error:', error);
    },
  });
}

// Note: Compliance report generation not yet implemented in backend
// This function is a placeholder for future implementation

// Combined Analytics Hook (for comprehensive dashboard)
export function useCombinedAnalytics() {
  const dashboard = useAnalyticsDashboard();
  const tokenVelocity = useTokenVelocity();
  const stakingMetrics = useStakingMetrics();
  const conversionAnalytics = useConversionAnalytics();
  const revenueBreakdown = useRevenueBreakdown();
  const systemHealth = useSystemHealth();

  return {
    dashboard,
    tokenVelocity,
    stakingMetrics,
    conversionAnalytics,
    revenueBreakdown,
    systemHealth,
    loading: 
      dashboard.loading ||
      tokenVelocity.loading ||
      stakingMetrics.loading ||
      conversionAnalytics.loading ||
      revenueBreakdown.loading ||
      systemHealth.loading,
    error: 
      dashboard.error ||
      tokenVelocity.error ||
      stakingMetrics.error ||
      conversionAnalytics.error ||
      revenueBreakdown.error ||
      systemHealth.error,
  };
}

// Real-time update hook with WebSocket (for future implementation)
export function useRealtimeAnalytics() {
  // Placeholder for WebSocket integration
  // Will subscribe to real-time updates from backend
  return {
    connected: false,
    lastUpdate: null,
  };
}

// Custom hook for error handling
export function useAnalyticsErrorHandler() {
  return (error: any) => {
    if (error.networkError) {
      console.error('Network error:', error.networkError);
      // Show network error notification
      return 'Network connection issue. Please check your internet.';
    }
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', error.graphQLErrors);
      // Show GraphQL error notification
      return error.graphQLErrors[0]?.message || 'An error occurred';
    }
    return 'An unexpected error occurred';
  };
}

// Custom hook for data transformation
export function useAnalyticsDataTransform() {
  const transformChartData = (data: any[]) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      value: parseFloat(item.value || 0),
      timestamp: new Date(item.timestamp),
    }));
  };

  const transformPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const transformCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return {
    transformChartData,
    transformPercentage,
    transformCurrency,
  };
}
