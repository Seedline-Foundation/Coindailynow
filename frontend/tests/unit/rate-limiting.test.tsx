/**
 * Unit Tests for Rate Limiting System
 * Tests DDoS protection and traffic management
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RateLimitingPage from '@/app/super-admin/rate-limiting/page';
import { SuperAdminProvider } from '@/contexts/SuperAdminContext';

global.fetch = jest.fn();

const mockRateLimitData = {
  overview: {
    requestsPerSecond: 1247,
    blockedRequests: 342,
    activeRules: 15,
    protectedEndpoints: 48,
    avgResponseTime: 124,
    uptime: 99.98
  },
  rules: [
    {
      id: '1',
      name: 'API Rate Limit',
      endpoint: '/api/*',
      limit: 100,
      window: '1 minute',
      action: 'throttle',
      status: 'active',
      hits: 45234,
      blocked: 234
    }
  ],
  blockedIPs: [
    {
      ip: '41.203.245.178',
      reason: 'Exceeded rate limit',
      blockedAt: 'Oct 6, 2025 10:45 AM',
      expiresAt: 'Oct 6, 2025 11:45 AM',
      requestCount: 1523,
      country: 'Nigeria'
    }
  ],
  trafficPatterns: {
    hourly: [
      { hour: '00:00', requests: 1234, blocked: 23 }
    ],
    byEndpoint: [
      { endpoint: '/api/articles', requests: 5432, avgTime: 120 }
    ],
    byCountry: [
      { country: 'Nigeria', requests: 3456, blocked: 45 }
    ]
  },
  ddosMetrics: {
    suspiciousTraffic: 234,
    patternDetected: false,
    threatLevel: 'low',
    lastAttack: 'Oct 1, 2025 08:30 AM',
    mitigatedAttacks: 12
  }
};

describe('Rate Limiting System', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockRateLimitData
    });
    localStorage.setItem('accessToken', 'test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('should render rate limiting header', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Rate Limiting & DDoS Protection')).toBeInTheDocument();
      });
    });

    it('should display overview metrics', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('1,247')).toBeInTheDocument(); // requests per second
        expect(screen.getByText('342')).toBeInTheDocument(); // blocked
        expect(screen.getByText('15')).toBeInTheDocument(); // active rules
      });
    });
  });

  describe('Rate Limit Rules', () => {
    it('should display configured rules', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('API Rate Limit')).toBeInTheDocument();
        expect(screen.getByText('/api/*')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should show rule statistics', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('45234')).toBeInTheDocument(); // hits
        expect(screen.getByText('234')).toBeInTheDocument(); // blocked
      });
    });
  });

  describe('Rule Management', () => {
    it('should have create rule button', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Create Rule')).toBeInTheDocument();
      });
    });

    it('should toggle rule status', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const toggleButton = screen.getAllByRole('button', { name: /toggle/i })[0];
        fireEvent.click(toggleButton);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/super-admin/rate-limiting/toggle'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should edit rule configuration', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      // Should show edit modal
      await waitFor(() => {
        expect(screen.getByText('Edit Rate Limit Rule')).toBeInTheDocument();
      });
    });
  });

  describe('Blocked IPs', () => {
    it('should display blocked IP addresses', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const blockedTab = screen.getByText('blocked-ips');
        fireEvent.click(blockedTab);
      });

      await waitFor(() => {
        expect(screen.getByText('41.203.245.178')).toBeInTheDocument();
        expect(screen.getByText('Nigeria')).toBeInTheDocument();
      });
    });

    it('should show block reason', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const blockedTab = screen.getByText('blocked-ips');
        fireEvent.click(blockedTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Exceeded rate limit')).toBeInTheDocument();
      });
    });

    it('should have unblock button', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const blockedTab = screen.getByText('blocked-ips');
        fireEvent.click(blockedTab);
      });

      await waitFor(() => {
        const unblockButton = screen.getByText('Unblock');
        fireEvent.click(unblockButton);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/super-admin/rate-limiting/unblock'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('Traffic Patterns', () => {
    it('should display hourly traffic chart', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const trafficTab = screen.getByText('traffic');
        fireEvent.click(trafficTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Hourly Traffic')).toBeInTheDocument();
      });
    });

    it('should show endpoint statistics', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const trafficTab = screen.getByText('traffic');
        fireEvent.click(trafficTab);
      });

      await waitFor(() => {
        expect(screen.getByText('/api/articles')).toBeInTheDocument();
        expect(screen.getByText('5432')).toBeInTheDocument();
      });
    });

    it('should display country traffic', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const trafficTab = screen.getByText('traffic');
        fireEvent.click(trafficTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Nigeria')).toBeInTheDocument();
        expect(screen.getByText('3456')).toBeInTheDocument();
      });
    });
  });

  describe('DDoS Protection', () => {
    it('should display DDoS metrics', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const ddosTab = screen.getByText('ddos');
        fireEvent.click(ddosTab);
      });

      await waitFor(() => {
        expect(screen.getByText('234')).toBeInTheDocument(); // suspicious traffic
        expect(screen.getByText('low')).toBeInTheDocument(); // threat level
      });
    });

    it('should show threat level with correct color', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const ddosTab = screen.getByText('ddos');
        fireEvent.click(ddosTab);
      });

      await waitFor(() => {
        const threatLevel = screen.getByText('low');
        expect(threatLevel).toHaveClass('text-green-600');
      });
    });

    it('should display mitigated attacks', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const ddosTab = screen.getByText('ddos');
        fireEvent.click(ddosTab);
      });

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText(/Mitigated Attacks/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Monitoring', () => {
    it('should have refresh button', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should refresh data when clicked', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
      });

      // Should call API again
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Whitelist Management', () => {
    it('should have whitelist section', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const whitelistTab = screen.getByText('whitelist');
        fireEvent.click(whitelistTab);
      });

      await waitFor(() => {
        expect(screen.getByText('IP Whitelist')).toBeInTheDocument();
      });
    });

    it('should have add to whitelist button', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const whitelistTab = screen.getByText('whitelist');
        fireEvent.click(whitelistTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Add IP')).toBeInTheDocument();
      });
    });
  });

  describe('Time Range Filter', () => {
    it('should have time range options', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Last Hour')).toBeInTheDocument();
        expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      });
    });

    it('should update data when time range changes', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const timeRange = screen.getByText('Last 24 Hours');
        fireEvent.click(timeRange);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=24h'),
        expect.any(Object)
      );
    });
  });

  describe('Export Functionality', () => {
    it('should have export report button', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Export Report')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /Rate Limiting & DDoS Protection/i });
        expect(heading).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch rate limiting data on mount', async () => {
      render(
        <SuperAdminProvider>
          <RateLimitingPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/super-admin/rate-limiting'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token'
            })
          })
        );
      });
    });
  });
});
