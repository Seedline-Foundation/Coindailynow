import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://press.coindaily.online'),
  title: 'SENDPRESS - PR Distribution Network by CoinDaily',
  description: 'Africa\'s largest automated PR distribution network. Distribute press releases to targeted websites with blockchain payments and AI verification.',
  keywords: ['PR', 'press release', 'distribution', 'crypto', 'JOY token', 'blockchain', 'Africa', 'SENDPRESS'],
  openGraph: {
    title: 'SENDPRESS - PR Distribution Network',
    description: 'Instant PR distribution to targeted websites. Automated payments via JOY token. AI-powered verification.',
    url: 'https://press.coindaily.online',
    siteName: 'SENDPRESS',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-dark-950 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
