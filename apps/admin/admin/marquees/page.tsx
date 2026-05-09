'use client';

import React from 'react';
import MarqueeAdmin from '@/components/admin/MarqueeAdmin';

export default function AdminMarqueePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CoinDaily Admin</h1>
              <p className="text-gray-600">Content Management System</p>
            </div>
            <nav className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-gray-700">Dashboard</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Articles</a>
              <a href="#" className="text-blue-600 font-medium">Marquees</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Settings</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <MarqueeAdmin />
      </main>
    </div>
  );
}
