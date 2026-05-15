import type { Metadata } from 'next';
import WireFeed from './WireFeed';

export const metadata: Metadata = {
  title: 'Wire | SENDPRESS — Real-Time Press Release Feed',
  description:
    'Live wire feed of crypto and fintech press releases across Africa. Filter by industry, country, and asset class. The BusinessWire of African crypto.',
  openGraph: {
    title: 'SENDPRESS Wire — Real-Time Press Releases',
    description:
      'Live wire feed of crypto and fintech press releases across Africa.',
    url: 'https://press.coindaily.online/wire',
    siteName: 'SENDPRESS',
    type: 'website',
  },
};

export default function WirePage() {
  return <WireFeed />;
}
