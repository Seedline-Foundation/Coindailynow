import { Metadata } from 'next';
import { SitemapManager } from '../../../../components/admin/seo/SitemapManager';

export const metadata: Metadata = {
  title: 'Sitemap Management - SEO Dashboard',
  description: 'Manage XML sitemaps and URL submissions for better search engine indexing',
};

export default function SitemapsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sitemap Management</h1>
        <p className="mt-2 text-gray-600">
          Generate, manage, and submit XML sitemaps to improve search engine indexing
        </p>
      </div>
      
      <SitemapManager />
    </div>
  );
}
