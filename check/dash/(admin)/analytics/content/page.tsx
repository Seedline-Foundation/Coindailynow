import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function ContentAnalytics() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Content Performance Analytics
            </h1>
            <p className="text-lg text-muted-foreground">
              Track article performance, engagement metrics, and content strategy insights across all categories.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/content/create">
                <div className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Create Content
                </div>
              </Link>
              <Link href="/admin/content/trending">
                <div className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-medium hover:bg-secondary/90 transition-colors">
                  Trending Articles
                </div>
              </Link>
            </div>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <Image 
              src="/images/CoinDaily_Logo.jpeg" 
              alt="Content Analytics" 
              fill 
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Content Performance Metrics */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <Link href="/admin/analytics/content/detailed" className="text-primary hover:underline">
            View Detailed Analytics
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,341</div>
              <p className="text-xs text-muted-foreground">
                +23 this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +15.3% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7%</div>
              <p className="text-xs text-muted-foreground">
                +0.8% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Read Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3m 45s</div>
              <p className="text-xs text-muted-foreground">
                +12s from last week
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Top Performing Articles */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top Performing Content</h2>
          <Link href="/admin/content/all" className="text-primary hover:underline">
            View All Articles
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SimpleNewsCard 
            title="Bitcoin Reaches New All-Time High"
            excerpt="Bitcoin has surpassed its previous record, reaching a new all-time high amid increased institutional adoption and growing mainstream acceptance."
            category="Breaking"
            date="2 hours ago"
            slug="/admin/content/bitcoin-new-ath"
          />
          <SimpleNewsCard 
            title="Ethereum Upgrade Scheduled for Next Month"
            excerpt="The Ethereum network is preparing for its next major upgrade, promising improved scalability and reduced gas fees for users."
            category="Updates"
            date="5 hours ago"
            slug="/admin/content/ethereum-upgrade"
          />
          <SimpleNewsCard 
            title="New Regulations Impact Crypto Exchanges"
            excerpt="Recent regulatory changes are forcing cryptocurrency exchanges to adapt their compliance procedures and enhance security measures."
            category="Policy"
            date="1 day ago"
            slug="/admin/content/regulations-impact"
          />
        </div>
      </section>

      {/* Content Categories Performance */}
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-6">Category Performance Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h3 className="font-bold mb-3">Breaking News</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/content/category/breaking" className="text-primary font-medium hover:underline">All Breaking News</Link></li>
              <li><Link href="/admin/content/breaking/bitcoin" className="text-muted-foreground hover:text-primary">Bitcoin Updates</Link></li>
              <li><Link href="/admin/content/breaking/market" className="text-muted-foreground hover:text-primary">Market Movements</Link></li>
              <li><Link href="/admin/content/breaking/regulatory" className="text-muted-foreground hover:text-primary">Regulatory News</Link></li>
              <li><Link href="/admin/content/breaking/partnerships" className="text-muted-foreground hover:text-primary">Partnership Announcements</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Market Analysis</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/content/category/analysis" className="text-primary font-medium hover:underline">All Analysis</Link></li>
              <li><Link href="/admin/content/analysis/technical" className="text-muted-foreground hover:text-primary">Technical Analysis</Link></li>
              <li><Link href="/admin/content/analysis/fundamental" className="text-muted-foreground hover:text-primary">Fundamental Analysis</Link></li>
              <li><Link href="/admin/content/analysis/trends" className="text-muted-foreground hover:text-primary">Market Trends</Link></li>
              <li><Link href="/admin/content/analysis/predictions" className="text-muted-foreground hover:text-primary">Price Predictions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Educational Content</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/content/category/education" className="text-primary font-medium hover:underline">All Educational</Link></li>
              <li><Link href="/admin/content/education/beginners" className="text-muted-foreground hover:text-primary">Beginner Guides</Link></li>
              <li><Link href="/admin/content/education/advanced" className="text-muted-foreground hover:text-primary">Advanced Topics</Link></li>
              <li><Link href="/admin/content/education/security" className="text-muted-foreground hover:text-primary">Security Guides</Link></li>
              <li><Link href="/admin/content/education/trading" className="text-muted-foreground hover:text-primary">Trading Tutorials</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Memecoin Coverage</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin/content/category/memecoins" className="text-primary font-medium hover:underline">All Memecoins</Link></li>
              <li><Link href="/admin/content/memecoins/launches" className="text-muted-foreground hover:text-primary">New Launches</Link></li>
              <li><Link href="/admin/content/memecoins/trending" className="text-muted-foreground hover:text-primary">Trending Memecoins</Link></li>
              <li><Link href="/admin/content/memecoins/analysis" className="text-muted-foreground hover:text-primary">Memecoin Analysis</Link></li>
              <li><Link href="/admin/content/memecoins/alerts" className="text-muted-foreground hover:text-primary">Scam Alerts</Link></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Performance Summary */}
      <section className="py-12 bg-muted rounded-lg p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Content Performance Summary</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">2,341</div>
              <div className="text-lg font-medium mb-2">Total Published Articles</div>
              <div className="text-sm text-muted-foreground">23 new articles this week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1.2M</div>
              <div className="text-lg font-medium mb-2">Total Page Views</div>
              <div className="text-sm text-muted-foreground">15.3% increase from last week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">4.7%</div>
              <div className="text-lg font-medium mb-2">Average Engagement Rate</div>
              <div className="text-sm text-muted-foreground">0.8% improvement this week</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}