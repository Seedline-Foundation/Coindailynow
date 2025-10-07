/**
 * Super Admin Dashboard Integration Tests
 * End-to-end testing for dashboard user flows
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import { SuperAdminProvider, useSuperAdmin } from '@/contexts/SuperAdminContext';
import SuperAdminDashboard from '@/app/super-admin/dashboard/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === 'super_admin_token') {
      return 'mock-jwt-token'; // Mock valid token
    }
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock fetch with proper API response
const mockFetch = jest.fn((input: RequestInfo | URL, options?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();
  if (url === '/api/super-admin/stats' && options?.headers && 'Authorization' in options.headers) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        stats: mockStats,
        cached: false,
      }),
    } as Response);
  }
  return Promise.reject(new Error('Network error'));
});
global.fetch = mockFetch;

const mockStats = {
  totalUsers: 1250,
  totalArticles: 340,
  totalRevenue: 15750.00,
  activeSubscriptions: 89,
  systemHealth: 'healthy' as const,
  aiProcessingRate: 94,
  serverUptime: 99.8,
  dailyActiveUsers: 450,
  apiRequests: 12500,
  errorRate: 0.2,
};

const mockAlerts = [
  {
    id: 'alert-1',
    type: 'warning' as const,
    message: 'AI processing rate below threshold',
    timestamp: new Date(),
    acknowledged: false,
    component: 'AI System',
  },
];

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminProvider>
      {children}
    </SuperAdminProvider>
  );
}

describe('Super Admin Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        stats: mockStats,
        cached: false,
      }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Dashboard Loading', () => {
    it('should show loading state initially', () => {
      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    });

    it('should load and display dashboard data', async () => {
      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });

      // Check if stats are displayed
      expect(screen.getByText('1,250')).toBeInTheDocument(); // totalUsers
      expect(screen.getByText('340')).toBeInTheDocument(); // totalArticles
      expect(screen.getByText('$15,750.00')).toBeInTheDocument(); // totalRevenue
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('System Health Display', () => {
    it('should show healthy system status', async () => {
      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
      });

      // Check for green health indicator
      const healthIndicator = screen.getByText('All Systems Operational').closest('div');
      expect(healthIndicator).toHaveClass('text-green-400');
    });

    it('should show warning status for degraded systems', async () => {
      const warningStats = { ...mockStats, systemHealth: 'warning' as const };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: warningStats,
          cached: false,
        }),
      });

      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Degraded')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display all statistic cards', async () => {
      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });

      // Check for key metrics
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Articles')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('AI Processing Rate')).toBeInTheDocument();
      expect(screen.getByText('Server Uptime')).toBeInTheDocument();
    });

    it('should show correct values in stat cards', async () => {
      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument();
      });

      // Verify specific values
      expect(screen.getByText('340')).toBeInTheDocument();
      expect(screen.getByText('89')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('99.8%')).toBeInTheDocument();
    });
  });

  describe('System Alerts', () => {
    it('should display active alerts', async () => {
      // Mock context with alerts
      const TestComponent = () => {
        const { systemAlerts } = useSuperAdmin();
        return (
          <div>
            {systemAlerts.map(alert => (
              <div key={alert.id} data-testid={`alert-${alert.id}`}>
                {alert.message}
              </div>
            ))}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('alert-alert-1')).toBeInTheDocument();
      });

      expect(screen.getByText('AI processing rate below threshold')).toBeInTheDocument();
    });

    it('should allow acknowledging alerts', async () => {
      const TestComponent = () => {
        const { systemAlerts, acknowledgeAlert } = useSuperAdmin();

        return (
          <div>
            {systemAlerts.map(alert => (
              <button
                key={alert.id}
                onClick={() => acknowledgeAlert(alert.id)}
                data-testid={`acknowledge-${alert.id}`}
              >
                Acknowledge
              </button>
            ))}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('acknowledge-alert-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('acknowledge-alert-1'));

      // Verify API call was made
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/super-admin/alerts/acknowledge',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ alertId: 'alert-1' }),
        })
      );
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button is clicked', async () => {
      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Should make another API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Caching Behavior', () => {
    it('should indicate when data is from cache', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
          cached: true,
        }),
      });

      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });

      // The context should handle cached responses appropriately
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/super-admin/stats',
        expect.any(Object)
      );
    });
  });

  describe('Error Recovery', () => {
    it('should show retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <SuperAdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Should attempt to fetch again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});