import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'Joy Token ($JY) - Africa\'s Premier Crypto Utility Token',
  description: 'Join the Joy Token presale. Real yield staking up to 70% APR. Deflationary tokenomics with 6M max supply. Powering CoinDaily\'s African crypto ecosystem.',
  keywords: 'Joy Token, JY Token, crypto presale, African crypto, staking rewards, deflationary token, real yield, CoinDaily',
  openGraph: {
    title: 'Joy Token ($JY) - Don\'t Miss the Presale',
    description: 'Limited supply. Real utility. Up to 70% staking APR. Join Africa\'s crypto revolution.',
    url: 'https://token.coindaily.online',
    siteName: 'Joy Token',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joy Token ($JY) - Presale Live',
    description: 'Real yield. Real utility. Limited to 6M tokens.',
    images: ['/twitter-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-black text-white`}>
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
