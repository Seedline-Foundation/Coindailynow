import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const timeRange = request.nextUrl.searchParams.get('timeRange') || '24h';

    // Mock rate limiting data
    const data = {
      metrics: {
        totalRequests: 1245678,
        blockedRequests: 8934,
        suspiciousIPs: 127,
        attacksDetected: 5,
        peakRPS: 3456,
        avgResponseTime: 143,
        bandwidthUsed: '47.3 GB',
        mitigation: 'active' as const
      },
      rateLimits: [
        {
          id: '1',
          endpoint: '/api/auth/login',
          limit: 5,
          window: 'minute',
          enabled: true,
          hits: 4234,
          blocked: 234
        },
        {
          id: '2',
          endpoint: '/api/articles',
          limit: 100,
          window: 'minute',
          enabled: true,
          hits: 89456,
          blocked: 1245
        },
        {
          id: '3',
          endpoint: '/api/market-data',
          limit: 30,
          window: 'second',
          enabled: true,
          hits: 234567,
          blocked: 3456
        },
        {
          id: '4',
          endpoint: '/api/search',
          limit: 20,
          window: 'minute',
          enabled: true,
          hits: 12345,
          blocked: 456
        },
        {
          id: '5',
          endpoint: '/api/comments',
          limit: 10,
          window: 'minute',
          enabled: false,
          hits: 5678,
          blocked: 123
        },
        {
          id: '6',
          endpoint: '/api/upload',
          limit: 5,
          window: 'hour',
          enabled: true,
          hits: 2345,
          blocked: 89
        }
      ],
      trafficPatterns: [
        {
          id: '1',
          timestamp: '10:00',
          requests: 45678,
          blocked: 234,
          avgResponseTime: 145,
          topEndpoint: '/api/articles'
        },
        {
          id: '2',
          timestamp: '11:00',
          requests: 52341,
          blocked: 456,
          avgResponseTime: 158,
          topEndpoint: '/api/market-data'
        },
        {
          id: '3',
          timestamp: '12:00',
          requests: 67890,
          blocked: 789,
          avgResponseTime: 172,
          topEndpoint: '/api/articles'
        },
        {
          id: '4',
          timestamp: '13:00',
          requests: 78901,
          blocked: 1234,
          avgResponseTime: 186,
          topEndpoint: '/api/search'
        },
        {
          id: '5',
          timestamp: '14:00',
          requests: 89012,
          blocked: 1567,
          avgResponseTime: 194,
          topEndpoint: '/api/market-data'
        },
        {
          id: '6',
          timestamp: '15:00',
          requests: 94567,
          blocked: 1890,
          avgResponseTime: 203,
          topEndpoint: '/api/articles'
        },
        {
          id: '7',
          timestamp: '16:00',
          requests: 87654,
          blocked: 1456,
          avgResponseTime: 189,
          topEndpoint: '/api/market-data'
        },
        {
          id: '8',
          timestamp: '17:00',
          requests: 76543,
          blocked: 1123,
          avgResponseTime: 167,
          topEndpoint: '/api/articles'
        }
      ],
      blockedRequests: [
        {
          id: '1',
          ipAddress: '41.203.245.178',
          country: 'Nigeria',
          endpoint: '/api/articles',
          reason: 'Rate limit exceeded (100 req/min)',
          timestamp: 'Oct 5, 2025 10:45 AM',
          attemptCount: 156
        },
        {
          id: '2',
          ipAddress: '196.207.89.124',
          country: 'Kenya',
          endpoint: '/api/market-data',
          reason: 'Suspicious traffic pattern detected',
          timestamp: 'Oct 5, 2025 10:42 AM',
          attemptCount: 234
        },
        {
          id: '3',
          ipAddress: '102.176.45.89',
          country: 'South Africa',
          endpoint: '/api/auth/login',
          reason: 'Rate limit exceeded (5 req/min)',
          timestamp: 'Oct 5, 2025 10:40 AM',
          attemptCount: 12
        },
        {
          id: '4',
          ipAddress: '154.72.188.56',
          country: 'Ghana',
          endpoint: '/api/search',
          reason: 'Bot detection triggered',
          timestamp: 'Oct 5, 2025 10:38 AM',
          attemptCount: 89
        },
        {
          id: '5',
          ipAddress: '197.231.156.78',
          country: 'Egypt',
          endpoint: '/api/market-data',
          reason: 'Rate limit exceeded (30 req/sec)',
          timestamp: 'Oct 5, 2025 10:35 AM',
          attemptCount: 345
        },
        {
          id: '6',
          ipAddress: '41.74.123.45',
          country: 'Tanzania',
          endpoint: '/api/articles',
          reason: 'DDoS attack pattern detected',
          timestamp: 'Oct 5, 2025 10:33 AM',
          attemptCount: 456
        },
        {
          id: '7',
          ipAddress: '197.45.123.67',
          country: 'Senegal',
          endpoint: '/api/upload',
          reason: 'Rate limit exceeded (5 req/hour)',
          timestamp: 'Oct 5, 2025 10:30 AM',
          attemptCount: 8
        },
        {
          id: '8',
          ipAddress: '41.89.234.156',
          country: 'Uganda',
          endpoint: '/api/comments',
          reason: 'Spam detection triggered',
          timestamp: 'Oct 5, 2025 10:28 AM',
          attemptCount: 67
        }
      ],
      geoBlocking: [
        {
          id: '1',
          country: 'Nigeria',
          countryCode: 'NG',
          status: 'allowed' as const,
          requests: 345678,
          blockedCount: 1234
        },
        {
          id: '2',
          country: 'Kenya',
          countryCode: 'KE',
          status: 'allowed' as const,
          requests: 234567,
          blockedCount: 890
        },
        {
          id: '3',
          country: 'South Africa',
          countryCode: 'ZA',
          status: 'allowed' as const,
          requests: 198765,
          blockedCount: 678
        },
        {
          id: '4',
          country: 'Ghana',
          countryCode: 'GH',
          status: 'allowed' as const,
          requests: 156789,
          blockedCount: 456
        },
        {
          id: '5',
          country: 'Egypt',
          countryCode: 'EG',
          status: 'monitored' as const,
          requests: 123456,
          blockedCount: 1567
        },
        {
          id: '6',
          country: 'China',
          countryCode: 'CN',
          status: 'blocked' as const,
          requests: 89012,
          blockedCount: 89012
        },
        {
          id: '7',
          country: 'Russia',
          countryCode: 'RU',
          status: 'blocked' as const,
          requests: 67890,
          blockedCount: 67890
        },
        {
          id: '8',
          country: 'Tanzania',
          countryCode: 'TZ',
          status: 'allowed' as const,
          requests: 45678,
          blockedCount: 234
        }
      ]
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching rate limiting data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limiting data' },
      { status: 500 }
    );
  }
}
