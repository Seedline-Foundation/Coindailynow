'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import type { NotificationPreferences } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, AlertTriangle, TrendingUp, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotificationPreferencesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
    enabled: !!user,
  });

  const [settings, setSettings] = useState<Partial<NotificationPreferences>>({
    emailEnabled: preferences?.emailEnabled ?? true,
    pushEnabled: preferences?.pushEnabled ?? true,
    priceAlerts: preferences?.priceAlerts ?? true,
    percentageAlerts: preferences?.percentageAlerts ?? true,
    volumeAlerts: preferences?.volumeAlerts ?? true,
    scamAlerts: preferences?.scamAlerts ?? true,
    newListingAlerts: preferences?.newListingAlerts ?? true,
    trendingAlerts: preferences?.trendingAlerts ?? true,
    // News preferences
    breakingNewsAlerts: preferences?.breakingNewsAlerts ?? true,
    marketUpdatesAlerts: preferences?.marketUpdatesAlerts ?? true,
    regulatoryNewsAlerts: preferences?.regulatoryNewsAlerts ?? true,
    projectAnnouncementsAlerts: preferences?.projectAnnouncementsAlerts ?? true,
    preferredNewsCategories: preferences?.preferredNewsCategories ?? [],
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      const response = await fetch('/api/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Notification Preferences</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          Please log in to manage your notification preferences
        </p>
      </div>
    );
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(settings);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize how and when you want to receive alerts
        </p>
      </div>

      <div className="grid gap-8">
        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts via email
                </p>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={() => handleToggle('emailEnabled')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts on your device
                </p>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={() => handleToggle('pushEnabled')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alert Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alert Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Price Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  When tokens hit your target price
                </p>
              </div>
              <Switch
                checked={settings.priceAlerts}
                onCheckedChange={() => handleToggle('priceAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Percentage Change Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  When tokens move by your specified percentage
                </p>
              </div>
              <Switch
                checked={settings.percentageAlerts}
                onCheckedChange={() => handleToggle('percentageAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Volume Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  When trading volume spikes significantly
                </p>
              </div>
              <Switch
                checked={settings.volumeAlerts}
                onCheckedChange={() => handleToggle('volumeAlerts')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Market Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Scam Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  When tokens are flagged as potential scams
                </p>
              </div>
              <Switch
                checked={settings.scamAlerts}
                onCheckedChange={() => handleToggle('scamAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Listing Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  When new tokens are listed
                </p>
              </div>
              <Switch
                checked={settings.newListingAlerts}
                onCheckedChange={() => handleToggle('newListingAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trending Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  When tokens start trending
                </p>
              </div>
              <Switch
                checked={settings.trendingAlerts}
                onCheckedChange={() => handleToggle('trendingAlerts')}
              />
            </div>
          </CardContent>
        </Card>

        {/* News Preferences */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              News Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Breaking News Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about major crypto events and breaking news
                </p>
              </div>
              <Switch
                checked={settings.breakingNewsAlerts}
                onCheckedChange={() => handleToggle('breakingNewsAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Market Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Daily summaries of important market movements
                </p>
              </div>
              <Switch
                checked={settings.marketUpdatesAlerts}
                onCheckedChange={() => handleToggle('marketUpdatesAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Regulatory News</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about crypto regulations and policy changes
                </p>
              </div>
              <Switch
                checked={settings.regulatoryNewsAlerts}
                onCheckedChange={() => handleToggle('regulatoryNewsAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Project Announcements</Label>
                <p className="text-sm text-muted-foreground">
                  News about cryptocurrency project developments
                </p>
              </div>
              <Switch
                checked={settings.projectAnnouncementsAlerts}
                onCheckedChange={() => handleToggle('projectAnnouncementsAlerts')}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={updatePreferencesMutation.isPending}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}