'use client';

export const dynamic = 'force-dynamic';

import PerformanceMonitor from '../../../components/admin/performanceMonitor';

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <PerformanceMonitor />
    </div>
  );
}