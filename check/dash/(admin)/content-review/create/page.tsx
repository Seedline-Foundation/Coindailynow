import { Metadata } from 'next';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

export const metadata: Metadata = {
  title: 'Create Article - Admin Dashboard',
  description: 'Create new articles with SEO optimization and real-time analysis',
};

export default function CreateArticlePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ArticleEditor />
    </div>
  );
}
