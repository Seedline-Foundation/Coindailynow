import { Metadata } from 'next';
import { SEOAnalytics } from '../../../../components/admin/seo/SEOAnalytics';

export const metadata: Metadata = {
  title: 'SEO Analytics - SEO Dashboard',
  description: 'Monitor SEO performance, rankings, and traffic analytics',
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SEO Analytics</h1>
        <p className="mt-2 text-gray-600">
          Monitor your SEO performance, search rankings, and organic traffic trends
        </p>
      </div>
      
      <SEOAnalytics />
    </div>
  );
}
