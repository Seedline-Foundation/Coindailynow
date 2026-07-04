import AdminOverview from '@/components/admin/AdminOverview';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Overview | Sygn CMS',
  description: 'Comprehensive overview of all administrative features and capabilities in the Sygn content management system.',
  robots: 'noindex, nofollow',
};

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
