/**
 * Legal Compliance Admin Dashboard
 * Task 30: Privacy & GDPR Compliance Admin Interface
 * 
 * Central admin interface for legal and compliance management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  Trash2,
  Download,
  Eye,
  Settings,
  Users,
  Database,
  Lock,
  Zap
} from 'lucide-react';

interface ComplianceMetrics {
  totalConsentRecords: number;
  activeConsents: number;
  expiredConsents: number;
  withdrawnConsents: number;
  dataExportRequests: number;
  dataRetentionRules: number;
  piaCompleted: number;
  crossBorderTransfers: number;
}

interface ComplianceDashboard {
  complianceScore: number;
  activeFrameworks: string[];
  recentViolations: number;
  pendingRequests: number;
  retentionActions: number;
  lastAudit: string;
  nextScheduledCleanup: string;
  metrics: ComplianceMetrics;
}

interface RetentionRule {
  id: string;
  name: string;
  dataCategory: string;
  retentionPeriod: number;
  isActive: boolean;
  lastExecuted?: string;
  nextExecution?: string;
  recordsToDelete: number;
}

interface DataRequest {
  id: string;
  type: 'export' | 'deletion' | 'correction';
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestDate: string;
  framework: string;
  priority: 'low' | 'medium' | 'high';
}

export default function LegalComplianceDashboard() {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [retentionRules, setRetentionRules] = useState<RetentionRule[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data (mock data for demo)
      const dashboardData: ComplianceDashboard = {
        complianceScore: 87.5,
        activeFrameworks: ['GDPR', 'CCPA', 'POPIA'],
        recentViolations: 3,
        pendingRequests: 12,
        retentionActions: 8,
        lastAudit: '2025-09-15',
        nextScheduledCleanup: '2025-10-15',
        metrics: {
          totalConsentRecords: 15420,
          activeConsents: 12850,
          expiredConsents: 890,
          withdrawnConsents: 1680,
          dataExportRequests: 45,
          dataRetentionRules: 12,
          piaCompleted: 8,
          crossBorderTransfers: 156
        }
      };

      const retentionData: RetentionRule[] = [
        {
          id: 'user_activity_retention',
          name: 'User Activity Data',
          dataCategory: 'user_activity',
          retentionPeriod: 730,
          isActive: true,
          lastExecuted: '2025-10-01',
          nextExecution: '2025-10-08',
          recordsToDelete: 2430
        },
        {
          id: 'session_data_retention',
          name: 'Session Data',
          dataCategory: 'session_data',
          retentionPeriod: 30,
          isActive: true,
          lastExecuted: '2025-10-02',
          nextExecution: '2025-10-04',
          recordsToDelete: 856
        },
        {
          id: 'email_marketing_retention',
          name: 'Email Marketing Data',
          dataCategory: 'marketing_data',
          retentionPeriod: 1095,
          isActive: true,
          lastExecuted: '2025-09-01',
          nextExecution: '2025-11-01',
          recordsToDelete: 340
        }
      ];

      const requestsData: DataRequest[] = [
        {
          id: 'req_001',
          type: 'export',
          userId: 'user_12345',
          status: 'processing',
          requestDate: '2025-10-01',
          framework: 'GDPR',
          priority: 'medium'
        },
        {
          id: 'req_002',
          type: 'deletion',
          userId: 'user_67890',
          status: 'pending',
          requestDate: '2025-10-02',
          framework: 'CCPA',
          priority: 'high'
        },
        {
          id: 'req_003',
          type: 'correction',
          userId: 'user_54321',
          status: 'completed',
          requestDate: '2025-09-28',
          framework: 'POPIA',
          priority: 'low'
        }
      ];

      setDashboard(dashboardData);
      setRetentionRules(retentionData);
      setDataRequests(requestsData);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeRetentionRule = async (ruleId: string) => {
    try {
      // Mock execution
      alert(`Executing retention rule: ${ruleId}`);
    } catch (error) {
      console.error('Failed to execute retention rule:', error);
    }
  };

  const generateComplianceReport = async (framework: string) => {
    try {
      // Mock report generation
      alert(`Generating compliance report for: ${framework}`);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const complianceData = [
    { name: 'GDPR', score: 92 },
    { name: 'CCPA', score: 85 },
    { name: 'POPIA', score: 88 },
    { name: 'NDPR', score: 83 }
  ];

  const consentData = [
    { name: 'Active', value: dashboard?.metrics.activeConsents || 0, color: '#10B981' },
    { name: 'Expired', value: dashboard?.metrics.expiredConsents || 0, color: '#F59E0B' },
    { name: 'Withdrawn', value: dashboard?.metrics.withdrawnConsents || 0, color: '#EF4444' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Compliance Dashboard</h1>
          <p className="text-gray-600">Monitor and manage legal compliance across all frameworks</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => generateComplianceReport('GDPR')}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.complianceScore}%</div>
            <Progress value={dashboard?.complianceScore} className="mt-2" />
            <p className="text-xs text-green-600 mt-1">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.activeFrameworks.length}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {dashboard?.activeFrameworks.map((framework) => (
                <Badge key={framework} variant="secondary" className="text-xs">
                  {framework}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.pendingRequests}</div>
            <p className="text-xs text-yellow-600 mt-1">
              {dashboard?.metrics.dataExportRequests} data exports pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.recentViolations}</div>
            <p className="text-xs text-red-600 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {dashboard && dashboard.recentViolations > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Compliance Issues Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {dashboard.recentViolations} compliance violations require immediate attention. 
            Please review and take corrective action.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Scores by Framework</CardTitle>
                <CardDescription>Current compliance status across legal frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consent Status Distribution</CardTitle>
                <CardDescription>Breakdown of user consent records</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={consentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {consentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Overview of compliance-related metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboard?.metrics.totalConsentRecords.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Consent Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboard?.metrics.dataRetentionRules}</div>
                  <div className="text-sm text-gray-600">Retention Rules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{dashboard?.metrics.piaCompleted}</div>
                  <div className="text-sm text-gray-600">PIAs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{dashboard?.metrics.crossBorderTransfers}</div>
                  <div className="text-sm text-gray-600">Cross-border Transfers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Rules</CardTitle>
              <CardDescription>Manage automated data retention and deletion policies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Data Category</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Records to Delete</TableHead>
                    <TableHead>Next Execution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.dataCategory}</TableCell>
                      <TableCell>{rule.retentionPeriod} days</TableCell>
                      <TableCell>{rule.recordsToDelete.toLocaleString()}</TableCell>
                      <TableCell>{rule.nextExecution}</TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => executeRetentionRule(rule.id)}
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>Manage GDPR, CCPA, and POPIA data subject requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell className="capitalize">{request.type}</TableCell>
                      <TableCell>{request.userId}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.framework}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.requestDate}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate and download compliance reports for audits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboard?.activeFrameworks.map((framework) => (
                  <Card key={framework} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{framework} Report</h3>
                        <p className="text-sm text-gray-600">Last generated: {dashboard.lastAudit}</p>
                      </div>
                      <Button onClick={() => generateComplianceReport(framework)}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Settings</CardTitle>
              <CardDescription>Configure legal compliance settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Configuration Protected</AlertTitle>
                  <AlertDescription>
                    Legal compliance settings require administrator approval to modify.
                    Contact your compliance officer for changes.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Data Retention</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Configure automatic data retention and deletion policies
                    </p>
                    <Button variant="outline" disabled>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Cookie Consent</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Manage cookie consent banners and preferences
                    </p>
                    <Button variant="outline" disabled>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


