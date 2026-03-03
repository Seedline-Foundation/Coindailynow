/**
 * Affiliate Management API Route
 * Returns affiliate data for the super admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock affiliate data (will be replaced with real DB queries)
const affiliateData = {
  stats: {
    totalAffiliates: 342,
    activeAffiliates: 278,
    pendingApplications: 18,
    suspendedAffiliates: 7,
    totalCommissionsEarned: 48520,
    totalCommissionsPaid: 39200,
    pendingPayouts: 9320,
    averageConversionRate: 12.4,
    totalReferrals: 15680,
    totalRevenue: 198400,
    monthlyGrowth: 14.2,
    topProduct: 'Pro Membership',
  },
  settings: {
    bronzeRate: 20,
    silverRate: 25,
    goldRate: 30,
    silverThreshold: 11,
    goldThreshold: 51,
    cookieDuration: 30,
    minPayout: 20,
    payoutSchedule: 'monthly',
    autoApprove: false,
    fraudDetection: true,
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';

    if (section === 'stats') {
      return NextResponse.json(affiliateData.stats);
    }
    if (section === 'settings') {
      return NextResponse.json(affiliateData.settings);
    }

    return NextResponse.json(affiliateData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch affiliate data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'approve':
        return NextResponse.json({ success: true, message: 'Affiliate approved' });
      case 'reject':
        return NextResponse.json({ success: true, message: 'Affiliate rejected' });
      case 'suspend':
        return NextResponse.json({ success: true, message: 'Affiliate suspended' });
      case 'reinstate':
        return NextResponse.json({ success: true, message: 'Affiliate reinstated' });
      case 'approve_payout':
        return NextResponse.json({ success: true, message: 'Payout approved' });
      case 'reject_payout':
        return NextResponse.json({ success: true, message: 'Payout rejected' });
      case 'update_settings':
        return NextResponse.json({ success: true, message: 'Settings updated', settings: body.settings });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
