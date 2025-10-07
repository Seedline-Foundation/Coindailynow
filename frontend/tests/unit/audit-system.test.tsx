/**
 * Unit Tests for Audit System
 * Tests audit logging, filtering, and analytics
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuditPage from '@/app/super-admin/audit/page';
import { SuperAdminProvider } from '@/contexts/SuperAdminContext';

global.fetch = jest.fn();

const mockAuditData = {
  logs: [
    {
      id: '1',
      timestamp: 'Oct 6, 2025 10:45 AM',
      userId: 'user-1',
      userName: 'Kwame Osei',
      userEmail: 'kwame@coindaily.com',
      action: 'User Login',
      category: 'authentication',
      resource: '/api/auth/login',
      result: 'success',
      ipAddress: '41.203.245.178',
      country: 'Nigeria',
      device: 'Desktop',
      browser: 'Chrome 118',
      details: 'Successful login with 2FA verification'
    }
  ],
  metrics: {
    totalEvents: 15234,
    successRate: 94.5,
    failureCount: 837,
    uniqueUsers: 234,
    topActions: [
      { action: 'User Login', count: 3456 }
    ],
    topUsers: [
      { userId: 'user-1', userName: 'Kwame Osei', count: 456 }
    ],
    eventsByCategory: {
      authentication: 4567,
      content: 3456
    },
    eventsByHour: []
  }
};

describe('Audit System', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockAuditData
    });
    localStorage.setItem('accessToken', 'test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('should render audit system header', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Audit System')).toBeInTheDocument();
      });
    });

    it('should display date range selector', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
        expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
        expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      });
    });
  });

  describe('Audit Logs Display', () => {
    it('should display audit log entries', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Kwame Osei')).toBeInTheDocument();
        expect(screen.getByText('User Login')).toBeInTheDocument();
        expect(screen.getByText('41.203.245.178')).toBeInTheDocument();
      });
    });

    it('should show log details', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Successful login with 2FA/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by category', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const categorySelect = screen.getByDisplayValue(/All Categories/i);
        fireEvent.change(categorySelect, { target: { value: 'authentication' } });
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=authentication'),
        expect.any(Object)
      );
    });

    it('should filter by result', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const resultSelect = screen.getByDisplayValue(/All Results/i);
        fireEvent.change(resultSelect, { target: { value: 'success' } });
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('result=success'),
        expect.any(Object)
      );
    });

    it('should search logs', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search logs/i);
        fireEvent.change(searchInput, { target: { value: 'login' } });
      });
      
      // Search is client-side filtering
      expect(screen.getByText('User Login')).toBeInTheDocument();
    });
  });

  describe('Analytics Tab', () => {
    it('should display metrics', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('analytics');
        fireEvent.click(analyticsTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('15,234')).toBeInTheDocument();
        expect(screen.getByText('94.5%')).toBeInTheDocument();
      });
    });

    it('should show top actions', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('analytics');
        fireEvent.click(analyticsTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('User Login')).toBeInTheDocument();
        expect(screen.getByText('3456')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should have export CSV button', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
    });

    it('should call export API when clicked', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuditData
      }).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV');
        fireEvent.click(exportButton);
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls', async () => {
      const logsData = {
        ...mockAuditData,
        logs: Array(25).fill(mockAuditData.logs[0]).map((log, i) => ({
          ...log,
          id: `${i}`
        }))
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => logsData
      });

      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });
  });

  describe('Reports Tab', () => {
    it('should display report types', async () => {
      render(
        <SuperAdminProvider>
          <AuditPage />
        </SuperAdminProvider>
      );
      
      await waitFor(() => {
        const reportsTab = screen.getByText('reports');
        fireEvent.click(reportsTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Security Audit Report')).toBeInTheDocument();
        expect(screen.getByText('GDPR Compliance Report')).toBeInTheDocument();
        expect(screen.getByText('User Activity Report')).toBeInTheDocument();
        expect(screen.getByText('Data Access Report')).toBeInTheDocument();
      });
    });
  });
});
