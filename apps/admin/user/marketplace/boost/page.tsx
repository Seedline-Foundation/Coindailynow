'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Zap,
  TrendingUp,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  Target,
  BarChart3,
  Package,
  Plus,
  Pause,
  Play,
  AlertCircle,
  Info,
  ArrowUpRight,
  Sparkles,
  Crown,
  Star,
  Calendar,
  ChevronRight,
  Brain,
} from 'lucide-react';

// ===========================================================================
// TYPES
// ===========================================================================

type BoostStatus = 'active' | 'paused' | 'expired' | 'scheduled';
type BoostTier = 'starter' | 'growth' | 'pro' | 'enterprise';

interface BoostCampaign {
  id: string;
  productId: string;
  productName: string;
  productType: string;
  tier: BoostTier;
  status: BoostStatus;
  dailyBudget: number;
  totalBudget: number;
  spent: number;
  remaining: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  startDate: string;
  endDate?: string;
  ctr: number;
  conversionRate: number;
}

interface BoostPlan {
  tier: BoostTier;
  name: string;
  price: number;
  duration: string;
  features: string[];
  impressions: string;
  placement: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  popular?: boolean;
}

// ===========================================================================
// MOCK DATA
// ===========================================================================

const mockCampaigns: BoostCampaign[] = [
  {
    id: 'bc1', productId: 'sp1', productName: 'DeFi Masterclass for Africa', productType: 'course',
    tier: 'pro', status: 'active', dailyBudget: 15, totalBudget: 300, spent: 186, remaining: 114,
    impressions: 12400, clicks: 620, conversions: 24, revenue: 1896,
    startDate: '2026-02-15', endDate: '2026-03-15', ctr: 5.0, conversionRate: 3.9,
  },
  {
    id: 'bc2', productId: 'sp3', productName: 'P2P Trading Blueprint', productType: 'ebook',
    tier: 'growth', status: 'active', dailyBudget: 8, totalBudget: 150, spent: 98, remaining: 52,
    impressions: 6800, clicks: 340, conversions: 12, revenue: 299.88,
    startDate: '2026-02-20', endDate: '2026-03-10', ctr: 5.0, conversionRate: 3.5,
  },
  {
    id: 'bc3', productId: 'sp5', productName: 'Portfolio Tracker Template', productType: 'template',
    tier: 'starter', status: 'active', dailyBudget: 3, totalBudget: 50, spent: 38, remaining: 12,
    impressions: 2100, clicks: 105, conversions: 5, revenue: 39.95,
    startDate: '2026-02-25', endDate: '2026-03-20', ctr: 5.0, conversionRate: 4.8,
  },
  {
    id: 'bc4', productId: 'sp2', productName: 'Nigeria Market Report Q1', productType: 'report',
    tier: 'growth', status: 'expired', dailyBudget: 10, totalBudget: 200, spent: 200, remaining: 0,
    impressions: 14200, clicks: 710, conversions: 31, revenue: 1549.69,
    startDate: '2026-01-15', endDate: '2026-02-14', ctr: 5.0, conversionRate: 4.4,
  },
];

const boostPlans: BoostPlan[] = [
  {
    tier: 'starter', name: 'Starter Boost', price: 50, duration: '7 days',
    features: ['Basic marketplace visibility', 'Category page placement', 'Standard analytics'],
    impressions: '~2,000', placement: 'Category pages',
    icon: <Zap className="w-6 h-6" />, color: 'text-blue-400', gradient: 'from-blue-600 to-blue-800',
  },
  {
    tier: 'growth', name: 'Growth Boost', price: 150, duration: '14 days', popular: true,
    features: ['Enhanced visibility', 'Homepage featured section', 'Priority in search', 'AI-optimized timing', 'Detailed analytics'],
    impressions: '~8,000', placement: 'Homepage + Category',
    icon: <TrendingUp className="w-6 h-6" />, color: 'text-green-400', gradient: 'from-green-600 to-green-800',
  },
  {
    tier: 'pro', name: 'Pro Boost', price: 300, duration: '30 days',
    features: ['Maximum visibility', 'Banner ads on articles', 'AI-powered audience targeting', 'Featured in newsletter', 'Real-time analytics', 'AI placement optimization'],
    impressions: '~20,000', placement: 'Sitewide + Newsletter',
    icon: <Crown className="w-6 h-6" />, color: 'text-purple-400', gradient: 'from-purple-600 to-purple-800',
  },
  {
    tier: 'enterprise', name: 'Enterprise Boost', price: 500, duration: '30 days',
    features: ['All Pro features', 'Dedicated product spotlight', 'Social media promotion', 'Priority customer support', 'Custom ad creatives', 'DeepSeek R1 AI optimization'],
    impressions: '~50,000+', placement: 'All channels',
    icon: <Sparkles className="w-6 h-6" />, color: 'text-orange-400', gradient: 'from-orange-600 to-orange-800',
  },
];

