/**
 * Example Article Page with Structured Data
 * Shows how to integrate structured data into article pages
 */

import React from 'react';
import { ArticleStructuredData, OrganizationStructuredData } from '@/components/seo';
import { GetServerSideProps } from 'next';

interface ArticlePageProps {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImageUrl: string;
    publishedAt: string;
    author: {
      name: string;
      username: string;
    };
    category: {
      name: string;
    };
  };
}

export default function ArticlePage({ article }: ArticlePageProps) {
  return (
    <>
      {/* Inject structured data for this article */}
      <ArticleStructuredData articleId={article.id} />
      
      {/* Include organization schema on all pages */}
      <OrganizationStructuredData />

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
          
          <div className="flex items-center space-x-4 text-gray-600 mb-6">
            <span>By {article.author.name}</span>
            <span>•</span>
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString()}
            </time>
            <span>•</span>
            <span>{article.category.name}</span>
          </div>

          {article.featuredImageUrl && (
            <img
              src={article.featuredImageUrl}
              alt={article.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          )}
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </article>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  // Fetch article from API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/articles/${slug}`
  );

  if (!response.ok) {
    return {
      notFound: true,
    };
  }

  const article = await response.json();

  return {
    props: {
      article,
    },
  };
};

