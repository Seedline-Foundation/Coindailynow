// Dynamic SEO Meta Tags Component
// Automatically generates and manages all SEO meta tags for pages

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  articleTag?: string[];
  // RAO-specific metadata for LLM indexing
  raometa: {
    canonicalAnswer?: string;
    semanticChunks: string[];
    entityMentions: string[];
    factClaims: string[];
    aiSource: string;
    lastVerified: string;
    confidence: number;
  };
}

interface DynamicMetaTagsProps {
  metadata?: SEOMetadata;
  contentId?: string;
  contentType?: 'article' | 'page' | 'category' | 'author';
  fallbackTitle?: string;
  fallbackDescription?: string;
  image?: string;
  author?: string;
  publishedAt?: Date;
  modifiedAt?: Date;
  category?: string;
  tags?: string[];
  keywords?: string[];
}

export default function DynamicMetaTags({
  metadata,
  contentId,
  contentType = 'page',
  fallbackTitle = 'CoinDaily - Africa\'s Premier Cryptocurrency News Platform',
  fallbackDescription = 'Stay ahead of the crypto curve with CoinDaily. Get real-time news, market analysis, and insights on cryptocurrencies, blockchain, and emerging trends across Africa.',
  image = '/images/default-og.jpg',
  author,
  publishedAt,
  modifiedAt,
  category,
  tags,
  keywords = ['cryptocurrency', 'bitcoin', 'blockchain', 'crypto news', 'africa', 'memecoin'],
}: DynamicMetaTagsProps) {
  const router = useRouter();
  const [seoMetadata, setSeoMetadata] = useState<SEOMetadata | null>(metadata || null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate metadata if not provided
  useEffect(() => {
    if (!metadata && contentId && contentType) {
      generateMetadata();
    }
  }, [metadata, contentId, contentType]);

  const generateMetadata = async () => {
    if (!contentId || !contentType) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/seo/metadata/${contentId}/${contentType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSeoMetadata(data.data);
      } else {
        // Generate metadata on the fly
        await generateOnDemand();
      }
    } catch (error) {
      console.error('Failed to fetch SEO metadata:', error);
      // Use fallback metadata
      setSeoMetadata(createFallbackMetadata());
    } finally {
      setIsLoading(false);
    }
  };

  const generateOnDemand = async () => {
    if (!contentId || !contentType) return;

    try {
      // This would typically get content from your CMS
      const content = await fetchContent(contentId, contentType);

      const response = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          content,
          type: contentType,
          url: window.location.href,
          image,
          author,
          publishedAt: publishedAt?.toISOString(),
          modifiedAt: modifiedAt?.toISOString(),
          category,
          tags,
          targetKeywords: keywords,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSeoMetadata(data.data);
      }
    } catch (error) {
      console.error('Failed to generate SEO metadata:', error);
      setSeoMetadata(createFallbackMetadata());
    }
  };

  const fetchContent = async (id: string, type: string): Promise<string> => {
    // This is a placeholder - implement based on your content fetching logic
    // For articles, pages, etc.
    try {
      const response = await fetch(`/api/content/${type}/${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.content || data.body || data.description || '';
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
    return '';
  };

  const createFallbackMetadata = (): SEOMetadata => {
    const canonicalUrl = typeof window !== 'undefined' ? window.location.href : '';

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      keywords,
      canonicalUrl,
      ogTitle: fallbackTitle,
      ogDescription: fallbackDescription,
      ogImage: image,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: fallbackTitle,
      twitterDescription: fallbackDescription,
      twitterImage: image,
      raometa: {
        semanticChunks: [],
        entityMentions: [],
        factClaims: [],
        aiSource: 'CoinDaily',
        lastVerified: new Date().toISOString(),
        confidence: 0.5,
      },
    };
  };

  // Use provided metadata or generated/fallback metadata
  const finalMetadata = seoMetadata || createFallbackMetadata();

  // Generate structured data (JSON-LD)
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': contentType === 'article' ? 'Article' : 'WebPage',
      name: finalMetadata.title,
      description: finalMetadata.description,
      url: finalMetadata.canonicalUrl,
      image: finalMetadata.ogImage,
      publisher: {
        '@type': 'Organization',
        name: 'CoinDaily',
        logo: {
          '@type': 'ImageObject',
          url: '/images/coindaily-logo.png',
        },
      },
    };

    if (contentType === 'article') {
      return {
        ...baseData,
        '@type': 'Article',
        headline: finalMetadata.title,
        author: finalMetadata.articleAuthor ? {
          '@type': 'Person',
          name: finalMetadata.articleAuthor,
        } : undefined,
        datePublished: finalMetadata.articlePublishedTime,
        dateModified: finalMetadata.articleModifiedTime,
        articleSection: finalMetadata.articleSection,
        keywords: finalMetadata.articleTag?.join(', '),
      };
    }

    return baseData;
  };

  // Generate RAO meta tags for LLM indexing
  const generateRAOMetaTags = () => {
    const rao = finalMetadata.raometa;
    if (!rao) return null;

    return (
      <>
        {/* Canonical Answer */}
        {rao.canonicalAnswer && (
          <meta name="rao:canonical-answer" content={rao.canonicalAnswer} />
        )}

        {/* Semantic Chunks */}
        {rao.semanticChunks.map((chunk, index) => (
          <meta key={`rao-chunk-${index}`} name={`rao:semantic-chunk-${index}`} content={chunk} />
        ))}

        {/* Entity Mentions */}
        {rao.entityMentions.map((entity, index) => (
          <meta key={`rao-entity-${index}`} name={`rao:entity-${index}`} content={entity} />
        ))}

        {/* Fact Claims */}
        {rao.factClaims.map((fact, index) => (
          <meta key={`rao-fact-${index}`} name={`rao:fact-${index}`} content={fact} />
        ))}

        {/* AI Source and Verification */}
        <meta name="rao:ai-source" content={rao.aiSource} />
        <meta name="rao:last-verified" content={rao.lastVerified} />
        <meta name="rao:confidence" content={rao.confidence.toString()} />

        {/* LLM-friendly meta tags */}
        <meta name="llms:canonical-url" content={finalMetadata.canonicalUrl} />
        <meta name="llms:content-type" content={contentType} />
        <meta name="llms:last-updated" content={finalMetadata.articleModifiedTime || new Date().toISOString()} />
      </>
    );
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{finalMetadata.title}</title>
      <meta name="description" content={finalMetadata.description} />
      <meta name="keywords" content={finalMetadata.keywords.join(', ')} />
      <link rel="canonical" href={finalMetadata.canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={finalMetadata.ogTitle} />
      <meta property="og:description" content={finalMetadata.ogDescription} />
      <meta property="og:image" content={finalMetadata.ogImage} />
      <meta property="og:url" content={finalMetadata.canonicalUrl} />
      <meta property="og:type" content={finalMetadata.ogType} />
      <meta property="og:site_name" content="CoinDaily" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={finalMetadata.twitterCard} />
      <meta name="twitter:title" content={finalMetadata.twitterTitle} />
      <meta name="twitter:description" content={finalMetadata.twitterDescription} />
      <meta name="twitter:image" content={finalMetadata.twitterImage} />
      <meta name="twitter:site" content="@CoinDailyAfrica" />

      {/* Article-specific meta tags */}
      {finalMetadata.articleAuthor && (
        <meta property="article:author" content={finalMetadata.articleAuthor} />
      )}
      {finalMetadata.articlePublishedTime && (
        <meta property="article:published_time" content={finalMetadata.articlePublishedTime} />
      )}
      {finalMetadata.articleModifiedTime && (
        <meta property="article:modified_time" content={finalMetadata.articleModifiedTime} />
      )}
      {finalMetadata.articleSection && (
        <meta property="article:section" content={finalMetadata.articleSection} />
      )}
      {finalMetadata.articleTag?.map((tag, index) => (
        <meta key={`article-tag-${index}`} property="article:tag" content={tag} />
      ))}

      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />

      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#1f2937" />

      {/* RAO Meta Tags for LLM Indexing */}
      {generateRAOMetaTags()}

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData()),
        }}
      />

      {/* Preload critical resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    </Head>
  );
}

// Hook for using SEO metadata in components
export function useSEOMetadata(contentId?: string, contentType?: string) {
  const [metadata, setMetadata] = useState<SEOMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    if (!contentId || !contentType) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/seo/metadata/${contentId}/${contentType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetadata(data.data);
      } else {
        setError('Failed to fetch SEO metadata');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveMetadata = async (metadata: SEOMetadata) => {
    if (!contentId || !contentType) return false;

    try {
      const response = await fetch(`/api/seo/metadata/${contentId}/${contentType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(metadata),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to save SEO metadata:', error);
      return false;
    }
  };

  useEffect(() => {
    if (contentId && contentType) {
      fetchMetadata();
    }
  }, [contentId, contentType]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata,
    save: saveMetadata,
  };
}
