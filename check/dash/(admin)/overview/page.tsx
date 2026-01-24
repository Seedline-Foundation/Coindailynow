import AdminOverview from '@/components/admin/AdminOverview';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Overview | CoinDaily CMS',
  description: 'Comprehensive overview of all administrative features and capabilities in the CoinDaily content management system.',
  robots: 'noindex, nofollow',
};

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
