import { Metadata } from 'next';
import ComparisonPageClient from './ComparisonPageClient';

export const metadata: Metadata = {
  title: 'Best Cryptocurrency News Platforms in Africa 2025 – Comparison | CoinDaily',
  description: 'Compare Africa\'s top crypto news platforms side-by-side. CoinDaily vs CoinDesk vs CoinTelegraph vs Bitcoin.ng vs Cryptotvplus — features, pricing, African coverage, and languages.',
  keywords: [
    'best crypto news platform Africa',
    'crypto news comparison',
    'CoinDaily vs CoinDesk',
    'African cryptocurrency news',
    'crypto news platforms compared',
    'cryptocurrency news Africa 2025',
  ],
  openGraph: {
    title: 'Best Cryptocurrency News Platforms in Africa 2025 – Comparison',
    description: 'Compare Africa\'s top crypto news platforms side-by-side. Features, pricing, African coverage, and language support.',
    url: 'https://coindaily.online/blog/comparison',
    siteName: 'CoinDaily',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Crypto News Platforms in Africa – Comparison',
    description: 'Compare Africa\'s top crypto news platforms. CoinDaily vs CoinDesk vs CoinTelegraph and more.',
    creator: '@CoinDailyOnline',
  },
  alternates: { canonical: 'https://coindaily.online/blog/comparison' },
  robots: { index: true, follow: true },
};

export default function ComparisonPage() {
  return <ComparisonPageClient />;
}
