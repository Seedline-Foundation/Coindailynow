/**
 * AMP Page Component
 * Frontend handler for AMP pages at /amp/news/[slug]
 * Implements FR-020, FR-033, FR-118, FR-159 + Mobile RAO
 */

import React from 'react';
import { notFound } from 'next/navigation';

interface AMPPageProps {
  params: {
    slug: string;
  };
}

/**
 * Fetch article data and AMP HTML
 */
async function getAMPPage(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // First, get the article by slug
    const articleResponse = await fetch(`${baseUrl}/api/articles/slug/${slug}`, {
      cache: 'no-store', // Always get fresh data for AMP pages
    });

    if (!articleResponse.ok) {
      return null;
    }

    const articleData = await articleResponse.json();
    const article = articleData.data;

    // Get or generate AMP page
    const ampResponse = await fetch(`${baseUrl}/api/amp/${article.id}/html`, {
      cache: 'no-store',
    });

    if (!ampResponse.ok) {
      // If AMP page doesn't exist, generate it
      const generateResponse = await fetch(`${baseUrl}/api/amp/generate/${article.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeAnalytics: true,
          includeAds: false,
          optimizeImages: true,
          enableRAO: true,
          cacheToGoogle: true,
        }),
      });

      if (!generateResponse.ok) {
        console.error('Failed to generate AMP page');
        return null;
      }

      // Fetch the newly generated AMP HTML
      const newAmpResponse = await fetch(`${baseUrl}/api/amp/${article.id}/html`, {
        cache: 'no-store',
      });

      if (!newAmpResponse.ok) {
        return null;
      }

      return newAmpResponse.text();
    }

    return ampResponse.text();
  } catch (error) {
    console.error('Error fetching AMP page:', error);
    return null;
  }
}

/**
 * AMP Page Component
 * This component returns raw AMP HTML for maximum performance
 */
export default async function AMPPage({ params }: AMPPageProps) {
  const { slug } = params;
  
  const ampHtml = await getAMPPage(slug);

  if (!ampHtml) {
    notFound();
  }

  // Return raw AMP HTML
  // Next.js will handle this properly in production
  return (
    <div dangerouslySetInnerHTML={{ __html: ampHtml }} />
  );
}

/**
 * Generate metadata for AMP pages
 */
export async function generateMetadata({ params }: AMPPageProps) {
  const { slug } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coindaily.co';

  return {
    title: `${slug} - AMP | CoinDaily`,
    description: 'Mobile-optimized AMP version for faster loading',
    alternates: {
      canonical: `${baseUrl}/news/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'amp-version': '⚡',
    },
  };
}

/**
 * Force dynamic rendering for AMP pages
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
