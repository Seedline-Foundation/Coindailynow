import { Metadata } from 'next';
import BlogPageClient from './BlogPageClient';

export const metadata: Metadata = {
  title: 'Blog — CoinDaily Africa',
  description: 'Expert cryptocurrency insights, guides, and analysis for Africa. Learn about Bitcoin, DeFi, NFTs, regulations, and more across 15+ African languages.',
  keywords: ['crypto blog africa', 'bitcoin blog nigeria', 'cryptocurrency guide africa', 'defi africa', 'crypto news africa'],
  openGraph: {
    title: 'CoinDaily Blog — Africa\'s #1 Crypto Knowledge Hub',
    description: 'Expert cryptocurrency insights, guides, and analysis for the African market. 20+ pillar articles covering Bitcoin, DeFi, exchanges, regulations, and more.',
    url: 'https://coindaily.online/blog',
    siteName: 'CoinDaily',
    type: 'website',
    images: [{ url: '/images/og/blog.webp', width: 1200, height: 630, alt: 'CoinDaily Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoinDaily Blog — Africa\'s #1 Crypto Knowledge Hub',
    description: 'Expert cryptocurrency insights, guides, and analysis for the African market.',
  },
  alternates: {
    canonical: 'https://coindaily.online/blog',
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
