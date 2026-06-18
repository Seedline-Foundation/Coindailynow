'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';
import { PILLAR_ARTICLES, type BlogArticle } from '@/data/blog-articles';

function TableOfContents({ sections }: { sections: BlogArticle['sections'] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    sections.forEach((_, i) => {
      const el = document.getElementById(`section-${i}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-24 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Table of Contents</h3>
      <ul className="space-y-1.5">
        {sections.map((section, i) => (
          <li key={i}>
            <a
              href={`#section-${i}`}
              className={`block text-sm py-1 px-2 rounded transition-colors ${
                activeId === `section-${i}`
                  ? 'text-orange-600 bg-orange-50 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {section.heading}
            </a>
          </li>
        ))}
        <li>
          <a
            href="#faq"
            className={`block text-sm py-1 px-2 rounded transition-colors ${
              activeId === 'faq'
                ? 'text-orange-600 bg-orange-50 font-medium'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            FAQ
          </a>
        </li>
      </ul>
    </nav>
  );
}

function FAQSection({ items }: { items: BlogArticle['faqItems'] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-800">{item.question}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIdx === i && (
              <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function BlogArticleClient({ article }: { article: BlogArticle }) {
  const relatedArticles = PILLAR_ARTICLES.filter(a =>
    article.relatedArticles?.includes(a.slug) && a.id !== article.id
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-800">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-800">Blog</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate max-w-xs">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide mb-4">
            {article.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{article.title}</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">{article.excerpt}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span>by {article.author}</span>
            <span>·</span>
            <span>{article.readingTime} min read</span>
            <span>·</span>
            <span>{article.wordCount.toLocaleString()} words</span>
            <span>·</span>
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>
          {/* Languages banner */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs text-orange-200">
            🌍 Available in 15+ African languages — Translation powered by AI
          </div>
        </div>
      </section>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 order-2 lg:order-1">
            <TableOfContents sections={article.sections} />
          </aside>

          {/* Article Content */}
          <article className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-10 prose prose-lg max-w-none">
                {/* Keywords highlight */}
                <div className="flex flex-wrap gap-2 mb-8 not-prose">
                  {article.targetKeywords.slice(0, 5).map(kw => (
                    <span key={kw} className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>

                {/* Article Sections */}
                {article.sections.map((section, i) => (
                  <section key={i} id={`section-${i}`} className="mb-10 scroll-mt-24">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {section.heading}
                    </h2>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                    {section.bulletPoints && section.bulletPoints.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {section.bulletPoints.map((bp, j) => (
                          <li key={j} className="flex items-start gap-2 text-gray-700">
                            <span className="text-orange-500 mt-1 flex-shrink-0">✓</span>
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.proTip && (
                      <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                        <p className="text-sm font-medium text-orange-800">💡 Pro Tip</p>
                        <p className="text-sm text-orange-700 mt-1">{section.proTip}</p>
                      </div>
                    )}
                  </section>
                ))}

                {/* FAQ */}
                {article.faqItems && article.faqItems.length > 0 && (
                  <FAQSection items={article.faqItems} />
                )}

                {/* Internal Links */}
                {article.internalLinks && article.internalLinks.length > 0 && (
                  <div className="mt-10 p-6 bg-gray-50 rounded-xl not-prose">
                    <h3 className="font-bold text-gray-800 mb-3">📚 Related Reading on CoinDaily</h3>
                    <ul className="space-y-2">
                      {article.internalLinks.map((link, i) => {
                        const href = typeof link === 'string' ? link : link.url;
                        const text = typeof link === 'string' ? link : link.text;
                        return (
                          <li key={i}>
                            <Link href={href} className="text-orange-600 hover:text-orange-800 text-sm underline underline-offset-2">
                              {text} →
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Share & Tags */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Share:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`https://sygn.live/blog/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://sygn.live/blog/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {relatedArticles.map(ra => (
                    <Link
                      key={ra.id}
                      href={`/blog/${ra.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <span className="text-xs text-orange-500 font-medium">{ra.category}</span>
                      <h4 className="font-semibold text-gray-800 mt-1 group-hover:text-orange-600 transition line-clamp-2">
                        {ra.title}
                      </h4>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{ra.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>

      {/* JSON-LD: BlogPosting + FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.metaDescription,
            url: `https://sygn.live/blog/${article.slug}`,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            author: { '@type': 'Person', name: article.author },
            publisher: {
              '@type': 'Organization',
              name: 'CoinDaily',
              url: 'https://sygn.live',
              logo: { '@type': 'ImageObject', url: 'https://sygn.live/images/logo.svg' },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://sygn.live/blog/${article.slug}`,
            },
            wordCount: article.wordCount,
            articleSection: article.category,
            keywords: article.targetKeywords.join(', '),
            inLanguage: 'en',
            isAccessibleForFree: true,
          }),
        }}
      />
      {article.faqItems && article.faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: article.faqItems.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}
      {/* BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sygn.live' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://sygn.live/blog' },
              { '@type': 'ListItem', position: 3, name: article.title, item: `https://sygn.live/blog/${article.slug}` },
            ],
          }),
        }}
      />

      <Footer />
    </div>
  );
}
