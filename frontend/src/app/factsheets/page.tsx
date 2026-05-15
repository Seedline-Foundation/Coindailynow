import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/footer/Footer';
import { Header } from '@/components/landing';
import { factsheets, type EntityType } from '@/data/factsheets';

export const metadata: Metadata = {
  title: 'Factsheets — Crypto, Exchanges, Markets & Countries',
  description:
    'Bloomberg-style factsheets for the cryptocurrencies, exchanges, companies, and countries shaping Africa\'s digital finance landscape.',
  openGraph: {
    title: 'CoinDaily Factsheets',
    description: 'In-depth profiles of the entities shaping African crypto and finance.',
  },
};

const TYPE_META: Record<EntityType, { heading: string; color: string; border: string; badge: string }> = {
  cryptocurrency: {
    heading: 'Cryptocurrencies',
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  exchange: {
    heading: 'Exchanges',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  company: {
    heading: 'Companies & Telcos',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  country: {
    heading: 'Country Profiles',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
};

const SECTIONS: EntityType[] = ['cryptocurrency', 'exchange', 'company', 'country'];

function Badge({ type }: { type: EntityType }) {
  const m = TYPE_META[type];
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${m.badge}`}>
      {type === 'cryptocurrency' ? 'Crypto' : type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

export default function FactsheetsIndex() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-orange-500 rounded-full" />
            <h1 className="text-3xl font-bold text-white">Factsheets</h1>
          </div>
          <p className="mt-2 text-gray-400 max-w-2xl">
            In-depth profiles of the cryptocurrencies, exchanges, companies, and countries driving Africa&#39;s digital
            finance revolution.
          </p>
        </div>

        {SECTIONS.map((type) => {
          const items = factsheets.filter((f) => f.type === type);
          const meta = TYPE_META[type];
          return (
            <section key={type} className="mb-12">
              <h2 className={`text-lg font-semibold mb-4 ${meta.color} flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full bg-current`} />
                {meta.heading}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((entity) => (
                  <Link
                    key={entity.slug}
                    href={`/factsheets/${entity.slug}`}
                    className={`group block bg-[#161b22] rounded-lg border ${meta.border} p-5 hover:bg-[#1c2128] hover:border-orange-500/50 transition-all`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                        {entity.name}
                        {entity.ticker && (
                          <span className="ml-1.5 text-sm font-mono text-gray-500">{entity.ticker}</span>
                        )}
                      </h3>
                      <Badge type={entity.type} />
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{entity.tagline}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <Footer />
    </div>
  );
}
