import { Metadata } from 'next';
import FAQPageClient from './FAQPageClient';

export const metadata: Metadata = {
  title: 'Cryptocurrency FAQ for Africa – All Your Crypto Questions Answered | CoinDaily',
  description: 'Comprehensive cryptocurrency FAQ for Africans. Learn about Bitcoin, exchanges, regulations, taxes, DeFi, wallets, and more — answered for the African market.',
  keywords: [
    'crypto FAQ Africa',
    'cryptocurrency questions African',
    'Bitcoin FAQ Nigeria',
    'how to buy crypto Africa',
    'crypto regulations Africa',
    'DeFi FAQ Africa',
    'crypto tax Africa',
  ],
  openGraph: {
    title: 'Cryptocurrency FAQ for Africa – All Your Questions Answered',
    description: 'Comprehensive crypto FAQ for Africans. Bitcoin, exchanges, regulations, taxes, DeFi, wallets, and more.',
    url: 'https://sygn.live/blog/faq',
    siteName: 'CoinDaily',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cryptocurrency FAQ for Africa',
    description: 'All your crypto questions answered — tailored for the African market.',
    creator: '@CoinDailyOnline',
  },
  alternates: { canonical: 'https://sygn.live/blog/faq' },
  robots: { index: true, follow: true },
};

export default function FAQPage() {
  return <FAQPageClient />;
}
