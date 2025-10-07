import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('dateRange') || '7d';
    const category = searchParams.get('category') || 'all';
    const result = searchParams.get('result') || 'all';
    const user = searchParams.get('user') || 'all';

    // Mock audit logs
    const logs = [
      {
        id: '1',
        timestamp: 'Oct 5, 2025 10:45 AM',
        userId: 'user-1',
        userName: 'Kwame Osei',
        userEmail: 'kwame@coindaily.com',
        action: 'User Login',
        category: 'authentication' as const,
        resource: '/api/auth/login',
        result: 'success' as const,
        ipAddress: '41.203.245.178',
        country: 'Nigeria',
        device: 'Desktop',
        browser: 'Chrome 118',
        details: 'Successful login with 2FA verification'
      },
      {
        id: '2',
        timestamp: 'Oct 5, 2025 10:40 AM',
        userId: 'user-2',
        userName: 'Amara Nwosu',
        userEmail: 'amara@coindaily.com',
        action: 'Article Published',
        category: 'content' as const,
        resource: '/articles/bitcoin-surge-africa',
        result: 'success' as const,
        ipAddress: '196.207.89.124',
        country: 'Kenya',
        device: 'Mobile',
        browser: 'Safari 17',
        details: 'Published article "Bitcoin Surges in African Markets"'
      },
      {
        id: '3',
        timestamp: 'Oct 5, 2025 10:35 AM',
        userId: 'user-3',
        userName: 'Thandiwe Mbatha',
        userEmail: 'thandiwe@coindaily.com',
        action: 'Failed Login Attempt',
        category: 'authentication' as const,
        resource: '/api/auth/login',
        result: 'failure' as const,
        ipAddress: '102.176.45.89',
        country: 'South Africa',
        device: 'Desktop',
        browser: 'Firefox 119',
        details: 'Invalid password - 3rd attempt'
      },
      {
        id: '4',
        timestamp: 'Oct 5, 2025 10:30 AM',
        userId: 'user-1',
        userName: 'Kwame Osei',
        userEmail: 'kwame@coindaily.com',
        action: 'User Role Updated',
        category: 'user_management' as const,
        resource: '/users/user-456/role',
        result: 'success' as const,
        ipAddress: '41.203.245.178',
        country: 'Nigeria',
        device: 'Desktop',
        browser: 'Chrome 118',
        details: 'Changed user role from EDITOR to ADMIN'
      },
      {
        id: '5',
        timestamp: 'Oct 5, 2025 10:25 AM',
        userId: 'user-4',
        userName: 'Chinedu Okeke',
        userEmail: 'chinedu@coindaily.com',
        action: 'Database Backup',
        category: 'system' as const,
        resource: '/system/backup',
        result: 'success' as const,
        ipAddress: '154.72.188.56',
        country: 'Ghana',
        device: 'Server',
        browser: 'System',
        details: 'Automated daily backup completed - 2.3 GB'
      },
      {
        id: '6',
        timestamp: 'Oct 5, 2025 10:20 AM',
        userId: 'user-5',
        userName: 'Fatima Hassan',
        userEmail: 'fatima@coindaily.com',
        action: 'IP Blocked',
        category: 'security' as const,
        resource: '/security/blacklist',
        result: 'success' as const,
        ipAddress: '197.231.156.78',
        country: 'Egypt',
        device: 'Desktop',
        browser: 'Edge 118',
        details: 'Blocked IP 41.89.234.156 for suspicious activity'
      },
      {
        id: '7',
        timestamp: 'Oct 5, 2025 10:15 AM',
        userId: 'user-6',
        userName: 'Jabari Mwangi',
        userEmail: 'jabari@coindaily.com',
        action: 'API Key Generated',
        category: 'api' as const,
        resource: '/api/keys/generate',
        result: 'success' as const,
        ipAddress: '41.74.123.45',
        country: 'Tanzania',
        device: 'Desktop',
        browser: 'Chrome 118',
        details: 'Generated new API key for third-party integration'
      },
      {
        id: '8',
        timestamp: 'Oct 5, 2025 10:10 AM',
        userId: 'user-2',
        userName: 'Amara Nwosu',
        userEmail: 'amara@coindaily.com',
        action: 'Data Export Request',
        category: 'data' as const,
        resource: '/gdpr/export',
        result: 'success' as const,
        ipAddress: '196.207.89.124',
        country: 'Kenya',
        device: 'Mobile',
        browser: 'Safari 17',
        details: 'User requested personal data export (GDPR)'
      },
      {
        id: '9',
        timestamp: 'Oct 5, 2025 10:05 AM',
        userId: 'user-7',
        userName: 'Zara Diop',
        userEmail: 'zara@coindaily.com',
        action: 'Article Deleted',
        category: 'content' as const,
        resource: '/articles/old-news-2024',
        result: 'warning' as const,
        ipAddress: '197.45.123.67',
        country: 'Senegal',
        device: 'Desktop',
        browser: 'Firefox 119',
        details: 'Deleted article without admin approval'
      },
      {
        id: '10',
        timestamp: 'Oct 5, 2025 10:00 AM',
        userId: 'user-3',
        userName: 'Thandiwe Mbatha',
        userEmail: 'thandiwe@coindaily.com',
        action: 'Password Changed',
        category: 'authentication' as const,
        resource: '/api/auth/change-password',
        result: 'success' as const,
        ipAddress: '102.176.45.89',
        country: 'South Africa',
        device: 'Desktop',
        browser: 'Firefox 119',
        details: 'User successfully changed password'
      },
      {
        id: '11',
        timestamp: 'Oct 5, 2025 09:55 AM',
        userId: 'user-4',
        userName: 'Chinedu Okeke',
        userEmail: 'chinedu@coindaily.com',
        action: 'System Configuration Update',
        category: 'system' as const,
        resource: '/system/config',
        result: 'success' as const,
        ipAddress: '154.72.188.56',
        country: 'Ghana',
        device: 'Server',
        browser: 'System',
        details: 'Updated rate limiting configuration'
      },
      {
        id: '12',
        timestamp: 'Oct 5, 2025 09:50 AM',
        userId: 'user-8',
        userName: 'Omar Kamau',
        userEmail: 'omar@coindaily.com',
        action: 'Failed API Request',
        category: 'api' as const,
        resource: '/api/market-data',
        result: 'failure' as const,
        ipAddress: '41.89.234.156',
        country: 'Tanzania',
        device: 'Mobile',
        browser: 'Chrome Mobile 118',
        details: 'Rate limit exceeded - 1000 requests in 1 minute'
      },
      {
        id: '13',
        timestamp: 'Oct 5, 2025 09:45 AM',
        userId: 'user-1',
        userName: 'Kwame Osei',
        userEmail: 'kwame@coindaily.com',
        action: 'Comment Moderated',
        category: 'content' as const,
        resource: '/comments/comment-789',
        result: 'success' as const,
        ipAddress: '41.203.245.178',
        country: 'Nigeria',
        device: 'Desktop',
        browser: 'Chrome 118',
        details: 'Removed spam comment and banned user'
      },
      {
        id: '14',
        timestamp: 'Oct 5, 2025 09:40 AM',
        userId: 'user-5',
        userName: 'Fatima Hassan',
        userEmail: 'fatima@coindaily.com',
        action: 'Security Alert',
        category: 'security' as const,
        resource: '/security/alerts',
        result: 'warning' as const,
        ipAddress: '197.231.156.78',
        country: 'Egypt',
        device: 'Desktop',
        browser: 'Edge 118',
        details: 'Multiple failed login attempts detected from same IP'
      },
      {
        id: '15',
        timestamp: 'Oct 5, 2025 09:35 AM',
        userId: 'user-9',
        userName: 'Aisha Bello',
        userEmail: 'aisha@coindaily.com',
        action: 'Database Query',
        category: 'data' as const,
        resource: '/database/users',
        result: 'success' as const,
        ipAddress: '41.76.234.123',
        country: 'Nigeria',
        device: 'Desktop',
        browser: 'Chrome 118',
        details: 'Exported user list for marketing campaign'
      }
    ];

    const metrics = {
      totalEvents: 15234,
      successRate: 94.5,
      failureCount: 837,
      uniqueUsers: 234,
      topActions: [
        { action: 'User Login', count: 3456 },
        { action: 'Article Published', count: 2341 },
        { action: 'Comment Posted', count: 1876 },
        { action: 'API Request', count: 1567 },
        { action: 'User Role Updated', count: 1234 }
      ],
      topUsers: [
        { userId: 'user-1', userName: 'Kwame Osei', count: 456 },
        { userId: 'user-2', userName: 'Amara Nwosu', count: 389 },
        { userId: 'user-3', userName: 'Thandiwe Mbatha', count: 342 },
        { userId: 'user-4', userName: 'Chinedu Okeke', count: 298 },
        { userId: 'user-5', userName: 'Fatima Hassan', count: 267 }
      ],
      eventsByCategory: {
        authentication: 4567,
        content: 3456,
        user_management: 2345,
        system: 1876,
        security: 1456,
        api: 1234,
        data: 300
      },
      eventsByHour: [
        { hour: '00:00', count: 234 },
        { hour: '03:00', count: 156 },
        { hour: '06:00', count: 456 },
        { hour: '09:00', count: 789 },
        { hour: '12:00', count: 1234 },
        { hour: '15:00', count: 1456 },
        { hour: '18:00', count: 1123 },
        { hour: '21:00', count: 876 }
      ]
    };

    return NextResponse.json({ logs, metrics });
  } catch (error) {
    console.error('Error fetching audit data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit data' },
      { status: 500 }
    );
  }
}
