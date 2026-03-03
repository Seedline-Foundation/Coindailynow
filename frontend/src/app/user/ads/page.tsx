'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  Zap,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  AlertTriangle,
  Activity,
  Gauge,
  Film,
  Image,
  Code2,
  Download,
  ChevronRight,
  PieChart,
  Wallet,
  Timer,
  Brain,
  Sparkles,
  Layers,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────
type CampaignStatus = 'active' | 'paused' | 'pending' | 'completed' | 'depleted' | 'cancelled' | 'rejected';
type AdType = 'image' | 'animated_image' | 'html5' | 'rich_media' | 'video' | 'video_preroll' | 'video_outstream' | 'article' | 'post' | 'comment';
type BudgetTier = 'premium' | 'standard' | 'long_tail';
type TabKey = 'overview' | 'campaigns' | 'create' | 'billing';

interface CampaignPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  viewableImpressions: number;
  totalSpent: number;
  ctr: number;
  cpc: number;
  cpm: number;
  viewabilityRate: number;
  burnRate: number;
  remainingImpressions: number;
  bestCreativeIndex: number;
  creativePerformance: CreativePerformance[];
}

interface CreativePerformance {
  creativeIndex: number;
  impressions: number;
  clicks: number;
  ctr: number;
  score: number;
}

interface AdvertiserCampaign {
  id: string;
  title: string;
  adType: AdType;
  status: CampaignStatus;
  currentTier: BudgetTier;
  totalBudget: number;
  remainingBudget: number;
  dailyCap: number;
  dailySpent: number;
  bidAmount: number;
  startDate: string;
  endDate: string;
  performance: CampaignPerformance;
  burnRate: { current: number; projected: number; daysRemaining: number };
  trafficAllocation: { premium: number; standard: number; longTail: number };
  recommendations: string[];
  creativeUrl: string;
  creativeAlternatives: string[];
}

