import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

// Font configurations
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

// SEO and PWA Metadata
export const metadata: Metadata = {
  title: {
    default: 'CoinDaily Africa - Premier Cryptocurrency News Platform',
    template: '%s | CoinDaily Africa'
  },
  description: 'Africa\'s premier cryptocurrency and memecoin news platform with AI-driven content generation, real-time market data from African exchanges, and community features. Stay informed with the latest crypto news from Nigeria, Kenya, South Africa, and Ghana.',
  keywords: [
    'cryptocurrency', 
    'bitcoin', 
    'ethereum', 
    'crypto news', 
    'africa', 
    'blockchain', 
    'memecoin',
    'binance africa',
    'luno',
    'quidax',
    'nigerian crypto',
    'kenyan crypto',
    'south african crypto',
    'ghanaian crypto',
    'm-pesa crypto',
    'mobile money cryptocurrency'
  ],
  authors: [{ name: 'CoinDaily Africa Team', url: 'https://coindaily.africa' }],
  creator: 'CoinDaily Africa',
  publisher: 'CoinDaily Africa',
  applicationName: 'CoinDaily Africa',
  category: 'Finance',
  classification: 'Cryptocurrency News Platform',
  
  // Open Graph
  openGraph: {
    type: 'website',
    siteName: 'CoinDaily Africa',
    title: 'CoinDaily Africa - Premier Cryptocurrency News Platform',
    description: 'Africa\'s premier cryptocurrency news platform with real-time market data and AI-driven content',
    url: 'https://coindaily.africa',
    countryName: 'Nigeria',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CoinDaily Africa - Cryptocurrency News Platform',
      }
    ],
    locale: 'en_US',
    alternateLocale: ['sw_KE', 'fr_SN', 'pt_AO', 'ar_EG'],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: '@coindailyafrica',
    creator: '@coindailyafrica',
    title: 'CoinDaily Africa - Premier Cryptocurrency News Platform',
    description: 'Africa\'s premier cryptocurrency news platform with real-time market data and AI-driven content',
    images: ['/twitter-image.png'],
  },
  
  // PWA Configuration
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CoinDaily Africa',
    startupImage: [
      {
        url: '/apple-splash-2048-2732.jpg',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-1668-2224.jpg',
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-1536-2048.jpg',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      }
    ],
  },
  
  // Additional meta tags
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'CoinDaily',
    'msapplication-TileColor': '#f97316',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#f97316',
  },
  
  // Robots and indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#ea580c' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to important domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.coindaily.africa" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#f97316" />
        
        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />
        
        {/* Performance hints */}
        <link rel="dns-prefetch" href="https://api.coindaily.africa" />
        <link rel="dns-prefetch" href="https://cdn.coindaily.africa" />
        
        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'CoinDaily Africa',
              alternateName: 'CoinDaily',
              url: 'https://coindaily.africa',
              description: 'Africa\'s premier cryptocurrency news platform',
              inLanguage: 'en-US',
              isAccessibleForFree: true,
              publisher: {
                '@type': 'Organization',
                name: 'CoinDaily Africa',
                url: 'https://coindaily.africa',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://coindaily.africa/logo.png'
                }
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://coindaily.africa/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      </head>
      <body 
        className={`${inter.className} font-sans antialiased bg-background text-neutral-900 selection:bg-primary-100 selection:text-primary-800`}
        suppressHydrationWarning
      >
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-500 text-white px-3 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          Skip to main content
        </a>
        
        {/* Main app content */}
        <div id="main-content" className="min-h-screen">
          {children}
        </div>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && 'PushManager' in window) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }).catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `
          }}
        />
        
        {/* Performance monitoring */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Core Web Vitals monitoring
                function sendToAnalytics(metric) {
                  // Send to your analytics endpoint
                  console.log('Web Vital:', metric.name, metric.value);
                }
                
                if ('web-vitals' in window) {
                  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                    getCLS(sendToAnalytics);
                    getFID(sendToAnalytics);
                    getFCP(sendToAnalytics);
                    getLCP(sendToAnalytics);
                    getTTFB(sendToAnalytics);
                  });
                }
              `
            }}
          />
        )}
      </body>
    </html>
  );
}