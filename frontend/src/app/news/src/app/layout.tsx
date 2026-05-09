import type { Metadata } from 'next';
import './globals.css';
import { GeoProvider } from '@/lib/GeoContext';
import LanguageBannerComponent from './components/LanguageBanner';
import LanguageSwitcher from './components/LanguageSwitcher';

export const metadata: Metadata = {
  metadataBase: new URL('https://coindaily.online'),
  title: 'CoinDaily - Africa\'s Premier Crypto News',
  description: 'Real-time cryptocurrency and memecoin news for Africa. Bitcoin, Ethereum, DeFi, and Web3 coverage with market data from Binance Africa, Luno, and Quidax.',
  keywords: ['cryptocurrency', 'crypto news', 'africa', 'bitcoin', 'memecoin', 'defi', 'web3', 'luno', 'quidax'],
  openGraph: {
    title: 'CoinDaily - Africa\'s Premier Crypto News',
    description: 'Real-time cryptocurrency news and market data for the African market.',
    siteName: 'CoinDaily',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-950">
        <GeoProvider>
          {/* Header */}
          <Header />

          {/* Language Banner — shows alternatives based on user IP */}
          <LanguageBannerComponent />

          {/* Main Content */}
          <main className="min-h-[80vh]">{children}</main>

          {/* Footer */}
          <Footer />
        </GeoProvider>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-md border-b border-dark-800">
      {/* Top bar - trending ticker */}
      <div className="bg-dark-900 border-b border-dark-800 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs overflow-hidden">
          <span className="text-primary-400 font-semibold shrink-0">TRENDING</span>
          <div className="flex gap-4 text-gray-400 overflow-x-auto whitespace-nowrap">
            <span>BTC $67,234</span>
            <span>ETH $3,456</span>
            <span>BNB $612</span>
            <span>SOL $148</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-dark-950 font-bold text-lg">
            C
          </div>
          <span className="font-display font-bold text-xl text-white">
            Coin<span className="text-primary-400">Daily</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="text-sm text-gray-300 hover:text-primary-400 transition-colors">Home</a>
          <a href="/category/bitcoin" className="text-sm text-gray-300 hover:text-primary-400 transition-colors">Bitcoin</a>
          <a href="/category/altcoins" className="text-sm text-gray-300 hover:text-primary-400 transition-colors">Altcoins</a>
          <a href="/category/defi" className="text-sm text-gray-300 hover:text-primary-400 transition-colors">DeFi</a>
          <a href="/category/nft" className="text-sm text-gray-300 hover:text-primary-400 transition-colors">NFT</a>
          <a href="/category/regulation" className="text-sm text-gray-300 hover:text-primary-400 transition-colors">Regulation</a>
          <a href="/category/africa" className="text-sm text-gray-300 hover:text-primary-400 transition-colors">Africa</a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a href="/search" className="p-2 rounded-lg hover:bg-dark-800 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-dark-950 font-bold">
                C
              </div>
              <span className="font-display font-bold text-lg text-white">
                Coin<span className="text-primary-400">Daily</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Africa&apos;s premier cryptocurrency news platform. Real-time market data, expert analysis, and AI-powered insights.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">News</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/category/bitcoin" className="hover:text-primary-400 transition-colors">Bitcoin</a></li>
              <li><a href="/category/altcoins" className="hover:text-primary-400 transition-colors">Altcoins</a></li>
              <li><a href="/category/defi" className="hover:text-primary-400 transition-colors">DeFi</a></li>
              <li><a href="/category/regulation" className="hover:text-primary-400 transition-colors">Regulation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Africa Focus</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/category/nigeria" className="hover:text-primary-400 transition-colors">Nigeria</a></li>
              <li><a href="/category/kenya" className="hover:text-primary-400 transition-colors">Kenya</a></li>
              <li><a href="/category/south-africa" className="hover:text-primary-400 transition-colors">South Africa</a></li>
              <li><a href="/category/ghana" className="hover:text-primary-400 transition-colors">Ghana</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/about" className="hover:text-primary-400 transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-primary-400 transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-dark-800 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} CoinDaily. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