// ─── Mock Data (will be replaced by API calls) ─────────────────────────
const mockCampaigns: AdvertiserCampaign[] = [
  {
    id: 'camp_001',
    title: 'Bitcoin Trading Campaign',
    adType: 'image',
    status: 'active',
    currentTier: 'premium',
    totalBudget: 5000,
    remainingBudget: 3250,
    dailyCap: 166.67,
    dailySpent: 89.42,
    bidAmount: 3.5,
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    performance: {
      impressions: 145200,
      clicks: 4356,
      conversions: 218,
      viewableImpressions: 130680,
      totalSpent: 1750,
      ctr: 0.03,
      cpc: 0.40,
      cpm: 12.05,
      viewabilityRate: 0.90,
      burnRate: 89.42,
      remainingImpressions: 928571,
      bestCreativeIndex: 0,
      creativePerformance: [
        { creativeIndex: 0, impressions: 97000, clicks: 3200, ctr: 0.033, score: 0.85 },
        { creativeIndex: 1, impressions: 48200, clicks: 1156, ctr: 0.024, score: 0.65 },
      ],
    },
    burnRate: { current: 89.42, projected: 92.10, daysRemaining: 13 },
    trafficAllocation: { premium: 0.70, standard: 0.20, longTail: 0.10 },
    recommendations: [
      'Creative A outperforms Creative B by 37% — consider pausing Creative B',
      'Increase bid by $0.30 for premium article slots during peak hours (8-11am WAT)',
      'Add "DeFi" and "NFT" contextual keywords for broader reach',
    ],
    creativeUrl: '/ads/btc-trading-728x90.png',
    creativeAlternatives: ['/ads/btc-trading-300x250.png'],
  },
  {
    id: 'camp_002',
    title: 'Luno Exchange Pre-roll Video',
    adType: 'video_preroll',
    status: 'active',
    currentTier: 'premium',
    totalBudget: 8000,
    remainingBudget: 5600,
    dailyCap: 280,
    dailySpent: 195.30,
    bidAmount: 8.50,
    startDate: '2026-02-20',
    endDate: '2026-03-20',
    performance: {
      impressions: 62300,
      clicks: 1869,
      conversions: 94,
      viewableImpressions: 56070,
      totalSpent: 2400,
      ctr: 0.03,
      cpc: 1.28,
      cpm: 38.52,
      viewabilityRate: 0.90,
      burnRate: 195.30,
      remainingImpressions: 658824,
      bestCreativeIndex: 0,
      creativePerformance: [
        { creativeIndex: 0, impressions: 62300, clicks: 1869, ctr: 0.03, score: 0.91 },
      ],
    },
    burnRate: { current: 195.30, projected: 200.00, daysRemaining: 18 },
    trafficAllocation: { premium: 0.80, standard: 0.15, longTail: 0.05 },
    recommendations: [
      'Video completion rate is strong at 72% — consider extending campaign',
      'Peak engagement hours: 9am-12pm and 6pm-9pm WAT',
      'Consider adding companion display ads for dual-screen coverage',
    ],
    creativeUrl: '/ads/luno-preroll-30s.mp4',
    creativeAlternatives: [],
  },
  {
    id: 'camp_003',
    title: 'Crypto Basics Article Sponsorship',
    adType: 'article',
    status: 'paused',
    currentTier: 'standard',
    totalBudget: 2000,
    remainingBudget: 1400,
    dailyCap: 66.67,
    dailySpent: 0,
    bidAmount: 2.0,
    startDate: '2026-02-10',
    endDate: '2026-03-10',
    performance: {
      impressions: 45000,
      clicks: 900,
      conversions: 36,
      viewableImpressions: 38250,
      totalSpent: 600,
      ctr: 0.02,
      cpc: 0.67,
      cpm: 13.33,
      viewabilityRate: 0.85,
      burnRate: 0,
      remainingImpressions: 700000,
      bestCreativeIndex: 0,
      creativePerformance: [
        { creativeIndex: 0, impressions: 45000, clicks: 900, ctr: 0.02, score: 0.55 },
      ],
    },
    burnRate: { current: 0, projected: 46.67, daysRemaining: 8 },
    trafficAllocation: { premium: 0.30, standard: 0.50, longTail: 0.20 },
    recommendations: [
      'Campaign is paused — resume to maintain audience momentum',
      'CTR below average (2%) — consider refreshing creative',
      'Target evening hours for better engagement with educational content',
    ],
    creativeUrl: '/ads/crypto-basics-article.html',
    creativeAlternatives: [],
  },
  {
    id: 'camp_004',
    title: 'Quidax Rich Media Banner',
    adType: 'rich_media',
    status: 'pending',
    currentTier: 'premium',
    totalBudget: 3000,
    remainingBudget: 3000,
    dailyCap: 0,
    dailySpent: 0,
    bidAmount: 5.0,
    startDate: '2026-03-05',
    endDate: '2026-04-05',
    performance: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      viewableImpressions: 0,
      totalSpent: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      viewabilityRate: 0,
      burnRate: 0,
      remainingImpressions: 0,
      bestCreativeIndex: 0,
      creativePerformance: [],
    },
    burnRate: { current: 0, projected: 0, daysRemaining: 31 },
    trafficAllocation: { premium: 0, standard: 0, longTail: 0 },
    recommendations: ['Awaiting admin approval — estimated review time: 24 hours'],
    creativeUrl: '/ads/quidax-rich-banner.html',
    creativeAlternatives: [],
  },
];

// ─── Helper Components ──────────────────────────────────────────────────

function KPICard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: 'primary' | 'green' | 'red' | 'amber' | 'blue' | 'purple';
}) {
  const colorMap = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="bg-dark-800/60 rounded-xl border border-dark-700 p-5 hover:border-dark-600 transition">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendLabel && (
          <span className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-dark-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trendLabel}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-dark-400 text-sm mt-1">{label}</p>
      {subValue && <p className="text-dark-500 text-xs mt-1">{subValue}</p>}
    </div>
  );
}

