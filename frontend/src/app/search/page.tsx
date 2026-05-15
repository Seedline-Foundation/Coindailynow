import type { Metadata } from 'next';
import { Header } from '@/components/landing';
import Footer from '@/components/footer/Footer';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Search | CoinDaily Africa',
  description:
    'Search across articles, factsheets, regulations, and market data on CoinDaily Africa.',
  robots: { index: false }, // search results pages shouldn't be indexed
};

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string; country?: string; lang?: string; page?: string };
}) {
  const params = searchParams || {};

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      <Header />
      <SearchClient
        initialQuery={params.q || ''}
        initialCategory={params.category || ''}
        initialCountry={params.country || ''}
        initialLang={params.lang || ''}
        initialPage={parseInt(params.page || '1') || 1}
      />
      <Footer />
    </div>
  );
}
