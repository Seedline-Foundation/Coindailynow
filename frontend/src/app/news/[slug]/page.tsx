/**
 * Dynamic News Article Page
 * Displays individual news articles by slug
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface NewsPageProps {
  params: {
    slug: string;
  };
}

interface Article {
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  author: string;
}

// This would typically fetch from your backend API
async function getArticle(slug: string): Promise<Article | null> {
  // TODO: Implement actual API call to backend
  // For now, return null to show 404
  return null;
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} | CoinDaily Africa`,
    description: article.summary,
  };
}

export default async function NewsPage({ params }: NewsPageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <div className="prose prose-lg">
          {/* Article content would go here */}
          <p>Article content loading...</p>
        </div>
      </article>
    </div>
  );
}
