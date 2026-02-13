import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'CoinDaily Press - PR & Ad Distribution Network',
  description: 'Web3 PR and advertising distribution platform powered by $COIN token',
  keywords: ['PR', 'advertising', 'crypto', 'web3', 'press release', 'distribution'],
  openGraph: {
    title: 'CoinDaily Press - PR & Ad Distribution Network',
    description: 'Web3 PR and advertising distribution platform powered by $COIN token',
    url: 'https://press.coindaily.online',
    siteName: 'CoinDaily Press',
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
      <body className={`${inter.variable} ${jakarta.variable} font-sans bg-dark-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
