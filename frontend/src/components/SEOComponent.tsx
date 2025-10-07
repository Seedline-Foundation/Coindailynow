import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  image?: string;
  articleTags?: string[];
  category?: string;
  readTime?: number;
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

interface SEOProps extends SEOData {
  type?: 'website' | 'article' | 'profile';
  children?: React.ReactNode;
}

export const SEOComponent: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  author,
  publishedAt,
  modifiedAt,
  image,
  articleTags = [],
  category,
  readTime,
  canonicalUrl,
  noindex = false,
  nofollow = false,
  type = 'website',
  children
}) => {
  const router = useRouter();
  const currentUrl = `https://coindaily.africa${router.asPath}`;
  const finalCanonicalUrl = canonicalUrl || currentUrl;

  // Generate structured data based on type
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type === 'article' ? 'NewsArticle' : 'WebPage',
      "headline": title,
      "description": description,
      "url": finalCanonicalUrl,
      "publisher": {
        "@type": "Organization",
        "name": "CoinDaily Africa",
        "logo": {
          "@type": "ImageObject",
          "url": "https://coindaily.africa/images/logo.png"
        }
      }
    };

    if (type === 'article') {
      return {
        ...baseData,
        "@type": "NewsArticle",
        "author": {
          "@type": "Person",
          "name": author || "CoinDaily Editorial Team"
        },
        "datePublished": publishedAt,
        "dateModified": modifiedAt || publishedAt,
        "image": image || "https://coindaily.africa/images/og-default.png",
        "articleSection": category,
        "keywords": [...keywords, ...articleTags].join(', '),
        "wordCount": readTime ? readTime * 200 : undefined, // Estimate 200 words per minute
        "timeRequired": readTime ? `PT${readTime}M` : undefined,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": finalCanonicalUrl
        }
      };
    }

    return baseData;
  };

  const structuredData = getStructuredData();

  // Generate SEO-optimized title
  const seoTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;
  
  // Generate SEO-optimized description
  const seoDescription = description.length > 160 ? `${description.substring(0, 157)}...` : description;

  // Combine all keywords
  const allKeywords = [
    ...keywords,
    ...articleTags,
    'cryptocurrency',
    'bitcoin',
    'ethereum',
    'africa',
    'news',
    'market',
    'trading'
  ].filter(Boolean).slice(0, 15);

  // Generate SEO-optimized title
  const fullTitle = `${seoTitle} | CoinDaily Africa`;
  
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={allKeywords.join(', ')} />
        <meta name="author" content={author || 'CoinDaily Editorial Team'} />
        <meta name="robots" content={robotsContent} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f97316" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={finalCanonicalUrl} />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={finalCanonicalUrl} />
        <meta property="og:site_name" content="CoinDaily Africa" />
        <meta property="og:image" content={image || 'https://coindaily.africa/images/og-default.png'} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
        <meta property="og:locale" content="en_US" />

        {/* Article-specific Open Graph tags */}
        {type === 'article' && (
          <>
            {publishedAt && <meta property="article:published_time" content={publishedAt} />}
            {(modifiedAt || publishedAt) && <meta property="article:modified_time" content={modifiedAt || publishedAt} />}
            {author && <meta property="article:author" content={author} />}
            {category && <meta property="article:section" content={category} />}
            {articleTags.map((tag, index) => (
              <meta key={index} property="article:tag" content={tag} />
            ))}
          </>
        )}

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@coindailyafrica" />
        <meta name="twitter:creator" content="@coindailyafrica" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={image || 'https://coindaily.africa/images/og-default.png'} />

        {/* Additional Meta Tags */}
        <meta httpEquiv="x-ua-compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="application-name" content="CoinDaily Africa" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CoinDaily" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData, null, 0)
          }}
        />

        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect to External Domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.coindaily.africa" />

        {/* Language Alternates */}
        <link rel="alternate" hrefLang="en" href={finalCanonicalUrl} />
        <link rel="alternate" hrefLang="fr" href={`${finalCanonicalUrl}?lang=fr`} />
        <link rel="alternate" hrefLang="sw" href={`${finalCanonicalUrl}?lang=sw`} />
        <link rel="alternate" hrefLang="ar" href={`${finalCanonicalUrl}?lang=ar`} />

        {/* RSS Feeds */}
        <link 
          rel="alternate" 
          type="application/rss+xml" 
          title="CoinDaily Africa RSS Feed" 
          href="/rss.xml" 
        />
        <link 
          rel="alternate" 
          type="application/atom+xml" 
          title="CoinDaily Africa Atom Feed" 
          href="/atom.xml" 
        />

        {/* Performance Hints */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.coindaily.africa" />
        <link rel="dns-prefetch" href="//cdn.coindaily.africa" />

        {children}
      </Head>
    </>
  );
};

// Predefined SEO templates for common page types
export const HomeSEO = () => (
  <SEOComponent
    title="Premier Cryptocurrency News Platform for Africa"
    description="Get the latest Bitcoin, Ethereum, and altcoin news tailored for African markets. Real-time market data, expert analysis, and insights from Nigeria, Kenya, South Africa, and beyond."
    keywords={['cryptocurrency news africa', 'bitcoin news nigeria', 'ethereum news kenya', 'crypto market south africa', 'altcoin news ghana']}
    type="website"
  />
);

export const NewsSEO = () => (
  <SEOComponent
    title="Latest Cryptocurrency News"
    description="Stay updated with the latest cryptocurrency news, market trends, and analysis from across Africa and the globe."
    keywords={['crypto news', 'bitcoin news', 'ethereum news', 'altcoin updates', 'blockchain news']}
    type="website"
  />
);

export const MarketSEO = () => (
  <SEOComponent
    title="Cryptocurrency Market Data & Prices"
    description="Real-time cryptocurrency prices, market cap, trading volume, and analysis for Bitcoin, Ethereum, and thousands of altcoins."
    keywords={['crypto prices', 'bitcoin price', 'ethereum price', 'market cap', 'trading volume']}
    type="website"
  />
);

export const ArticleSEO: React.FC<{
  article: {
    title: string;
    excerpt: string;
    slug: string;
    publishedAt: string;
    updatedAt?: string;
    author: { name: string };
    featuredImage?: string;
    tags: string[];
    category: string;
    readTime: number;
  }
}> = ({ article }) => (
  <SEOComponent
    title={article.title}
    description={article.excerpt}
    author={article.author.name}
    publishedAt={article.publishedAt}
    modifiedAt={article.updatedAt || article.publishedAt}
    image={article.featuredImage || undefined}
    articleTags={article.tags}
    category={article.category}
    readTime={article.readTime}
    canonicalUrl={`https://coindaily.africa/news/${article.slug}`}
    type="article"
  />
);

export default SEOComponent;