import { Suspense } from 'react';
import { Header } from '@/components/landing';
import MarqueeWrapper from '@/components/landing/MarqueeWrapper';
import TickerBar from '@/components/landing/TickerBar';
import Footer from '@/components/footer/Footer';
import LanguageBanner from '@/components/geo/LanguageBanner';
import HomepageDashboard from '@/components/home/HomepageDashboard';
import { countryCodeToRoute, routeToCountryCode } from '@/lib/geo';
import { cookies } from 'next/headers';

// Mock data for demonstration
const mockTrendingTokens = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.0,
    change24h: 1250.5,
    changePercent24h: 2.98,
    isHot: true,
    marketCap: 846000000000,
    volume24h: 24500000000,
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2650.75,
    change24h: -32.25,
    changePercent24h: -1.2,
    marketCap: 318000000000,
    volume24h: 12300000000,
  },
  {
    id: '3',
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.082,
    change24h: 0.0045,
    changePercent24h: 5.81,
    isHot: true,
    marketCap: 11800000000,
    volume24h: 890000000,
  },
  {
    id: '4',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    price: 0.000024,
    change24h: 0.0000012,
    changePercent24h: 5.26,
    isHot: true,
    marketCap: 14200000000,
    volume24h: 567000000,
  },
  {
    id: '5',
    symbol: 'PEPE',
    name: 'Pepe',
    price: 0.00000125,
    change24h: 0.000000087,
    changePercent24h: 7.48,
    isHot: true,
    marketCap: 525000000,
    volume24h: 234000000,
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams?: { country?: string; lang?: string };
}) {
  const params = searchParams || {};
  const cookieStore = await cookies();
  const countryCode = routeToCountryCode(params.country || cookieStore.get('country')?.value || 'ng');
  const countrySlug = countryCodeToRoute(countryCode);
  const languageCode = params.lang || cookieStore.get('lang')?.value || 'en';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showDateTime={true} />
      <LanguageBanner />

      <TickerBar />

      <div className="hidden">
        <MarqueeWrapper
          useDynamic={true}
          position="header"
          fallbackTokens={mockTrendingTokens}
          speed={60}
          showVolume={true}
        />
      </div>

      <HomepageDashboard 
        countryCode={countryCode}
        countrySlug={countrySlug}
        languageCode={languageCode}
      />
      <Footer />
    </div>
  );
}
