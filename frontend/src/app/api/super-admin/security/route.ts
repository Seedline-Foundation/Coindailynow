import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock security data
    const timeRange = request.nextUrl.searchParams.get('timeRange') || '24h';

    const data = {
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
        lastScan: 'Oct 5, 2025 10:30 AM'
      },
      failedLogins: [
        {
          id: '1',
          username: 'admin@example.com',
          ipAddress: '41.203.245.178',
          country: 'Nigeria',
          attempts: 12,
          lastAttempt: 'Oct 5, 2025 10:45 AM',
          reason: 'Brute force attack detected',
          blocked: true
        },
        {
          id: '2',
          username: 'user@coindaily.com',
          ipAddress: '196.207.89.124',
          country: 'Kenya',
          attempts: 5,
          lastAttempt: 'Oct 5, 2025 10:30 AM',
          reason: 'Multiple failed password attempts',
          blocked: false
        },
        {
          id: '3',
          username: 'root',
          ipAddress: '102.176.45.89',
          country: 'South Africa',
          attempts: 8,
          lastAttempt: 'Oct 5, 2025 10:15 AM',
          reason: 'Invalid username enumeration',
          blocked: true
        },
        {
          id: '4',
          username: 'admin',
          ipAddress: '154.72.188.56',
          country: 'Ghana',
          attempts: 15,
          lastAttempt: 'Oct 5, 2025 09:45 AM',
          reason: 'Credential stuffing attack',
          blocked: true
        },
        {
          id: '5',
          username: 'support@coindaily.com',
          ipAddress: '197.231.156.78',
          country: 'Egypt',
          attempts: 3,
          lastAttempt: 'Oct 5, 2025 09:30 AM',
          reason: 'Suspicious login pattern',
          blocked: false
        },
        {
          id: '6',
          username: 'test@test.com',
          ipAddress: '41.74.123.45',
          country: 'Tanzania',
          attempts: 6,
          lastAttempt: 'Oct 5, 2025 09:00 AM',
          reason: 'Account enumeration attempt',
          blocked: false
        }
      ],
      blacklistedIPs: [
        {
          id: '1',
          ipAddress: '41.203.245.178',
          reason: 'Repeated brute force attacks on admin accounts',
          addedBy: 'System Auto-Block',
          addedAt: 'Oct 5, 2025 10:45 AM',
          expiresAt: 'Oct 12, 2025 10:45 AM',
          permanent: false,
          attempts: 12
        },
        {
          id: '2',
          ipAddress: '154.72.188.56',
          reason: 'Credential stuffing and DDoS attempts',
          addedBy: 'admin@coindaily.com',
          addedAt: 'Oct 4, 2025 03:20 PM',
          permanent: true,
          attempts: 24
        },
        {
          id: '3',
          ipAddress: '102.176.45.89',
          reason: 'SQL injection attempts detected',
          addedBy: 'System Auto-Block',
          addedAt: 'Oct 5, 2025 10:15 AM',
          expiresAt: 'Nov 5, 2025 10:15 AM',
          permanent: false,
          attempts: 8
        },
        {
          id: '4',
          ipAddress: '197.45.123.67',
          reason: 'Multiple XSS attack attempts',
          addedBy: 'security@coindaily.com',
          addedAt: 'Oct 3, 2025 11:30 AM',
          permanent: true,
          attempts: 18
        },
        {
          id: '5',
          ipAddress: '41.89.234.156',
          reason: 'Automated scraping and data harvesting',
          addedBy: 'System Auto-Block',
          addedAt: 'Oct 5, 2025 08:00 AM',
          expiresAt: 'Oct 8, 2025 08:00 AM',
          permanent: false,
          attempts: 156
        }
      ],
      securityAlerts: [
        {
          id: '1',
          type: 'critical' as const,
          title: 'Multiple Failed Login Attempts Detected',
          description: 'Unusual spike in failed login attempts from Nigerian IP addresses. Automated blocking has been enabled.',
          timestamp: 'Oct 5, 2025 10:45 AM',
          resolved: false,
          affectedUsers: 12
        },
        {
          id: '2',
          type: 'warning' as const,
          title: 'Suspicious API Activity',
          description: 'Elevated API request rate detected from unknown user agents. Rate limiting applied.',
          timestamp: 'Oct 5, 2025 09:30 AM',
          resolved: false,
          affectedUsers: 5
        },
        {
          id: '3',
          type: 'info' as const,
          title: 'Security Scan Completed',
          description: 'Automated security scan completed successfully. 3 medium-priority vulnerabilities identified.',
          timestamp: 'Oct 5, 2025 08:00 AM',
          resolved: true
        },
        {
          id: '4',
          type: 'critical' as const,
          title: 'DDoS Attack Mitigated',
          description: 'Large-scale DDoS attack detected and successfully blocked. 450+ malicious IPs identified.',
          timestamp: 'Oct 4, 2025 11:20 PM',
          resolved: true,
          affectedUsers: 0
        },
        {
          id: '5',
          type: 'warning' as const,
          title: 'Outdated Dependencies Detected',
          description: '5 npm packages have available security updates. Update recommended.',
          timestamp: 'Oct 4, 2025 06:00 PM',
          resolved: false
        },
        {
          id: '6',
          type: 'info' as const,
          title: 'SSL Certificate Renewal',
          description: 'SSL certificate will expire in 90 days. Automatic renewal scheduled.',
          timestamp: 'Oct 4, 2025 03:00 PM',
          resolved: true
        }
      ],
      vulnerabilities: [
        {
          id: '1',
          severity: 'high' as const,
          title: 'Outdated Node.js Dependencies',
          description: 'Multiple npm packages have known vulnerabilities. Update to latest stable versions recommended.',
          cve: 'CVE-2024-12345',
          affectedComponent: 'npm packages (express, axios, jsonwebtoken)',
          discoveredAt: 'Oct 5, 2025 08:00 AM',
          status: 'open' as const
        },
        {
          id: '2',
          severity: 'medium' as const,
          title: 'Missing Rate Limiting on API Endpoints',
          description: 'Some API endpoints lack proper rate limiting, potentially allowing abuse.',
          affectedComponent: '/api/public/* endpoints',
          discoveredAt: 'Oct 4, 2025 02:00 PM',
          status: 'in-progress' as const
        },
        {
          id: '3',
          severity: 'medium' as const,
          title: 'Weak Password Policy',
          description: 'Current password requirements may be insufficient for high-security accounts.',
          affectedComponent: 'Authentication System',
          discoveredAt: 'Oct 3, 2025 10:00 AM',
          status: 'open' as const
        },
        {
          id: '4',
          severity: 'low' as const,
          title: 'Verbose Error Messages',
          description: 'Some error responses include stack traces that could aid attackers.',
          affectedComponent: 'Error Handling Middleware',
          discoveredAt: 'Oct 2, 2025 04:00 PM',
          status: 'resolved' as const
        },
        {
          id: '5',
          severity: 'critical' as const,
          title: 'SQL Injection Risk (Resolved)',
          description: 'Raw SQL queries detected in legacy code. All instances have been migrated to parameterized queries.',
          cve: 'CVE-2024-11111',
          affectedComponent: 'Database Layer',
          discoveredAt: 'Sep 28, 2025 09:00 AM',
          status: 'resolved' as const
        }
      ]
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching security data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    );
  }
}
