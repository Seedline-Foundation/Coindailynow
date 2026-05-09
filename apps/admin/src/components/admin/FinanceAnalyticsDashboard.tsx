'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  GET_ANALYTICS_DASHBOARD,
  GET_SYSTEM_HEALTH,
  GET_PERFORMANCE_HISTORY,
  GET_TOP_EARNERS,
  GENERATE_SYSTEM_REPORT,
  RUN_LOAD_TEST,
} from '../../graphql/analytics';

interface AnalyticsDashboardProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCard> = ({ title, value, change, trend, icon }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

const FinanceAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ dateRange }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loadTestRunning, setLoadTestRunning] = useState(false);

  // GraphQL queries
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useQuery(
    GET_ANALYTICS_DASHBOARD,
    {
      variables: { dateRange },
      pollInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: systemHealth, loading: healthLoading } = useQuery(GET_SYSTEM_HEALTH, {
    pollInterval: 10000, // Refresh every 10 seconds
  });

  const { data: performanceHistory } = useQuery(GET_PERFORMANCE_HISTORY, {
    variables: { hours: 24 },
    pollInterval: 60000, // Refresh every minute
  });

  const { data: topEarners } = useQuery(GET_TOP_EARNERS, {
    variables: { dateRange, limit: 10 },
  });

  // Mutations
  const [generateReport] = useMutation(GENERATE_SYSTEM_REPORT);
  const [runLoadTest] = useMutation(RUN_LOAD_TEST);

  const handleGenerateReport = async () => {
    try {
      const { data } = await generateReport({
        variables: {
          config: {
            ...dateRange,
            includeUserData: true,
            includeSystemMetrics: true,
            includeFinancialData: true,
            format: 'json',
          },
        },
      });
      
      // Download or display report
      console.log('Report generated:', data.generateSystemReport);
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    }
  };

  const handleRunLoadTest = async () => {
    try {
      setLoadTestRunning(true);
      const { data } = await runLoadTest({
        variables: {
          config: {
            duration: 300, // 5 minutes
            concurrentUsers: 100,
            transactionsPerUser: 50,
            rampUpTime: 60,
          },
        },
      });
      
      console.log('Load test completed:', data.runLoadTest);
      alert('Load test completed successfully!');
    } catch (error) {
      console.error('Error running load test:', error);
      alert('Error running load test');
    } finally {
      setLoadTestRunning(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-red-800">Error Loading Dashboard</h3>
        <p className="text-red-600">{dashboardError.message}</p>
      </div>
    );
  }

  const dashboard = dashboardData?.getAnalyticsDashboard;
  const health = systemHealth?.getSystemHealth;

  // Chart data preparation
  const revenueChartData = dashboard?.revenue.revenueByDate.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    revenue: item.revenue,
  }));

  const performanceChartData = performanceHistory?.getPerformanceHistory.map((item: any) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    responseTime: item.averageResponseTime,
    throughput: item.transactionThroughput,
    errorRate: item.errorRate,
  }));

  const serviceRevenueData = dashboard?.revenue.revenueByService.map((item: any) => ({
    name: item.service,
    value: item.revenue,
    transactions: item.transactionCount,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Finance Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </button>
          <button
            onClick={handleRunLoadTest}
            disabled={loadTestRunning}
            className={`px-4 py-2 rounded-md transition-colors ${
              loadTestRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {loadTestRunning ? 'Running Load Test...' : 'Run Load Test'}
          </button>
        </div>
      </div>

      {/* System Health Status */}
      {health && (
        <div className={`p-4 rounded-lg border-2 ${
          health.status === 'HEALTHY' 
            ? 'bg-green-50 border-green-200'
            : health.status === 'DEGRADED'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">System Status: {health.status}</h3>
              <p className="text-sm text-gray-600">
                {health.activeAlerts.length} active alerts
              </p>
            </div>
            <div className="flex space-x-4 text-sm">
              <span>Response Time: {health.metrics.averageResponseTime.toFixed(0)}ms</span>
              <span>Error Rate: {health.metrics.errorRate.toFixed(2)}%</span>
              <span>Active Users: {health.metrics.activeUsers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'revenue', name: 'Revenue' },
            { id: 'performance', name: 'Performance' },
            { id: 'users', name: 'Users' },
            { id: 'system', name: 'System' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={`$${dashboard?.revenue.totalRevenue.toLocaleString()}`}
              change={dashboard?.revenue.monthlyGrowth}
              trend={dashboard?.revenue.monthlyGrowth > 0 ? 'up' : 'down'}
            />
            <MetricCard
              title="Active Users"
              value={dashboard?.systemHealth.activeUsers.toLocaleString()}
            />
            <MetricCard
              title="Total Transactions"
              value={dashboard?.systemHealth.totalTransactions.toLocaleString()}
            />
            <MetricCard
              title="Error Rate"
              value={`${dashboard?.systemHealth.errorRate.toFixed(2)}%`}
              trend={dashboard?.systemHealth.errorRate < 1 ? 'up' : 'down'}
            />
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Revenue Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue by Service</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceRevenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${((entry.percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceRevenueData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
              <div className="space-y-4">
                {dashboard?.revenue.revenueByService.map((service: any, index: number) => (
                  <div key={service.service} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{service.service}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${service.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{service.transactionCount} txns</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Projected Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Revenue Projections</h3>
            <p className="text-gray-600 mb-4">
              Based on current trends, projected revenue for next 30 days: 
              <span className="font-semibold text-green-600 ml-2">
                ${dashboard?.revenue.projectedRevenue.toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      )}

      {selectedTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Avg Response Time"
              value={`${health?.metrics.averageResponseTime.toFixed(0)}ms`}
            />
            <MetricCard
              title="Throughput"
              value={`${health?.metrics.transactionThroughput.toFixed(1)}/sec`}
            />
            <MetricCard
              title="Memory Usage"
              value={`${health?.metrics.memoryUsage.toFixed(0)}MB`}
            />
          </div>

          {/* Performance Charts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#8884d8"
                  name="Response Time (ms)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="throughput"
                  stroke="#82ca9d"
                  name="Throughput (req/sec)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="errorRate"
                  stroke="#ff7300"
                  name="Error Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="space-y-6">
          {/* Top Earners */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Top Earners</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Potential
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topEarners?.getTopEarners.map((user: any, index: number) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.userId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${user.totalEarnings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${user.potentialEarnings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staking Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Stakers"
              value={dashboard?.staking.totalStakers.toLocaleString()}
            />
            <MetricCard
              title="Total Staked"
              value={`$${dashboard?.staking.totalStaked.toLocaleString()}`}
            />
            <MetricCard
              title="Participation Rate"
              value={`${dashboard?.staking.participationRate.toFixed(1)}%`}
            />
          </div>
        </div>
      )}

      {selectedTab === 'system' && (
        <div className="space-y-6">
          {/* System Alerts */}
          {health?.activeAlerts && health.activeAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
              <div className="space-y-3">
                {health.activeAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-md border-l-4 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-50 border-red-400'
                        : alert.severity === 'HIGH'
                        ? 'bg-orange-50 border-orange-400'
                        : 'bg-yellow-50 border-yellow-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : alert.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Recommendations */}
          {health?.recommendations && health.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">System Recommendations</h3>
              <ul className="space-y-2">
                {health.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinanceAnalyticsDashboard;
