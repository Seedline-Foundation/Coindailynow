import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

interface ReportData {
  title: string;
  description: string;
  generatedAt: string;
  dateRange: string;
  stats: Record<string, any>;
  data: any[];
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify super admin role
    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('reportType') || 'security';
    const dateRange = searchParams.get('dateRange') || '30d';
    const format = searchParams.get('format') || 'pdf';

    // Calculate date range
    const now = new Date();
    const daysBack = dateRange === '24h' ? 1 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    let reportData: ReportData;

    switch (reportType) {
      case 'security':
        reportData = await generateSecurityReport(startDate, now);
        break;
      case 'gdpr':
        reportData = await generateGDPRReport(startDate, now);
        break;
      case 'user-activity':
        reportData = await generateUserActivityReport(startDate, now);
        break;
      case 'data-access':
        reportData = await generateDataAccessReport(startDate, now);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'json') {
      return NextResponse.json(reportData);
    }

    // Generate PDF report
    const pdfBuffer = await generatePDFReport(reportData, reportType);
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generateSecurityReport(startDate: Date, endDate: Date): Promise<ReportData> {
  // Fetch security-related audit logs from backend API
  const response = await fetch(`${BACKEND_API_URL}/api/audit/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&actions=login,logout,failed_login,password_reset,password_change,mfa_enable,mfa_disable,permission_change,role_change`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch security logs from backend');
  }

  const securityLogs = await response.json();

  const stats = {
    totalEvents: securityLogs.length,
    loginAttempts: securityLogs.filter((log: any) => log.action === 'login').length,
    failedLogins: securityLogs.filter((log: any) => log.action === 'failed_login').length,
    passwordResets: securityLogs.filter((log: any) => log.action === 'password_reset').length,
    permissionChanges: securityLogs.filter((log: any) => log.action === 'permission_change').length,
    roleChanges: securityLogs.filter((log: any) => log.action === 'role_change').length,
    uniqueUsers: new Set(securityLogs.map((log: any) => log.adminId)).size,
    suspiciousActivity: securityLogs.filter((log: any) => 
      log.action === 'failed_login' || 
      log.metadata && JSON.stringify(log.metadata).includes('suspicious')
    ).length
  };

  return {
    title: 'Security Audit Report',
    description: 'Comprehensive security events and authentication activities',
    generatedAt: new Date().toISOString(),
    dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    stats,
    data: securityLogs.map((log: any) => ({
      timestamp: log.timestamp,
      user: log.admin?.username || 'Unknown',
      action: log.action,
      ipAddress: log.ipAddress || 'N/A',
      userAgent: log.userAgent || 'N/A',
      details: log.details || 'N/A',
      result: log.metadata ? JSON.stringify(log.metadata) : 'N/A'
    }))
  };
}

async function generateGDPRReport(startDate: Date, endDate: Date): Promise<ReportData> {
  // Fetch GDPR-related audit logs from backend API
  const response = await fetch(`${BACKEND_API_URL}/api/audit/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&actions=data_export,data_deletion,consent_update,privacy_settings_change,account_deletion,data_access_request`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GDPR logs from backend');
  }

  const gdprLogs = await response.json();

  const stats = {
    totalEvents: gdprLogs.length,
    dataExports: gdprLogs.filter((log: any) => log.action === 'data_export').length,
    dataDeletions: gdprLogs.filter((log: any) => log.action === 'data_deletion').length,
    consentUpdates: gdprLogs.filter((log: any) => log.action === 'consent_update').length,
    accessRequests: gdprLogs.filter((log: any) => log.action === 'data_access_request').length,
    accountDeletions: gdprLogs.filter((log: any) => log.action === 'account_deletion').length,
    uniqueUsers: new Set(gdprLogs.map((log: any) => log.adminId)).size,
  };

  return {
    title: 'GDPR Compliance Report',
    description: 'Data access requests, user rights, and privacy compliance',
    generatedAt: new Date().toISOString(),
    dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    stats,
    data: gdprLogs.map((log: any) => ({
      timestamp: log.timestamp,
      user: log.admin?.username || 'Unknown',
      action: log.action,
      resource: log.resource || 'N/A',
      details: log.details || 'N/A',
      ipAddress: log.ipAddress || 'N/A'
    }))
  };
}

async function generateUserActivityReport(startDate: Date, endDate: Date): Promise<ReportData> {
  // Fetch all user activity logs from backend API
  const response = await fetch(`${BACKEND_API_URL}/api/audit/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activity logs from backend');
  }

  const activityLogs = await response.json();

  const stats = {
    totalEvents: activityLogs.length,
    uniqueUsers: new Set(activityLogs.map((log: any) => log.adminId)).size,
    topActions: getTopActions(activityLogs),
    topUsers: getTopUsers(activityLogs),
    actionsByCategory: getActionsByCategory(activityLogs),
  };

  return {
    title: 'User Activity Report',
    description: 'Comprehensive user actions and system interactions',
    generatedAt: new Date().toISOString(),
    dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    stats,
    data: activityLogs.map((log: any) => ({
      timestamp: log.timestamp,
      user: log.admin?.username || 'Unknown',
      email: log.admin?.email || 'N/A',
      role: log.admin?.role || 'N/A',
      action: log.action,
      resource: log.resource || 'N/A',
      details: log.details || 'N/A',
      ipAddress: log.ipAddress || 'N/A'
    }))
  };
}

async function generateDataAccessReport(startDate: Date, endDate: Date): Promise<ReportData> {
  // Fetch database and API access logs from backend API
  const response = await fetch(`${BACKEND_API_URL}/api/audit/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&actionContains=read,query,access,fetch&resourceContains=database,api`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data access logs from backend');
  }

  const dataLogs = await response.json();

  const stats = {
    totalAccesses: dataLogs.length,
    uniqueUsers: new Set(dataLogs.map((log: any) => log.adminId)).size,
    databaseAccesses: dataLogs.filter((log: any) => log.resource?.includes('database')).length,
    apiAccesses: dataLogs.filter((log: any) => log.resource?.includes('api')).length,
    topResources: getTopResources(dataLogs),
    accessByHour: getAccessByHour(dataLogs),
  };

  return {
    title: 'Data Access Report',
    description: 'Database queries, API calls, and data access patterns',
    generatedAt: new Date().toISOString(),
    dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    stats,
    data: dataLogs.map((log: any) => ({
      timestamp: log.timestamp,
      user: log.admin?.username || 'Unknown',
      action: log.action,
      resource: log.resource || 'N/A',
      ipAddress: log.ipAddress || 'N/A',
      userAgent: log.userAgent || 'N/A',
      details: log.details || 'N/A'
    }))
  };
}

// Helper functions
function getTopActions(logs: any[]): Array<{ action: string; count: number }> {
  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getTopUsers(logs: any[]): Array<{ username: string; count: number }> {
  const userCounts = logs.reduce((acc, log) => {
    const username = log.admin?.username || 'Unknown';
    acc[username] = (acc[username] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(userCounts)
    .map(([username, count]) => ({ username, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getActionsByCategory(logs: any[]): Record<string, number> {
  return logs.reduce((acc, log) => {
    const category = categorizeAction(log.action);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getTopResources(logs: any[]): Array<{ resource: string; count: number }> {
  const resourceCounts = logs.reduce((acc, log) => {
    const resource = log.resource || 'Unknown';
    acc[resource] = (acc[resource] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(resourceCounts)
    .map(([resource, count]) => ({ resource, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getAccessByHour(logs: any[]): Array<{ hour: string; count: number }> {
  const hourCounts = logs.reduce((acc, log) => {
    const hour = new Date(log.timestamp).getHours();
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    acc[hourStr] = (acc[hourStr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour, count: count as number }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

function categorizeAction(action: string): string {
  if (action.includes('login') || action.includes('auth')) return 'Authentication';
  if (action.includes('create') || action.includes('add')) return 'Create';
  if (action.includes('update') || action.includes('edit')) return 'Update';
  if (action.includes('delete') || action.includes('remove')) return 'Delete';
  if (action.includes('read') || action.includes('view') || action.includes('fetch')) return 'Read';
  return 'Other';
}

async function generatePDFReport(reportData: ReportData, reportType: string): Promise<Buffer> {
  // Simple PDF generation - in production, use a library like PDFKit or Puppeteer
  // For now, return a simple text-based PDF
  
  const content = `
=================================================
${reportData.title}
=================================================

Generated: ${new Date(reportData.generatedAt).toLocaleString()}
Date Range: ${reportData.dateRange}
Report Type: ${reportType.toUpperCase()}

-------------------------------------------------
STATISTICS
-------------------------------------------------
${Object.entries(reportData.stats).map(([key, value]) => 
  `${key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`
).join('\n')}

-------------------------------------------------
DETAILED EVENTS (First 100)
-------------------------------------------------
${reportData.data.slice(0, 100).map((item, index) => 
  `\n${index + 1}. ${JSON.stringify(item, null, 2)}`
).join('\n')}

-------------------------------------------------
End of Report
Generated by CoinDaily Super Admin System
=================================================
`;

  // Convert to simple PDF-like format (in production, use proper PDF library)
  const pdfHeader = '%PDF-1.4\n';
  const pdfContent = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length} >>\nstream\nBT\n/F1 10 Tf\n50 750 Td\n${content.split('\n').map((line, i) => `(${line}) Tj 0 -12 Td`).join('\n')}\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000280 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${400 + content.length}\n%%EOF`;
  
  return Buffer.from(pdfHeader + pdfContent);
}
