/**
 * Structured Data Component
 * Implements Task 57: Production-ready structured data rendering
 * 
 * Automatically injects JSON-LD structured data into page head
 * for SEO and rich snippets optimization
 */

'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';

interface StructuredDataProps {
  contentId: string;
  contentType: 'article' | 'author' | 'category' | 'cryptocurrency' | 'exchange-rate';
}

interface StructuredDataResponse {
  schemas: {
    newsArticle?: any;
    person?: any;
    organization?: any;
    cryptocurrency?: any;
    exchangeRate?: any;
    rao?: any;
  };
  raometa?: any;
}

export default function StructuredData({ contentId, contentType }: StructuredDataProps) {
  const [structuredData, setStructuredData] = useState<StructuredDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStructuredData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/structured-data/${contentType}/${contentId}`
        );

        if (response.ok) {
          const result = await response.json();
          setStructuredData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch structured data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStructuredData();
  }, [contentId, contentType]);

  if (loading || !structuredData) {
    return null;
  }

  // Build JSON-LD graph with all schemas
  const jsonLdGraph = {
    '@graph': [
      structuredData.schemas.newsArticle,
      structuredData.schemas.person,
      structuredData.schemas.organization,
      structuredData.schemas.cryptocurrency,
      structuredData.schemas.exchangeRate,
      structuredData.schemas.rao,
    ].filter(Boolean),
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdGraph),
          }}
        />
      </Head>
    </>
  );
}

/**
 * Article Structured Data Component
 * Specialized component for article pages
 */
export function ArticleStructuredData({ articleId }: { articleId: string }) {
  return <StructuredData contentId={articleId} contentType="article" />;
}

/**
 * Cryptocurrency Structured Data Component
 * Specialized component for token pages
 */
export function CryptoStructuredData({ 
  tokenSymbol,
  tokenName,
  description,
  price,
  imageUrl,
}: { 
  tokenSymbol: string;
  tokenName: string;
  description: string;
  price?: number;
  imageUrl?: string;
}) {
  const [schema, setSchema] = useState<any>(null);

  useEffect(() => {
    const generateSchema = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/structured-data/cryptocurrency/generate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              tokenSymbol,
              tokenName,
              description,
              price,
              imageUrl,
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          setSchema(result.data.schema);
        }
      } catch (error) {
        console.error('Failed to generate crypto schema:', error);
      }
    };

    generateSchema();
  }, [tokenSymbol, tokenName, description, price, imageUrl]);

  if (!schema) {
    return null;
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
    </Head>
  );
}

/**
 * Organization Structured Data Component
 * Global component for CoinDaily organization schema
 */
export function OrganizationStructuredData() {
  const [schema, setSchema] = useState<any>(null);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/structured-data/organization`
        );

        if (response.ok) {
          const result = await response.json();
          setSchema(result.data.schema);
        }
      } catch (error) {
        console.error('Failed to fetch organization schema:', error);
      }
    };

    fetchSchema();
  }, []);

  if (!schema) {
    return null;
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
    </Head>
  );
}

