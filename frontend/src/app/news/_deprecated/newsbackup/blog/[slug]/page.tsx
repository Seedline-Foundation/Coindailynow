import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PILLAR_ARTICLES } from '@/data/blog-articles';
import BlogArticleClient from './BlogArticleClient';

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  return PILLAR_ARTICLES.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = PILLAR_ARTICLES.find(a => a.slug === params.slug);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.targetKeywords,
    authors: [{ name: article.author }],
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      url: `https://coindaily.online/blog/${article.slug}`,
      siteName: 'CoinDaily',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      section: article.category,
      tags: article.tags,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle,
      description: article.metaDescription,
      creator: '@CoinDailyOnline',
    },
    alternates: {
      canonical: `https://coindaily.online/blog/${article.slug}`,
      languages: {
        'en': `https://coindaily.online/blog/${article.slug}`,
        'sw': `https://coindaily.online/sw/blog/${article.slug}`,
        'ha': `https://coindaily.online/ha/blog/${article.slug}`,
        'yo': `https://coindaily.online/yo/blog/${article.slug}`,
        'am': `https://coindaily.online/am/blog/${article.slug}`,
        'zu': `https://coindaily.online/zu/blog/${article.slug}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default function BlogArticlePage({ params }: Props) {
  const article = PILLAR_ARTICLES.find(a => a.slug === params.slug);
  if (!article) notFound();

  return <BlogArticleClient article={article} />;
}
