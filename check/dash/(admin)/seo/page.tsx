import { SEODashboard } from '@/components/admin/SEODashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Dashboard - CoinDaily Admin',
  description: 'Monitor and manage SEO performance for CoinDaily news platform.',
};

export default function SEODashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEODashboard />
    </div>
  );
}
