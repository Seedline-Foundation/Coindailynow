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
}: {
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
}) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{name}</h3>
          <span className="text-sm text-muted-foreground">{symbol}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-xl font-bold">${price.toLocaleString()}</div>
          <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground">Vol: {volume}</div>
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

export default function RealTimeAnalytics() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Real-Time Analytics Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitor live website traffic, user behavior, and trending content with real-time insights.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/analytics/detailed">
                <div className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Detailed Analytics
                </div>
              </Link>
              <Link href="/admin/analytics/reports">
                <div className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-medium hover:bg-secondary/90 transition-colors">
                  Generate Report
                </div>
              </Link>
            </div>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <Image 
              src="/images/CoinDaily_Logo.jpeg" 
              alt="Real-Time Analytics" 
              fill 
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Live Metrics */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Live Metrics</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live Updates</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                Currently browsing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5,678</div>
              <p className="text-xs text-muted-foreground">
                Last 30 minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">890</div>
              <p className="text-xs text-muted-foreground">
                Active sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32.1%</div>
              <p className="text-xs text-muted-foreground">
                Real-time rate
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trending Content */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Trending Now</h2>
          <Link href="/admin/content/trending" className="text-primary hover:underline">
            View All Trending
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Trending Articles</h3>
            <div className="space-y-4">
              <SimpleNewsCard 
                title="Major Bitcoin Whale Movement Detected"
                excerpt="Large-scale Bitcoin transactions spotted on-chain, indicating potential market movement ahead."
                category="Breaking"
                date="Live"
                slug="/admin/content/bitcoin-whale-movement"
              />
              <SimpleNewsCard 
                title="New DeFi Protocol Launches Today"
                excerpt="Revolutionary DeFi platform promises 20% APY with innovative staking mechanisms."
                category="DeFi"
                date="2 min ago"
                slug="/admin/content/new-defi-protocol"
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Trending Cryptocurrencies</h3>
            <div className="space-y-4">
              <SimpleCoinCard 
                name="Bitcoin"
                symbol="BTC"
                price={65432}
                change={2.45}
                volume="$2.1B"
              />
              <SimpleCoinCard 
                name="Ethereum"
                symbol="ETH"
                price={3456}
                change={-1.23}
                volume="$1.8B"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Geographic Distribution */}
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-6">Geographic Distribution</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>United States</span>
                  <span className="font-medium">34%</span>
                </div>
                <div className="flex justify-between">
                  <span>Nigeria</span>
                  <span className="font-medium">18%</span>
                </div>
                <div className="flex justify-between">
                  <span>United Kingdom</span>
                  <span className="font-medium">12%</span>
                </div>
                <div className="flex justify-between">
                  <span>Germany</span>
                  <span className="font-medium">8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Others</span>
                  <span className="font-medium">28%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Mobile</span>
                  <span className="font-medium">58%</span>
                </div>
                <div className="flex justify-between">
                  <span>Desktop</span>
                  <span className="font-medium">32%</span>
                </div>
                <div className="flex justify-between">
                  <span>Tablet</span>
                  <span className="font-medium">10%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Direct</span>
                  <span className="font-medium">42%</span>
                </div>
                <div className="flex justify-between">
                  <span>Google Search</span>
                  <span className="font-medium">28%</span>
                </div>
                <div className="flex justify-between">
                  <span>Social Media</span>
                  <span className="font-medium">18%</span>
                </div>
                <div className="flex justify-between">
                  <span>Referrals</span>
                  <span className="font-medium">12%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Browser Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Chrome</span>
                  <span className="font-medium">54%</span>
                </div>
                <div className="flex justify-between">
                  <span>Safari</span>
                  <span className="font-medium">22%</span>
                </div>
                <div className="flex justify-between">
                  <span>Firefox</span>
                  <span className="font-medium">12%</span>
                </div>
                <div className="flex justify-between">
                  <span>Edge</span>
                  <span className="font-medium">8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Others</span>
                  <span className="font-medium">4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Performance Summary */}
      <section className="py-12 bg-muted rounded-lg p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Real-Time Performance Summary</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,234</div>
              <div className="text-lg font-medium mb-2">Active Users</div>
              <div className="text-sm text-muted-foreground">Currently online</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">5,678</div>
              <div className="text-lg font-medium mb-2">Page Views</div>
              <div className="text-sm text-muted-foreground">Last 30 minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">890</div>
              <div className="text-lg font-medium mb-2">Active Sessions</div>
              <div className="text-sm text-muted-foreground">Live interactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">32.1%</div>
              <div className="text-lg font-medium mb-2">Bounce Rate</div>
              <div className="text-sm text-muted-foreground">Real-time metric</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
