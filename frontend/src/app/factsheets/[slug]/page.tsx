import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Footer from '@/components/footer/Footer';
import { Header } from '@/components/landing';
import { factsheets, getFactsheet, getAllFactsheetSlugs, type EntityType } from '@/data/factsheets';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllFactsheetSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entity = getFactsheet(slug);
  if (!entity) return { title: 'Not Found' };

  const typeLabel =
    entity.type === 'cryptocurrency'
      ? 'Cryptocurrency'
      : entity.type === 'exchange'
        ? 'Exchange'
        : entity.type === 'company'
          ? 'Company'
          : 'Country';

  return {
    title: `${entity.name} (${entity.ticker || typeLabel}) — Factsheet`,
    description: `${entity.tagline}. ${entity.africanRelevance.slice(0, 120)}...`,
    openGraph: {
      title: `${entity.name} Factsheet — CoinDaily Africa`,
      description: entity.tagline,
      type: 'article',
    },
  };
}

const TYPE_STYLES: Record<EntityType, { badge: string; accent: string; glow: string }> = {
  cryptocurrency: {
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    accent: 'border-orange-500',
    glow: 'shadow-orange-500/10',
  },
  exchange: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    accent: 'border-blue-500',
    glow: 'shadow-blue-500/10',
  },
  company: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    accent: 'border-emerald-500',
    glow: 'shadow-emerald-500/10',
  },
  country: {
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    accent: 'border-purple-500',
    glow: 'shadow-purple-500/10',
  },
};

function JsonLd({ entity }: { entity: (typeof factsheets)[number] }) {
  const schema: Record<string, unknown> =
    entity.type === 'country'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Country',
          name: entity.name,
          description: entity.overview,
          url: `https://sygn.live/factsheets/${entity.slug}`,
        }
      : entity.type === 'exchange' || entity.type === 'company'
        ? {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: entity.name,
            description: entity.overview,
            url: entity.website,
            foundingDate: entity.founded,
            address: entity.headquarters ? { '@type': 'PostalAddress', addressLocality: entity.headquarters } : undefined,
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'Thing',
            name: entity.name,
            alternateName: entity.ticker,
            description: entity.overview,
            url: `https://sygn.live/factsheets/${entity.slug}`,
          };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export default async function FactsheetPage({ params }: Props) {
  const { slug } = await params;
  const entity = getFactsheet(slug);
  if (!entity) notFound();

  const styles = TYPE_STYLES[entity.type];
  const related = entity.relatedSlugs
    .map((s) => getFactsheet(s))
    .filter(Boolean) as (typeof factsheets)[number][];

  const typeLabel =
    entity.type === 'cryptocurrency'
      ? 'Cryptocurrency'
      : entity.type === 'exchange'
        ? 'Exchange'
        : entity.type === 'company'
          ? 'Company'
          : 'Country Profile';

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      <JsonLd entity={entity} />
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 font-mono">
          <Link href="/" className="hover:text-orange-400 transition-colors">
            Home
          </Link>
          <span className="mx-2 text-gray-700">/</span>
          <Link href="/factsheets" className="hover:text-orange-400 transition-colors">
            Factsheets
          </Link>
          <span className="mx-2 text-gray-700">/</span>
          <span className="text-gray-300">{entity.name}</span>
        </nav>

        {/* Header */}
        <div className={`bg-[#161b22] rounded-xl shadow-lg ${styles.glow} border-l-4 ${styles.accent} border border-gray-800 p-8 mb-8`}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{entity.name}</h1>
                {entity.ticker && (
                  <span className="text-lg font-mono text-gray-400 bg-gray-800 px-2.5 py-0.5 rounded">
                    {entity.ticker}
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-400">{entity.tagline}</p>
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${styles.badge}`}>
              {typeLabel}
            </span>
          </div>

          {/* Quick info row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 mt-4 font-mono">
            {entity.founded && (
              <span>
                <strong className="text-gray-300">Founded:</strong> {entity.founded}
              </span>
            )}
            {entity.headquarters && (
              <span>
                <strong className="text-gray-300">HQ:</strong> {entity.headquarters}
              </span>
            )}
            {entity.website && (
              <a
                href={entity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                {entity.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <section className="bg-[#161b22] rounded-xl border border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Overview</h2>
              <p className="text-gray-400 leading-relaxed">{entity.overview}</p>
            </section>

            {/* African Relevance */}
            <section className="bg-[#161b22] rounded-xl border border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                African Relevance
              </h2>
              <p className="text-gray-400 leading-relaxed">{entity.africanRelevance}</p>
            </section>

            {/* Regulatory Status */}
            {entity.regulatoryStatus && (
              <section className="bg-[#161b22] rounded-xl border border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
                  Regulatory Status
                </h2>
                <p className="text-gray-400 leading-relaxed">{entity.regulatoryStatus}</p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Key Statistics
              </h3>
              <dl className="space-y-3">
                {entity.keyStats.map((stat) => (
                  <div key={stat.label} className="flex justify-between border-b border-gray-800 pb-2 last:border-0">
                    <dt className="text-xs text-gray-500">{stat.label}</dt>
                    <dd className="text-xs font-medium text-white font-mono tabular-nums">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Related entities */}
            {related.length > 0 && (
              <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Related</h3>
                <ul className="space-y-2">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/factsheets/${r.slug}`}
                        className="flex items-center justify-between text-sm text-gray-400 hover:text-orange-400 transition-colors py-1"
                      >
                        <span>
                          {r.name}
                          {r.ticker && <span className="ml-1 text-gray-600 font-mono text-xs">{r.ticker}</span>}
                        </span>
                        <span className="text-gray-700">&#8594;</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#161b22] border border-orange-500/30 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400 mb-3">
            Want real-time data and deeper analysis on {entity.name}?
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-orange-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
