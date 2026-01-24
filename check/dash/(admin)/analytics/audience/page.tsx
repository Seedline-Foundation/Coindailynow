import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AudienceAnalytics() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Audience Analytics</h1>
        <p className="text-muted-foreground mt-2">Track user engagement and demographics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,231</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-muted-foreground">
              +15.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4m 32s</div>
            <p className="text-xs text-muted-foreground">
              +2.4% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.1%</div>
            <p className="text-xs text-muted-foreground">
              -5.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Nigeria</span>
                <span className="font-medium">34.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>South Africa</span>
                <span className="font-medium">22.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Kenya</span>
                <span className="font-medium">18.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Ghana</span>
                <span className="font-medium">12.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Others</span>
                <span className="font-medium">12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>18-24</span>
                <span className="font-medium">28.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>25-34</span>
                <span className="font-medium">41.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>35-44</span>
                <span className="font-medium">18.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>45-54</span>
                <span className="font-medium">7.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>55+</span>
                <span className="font-medium">3.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Article: &quot;Bitcoin Reaches New ATH&quot;</p>
                <p className="text-sm text-muted-foreground">1,234 views in last hour</p>
              </div>
              <span className="text-sm text-green-600">+15.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Market Page: Trending Coins</p>
                <p className="text-sm text-muted-foreground">892 views in last hour</p>
              </div>
              <span className="text-sm text-green-600">+8.7%</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Services: List Memecoins</p>
                <p className="text-sm text-muted-foreground">567 views in last hour</p>
              </div>
              <span className="text-sm text-red-600">-2.1%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Direct</span>
              <span className="font-medium">42.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Search Engines</span>
              <span className="font-medium">28.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Social Media</span>
              <span className="font-medium">15.7%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Referrals</span>
              <span className="font-medium">8.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Email</span>
              <span className="font-medium">4.7%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
