'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { 
  BarChart3, 
  Settings, 
  Download, 
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const integrationStatus = {
    googleAnalytics: {
      connected: true,
      lastSync: new Date(),
      status: 'active',
      propertyId: 'GA4-XXXXXXXXX'
    },
    searchConsole: {
      connected: true,
      lastSync: new Date(),
      status: 'verified',
      siteUrl: 'https://coindaily.news'
    },
    facebook: {
      connected: false,
      lastSync: null,
      status: 'disconnected',
      pixelId: null
    },
    twitter: {
      connected: true,
      lastSync: new Date(),
      status: 'active',
      accountId: '@coindailynews'
    }
  };

  const handleExportData = () => {
    // Export analytics data as CSV/PDF
    console.log('Exporting analytics data...');
  };

  const handleRefreshIntegrations = () => {
    // Refresh all integrations
    console.log('Refreshing integrations...');
  };

  const handleConfigureIntegration = (integration: string) => {
    // Open integration configuration modal
    console.log(`Configuring ${integration}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor performance, track user engagement, and optimize content strategy
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={handleRefreshIntegrations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => handleConfigureIntegration('settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Google Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integrationStatus.googleAnalytics.connected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge 
                    variant={integrationStatus.googleAnalytics.connected ? 'default' : 'destructive'}
                  >
                    {integrationStatus.googleAnalytics.status}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleConfigureIntegration('google-analytics')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Property: {integrationStatus.googleAnalytics.propertyId}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Search Console</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integrationStatus.searchConsole.connected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge 
                    variant={integrationStatus.searchConsole.connected ? 'default' : 'destructive'}
                  >
                    {integrationStatus.searchConsole.status}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleConfigureIntegration('search-console')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Site: {integrationStatus.searchConsole.siteUrl}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Facebook Pixel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integrationStatus.facebook.connected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge 
                    variant={integrationStatus.facebook.connected ? 'default' : 'destructive'}
                  >
                    {integrationStatus.facebook.status}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleConfigureIntegration('facebook')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                {integrationStatus.facebook.pixelId || 'Not configured'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Twitter Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integrationStatus.twitter.connected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge 
                    variant={integrationStatus.twitter.connected ? 'default' : 'destructive'}
                  >
                    {integrationStatus.twitter.status}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleConfigureIntegration('twitter')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Account: {integrationStatus.twitter.accountId}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Additional Admin Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Administration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => handleConfigureIntegration('goals')}
              >
                <Settings className="h-6 w-6 mb-2" />
                Configure Goals
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => handleConfigureIntegration('reports')}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                Custom Reports
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => handleConfigureIntegration('alerts')}
              >
                <AlertCircle className="h-6 w-6 mb-2" />
                Set Up Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
