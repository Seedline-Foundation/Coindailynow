'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Mail, 
  Bell, 
  Brain,
  TrendingUp,
  BarChart3,
  Settings
} from 'lucide-react';

// Import our components
import { SocialFeed } from '@/components/ui/social-feed';
import { NewsletterSignup, NewsletterManagement } from '@/components/ui/newsletter';
import { PushNotificationManager, NotificationComposer } from '@/components/ui/push-notifications';
import { AIEngagementDashboard } from '@/components/ui/ai-engagement';
import type { NewsletterSubscription } from '@/types/social';

// Mock admin data
const MOCK_ADMIN_STATS = {
  totalUsers: 45680,
  activeSubscribers: 12450,
  totalComments: 3420,
  pendingModeration: 23,
  socialShares: 8970,
  engagementRate: 4.2,
  pushNotificationsSent: 150,
  newslettersSent: 12
};

const MOCK_NEWSLETTER_SUBSCRIPTION: NewsletterSubscription = {
  id: 'sub-123',
  email: 'admin@coindaily.news',
  name: 'Admin User',
  isActive: true,
  frequency: 'daily',
  categories: ['breaking-news', 'market-analysis'],
  preferences: {
    frequency: 'daily',
    categories: ['breaking-news', 'market-analysis', 'memecoin-trends'],
    format: 'html'
  },
  status: 'active',
  subscribedAt: new Date().toISOString()
};

const MOCK_NOTIFICATION_SETTINGS = {
  enabled: true,
  types: {
    'breaking-news': true,
    'price-alerts': true,
    'market-updates': true,
    'new-articles': true
  },
  quietHours: {
    start: '23:00',
    end: '07:00'
  },
  maxDaily: 50
};

export default function AdminSocialManagement() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Management</h1>
          <p className="text-gray-600 mt-2">
            Manage social engagement, newsletters, and user communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-100 text-green-800">
            System Online
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.activeSubscribers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Subscribers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.totalComments.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Comments</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.pendingModeration}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Share2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.socialShares.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Shares</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.engagementRate}%</div>
            <div className="text-sm text-gray-600">Engagement</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.pushNotificationsSent}</div>
            <div className="text-sm text-gray-600">Push Sent</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{MOCK_ADMIN_STATS.newslettersSent}</div>
            <div className="text-sm text-gray-600">Newsletters</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="social-feed" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Social Feed
          </TabsTrigger>
          <TabsTrigger value="newsletters" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Newsletters
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Push Notifications
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Social Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Share2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Bitcoin ETF article shared 450 times</div>
                        <div className="text-xs text-gray-600">2 hours ago</div>
                      </div>
                    </div>
                    <Badge variant="default">High</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-sm">125 new comments on DeFi analysis</div>
                        <div className="text-xs text-gray-600">4 hours ago</div>
                      </div>
                    </div>
                    <Badge variant="secondary">Medium</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-sm">Weekly newsletter sent to 12,450 subscribers</div>
                        <div className="text-xs text-gray-600">1 day ago</div>
                      </div>
                    </div>
                    <Badge variant="outline">Success</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Social Shares</span>
                      <span className="font-medium">+15.3%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Comments</span>
                      <span className="font-medium">+8.7%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Newsletter Opens</span>
                      <span className="font-medium">+12.1%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Push Engagement</span>
                      <span className="font-medium">+22.4%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social-feed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Social Media Feed</CardTitle>
                <p className="text-sm text-gray-600">
                  Monitor mentions and content from all platforms
                </p>
              </CardHeader>
              <CardContent>
                <SocialFeed
                  platforms={['twitter', 'youtube', 'telegram']}
                  maxPosts={8}
                  refreshInterval={30000}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Twitter Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">YouTube Views</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <span className="text-sm font-medium">72%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Telegram Activity</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Facebook Reach</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-800 h-2 rounded-full" style={{ width: '54%' }}></div>
                      </div>
                      <span className="text-sm font-medium">54%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="newsletters" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NewsletterSignup
              showCategories={true}
              showFrequency={true}
            />
            <NewsletterManagement
              subscription={MOCK_NEWSLETTER_SUBSCRIPTION}
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NotificationComposer />
            <PushNotificationManager
              settings={MOCK_NOTIFICATION_SETTINGS}
            />
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <AIEngagementDashboard userId="admin" />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-sharing</div>
                      <div className="text-sm text-gray-600">Automatically share new articles</div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Comment Moderation</div>
                      <div className="text-sm text-gray-600">Require approval for new comments</div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">AI Recommendations</div>
                      <div className="text-sm text-gray-600">Enable AI-powered content suggestions</div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Twitter API</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Facebook Graph API</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">YouTube API</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Telegram Bot</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push Notifications</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
