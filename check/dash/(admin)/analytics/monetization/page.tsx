import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simple version of CoinCard that doesn't cause Server Component issues
function SimpleCoinCard({
  name,
  symbol,
  price,
  change,
  volume,
  marketCap,
}: {
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
  marketCap: string;
}) {
  const isPositive = change >= 0;
  
  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">{name}</h3>
            <p className="text-sm text-muted-foreground">{symbol}</p>
          </div>
          <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <span className="font-medium">{isPositive ? '+' : ''}{change}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Price:</span>
            <span className="font-medium">${price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Volume:</span>
            <span className="text-sm">{volume}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Market Cap:</span>
            <span className="text-sm">{marketCap}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple version of NewsCard that doesn't cause Server Component issues
function SimpleNewsCard({
  title,
  excerpt,
  category,
  date,
  slug,
}: {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  slug: string;
}) {
  return (
    <Link href={slug}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">{category}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <h3 className="font-bold text-lg leading-tight">{title}</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MonetizationAnalytics() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Monetization Analytics Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Track revenue streams, subscription metrics, and monetization performance across all channels.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/analytics/revenue">
                <div className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Revenue Reports
                </div>
              </Link>
              <Link href="/admin/analytics/subscriptions">
                <div className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-medium hover:bg-secondary/90 transition-colors">
                  Subscription Analytics
                </div>
              </Link>
            </div>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <Image 
              src="/images/CoinDaily_Logo.jpeg" 
              alt="Monetization Analytics" 
              fill 
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Revenue Metrics */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Revenue Performance</h2>
          <Link href="/admin/analytics/revenue" className="text-primary hover:underline">
            View Detailed Reports
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ad Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$32,234</div>
              <p className="text-xs text-muted-foreground">
                +15.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$8,997</div>
              <p className="text-xs text-muted-foreground">
                +12.4% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$4,000</div>
              <p className="text-xs text-muted-foreground">
                +25.2% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Top Performing Content */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top Revenue Generating Content</h2>
          <Link href="/admin/analytics/content" className="text-primary hover:underline">
            View All Content Analytics
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SimpleNewsCard 
            title="Premium Bitcoin Analysis - Q4 2024 Report"
            excerpt="Comprehensive quarterly analysis driving highest subscription conversions and premium content engagement."
            category="Premium"
            date="2 hours ago"
            slug="/admin/content/bitcoin-q4-analysis"
          />
          <SimpleNewsCard 
            title="Sponsored Memecoin Deep Dive: Top 10 Projects"
            excerpt="Partner-sponsored content generating significant advertising revenue and affiliate commissions."
            category="Sponsored"
            date="5 hours ago"
            slug="/admin/content/memecoin-sponsored-review"
          />
          <SimpleNewsCard 
            title="Service Spotlight: Professional Portfolio Analysis"
            excerpt="Featured service content that drives direct service bookings and consultation requests."
            category="Services"
            date="1 day ago"
            slug="/admin/content/portfolio-analysis-service"
          />
        </div>
      </section>

      {/* Top Revenue Generating Coins */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">High-Value Market Coverage</h2>
          <Link href="/admin/analytics/market" className="text-primary hover:underline">
            View Market Analytics
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SimpleCoinCard 
            name="Bitcoin"
            symbol="BTC"
            price={67000}
            change={3.5}
            volume="$52.2B"
            marketCap="$1.3T"
          />
          <SimpleCoinCard 
            name="Ethereum"
            symbol="ETH"
            price={3800}
            change={2.8}
            volume="$28.5B"
            marketCap="$456B"
          />
          <SimpleCoinCard 
            name="Solana"
            symbol="SOL"
            price={245}
            change={8.2}
            volume="$12.7B"
            marketCap="$112B"
          />
          <SimpleCoinCard 
            name="Chainlink"
            symbol="LINK"
            price={28}
            change={5.1}
            volume="$2.8B"
            marketCap="$16B"
          />
        </div>
      </section>

      {/* Monetization Strategy Overview */}
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-6">Revenue Stream Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h3 className="font-bold mb-3">Advertising</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/analytics/ads/display" className="text-primary font-medium hover:underline">Display Advertising</Link></li>
              <li><Link href="/admin/analytics/ads/sponsored" className="text-muted-foreground hover:text-primary">Sponsored Content</Link></li>
              <li><Link href="/admin/analytics/ads/affiliate" className="text-muted-foreground hover:text-primary">Affiliate Programs</Link></li>
              <li><Link href="/admin/analytics/ads/newsletter" className="text-muted-foreground hover:text-primary">Newsletter Sponsorship</Link></li>
              <li><Link href="/admin/analytics/ads/social" className="text-muted-foreground hover:text-primary">Social Media Ads</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Subscriptions</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/analytics/subs/premium" className="text-primary font-medium hover:underline">Premium Content</Link></li>
              <li><Link href="/admin/analytics/subs/newsletter" className="text-muted-foreground hover:text-primary">Newsletter Premium</Link></li>
              <li><Link href="/admin/analytics/subs/analytics" className="text-muted-foreground hover:text-primary">Analytics Access</Link></li>
              <li><Link href="/admin/analytics/subs/alerts" className="text-muted-foreground hover:text-primary">Price Alerts</Link></li>
              <li><Link href="/admin/analytics/subs/research" className="text-muted-foreground hover:text-primary">Research Reports</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/analytics/services/consulting" className="text-primary font-medium hover:underline">Consulting</Link></li>
              <li><Link href="/admin/analytics/services/research" className="text-muted-foreground hover:text-primary">Custom Research</Link></li>
              <li><Link href="/admin/analytics/services/writing" className="text-muted-foreground hover:text-primary">Content Writing</Link></li>
              <li><Link href="/admin/analytics/services/listings" className="text-muted-foreground hover:text-primary">Coin Listings</Link></li>
              <li><Link href="/admin/analytics/services/partnerships" className="text-muted-foreground hover:text-primary">Partnerships</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Affiliate Revenue</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/analytics/affiliate/exchanges" className="text-primary font-medium hover:underline">Exchange Referrals</Link></li>
              <li><Link href="/admin/analytics/affiliate/wallets" className="text-muted-foreground hover:text-primary">Wallet Referrals</Link></li>
              <li><Link href="/admin/analytics/affiliate/tools" className="text-muted-foreground hover:text-primary">Trading Tools</Link></li>
              <li><Link href="/admin/analytics/affiliate/courses" className="text-muted-foreground hover:text-primary">Educational Courses</Link></li>
              <li><Link href="/admin/analytics/affiliate/products" className="text-muted-foreground hover:text-primary">Product Reviews</Link></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Performance Summary */}
      <section className="py-12 bg-muted rounded-lg p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Monetization Performance Summary</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$45.2K</div>
              <div className="text-lg font-medium mb-2">Monthly Revenue</div>
              <div className="text-sm text-muted-foreground">20.1% increase from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,234</div>
              <div className="text-lg font-medium mb-2">Premium Subscribers</div>
              <div className="text-sm text-muted-foreground">15.3% growth in subscription base</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$36.70</div>
              <div className="text-lg font-medium mb-2">Average Revenue Per User</div>
              <div className="text-sm text-muted-foreground">12.4% improvement in ARPU</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
