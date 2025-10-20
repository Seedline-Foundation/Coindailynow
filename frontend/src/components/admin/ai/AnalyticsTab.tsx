/**
 * Analytics Tab Component
 * Performance trends, cost analysis, and optimization recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { aiManagementService } from '@/services/aiManagementService';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [costs, setCosts] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dateRange = { start: sevenDaysAgo.toISOString(), end: now.toISOString() };

      const [overviewData, costsData, trendsData, recsData] = await Promise.all([
        aiManagementService.getAnalyticsOverview(dateRange),
        aiManagementService.getCostBreakdown(dateRange),
        aiManagementService.getPerformanceTrends(dateRange),
        aiManagementService.getOptimizationRecommendations(),
      ]);

      setOverview(overviewData);
      setCosts(costsData);
      setTrends(trendsData);
      setRecommendations(recsData);
    } catch (error) {
      console.error('[AnalyticsTab] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{((overview?.avgSuccessRate || 0) * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Avg Processing Time</p>
          <p className="text-2xl font-bold text-blue-600">{(overview?.avgProcessingTime || 0).toFixed(2)}s</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Total Cost (7d)</p>
          <p className="text-2xl font-bold text-orange-600">${(costs?.totalCost || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Cache Hit Rate</p>
          <p className="text-2xl font-bold text-purple-600">{((overview?.cacheHitRate || 0) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Performance Trends */}
      {trends && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.successRate?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Success Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Breakdown */}
      {costs && costs.byAgent && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Cost by Agent</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costs.byAgent}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.agentType}: $${entry.cost.toFixed(2)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {costs.byAgent.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Cost Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costs.byDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cost" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className={`p-4 rounded-lg border-l-4 ${
                rec.severity === 'critical' ? 'border-red-500 bg-red-50' :
                rec.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                rec.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{rec.description}</p>
                    <p className="text-sm font-medium text-gray-900 mt-2">💡 {rec.recommendation}</p>
                    {rec.estimatedSavings && (
                      <p className="text-sm text-green-600 mt-1">
                        Potential savings: ${rec.estimatedSavings.cost?.toFixed(2) || 'N/A'}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    rec.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    rec.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    rec.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