const statusConfig: Record<BoostStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/10', icon: <Play className="w-3.5 h-3.5" /> },
  paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: <Pause className="w-3.5 h-3.5" /> },
  expired: { label: 'Expired', color: 'text-dark-400', bg: 'bg-dark-700', icon: <Clock className="w-3.5 h-3.5" /> },
  scheduled: { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Calendar className="w-3.5 h-3.5" /> },
};

// ===========================================================================
// COMPONENT
// ===========================================================================

export default function SellerBoostPage() {
  const [campaigns, setCampaigns] = useState<BoostCampaign[]>(mockCampaigns);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'plans' | 'how_it_works'>('campaigns');
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalBoostedRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const avgROI = totalSpent > 0 ? ((totalBoostedRevenue - totalSpent) / totalSpent * 100).toFixed(0) : '0';

  const toggleCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, status: c.status === 'active' ? 'paused' as const : 'active' as const };
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary-500" /> Boost Manager
          </h1>
          <p className="text-dark-400 mt-1">Boost your products for more visibility and sales</p>
        </div>
        <button onClick={() => { setActiveTab('plans'); setShowNewCampaign(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg text-sm hover:from-orange-600 hover:to-orange-800">
          <Plus className="w-4 h-4" /> New Boost Campaign
        </button>
      </div>

      {/* AI Agent Badge */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-xl p-4 flex items-start gap-3">
        <Brain className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            Powered by DeepSeek R1 AI Agent
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">AI</span>
          </p>
          <p className="text-xs text-dark-300 mt-1">
            Our AI ad placement agent automatically optimizes your product visibility. When you boost a product, the DeepSeek R1 model
            analyzes user behavior, browsing patterns, and market trends to place your product where it will get the most engagement.
            When your boost budget is depleted, the agent returns your product to its normal organic ranking.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Campaigns', value: activeCampaigns.length.toString(), icon: <Rocket className="w-5 h-5 text-orange-400" /> },
          { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, icon: <DollarSign className="w-5 h-5 text-red-400" /> },
          { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: <Eye className="w-5 h-5 text-blue-400" /> },
          { label: 'Conversions', value: totalConversions.toString(), icon: <Target className="w-5 h-5 text-green-400" /> },
          { label: 'ROI', value: `${avgROI}%`, icon: <TrendingUp className="w-5 h-5 text-purple-400" /> },
        ].map(s => (
          <div key={s.label} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{s.icon}</div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-dark-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-dark-900 border border-dark-700 rounded-xl p-1">
        {(['campaigns', 'plans', 'how_it_works'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab ? 'bg-primary-500/10 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-dark-800'
            }`}>
            {tab === 'campaigns' && <Rocket className="w-4 h-4 inline mr-1.5" />}
            {tab === 'plans' && <Crown className="w-4 h-4 inline mr-1.5" />}
            {tab === 'how_it_works' && <Brain className="w-4 h-4 inline mr-1.5" />}
            {tab === 'campaigns' ? 'Campaigns' : tab === 'plans' ? 'Boost Plans' : 'How It Works'}
          </button>
        ))}
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map(c => {
            const sc = statusConfig[c.status];
            const progress = c.totalBudget > 0 ? (c.spent / c.totalBudget) * 100 : 0;
            return (
              <div key={c.id} className={`bg-dark-900 border rounded-xl p-5 ${c.status === 'active' ? 'border-green-700/30' : 'border-dark-700'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white truncate">{c.productName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <span className="px-2 py-0.5 bg-dark-700 text-dark-300 text-xs rounded-full capitalize">{c.tier}</span>
                    </div>
                    <p className="text-xs text-dark-400">
                      {new Date(c.startDate).toLocaleDateString()} — {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Ongoing'}
                    </p>
                    {/* Budget Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-dark-400 mb-1">
                        <span>Budget: ${c.spent} / ${c.totalBudget}</span>
                        <span>{progress.toFixed(0)}% used</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${progress > 80 ? 'bg-red-500' : progress > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-4 gap-3 md:gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{c.impressions.toLocaleString()}</p>
                      <p className="text-xs text-dark-500">Impressions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{c.clicks}</p>
                      <p className="text-xs text-dark-500">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-400">{c.conversions}</p>
                      <p className="text-xs text-dark-500">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary-400">${c.revenue.toLocaleString()}</p>
                      <p className="text-xs text-dark-500">Revenue</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {(c.status === 'active' || c.status === 'paused') && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => toggleCampaign(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                          c.status === 'active'
                            ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}>
                        {c.status === 'active' ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {campaigns.length === 0 && (
            <div className="text-center py-16 text-dark-400">
              <Rocket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No boost campaigns yet</p>
              <p className="text-sm mt-1">Create a campaign to increase your product visibility</p>
            </div>
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {boostPlans.map(plan => (
            <div key={plan.tier} className={`bg-dark-900 border rounded-2xl overflow-hidden relative ${plan.popular ? 'border-primary-500' : 'border-dark-700'}`}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary-500 text-dark-950 text-xs font-bold text-center py-1">Most Popular</div>
              )}
              <div className={`bg-gradient-to-br ${plan.gradient} p-5 ${plan.popular ? 'pt-8' : ''}`}>
                <div className="text-white/80 mb-3">{plan.icon}</div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-white/60 text-sm">{plan.duration}</p>
              </div>
              <div className="p-5">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">${plan.price}</span>
                  <span className="text-dark-400 text-sm">JOY</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-dark-300">
                    <Eye className="w-3.5 h-3.5 text-blue-400" /> {plan.impressions} impressions
                  </div>
                  <div className="flex items-center gap-2 text-xs text-dark-300">
                    <Target className="w-3.5 h-3.5 text-green-400" /> {plan.placement}
                  </div>
                </div>
                <ul className="space-y-1.5 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-dark-300 flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-lg font-bold text-sm ${
                  plan.popular
                    ? 'bg-primary-500 text-dark-950 hover:bg-primary-600'
                    : 'bg-dark-800 text-white hover:bg-dark-700'
                }`}>
                  Select Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How It Works Tab */}
      {activeTab === 'how_it_works' && (
        <div className="space-y-6">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" /> DeepSeek R1 Ad Placement Agent
            </h2>
            <p className="text-dark-300 text-sm leading-relaxed mb-6">
              Our marketplace uses a sophisticated AI agent powered by the <strong className="text-purple-400">DeepSeek R1</strong> model
              to manage product visibility and ad placements. This agent works autonomously to maximize your return on investment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: '1. You Create a Boost Campaign',
                  desc: 'Select a product, choose a boost tier, and set your budget. The AI agent takes over from here.',
                  icon: <Rocket className="w-5 h-5 text-orange-400" />,
                },
                {
                  title: '2. AI Analyzes Optimal Placement',
                  desc: 'DeepSeek R1 analyzes user browsing patterns, time-of-day activity, geographic data, and content relevance to determine the best ad positions.',
                  icon: <Brain className="w-5 h-5 text-purple-400" />,
                },
                {
                  title: '3. Dynamic Visibility Boosting',
                  desc: 'Your product is promoted across the marketplace — in search results, category pages, homepage features, article sidebars, and newsletters based on your plan.',
                  icon: <TrendingUp className="w-5 h-5 text-green-400" />,
                },
                {
                  title: '4. Auto-Normalization on Depletion',
                  desc: 'When your boost budget is depleted, the AI agent automatically returns your product to its normal organic ranking without any manual intervention.',
                  icon: <Target className="w-5 h-5 text-blue-400" />,
                },
              ].map(step => (
                <div key={step.title} className="bg-dark-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">{step.icon}<h4 className="font-bold text-white text-sm">{step.title}</h4></div>
                  <p className="text-xs text-dark-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="font-bold text-white mb-3">AI Agent Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { feature: 'Smart Scheduling', desc: 'Places ads during peak user activity hours for your target geography' },
                { feature: 'Audience Matching', desc: 'Identifies users most likely to purchase based on browsing & reading history' },
                { feature: 'A/B Placement Testing', desc: 'Tests different ad positions and automatically shifts budget to best performers' },
                { feature: 'Budget Pacing', desc: 'Spreads budget evenly across campaign duration to avoid early depletion' },
                { feature: 'Competitive Awareness', desc: 'Adjusts placement strategy based on similar products in the marketplace' },
                { feature: 'Real-time Optimization', desc: 'Continuously refines targeting based on live click and conversion data' },
              ].map(item => (
                <div key={item.feature} className="bg-dark-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-white flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> {item.feature}</p>
                  <p className="text-xs text-dark-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
