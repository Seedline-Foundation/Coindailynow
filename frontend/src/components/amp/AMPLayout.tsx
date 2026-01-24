import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface AMPConfig {
  enabled: boolean;
  canonical?: string;
  schema?: Record<string, any>;
  customCSS?: string;
}

interface AMPLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  config?: AMPConfig;
  keywords?: string[];
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  image?: string;
  category?: string;
}

const AMPLayout: React.FC<AMPLayoutProps> = ({
  children,
  title,
  description,
  config = { enabled: false },
  keywords = [],
  author = 'CoinDaily',
  publishedAt,
  modifiedAt,
  image,
  category
}) => {
  const router = useRouter();
  const isAMP = config.enabled || router.query.amp === '1';
  const canonicalUrl = config.canonical || `https://coindaily.co${router.asPath.split('?')[0]}`;
  const ampUrl = `${canonicalUrl}?amp=1`;

  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://coindaily.co'
    },
    publisher: {
      '@type': 'Organization',
      name: 'CoinDaily',
      logo: {
        '@type': 'ImageObject',
        url: 'https://coindaily.co/icons/icon-512x512.png',
        width: 512,
        height: 512
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    ...(publishedAt && { datePublished: publishedAt }),
    ...(modifiedAt && { dateModified: modifiedAt }),
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
        width: 1200,
        height: 630
      }
    }),
    ...(category && { articleSection: category }),
    ...config.schema
  };

  if (isAMP) {
    return (
      <AMPDocument
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        structuredData={structuredData}
        keywords={keywords}
        customCSS={config.customCSS || ''}
        image={image || undefined}
      >
        {children}
      </AMPDocument>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="amphtml" href={ampUrl} />
        
        {keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        {image && <meta property="og:image" content={image} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>
      <div className="non-amp-content">
        {children}
      </div>
    </>
  );
};

interface AMPDocumentProps {
  children: React.ReactNode;
  title: string;
  description: string;
  canonicalUrl: string;
  structuredData: Record<string, any>;
  keywords: string[];
  customCSS: string;
  image?: string;
}

const AMPDocument: React.FC<AMPDocumentProps> = ({
  children,
  title,
  description,
  canonicalUrl,
  structuredData,
  keywords,
  customCSS,
  image
}) => {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        
        {/* AMP Components */}
        <script
          async
          custom-element="amp-analytics"
          src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"
        ></script>
        <script
          async
          custom-element="amp-social-share"
          src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"
        ></script>
        <script
          async
          custom-element="amp-img"
          src="https://cdn.ampproject.org/v0/amp-img-0.1.js"
        ></script>
        <script
          async
          custom-element="amp-form"
          src="https://cdn.ampproject.org/v0/amp-form-0.1.js"
        ></script>
        
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
        
        {keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        {image && <meta property="og:image" content={image} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
        
        {/* AMP Custom CSS */}
        <style 
          amp-custom="" 
          dangerouslySetInnerHTML={{ 
            __html: getAMPStyles(customCSS) 
          }} 
        />
        
        {/* AMP Boilerplate */}
        <style amp-boilerplate="">
          {`body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`}
        </style>
        <noscript>
          <style amp-boilerplate="">
            {`body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`}
          </style>
        </noscript>
      </Head>
      
      <div className="amp-container">
        <header className="amp-header">
          <a href="/" className="amp-logo">CoinDaily</a>
          <nav className="amp-nav">
            <a href="/news">News</a>
            <a href="/market">Market</a>
            <a href="/analysis">Analysis</a>
          </nav>
        </header>
        
        <main>
          {children}
        </main>
        
        <footer className="amp-footer">
          <p>&copy; 2024 CoinDaily. Africa's Premier Cryptocurrency News Platform.</p>
        </footer>
      </div>
      
      {/* AMP Analytics */}
      <amp-analytics type="googleanalytics">
        <script
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              vars: {
                account: process.env.NEXT_PUBLIC_GA_ID || 'GA_MEASUREMENT_ID'
              },
              triggers: {
                trackPageview: {
                  on: 'visible',
                  request: 'pageview'
                }
              }
            })
          }}
        />
      </amp-analytics>
    </>
  );
};

