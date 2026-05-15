import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/footer/Footer';
import { factsheets, type EntityType } from '@/data/factsheets';

export const metadata: Metadata = {
  title: 'Factsheets — Crypto, Exchanges, Markets & Countries',
  description:
    'Bloomberg-style factsheets for the cryptocurrencies, exchanges, companies, and countries shaping Africa’s digital finance landscape.',
  openGraph: {
    title: 'CoinDaily Factsheets',
    description: 'In-depth profiles of the entities shaping African crypto and finance.',
  },
};

const TYPE_META: Record<EntityType, { heading: string; color: string; bg: string }> = {
  cryptocurrency: { heading: 'Cryptocurrencies', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  exchange: { heading: 'Exchanges', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  company: { heading: 'Companies & Telcos', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  country: { heading: 'Country Profiles', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

const SECTIONS: EntityType[] = ['cryptocurrency', 'exchange', 'company', 'country'];

function Badge({ type }: { type: EntityType }) {
  const m = TYPE_META[type];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${m.bg} ${m.color}`}>
      {type === 'cryptocurrency' ? 'Crypto' : type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

export default function FactsheetsIndex() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Factsheets</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            In-depth profiles of the cryptocurrencies, exchanges, companies, and countries driving Africa's digital
            finance revolution.
          </p>
        </div>

        {SECTIONS.map((type) => {
          const items = factsheets.filter((f) => f.type === type);
          const meta = TYPE_META[type];
          return (
            <section key={type} className="mb-12">
              <h2 className={`text-xl font-semibold mb-4 ${meta.color}`}>{meta.heading}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((entity) => (
                  <Link
                    key={entity.slug}
                    href={`/factsheets/${entity.slug}`}
                    className="group block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {entity.name}
                        {entity.ticker && (
                          <span className="ml-1.5 text-sm font-mono text-gray-400">{entity.ticker}</span>
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
