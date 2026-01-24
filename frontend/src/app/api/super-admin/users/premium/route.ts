import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock premium users data - replace with actual database call
    const premiumUsers = [
      {
        id: '1',
        email: 'premium.user1@example.com',
        name: 'Sarah Johnson',
        tier: 'gold',
        status: 'active',
        subscriptionStart: '2024-01-15T00:00:00Z',
        subscriptionEnd: '2025-01-15T00:00:00Z',
        monthlyPayment: 29.99,
        totalPaid: 299.90,
        articles: {
          read: 450,
          bookmarked: 68,
          shared: 23
        },
        engagement: {
          timeSpent: 1250, // minutes this month
          sessionsCount: 45,
          avgSessionDuration: 27.8,
          lastActive: '2024-11-04T09:30:00Z'
        },
        preferences: {
          notifications: true,
          newsletter: true,
          analytics: true,
          aiInsights: true
        },
        country: 'Nigeria',
        registeredAt: '2023-12-01T00:00:00Z',
        autoRenewal: true,
        paymentMethod: 'Credit Card',
        referrals: 3
      },
      {
        id: '2',
        email: 'crypto.trader@example.com',
        name: 'Michael Chen',
        tier: 'platinum',
        status: 'active',
        subscriptionStart: '2024-03-01T00:00:00Z',
        subscriptionEnd: '2025-03-01T00:00:00Z',
        monthlyPayment: 49.99,
        totalPaid: 399.92,
        articles: {
          read: 720,
          bookmarked: 145,
          shared: 89
        },
        engagement: {
          timeSpent: 2150,
          sessionsCount: 78,
          avgSessionDuration: 35.2,
          lastActive: '2024-11-04T11:15:00Z'
        },
        preferences: {
          notifications: true,
          newsletter: true,
          analytics: true,
          aiInsights: true
        },
        country: 'Kenya',
        registeredAt: '2024-02-15T00:00:00Z',
        autoRenewal: true,
        paymentMethod: 'Mobile Money',
        referrals: 8
      },
      {
        id: '3',
        email: 'investor.pro@example.com',
        name: 'Amara Okafor',
        tier: 'gold',
        status: 'suspended',
        subscriptionStart: '2024-05-01T00:00:00Z',
        subscriptionEnd: '2025-05-01T00:00:00Z',
        monthlyPayment: 29.99,
        totalPaid: 179.94,
        articles: {
          read: 280,
          bookmarked: 34,
          shared: 12
        },
        engagement: {
          timeSpent: 450,
          sessionsCount: 18,
          avgSessionDuration: 15.5,
          lastActive: '2024-10-15T14:20:00Z'
        },
        preferences: {
          notifications: false,
          newsletter: true,
          analytics: false,
          aiInsights: true
        },
        country: 'Ghana',
        registeredAt: '2024-04-10T00:00:00Z',
        autoRenewal: false,
        paymentMethod: 'Bank Transfer',
        referrals: 1,
        suspensionReason: 'Payment failure'
      },
      {
        id: '4',
        email: 'crypto.analyst@example.com',
        name: 'David Mwangi',
        tier: 'silver',
        status: 'cancelled',
        subscriptionStart: '2024-02-01T00:00:00Z',
        subscriptionEnd: '2024-08-01T00:00:00Z',
        monthlyPayment: 19.99,
        totalPaid: 119.94,
        articles: {
          read: 320,
          bookmarked: 45,
          shared: 18
        },
        engagement: {
          timeSpent: 890,
          sessionsCount: 32,
          avgSessionDuration: 22.1,
          lastActive: '2024-07-28T16:45:00Z'
        },
        preferences: {
          notifications: false,
          newsletter: false,
          analytics: false,
          aiInsights: false
        },
        country: 'Uganda',
        registeredAt: '2024-01-20T00:00:00Z',
        autoRenewal: false,
        paymentMethod: 'Mobile Money',
        referrals: 0,
        cancellationReason: 'Price too high'
      }
    ];

    // Filter based on tier and status
    let filteredUsers = premiumUsers;
    
    if (tier !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.tier === tier);
    }
    
    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total: premiumUsers.length,
      active: premiumUsers.filter(user => user.status === 'active').length,
      suspended: premiumUsers.filter(user => user.status === 'suspended').length,
      cancelled: premiumUsers.filter(user => user.status === 'cancelled').length,
      silver: premiumUsers.filter(user => user.tier === 'silver').length,
      gold: premiumUsers.filter(user => user.tier === 'gold').length,
      platinum: premiumUsers.filter(user => user.tier === 'platinum').length,
      totalRevenue: premiumUsers.reduce((sum, user) => sum + user.totalPaid, 0).toFixed(2),
      monthlyRevenue: premiumUsers
        .filter(user => user.status === 'active')
        .reduce((sum, user) => sum + user.monthlyPayment, 0).toFixed(2),
      avgEngagement: premiumUsers
        .reduce((sum, user) => sum + user.engagement.timeSpent, 0) / premiumUsers.length,
      retentionRate: 85.4 // Mock retention rate
    };

    return NextResponse.json({
      users: paginatedUsers,
      stats,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('Premium users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, userId, ...data } = await request.json();

    // Handle different actions for premium users
    switch (action) {
      case 'upgrade':
        console.log('Upgrading user tier:', userId, data);
        return NextResponse.json({ success: true, message: 'User tier upgraded' });
        
      case 'downgrade':
        console.log('Downgrading user tier:', userId, data);
        return NextResponse.json({ success: true, message: 'User tier downgraded' });
        
      case 'suspend':
        console.log('Suspending user:', userId, data);
        return NextResponse.json({ success: true, message: 'User suspended' });
        
      case 'reactivate':
        console.log('Reactivating user:', userId, data);
        return NextResponse.json({ success: true, message: 'User reactivated' });
        
      case 'cancel':
        console.log('Cancelling subscription:', userId, data);
        return NextResponse.json({ success: true, message: 'Subscription cancelled' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Premium user action error:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}