function BurnRateGauge({ current, projected, dailyCap }: { current: number; projected: number; dailyCap: number }) {
  const pct = dailyCap > 0 ? Math.min(100, (current / dailyCap) * 100) : 0;
  const projectedPct = dailyCap > 0 ? Math.min(100, (projected / dailyCap) * 100) : 0;
  const isOverpacing = pct > 70;
  const isUnderpacing = pct < 30 && dailyCap > 0;

  return (
    <div className="bg-dark-800/60 rounded-xl border border-dark-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Burn Rate</h3>
      </div>

      {/* Gauge visualization */}
      <div className="relative w-full h-32 flex items-center justify-center mb-4">
        <svg viewBox="0 0 120 80" className="w-full max-w-[200px]">
          {/* Background arc */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke="rgb(55 65 81)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke={isOverpacing ? '#ef4444' : isUnderpacing ? '#f59e0b' : '#22c55e'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${pct * 1.57} 157`}
          />
          {/* Projected marker */}
          {projectedPct > 0 && (
            <circle
              cx={10 + (projectedPct / 100) * 100}
              cy={70 - Math.sin((projectedPct / 100) * Math.PI) * 50}
              r="3"
              fill="#a855f7"
              stroke="white"
              strokeWidth="1"
            />
          )}
          {/* Center text */}
          <text x="60" y="55" textAnchor="middle" className="text-lg font-bold" fill="white" fontSize="16">
            {pct.toFixed(0)}%
          </text>
          <text x="60" y="70" textAnchor="middle" fill="rgb(156 163 175)" fontSize="8">
            of daily cap
          </text>
        </svg>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-dark-400">Current spend/hr</span>
          <span className="text-white font-medium">${current.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400">Projected spend/hr</span>
          <span className="text-purple-400 font-medium">${projected.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400">Daily Cap</span>
          <span className="text-white font-medium">${dailyCap.toFixed(2)}</span>
        </div>
      </div>

      {isOverpacing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          Over-pacing — budget will deplete ahead of schedule
        </div>
      )}
      {isUnderpacing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          Under-pacing — budget will not be fully used
        </div>
      )}
    </div>
  );
}

function TrafficAllocationPie({
  allocation,
}: {
  allocation: { premium: number; standard: number; longTail: number };
}) {
  const total = allocation.premium + allocation.standard + allocation.longTail;
  const premPct = total > 0 ? (allocation.premium / total) * 100 : 0;
  const stdPct = total > 0 ? (allocation.standard / total) * 100 : 0;
  const ltPct = total > 0 ? (allocation.longTail / total) * 100 : 0;

  // SVG donut chart
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const premDash = (premPct / 100) * circumference;
  const stdDash = (stdPct / 100) * circumference;
  const ltDash = (ltPct / 100) * circumference;

  return (
    <div className="bg-dark-800/60 rounded-xl border border-dark-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Traffic Allocation</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Premium slice */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#a855f7"
              strokeWidth="16"
              strokeDasharray={`${premDash} ${circumference - premDash}`}
              strokeDashoffset="0"
            />
            {/* Standard slice */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="16"
              strokeDasharray={`${stdDash} ${circumference - stdDash}`}
              strokeDashoffset={`${-premDash}`}
            />
            {/* Long Tail slice */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#6b7280"
              strokeWidth="16"
              strokeDasharray={`${ltDash} ${circumference - ltDash}`}
              strokeDashoffset={`${-(premDash + stdDash)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-dark-400 font-medium">TIER</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-dark-300 text-sm">Premium</span>
            <span className="text-white font-bold text-sm ml-auto">{premPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-dark-300 text-sm">Standard</span>
            <span className="text-white font-bold text-sm ml-auto">{stdPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-dark-300 text-sm">Long Tail</span>
            <span className="text-white font-bold text-sm ml-auto">{ltPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreativeComparison({ creatives }: { creatives: CreativePerformance[] }) {
  if (creatives.length === 0) return null;
  const best = creatives.reduce((a, b) => (a.ctr > b.ctr ? a : b));

  return (
    <div className="bg-dark-800/60 rounded-xl border border-dark-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-green-400" />
        <h3 className="text-sm font-semibold text-white">Creative Comparison</h3>
      </div>

      <div className="space-y-3">
        {creatives.map((c) => {
          const isBest = c.creativeIndex === best.creativeIndex;
          return (
            <div
              key={c.creativeIndex}
              className={`rounded-lg p-3 border ${
                isBest ? 'border-green-500/30 bg-green-500/5' : 'border-dark-600 bg-dark-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Creative {String.fromCharCode(65 + c.creativeIndex)}
                  </span>
                  {isBest && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Best</span>
                  )}
                </div>
                <span className="text-xs text-dark-400">Score: {(c.score * 100).toFixed(0)}</span>
              </div>

              {/* CTR bar */}
              <div className="relative w-full h-2 bg-dark-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full ${isBest ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, c.ctr * 100 * 10)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-dark-400">{c.impressions.toLocaleString()} impressions</span>
                <span className="text-dark-400">{c.clicks.toLocaleString()} clicks</span>
                <span className={isBest ? 'text-green-400 font-medium' : 'text-white'}>
                  CTR {(c.ctr * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const statusConfig: Record<CampaignStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'text-green-400 bg-green-500/10', icon: CheckCircle },
  paused: { label: 'Paused', color: 'text-amber-400 bg-amber-500/10', icon: Pause },
  pending: { label: 'Pending', color: 'text-blue-400 bg-blue-500/10', icon: Clock },
  completed: { label: 'Completed', color: 'text-dark-400 bg-dark-700', icon: CheckCircle },
  depleted: { label: 'Depleted', color: 'text-red-400 bg-red-500/10', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'text-dark-500 bg-dark-800', icon: XCircle },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/10', icon: XCircle },
};

const adTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  animated_image: Image,
  html5: Code2,
  rich_media: Code2,
  video: Film,
  video_preroll: Film,
  video_outstream: Film,
  article: BarChart3,
  post: BarChart3,
  comment: BarChart3,
};

function adsApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

function mapApiCampaignToAdvertiserCampaign(input: any): AdvertiserCampaign {
  const totalBudget = Number(input.totalBudget || 0);
  const remainingBudget = Number(input.remainingBudget || 0);
  const spent = Math.max(0, totalBudget - remainingBudget);
  const performance = input.performance || {};
  const impressions = Number(performance.impressions || 0);
  const clicks = Number(performance.clicks || 0);
  const conversions = Number(performance.conversions || 0);
  const ctr = impressions > 0 ? clicks / impressions : Number(performance.ctr || 0);
  const cpc = clicks > 0 ? spent / clicks : Number(performance.cpc || 0);
  const cpm = impressions > 0 ? (spent / impressions) * 1000 : Number(performance.cpm || 0);
  const viewableImpressions = Number(performance.viewableImpressions || 0);
  const viewabilityRate = impressions > 0 ? viewableImpressions / impressions : Number(performance.viewabilityRate || 0);

  return {
    id: String(input.id || ''),
    title: String(input.title || 'Untitled Campaign'),
    adType: (input.adType || 'image') as AdType,
    status: (input.status || 'pending') as CampaignStatus,
    currentTier: (input.currentTier || 'standard') as BudgetTier,
    totalBudget,
    remainingBudget,
    dailyCap: Number(input.dailyCap || 0),
    dailySpent: Number(input.dailySpent || 0),
    bidAmount: Number(input.bidAmount || 0),
    startDate: String(input.startDate || new Date().toISOString()),
    endDate: String(input.endDate || new Date().toISOString()),
    performance: {
      impressions,
      clicks,
      conversions,
      viewableImpressions,
      totalSpent: spent,
      ctr,
      cpc,
      cpm,
      viewabilityRate,
      burnRate: Number(input.dailySpent || 0),
      remainingImpressions: cpm > 0 ? Math.floor((remainingBudget / cpm) * 1000) : 0,
      bestCreativeIndex: Number(performance.bestCreativeIndex || 0),
      creativePerformance: Array.isArray(performance.creativePerformance) ? performance.creativePerformance : [],
    },
    burnRate: {
      current: Number(input.dailySpent || 0),
      projected: Number(input.dailyCap || 0),
      daysRemaining: Math.max(0, Math.ceil((new Date(input.endDate || Date.now()).getTime() - Date.now()) / 86400000)),
    },
    trafficAllocation: {
      premium: input.currentTier === 'premium' ? 0.7 : 0.3,
      standard: input.currentTier === 'standard' ? 0.5 : 0.2,
      longTail: input.currentTier === 'long_tail' ? 0.7 : 0.1,
    },
    recommendations: [],
    creativeUrl: String(input.creativeUrl || ''),
    creativeAlternatives: Array.isArray(input.creativeAlternatives) ? input.creativeAlternatives : [],
  };
}

// ─── Main Page Component ─────────────────────────────────────────────────

export default function AdvertiserDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [campaigns, setCampaigns] = useState<AdvertiserCampaign[]>(mockCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<AdvertiserCampaign | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = async () => {
    try {
      const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const advertiserId = parsedUser?.id || parsedUser?.userId || parsedUser?.email || 'demo-advertiser';

      const response = await fetch(`${adsApiBase()}/api/ads/campaigns?advertiserId=${encodeURIComponent(advertiserId)}`);
      if (!response.ok) throw new Error(`Failed to load campaigns (${response.status})`);

      const payload = await response.json();
      const campaignsFromApi = Array.isArray(payload?.data) ? payload.data.map(mapApiCampaignToAdvertiserCampaign) : [];
      if (campaignsFromApi.length > 0) {
        setCampaigns(campaignsFromApi);
      }
    } catch {
      // Keep mock campaigns as graceful fallback
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const activeCamps = campaigns.filter((c) => c.status === 'active');
    return {
      totalBudget: campaigns.reduce((s, c) => s + c.totalBudget, 0),
      totalSpent: campaigns.reduce((s, c) => s + c.performance.totalSpent, 0),
      totalRemaining: campaigns.reduce((s, c) => s + c.remainingBudget, 0),
      totalImpressions: campaigns.reduce((s, c) => s + c.performance.impressions, 0),
      totalClicks: campaigns.reduce((s, c) => s + c.performance.clicks, 0),
      totalConversions: campaigns.reduce((s, c) => s + c.performance.conversions, 0),
      avgCtr: activeCamps.length > 0
        ? activeCamps.reduce((s, c) => s + c.performance.ctr, 0) / activeCamps.length
        : 0,
      avgCpc: activeCamps.length > 0
        ? activeCamps.reduce((s, c) => s + c.performance.cpc, 0) / activeCamps.length
        : 0,
      avgViewability: activeCamps.length > 0
        ? activeCamps.reduce((s, c) => s + c.performance.viewabilityRate, 0) / activeCamps.length
        : 0,
      activeCampaigns: activeCamps.length,
      pendingCampaigns: campaigns.filter((c) => c.status === 'pending').length,
    };
  }, [campaigns]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    await new Promise((r) => setTimeout(r, 200));
    setRefreshing(false);
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'campaigns', label: 'My Campaigns', icon: Layers },
    { key: 'create', label: 'Create Campaign', icon: Plus },
    { key: 'billing', label: 'Billing', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ads Dashboard</h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage your ad campaigns, track performance, and optimize ROI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-dark-800 border border-dark-600 text-dark-300 rounded-lg text-sm hover:text-white hover:border-dark-500 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/user/ads/create"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/50 rounded-xl p-1 border border-dark-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== 'overview') setSelectedCampaign(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* OVERVIEW TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top-level KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Total Spent"
              value={`$${kpis.totalSpent.toLocaleString()}`}
              subValue={`of $${kpis.totalBudget.toLocaleString()} budget`}
              icon={DollarSign}
              color="primary"
              trend="up"
              trendLabel="+12%"
            />
            <KPICard
              label="Total Impressions"
              value={kpis.totalImpressions.toLocaleString()}
              subValue={`${kpis.totalClicks.toLocaleString()} clicks`}
              icon={Eye}
              color="blue"
              trend="up"
              trendLabel="+8.5%"
            />
            <KPICard
              label="Avg CTR"
              value={`${(kpis.avgCtr * 100).toFixed(2)}%`}
              subValue={`CPC: $${kpis.avgCpc.toFixed(2)}`}
              icon={MousePointerClick}
              color="green"
              trend="up"
              trendLabel="+0.3%"
            />
            <KPICard
              label="Conversions"
              value={kpis.totalConversions.toLocaleString()}
              subValue={`Viewability: ${(kpis.avgViewability * 100).toFixed(0)}%`}
              icon={Target}
              color="purple"
              trend="up"
              trendLabel="+15%"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Active Campaigns"
              value={String(kpis.activeCampaigns)}
              subValue={`${kpis.pendingCampaigns} pending`}
              icon={Activity}
              color="green"
            />
            <KPICard
              label="Remaining Budget"
              value={`$${kpis.totalRemaining.toLocaleString()}`}
              icon={Wallet}
              color="amber"
            />
            <KPICard
              label="Avg CPC"
              value={`$${kpis.avgCpc.toFixed(2)}`}
              icon={MousePointerClick}
              color="blue"
            />
            <KPICard
              label="Viewability"
              value={`${(kpis.avgViewability * 100).toFixed(0)}%`}
              subValue="MRC Standard"
              icon={Eye}
              color="purple"
            />
          </div>

          {/* Campaign quick list */}
          <div className="bg-dark-800/60 rounded-xl border border-dark-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Campaign Performance</h2>
              <button
                onClick={() => setActiveTab('campaigns')}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-dark-400 text-xs uppercase tracking-wider border-b border-dark-700">
                    <th className="text-left px-4 py-3">Campaign</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Budget</th>
                    <th className="text-right px-4 py-3">Spent</th>
                    <th className="text-right px-4 py-3">Impressions</th>
                    <th className="text-right px-4 py-3">CTR</th>
                    <th className="text-right px-4 py-3">CPC</th>
                    <th className="text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {campaigns.map((c) => {
                    const Icon = adTypeIcons[c.adType] || BarChart3;
                    const status = statusConfig[c.status];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={c.id} className="hover:bg-dark-700/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-dark-400" />
                            <div>
                              <p className="text-white font-medium">{c.title}</p>
                              <p className="text-dark-500 text-xs">{c.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" /> {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-white">${c.totalBudget.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-white">${c.performance.totalSpent.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-dark-300">{c.performance.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-dark-300">{(c.performance.ctr * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-dark-300">${c.performance.cpc.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedCampaign(c)}
                            className="text-primary-400 hover:text-primary-300 text-xs font-medium"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Campaign Detail */}
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {selectedCampaign.title} — Detailed Report
                </h2>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-dark-400 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Burn Rate Gauge */}
                <BurnRateGauge
                  current={selectedCampaign.burnRate.current}
                  projected={selectedCampaign.burnRate.projected}
                  dailyCap={selectedCampaign.dailyCap}
                />

                {/* Traffic Allocation Pie */}
                <TrafficAllocationPie allocation={selectedCampaign.trafficAllocation} />

                {/* Key Metrics */}
                <div className="bg-dark-800/60 rounded-xl border border-dark-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary-400" />
                    <h3 className="text-sm font-semibold text-white">Key Metrics</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Remaining Budget</span>
                      <span className="text-white font-medium">${selectedCampaign.remainingBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Days Remaining</span>
                      <span className="text-white font-medium">{selectedCampaign.burnRate.daysRemaining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Remaining Impressions</span>
                      <span className="text-white font-medium">{selectedCampaign.performance.remainingImpressions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">CPM</span>
                      <span className="text-white font-medium">${selectedCampaign.performance.cpm.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Viewability</span>
                      <span className="text-white font-medium">
                        {(selectedCampaign.performance.viewabilityRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Current Tier</span>
                      <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                        selectedCampaign.currentTier === 'premium'
                          ? 'text-purple-400 bg-purple-500/10'
                          : selectedCampaign.currentTier === 'standard'
                          ? 'text-blue-400 bg-blue-500/10'
                          : 'text-dark-400 bg-dark-700'
                      }`}>
                        {selectedCampaign.currentTier.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creative Comparison */}
              {selectedCampaign.performance.creativePerformance.length > 0 && (
                <CreativeComparison creatives={selectedCampaign.performance.creativePerformance} />
              )}

              {/* AI Recommendations */}
              {selectedCampaign.recommendations.length > 0 && (
                <div className="bg-dark-800/60 rounded-xl border border-dark-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">AI Recommendations</h3>
                    <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                      DeepSeek R1
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedCampaign.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-dark-900/40 border border-dark-600">
                        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <span className="text-dark-300 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* CAMPAIGNS TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const Icon = adTypeIcons[c.adType] || BarChart3;
            const status = statusConfig[c.status];
            const StatusIcon = status.icon;
            const budgetPct = c.totalBudget > 0 ? ((c.totalBudget - c.remainingBudget) / c.totalBudget) * 100 : 0;

            return (
              <div
                key={c.id}
                className="bg-dark-800/60 rounded-xl border border-dark-700 p-5 hover:border-dark-600 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-dark-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">{c.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                      </div>
                      <p className="text-dark-500 text-xs">
                        {c.adType.replace(/_/g, ' ')} · Bid: ${c.bidAmount.toFixed(2)} CPM · {c.currentTier.replace('_', ' ')} tier
                      </p>
                    </div>
                  </div>

                  {/* Middle: Budget bar */}
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-dark-400">
                        ${(c.totalBudget - c.remainingBudget).toLocaleString()} / ${c.totalBudget.toLocaleString()}
                      </span>
                      <span className="text-dark-400">{budgetPct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budgetPct > 80 ? 'bg-red-500' : budgetPct > 50 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Quick stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-white font-medium">{c.performance.impressions.toLocaleString()}</p>
                      <p className="text-dark-500 text-xs">Impressions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">{(c.performance.ctr * 100).toFixed(2)}%</p>
                      <p className="text-dark-500 text-xs">CTR</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">{c.burnRate.daysRemaining}d</p>
                      <p className="text-dark-500 text-xs">Remaining</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCampaign(c);
                        setActiveTab('overview');
                      }}
                      className="px-3 py-1.5 text-primary-400 border border-primary-500/30 rounded-lg text-xs font-medium hover:bg-primary-500/10 transition"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* CREATE CAMPAIGN TAB (links to upload flow) */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Create a New Campaign</h2>
            <p className="text-dark-400 text-sm mb-6">
              Set up targeting, upload creatives, choose your budget and pacing strategy, then submit for review.
            </p>
            <Link
              href="/user/ads/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition"
            >
              <Plus className="w-5 h-5" />
              Start Campaign Builder
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* BILLING TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              label="Total Spend (All Time)"
              value={`$${kpis.totalSpent.toLocaleString()}`}
              icon={DollarSign}
              color="primary"
            />
            <KPICard
              label="Active Budgets"
              value={`$${kpis.totalRemaining.toLocaleString()}`}
              subValue="Across all campaigns"
              icon={Wallet}
              color="green"
            />
            <KPICard
              label="Average CPM"
              value={`$${campaigns.length > 0 ? (campaigns.reduce((s, c) => s + c.performance.cpm, 0) / campaigns.length).toFixed(2) : '0.00'}`}
              icon={BarChart3}
              color="blue"
            />
          </div>

          <div className="bg-dark-800/60 rounded-xl border border-dark-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-dark-400 text-xs uppercase tracking-wider border-b border-dark-700">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Campaign</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {campaigns
                    .filter((c) => c.performance.totalSpent > 0)
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-dark-700/30">
                        <td className="px-4 py-3 text-dark-300">{new Date(c.startDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-white">{c.title}</td>
                        <td className="px-4 py-3 text-dark-300">Campaign Spend</td>
                        <td className="px-4 py-3 text-right text-white">${c.performance.totalSpent.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Processed</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
