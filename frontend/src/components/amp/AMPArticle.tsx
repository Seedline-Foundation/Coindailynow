import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

interface AMPArticleProps {
  article: {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    publishedAt: string;
    author: {
      name: string;
      avatar?: string;
    };
    featuredImage?: string;
    tags: string[];
    readTime: number;
    category: string;
  };
}

const AMPArticle: React.FC<AMPArticleProps> = ({ article }) => {
  const isAMP = true; // This would come from Next.js useAmp hook in production

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": article.featuredImage || "/images/default-article.png",
    "datePublished": article.publishedAt,
    "dateModified": article.publishedAt,
    "author": {
      "@type": "Person",
      "name": article.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "CoinDaily Africa",
      "logo": {
        "@type": "ImageObject",
        "url": "https://coindaily.africa/images/logo.png"
      }
    },
    "description": article.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://coindaily.africa/amp/news/${article.slug}`
    }
  };

  return (
    <>
      <Head>
        <title>{article.title} - CoinDaily Africa</title>
        <meta name="description" content={article.excerpt} />
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
        
        {/* AMP specific meta tags */}
        <meta charSet="utf-8" />
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
        <script async custom-element="amp-social-share" src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"></script>
        <script async custom-element="amp-img" src="https://cdn.ampproject.org/v0/amp-img-0.1.js"></script>
        
        {/* Structured Data */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://coindaily.africa/news/${article.slug}`} />
        
        {/* AMP CSS */}
        <style amp-custom>{`
          :root {
            --primary-color: #f97316;
            --text-color: #1f2937;
            --bg-color: #fafaf9;
            --border-color: #e5e7eb;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 680px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 30px;
          }
          
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary-color);
            text-decoration: none;
          }
          
          .article-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 20px 0;
            font-size: 14px;
            color: #6b7280;
          }
          
          .article-title {
            font-size: 28px;
            font-weight: bold;
            line-height: 1.3;
            margin: 20px 0;
            color: var(--text-color);
          }
          
          .article-excerpt {
            font-size: 18px;
            color: #4b5563;
            margin: 20px 0;
            font-weight: 400;
            line-height: 1.5;
          }
          
          .article-image {
            width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
          }
          
          .article-content {
            font-size: 16px;
            line-height: 1.7;
            margin: 30px 0;
          }
          
          .article-content h2 {
            font-size: 22px;
            font-weight: 600;
            margin: 30px 0 15px 0;
            color: var(--text-color);
          }
          
          .article-content h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 25px 0 12px 0;
            color: var(--text-color);
          }
          
          .article-content p {
            margin: 16px 0;
          }
          
          .article-content a {
            color: var(--primary-color);
            text-decoration: underline;
          }
          
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 30px 0;
          }
          
          .tag {
            background-color: #f3f4f6;
            color: #4b5563;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            text-decoration: none;
          }
          
          .social-share {
            margin: 30px 0;
            text-align: center;
          }
          
          .social-share h3 {
            font-size: 16px;
            margin-bottom: 15px;
            color: var(--text-color);
          }
          
          .share-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          
          .footer {
            border-top: 1px solid var(--border-color);
            padding: 30px 0;
            text-align: center;
            margin-top: 50px;
          }
          
          @media (max-width: 640px) {
            .container {
              padding: 15px;
            }
            
            .article-title {
              font-size: 24px;
            }
            
            .article-excerpt {
              font-size: 16px;
            }
            
            .article-meta {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }
          }
        `}</style>

        {/* AMP Boilerplate */}
        <style amp-boilerplate>{`
          body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
        `}</style>
        <noscript>
          <style amp-boilerplate>{`
            body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}
          `}</style>
        </noscript>
      </Head>

      <div className="container">
        {/* Header */}
        <header className="header">
          <a href="/" className="logo">CoinDaily Africa</a>
        </header>

        {/* Article */}
        <article>
          <h1 className="article-title">{article.title}</h1>
          
          <div className="article-meta">
            <span>By {article.author.name}</span>
            <span>•</span>
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span>•</span>
            <span>{article.readTime} min read</span>
            <span>•</span>
            <span>{article.category}</span>
          </div>

          <p className="article-excerpt">{article.excerpt}</p>

          {article.featuredImage && (
            <amp-img
              className="article-image"
              src={article.featuredImage}
              width="680"
              height="400"
              layout="responsive"
              alt={article.title}
            />
          )}

          <div 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="tags">
              {article.tags.map((tag) => (
                <a key={tag} href={`/tags/${tag}`} className="tag">
                  #{tag}
                </a>
              ))}
            </div>
          )}

          {/* Social Sharing */}
          <div className="social-share">
            <h3>Share this article</h3>
            <div className="share-buttons">
              <amp-social-share
                type="twitter"
                width="45"
                height="33"
                data-param-text={article.title}
                data-param-url={`https://coindaily.africa/news/${article.slug}`}
              />
              <amp-social-share
                type="facebook"
                width="45"
                height="33"
                data-param-href={`https://coindaily.africa/news/${article.slug}`}
              />
              <amp-social-share
                type="linkedin"
                width="45"
                height="33"
                data-param-url={`https://coindaily.africa/news/${article.slug}`}
                data-param-title={article.title}
              />
              <amp-social-share
                type="whatsapp"
                width="45"
                height="33"
                data-param-text={`${article.title} - https://coindaily.africa/news/${article.slug}`}
              />
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 CoinDaily Africa. All rights reserved.</p>
          <p>
            <a href="/privacy">Privacy Policy</a> • 
            <a href="/terms">Terms of Service</a> • 
            <a href="/contact">Contact</a>
          </p>
        </footer>
      </div>

      {/* AMP Analytics */}
      <amp-analytics type="gtag" data-credentials="include">
        <script type="application/json">
          {JSON.stringify({
            "vars": {
              "gtag_id": process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
              "config": {
                [process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!]: {
                  "groups": "default"
                }
              }
            },
            "triggers": {
              "pageview": {
                "on": "visible",
                "request": "pageview"
              }
            }
          })}
        </script>
      </amp-analytics>
    </>
  );
};

export default AMPArticle;