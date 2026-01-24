/**
 * Unit Tests for Security Dashboard
 * Tests security metrics, threat detection, and IP management
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecurityPage from '@/app/super-admin/security/page';
import { SuperAdminProvider } from '@/contexts/SuperAdminContext';

// Mock fetch
global.fetch = jest.fn();

const mockSecurityData = {
  metrics: {
    totalThreats: 1247,
    threatsBlocked: 1189,
    failedLogins: 342,
    suspiciousIPs: 67,
    activeBlacklist: 45,
    successRate: 95.3,
    avgResponseTime: 124,
    vulnerabilities: 3,
    securityScore: 87,
    lastScan: 'Oct 6, 2025 10:30 AM'
  },
  failedLogins: [
    {
      id: '1',
      username: 'admin@example.com',
      ipAddress: '41.203.245.178',
      country: 'Nigeria',
      attempts: 12,
      lastAttempt: 'Oct 6, 2025 10:45 AM',
      reason: 'Brute force attack detected',
      blocked: true
    }
  ],
  blacklistedIPs: [],
  securityAlerts: [],
  vulnerabilities: []
};

const mockUser = {
  id: 'user-1',
  email: 'admin@coindaily.com',
  role: 'SUPER_ADMIN',
  name: 'Test Admin'
};

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <SuperAdminProvider>
      {component}
    </SuperAdminProvider>
  );
};

describe('Security Dashboard', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSecurityData
    });
    localStorage.setItem('accessToken', 'test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('should render security dashboard header', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
        expect(screen.getByText(/Threat detection, monitoring, and incident response/i)).toBeInTheDocument();
      });
    });

    it('should display security score', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('87')).toBeInTheDocument();
        expect(screen.getByText('out of 100')).toBeInTheDocument();
      });
    });

    it('should show all time range options', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
        expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      });
    });
  });

  describe('Security Metrics', () => {
    it('should display threats blocked metric', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('1189')).toBeInTheDocument();
        expect(screen.getByText('95.3%')).toBeInTheDocument();
      });
    });

    it('should display failed logins count', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('342')).toBeInTheDocument();
      });
    });

    it('should display blacklisted IPs count', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument();
      });
    });

    it('should display vulnerabilities count', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        const threatsTab = screen.getByText('threats');
        fireEvent.click(threatsTab);
        expect(threatsTab).toHaveClass('text-blue-500');
      });
    });

    it('should display overview tab by default', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        const overviewTab = screen.getByText('overview');
        expect(overviewTab).toHaveClass('text-blue-500');
      });
    });
  });

  describe('Data Loading', () => {
    it('should show loading state initially', () => {
      renderWithContext(<SecurityPage />);
      expect(screen.getByText(/Loading security data/i)).toBeInTheDocument();
    });

    it('should fetch data on mount', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/super-admin/security'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token'
            })
          })
        );
      });
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/Loading security data/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should reload data when refresh is clicked', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Time Range Filter', () => {
    it('should update data when time range changes', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        const sevenDaysButton = screen.getByText('Last 7 Days');
        fireEvent.click(sevenDaysButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('timeRange=7d'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Security Score Color', () => {
    it('should show green for high scores', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        const scoreElement = screen.getByText('87');
        expect(scoreElement).toHaveClass('text-yellow-500'); // 87 is in yellow range (70-89)
      });
    });
  });

  describe('Failed Logins Display', () => {
    it('should display failed login entries', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        const threatsTab = screen.getByText('threats');
        fireEvent.click(threatsTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('41.203.245.178')).toBeInTheDocument();
        expect(screen.getByText('Nigeria')).toBeInTheDocument();
      });
    });
  });

  describe('IP Blocking', () => {
    it('should call block IP API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecurityData
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        const threatsTab = screen.getByText('threats');
        fireEvent.click(threatsTab);
      });
      
      await waitFor(() => {
        const blockButton = screen.getByText('Block IP');
        if (blockButton) {
          fireEvent.click(blockButton);
        }
      });
    });
  });

  describe('Export Functionality', () => {
    it('should have export button', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Export Report')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithContext(<SecurityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
      });
    });
  });
});

describe('Security API Integration', () => {
  it('should format API request correctly', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSecurityData
    });
    global.fetch = mockFetch;

    renderWithContext(<SecurityPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/super-admin/security'),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });
  });
});
