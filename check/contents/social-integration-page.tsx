'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  MessageSquare, 
  Bell, 
  Mail, 
  Brain, 
  BarChart3,
  Globe
} from 'lucide-react';

// Import our social components
import { SocialShare } from '@/components/ui/social-share';
import { CommentsSystem } from '@/components/ui/comments-system';
import { SocialFeed } from '@/components/ui/social-feed';
import { NewsletterSignup } from '@/components/ui/newsletter';
import { PushNotificationManager } from '@/components/ui/push-notifications';
import { AIEngagementDashboard } from '@/components/ui/ai-engagement';

// Mock data
const MOCK_ARTICLE = {
  id: 'article-123',
  title: 'Bitcoin Reaches New All-Time High: Market Analysis and Future Predictions',
  url: 'https://coindaily.news/bitcoin-ath-analysis',
  author: 'CoinDaily Team'
};

const MOCK_USER = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/avatars/john-doe.jpg'
};

const MOCK_NOTIFICATION_SETTINGS = {
  enabled: true,
  types: {
    'breaking-news': true,
    'price-alerts': true,
    'market-updates': false,
    'new-articles': true
  },
  quietHours: {
    start: '22:00',
    end: '08:00'
  },
  maxDaily: 10
};

interface SocialIntegrationPageProps {
  className?: string;
}

export function SocialIntegrationPage({ className = '' }: SocialIntegrationPageProps) {
  const [activeTab, setActiveTab] = useState('sharing');
  const [engagementMetrics, setEngagementMetrics] = useState({
    totalShares: 1284,
    totalComments: 563,
    totalSubscribers: 12450,
    engagementRate: 4.2
  });

  const handleNewsletterSubscribe = async (subscription: Record<string, unknown>) => {
    console.log('Newsletter subscription:', subscription);
    setEngagementMetrics(prev => ({
      ...prev,
      totalSubscribers: prev.totalSubscribers + 1
    }));
  };

  const handleNotificationUpdate = async (settings: Record<string, unknown>) => {
    console.log('Notification settings updated:', settings);
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Integration</h1>
          <p className="text-gray-600 mt-2">
            Manage your social presence and audience engagement
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{engagementMetrics.totalShares.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Shares</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{engagementMetrics.totalComments.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{engagementMetrics.totalSubscribers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Subscribers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{engagementMetrics.engagementRate}%</div>
            <div className="text-sm text-gray-600">Engagement</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('sharing')}>
          <CardContent className="p-4 text-center">
            <Share2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium">Social Sharing</h3>
            <p className="text-sm text-gray-600">Share content across platforms</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('comments')}>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium">Comments & Moderation</h3>
            <p className="text-sm text-gray-600">Manage user interactions</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('notifications')}>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-gray-600">Real-time user alerts</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('ai-insights')}>
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-medium">AI Insights</h3>
            <p className="text-sm text-gray-600">Intelligent engagement tools</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sharing" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Sharing
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Social Feed
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Newsletter
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sharing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>One-Click Social Sharing</CardTitle>
                <p className="text-sm text-gray-600">
                  Share articles instantly across multiple platforms
                </p>
              </CardHeader>
              <CardContent>
                <SocialShare
                  options={{
                    url: MOCK_ARTICLE.url,
                    title: MOCK_ARTICLE.title,
                    description: 'Latest crypto market analysis and insights',
                    hashtags: ['Bitcoin', 'Crypto', 'CoinDaily']
                  }}
                  variant="full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sharing Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Twitter</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-medium">450</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Facebook</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-800 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sm font-medium">320</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LinkedIn</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-700 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm font-medium">180</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Telegram</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-sm font-medium">145</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          <CommentsSystem
            articleId={MOCK_ARTICLE.id}
          />
        </TabsContent>

        <TabsContent value="feed" className="space-y-6">
          <SocialFeed
            platforms={['twitter', 'youtube', 'telegram']}
            maxPosts={10}
            refreshInterval={60000}
          />
        </TabsContent>

        <TabsContent value="newsletter" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NewsletterSignup
              onSubscribe={handleNewsletterSubscribe}
              showCategories={true}
              showFrequency={true}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Newsletter Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Open Rate</span>
                    <span className="font-medium">24.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Click Rate</span>
                    <span className="font-medium">8.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Unsubscribe Rate</span>
                    <span className="font-medium">0.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Growth Rate</span>
                    <span className="font-medium text-green-600">+5.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <PushNotificationManager
            settings={MOCK_NOTIFICATION_SETTINGS}
            onUpdateSettings={handleNotificationUpdate}
          />
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <AIEngagementDashboard userId={MOCK_USER.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
