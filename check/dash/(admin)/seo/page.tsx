import { SEODashboard } from '@/components/admin/SEODashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Dashboard - Sygn Admin',
  description: 'Monitor and manage SEO performance for Sygn news platform.',
};

export default function SEODashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEODashboard />
    </div>
  );
}