// Generate AMP styles
function getAMPStyles(customCSS: string): string {
  const baseStyles = `
    /* AMP Custom CSS for CoinDaily */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    
    .amp-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .amp-header {
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .amp-logo {
      font-size: 24px;
      font-weight: bold;
      color: #f59e0b;
      text-decoration: none;
    }
    
    .amp-nav {
      margin-top: 10px;
    }
    
    .amp-nav a {
      color: #6b7280;
      text-decoration: none;
      margin-right: 20px;
      font-size: 14px;
    }
    
    .amp-article-header {
      margin-bottom: 30px;
    }
    
    .amp-title {
      font-size: 32px;
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: 15px;
      color: #1a1a1a;
    }
    
    .amp-meta {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 20px;
    }
    
    .amp-content {
      font-size: 16px;
      line-height: 1.7;
    }
    
    .amp-content h2 {
      font-size: 24px;
      font-weight: bold;
      margin: 30px 0 15px 0;
      color: #1a1a1a;
    }
    
    .amp-content h3 {
      font-size: 20px;
      font-weight: bold;
      margin: 25px 0 12px 0;
      color: #1a1a1a;
    }
    
    .amp-content p {
      margin-bottom: 15px;
    }
    
    .amp-content a {
      color: #f59e0b;
      text-decoration: underline;
    }
    
    .amp-content blockquote {
      border-left: 4px solid #f59e0b;
      margin: 20px 0;
      padding-left: 20px;
      font-style: italic;
      color: #4b5563;
    }
    
    .amp-image {
      width: 100%;
      height: auto;
      margin: 20px 0;
      border-radius: 8px;
    }
    
    .amp-market-data {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .amp-price {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
    }
    
    .amp-price.negative {
      color: #ef4444;
    }
    
    .amp-footer {
      border-top: 1px solid #e5e7eb;
      margin-top: 40px;
      padding-top: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .amp-container {
        padding: 15px;
      }
      
      .amp-title {
        font-size: 26px;
      }
      
      .amp-content {
        font-size: 15px;
      }
    }
    
    /* AMP specific optimizations */
    .amp-social-share {
      margin: 30px 0;
    }
    
    .amp-related-articles {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    
    .amp-newsletter-signup {
      background-color: #fef3c7;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
      text-align: center;
    }
  `;
  
  return baseStyles + customCSS;
}

export default AMPLayout;

// AMP Image Component
interface AMPImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  className?: string;
}

export const AMPImage: React.FC<AMPImageProps> = ({
  src,
  alt,
  width,
  height,
  caption,
  className = ''
}) => {
  return (
    <figure className={`amp-image-figure ${className}`}>
      <amp-img
        src={src}
        alt={alt}
        width={width}
        height={height}
        layout="responsive"
        className="amp-image"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
};

// AMP Social Share Component
interface AMPSocialShareProps {
  url: string;
  title: string;
}

export const AMPSocialShare: React.FC<AMPSocialShareProps> = ({ url, title }) => {
  return (
    <div className="amp-social-share">
      <h3>Share this article:</h3>
      <amp-social-share
        type="twitter"
        width={40}
        height={40}
        data-param-text={title}
        data-param-url={url}
      />
      <amp-social-share
        type="facebook"
        width={40}
        height={40}
        data-param-href={url}
      />
      <amp-social-share
        type="linkedin"
        width={40}
        height={40}
        data-param-url={url}
        data-param-title={title}
      />
      <amp-social-share
        type="whatsapp"
        width={40}
        height={40}
        data-param-text={`${title} ${url}`}
      />
    </div>
  );
};

// AMP Market Data Component
interface AMPMarketDataProps {
  symbol: string;
  price: number;
  change24h: number;
  volume?: number;
}

export const AMPMarketData: React.FC<AMPMarketDataProps> = ({
  symbol,
  price,
  change24h,
  volume
}) => {
  const isPositive = change24h >= 0;
  
  return (
    <div className="amp-market-data">
      <h3>{symbol}</h3>
      <div className={`amp-price ${isPositive ? '' : 'negative'}`}>
        ${price.toLocaleString()}
      </div>
      <div style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
        {isPositive ? '+' : ''}{change24h.toFixed(2)}%
      </div>
      {volume && (
        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
          Volume: ${volume.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// AMP Newsletter Signup
export const AMPNewsletterSignup: React.FC = () => {
  return (
    <div className="amp-newsletter-signup">
      <h3>Stay Updated with CoinDaily</h3>
      <p>Get the latest crypto news from Africa delivered to your inbox.</p>
      <form
        method="post"
        action-xhr="/api/newsletter/subscribe"
        target="_top"
      >
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            marginRight: '10px',
            width: '200px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Subscribe
        </button>
      </form>
    </div>
  );
};
