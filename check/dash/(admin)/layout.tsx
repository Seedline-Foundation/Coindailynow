/**
 * Admin Layout Component
 */

'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
          <AdminSidebar />
        </div>
        <main className="flex-1 pt-16">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
