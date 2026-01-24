"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComplianceDashboard from '@/components/compliance/ComplianceDashboard';
import GDPRTools from '@/components/compliance/GDPRTools';
import AccessibilityTools from '@/components/compliance/AccessibilityTools';
import CopyrightTools from '@/components/compliance/CopyrightTools';
import { PageHeader } from '@/components/PageHeader';
import {
  Shield,
  Eye,
  Accessibility,
  Copyright,
  FileCheck
} from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Digital Publishing Compliance"
        description="Comprehensive compliance management for GDPR, CCPA, WCAG, and Copyright Standards"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="gdpr" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              GDPR
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="copyright" className="flex items-center gap-2">
              <Copyright className="h-4 w-4" />
              Copyright
            </TabsTrigger>
            <TabsTrigger value="ccpa" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              CCPA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ComplianceDashboard />
          </TabsContent>

          <TabsContent value="gdpr">
            <GDPRTools />
          </TabsContent>

          <TabsContent value="accessibility">
            <AccessibilityTools />
          </TabsContent>

          <TabsContent value="copyright">
            <CopyrightTools />
          </TabsContent>

          <TabsContent value="ccpa">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-6 w-6 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">CCPA Compliance Tools</h1>
                  <p className="text-gray-600">
                    California Consumer Privacy Act compliance management
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Do Not Sell</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Manage user opt-out preferences for data sales
                  </p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    View Opt-Outs
                  </button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Data Categories</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Review personal information categories collected
                  </p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    Manage Categories
                  </button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Disclosure Report</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Generate annual CCPA disclosure report
                  </p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
