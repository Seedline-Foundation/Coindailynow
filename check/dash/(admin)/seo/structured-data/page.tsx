import { Metadata } from 'next';
import { StructuredDataManager } from '../../../../components/admin/seo/StructuredDataManager';

export const metadata: Metadata = {
  title: 'Structured Data Management - SEO Dashboard',
  description: 'Manage JSON-LD structured data for rich snippets and enhanced search results',
};

export default function StructuredDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Structured Data Management</h1>
        <p className="mt-2 text-gray-600">
          Configure and validate JSON-LD structured data for rich snippets and enhanced search results
        </p>
      </div>
      
      <StructuredDataManager />
    </div>
  );
}
