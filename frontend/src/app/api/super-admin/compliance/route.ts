import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if user has required permissions
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      // Mock compliance data (replace with real data from your database)
      const complianceData = {
        metrics: {
          totalGDPRRequests: 145,
          pendingRequests: 12,
          completedRequests: 128,
          avgResponseTime: 18,
          cookieConsents: 45678,
          consentRate: 78.5,
          dataBreaches: 0,
          encryptedData: 98.5,
          retentionCompliance: 95.2,
          ccpaOptOuts: 234
        },
        gdprRequests: [
          {
            id: '1',
            type: 'export' as const,
            user: {
              name: 'Amara Okafor',
              email: 'amara.okafor@example.com',
              country: 'Nigeria'
            },
            status: 'pending' as const,
            requestedAt: '2024-10-05 10:30'
          },
          {
            id: '2',
            type: 'delete' as const,
            user: {
              name: 'Kwame Mensah',
              email: 'kwame.mensah@example.com',
              country: 'Ghana'
            },
            status: 'processing' as const,
            requestedAt: '2024-10-04 14:15'
          },
          {
            id: '3',
            type: 'export' as const,
            user: {
              name: 'Thandiwe Ndlovu',
              email: 'thandiwe.ndlovu@example.com',
              country: 'South Africa'
            },
            status: 'completed' as const,
            requestedAt: '2024-10-03 09:00',
            completedAt: '2024-10-03 11:30'
          },
          {
            id: '4',
            type: 'rectify' as const,
            user: {
              name: 'Omar Hassan',
              email: 'omar.hassan@example.com',
              country: 'Kenya'
            },
            status: 'pending' as const,
            requestedAt: '2024-10-05 08:45'
          },
          {
            id: '5',
            type: 'delete' as const,
            user: {
              name: 'Zainab Diallo',
              email: 'zainab.diallo@example.com',
              country: 'Senegal'
            },
            status: 'completed' as const,
            requestedAt: '2024-10-02 16:20',
            completedAt: '2024-10-04 10:00'
          },
          {
            id: '6',
            type: 'restrict' as const,
            user: {
              name: 'Chidi Okonkwo',
              email: 'chidi.okonkwo@example.com',
              country: 'Nigeria'
            },
            status: 'rejected' as const,
            requestedAt: '2024-10-01 12:00',
            reason: 'Incomplete verification documents'
          },
          {
            id: '7',
            type: 'export' as const,
            user: {
              name: 'Aisha Kamara',
              email: 'aisha.kamara@example.com',
              country: 'Sierra Leone'
            },
            status: 'pending' as const,
            requestedAt: '2024-10-05 11:20'
          },
          {
            id: '8',
            type: 'delete' as const,
            user: {
              name: 'Jabari Mwangi',
              email: 'jabari.mwangi@example.com',
              country: 'Kenya'
            },
            status: 'processing' as const,
            requestedAt: '2024-10-04 15:30'
          },
          {
            id: '9',
            type: 'export' as const,
            user: {
              name: 'Fatima Bello',
              email: 'fatima.bello@example.com',
              country: 'Nigeria'
            },
            status: 'completed' as const,
            requestedAt: '2024-09-30 10:00',
            completedAt: '2024-10-01 14:30'
          },
          {
            id: '10',
            type: 'rectify' as const,
            user: {
              name: 'Kofi Asante',
              email: 'kofi.asante@example.com',
              country: 'Ghana'
            },
            status: 'completed' as const,
            requestedAt: '2024-09-28 09:15',
            completedAt: '2024-09-29 11:00'
          }
        ],
        cookieConsents: [
          {
            userId: 'user_1',
            necessary: true,
            analytics: true,
            marketing: false,
            preferences: true,
            consentDate: '2024-10-05 09:30',
            ipAddress: '102.176.89.123'
          },
          {
            userId: 'user_2',
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true,
            consentDate: '2024-10-04 14:20',
            ipAddress: '197.45.123.45'
          },
          {
            userId: 'user_3',
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            consentDate: '2024-10-03 11:15',
            ipAddress: '41.190.34.89'
          }
        ]
      };

      // Create audit log
      // await prisma.auditLog.create({
      //   data: {
      //     userId: decoded.userId,
      //     action: 'VIEW_COMPLIANCE_DATA',
      //     details: 'Accessed compliance and privacy dashboard',
      //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      //     userAgent: request.headers.get('user-agent') || 'unknown'
      //   }
      // });

      return NextResponse.json(complianceData);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Compliance data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
