import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    // Mock CSV export
    const csvContent = `Timestamp,User,Email,Action,Category,Resource,Result,IP Address,Country,Device,Details
Oct 5 2025 10:45 AM,Kwame Osei,kwame@coindaily.com,User Login,authentication,/api/auth/login,success,41.203.245.178,Nigeria,Desktop,Successful login with 2FA
Oct 5 2025 10:40 AM,Amara Nwosu,amara@coindaily.com,Article Published,content,/articles/bitcoin-surge,success,196.207.89.124,Kenya,Mobile,Published Bitcoin article
Oct 5 2025 10:35 AM,Thandiwe Mbatha,thandiwe@coindaily.com,Failed Login,authentication,/api/auth/login,failure,102.176.45.89,South Africa,Desktop,Invalid password
Oct 5 2025 10:30 AM,Kwame Osei,kwame@coindaily.com,User Role Updated,user_management,/users/456/role,success,41.203.245.178,Nigeria,Desktop,Changed role to ADMIN
Oct 5 2025 10:25 AM,Chinedu Okeke,chinedu@coindaily.com,Database Backup,system,/system/backup,success,154.72.188.56,Ghana,Server,Backup 2.3 GB`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString()}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting audit log:', error);
    return NextResponse.json(
      { error: 'Failed to export audit log' },
      { status: 500 }
    );
  }
}
