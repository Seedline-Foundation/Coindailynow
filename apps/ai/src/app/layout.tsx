import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'CoinDaily AI System',
  description: 'AI Agent Orchestration and Content Generation Platform',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} font-sans bg-dark-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
