'use client';

import { useState, useMemo } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import {
  Megaphone,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Ban,
  DollarSign,
  TrendingUp,
  MoreVertical,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Play,
  Pause,
  BarChart3,
  Globe,
  MousePointerClick,
  Target,
  Brain,
  Activity,
  Layers,
  Settings,
  Gauge,
  Users,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Rocket,
  ShieldCheck,
  Wallet,
  Timer,
  Image,
  Code2,
  FileText,
  MessageSquare,
  Film,
  Video,
  MonitorPlay,
  Clapperboard,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────
type TabKey = 'overview' | 'campaigns' | 'approvals' | 'inventory' | 'ai-insights';

type CampaignStatus = 'active' | 'paused' | 'pending' | 'completed' | 'rejected' | 'draft';
type AdType = 'image' | 'animated_image' | 'html5' | 'rich_media' | 'video' | 'video_preroll' | 'video_outstream' | 'article' | 'post' | 'comment';
type BudgetTier = 'PREMIUM' | 'STANDARD' | 'LONG_TAIL';
type RotationStrategy = 'sequential' | 'random' | 'optimized' | 'even' | 'weighted' | 'pacing';
type PlacementLocation =
  | 'homepage_hero'
  | 'article_top'
  | 'article_inline'
  | 'article_bottom'
  | 'sidebar_sticky'
  | 'sidebar_scroll'
  | 'feed_native'
  | 'search_results'
  | 'category_banner'
  | 'mobile_interstitial'
  | 'notification_bar'
  | 'exit_intent'
  | 'video_preroll'
  | 'video_midroll'
  | 'video_postroll'
  | 'video_outstream';

interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  advertiserEmail: string;
  advertiserCountry: string;
  countryFlag: string;
  status: CampaignStatus;
  adType: AdType;
  budgetTier: BudgetTier;
  rotationStrategy: RotationStrategy;
  dailyBudget: number;
  totalBudget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  viewabilityRate?: number;
  videoCompletionRate?: number;
  placements: PlacementLocation[];
  startDate: string;
  endDate: string;
  aiScore: number;
  createdAt: string;
  thumbnail: string;
}

interface InventorySlot {
  id: string;
  location: PlacementLocation;
  label: string;
  avgTraffic: number;
  fillRate: number;
  avgCPM: number;
  activeCampaigns: number;
  status: 'active' | 'paused' | 'maintenance';
  revenue24h: number;
  supportsVideo?: boolean;
  supportsRichMedia?: boolean;
}

interface ApprovalItem {
  id: string;
  campaignName: string;
  advertiser: string;
  adType: AdType;
  submittedAt: string;
  budget: number;
  placements: PlacementLocation[];
  previewUrl: string;
  aiReviewScore: number;
  aiFlags: string[];
}

// ─── Mock Data ──────────────────────────────────────────
const mockCampaigns: Campaign[] = [
  {
    id: 'C001',
    name: 'Binance Africa Q1 Launch',
    advertiser: 'Binance Africa',
    advertiserEmail: 'ads@binance-africa.com',
    advertiserCountry: 'Nigeria',
    countryFlag: '🇳🇬',
    status: 'active',
    adType: 'image',
    budgetTier: 'PREMIUM',
    rotationStrategy: 'optimized',
    dailyBudget: 500,
    totalBudget: 15000,
    spent: 8420,
    impressions: 1245000,
    clicks: 18675,
    conversions: 934,
    ctr: 1.5,
    cpc: 0.45,
    cpm: 6.76,
    roas: 4.2,
    placements: ['homepage_hero', 'article_top', 'feed_native'],
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    aiScore: 92,
    createdAt: '2025-01-10',
    thumbnail: '🏦',
  },
  {
    id: 'C002',
    name: 'Luno Trade Competition',
    advertiser: 'Luno Exchange',
    advertiserEmail: 'marketing@luno.com',
    advertiserCountry: 'South Africa',
    countryFlag: '🇿🇦',
    status: 'active',
    adType: 'html5',
    budgetTier: 'PREMIUM',
    rotationStrategy: 'weighted',
    dailyBudget: 350,
    totalBudget: 10500,
    spent: 5670,
    impressions: 890000,
    clicks: 11570,
    conversions: 578,
    ctr: 1.3,
    cpc: 0.49,
    cpm: 6.37,
    roas: 3.8,
    placements: ['sidebar_sticky', 'article_inline', 'category_banner'],
    startDate: '2025-01-20',
    endDate: '2025-02-20',
    aiScore: 88,
    createdAt: '2025-01-18',
    thumbnail: '💱',
  },
  {
    id: 'C003',
    name: 'Quidax Welcome Bonus',
    advertiser: 'Quidax',
    advertiserEmail: 'ads@quidax.com',
    advertiserCountry: 'Nigeria',
    countryFlag: '🇳🇬',
    status: 'paused',
    adType: 'image',
    budgetTier: 'STANDARD',
    rotationStrategy: 'even',
    dailyBudget: 150,
    totalBudget: 4500,
    spent: 2100,
    impressions: 420000,
    clicks: 5040,
    conversions: 201,
    ctr: 1.2,
    cpc: 0.42,
    cpm: 5.0,
    roas: 2.9,
    placements: ['article_bottom', 'sidebar_scroll'],
    startDate: '2025-01-05',
    endDate: '2025-02-05',
    aiScore: 74,
    createdAt: '2025-01-03',
    thumbnail: '🎁',
  },
  {
    id: 'C004',
    name: 'M-Pesa Crypto Gateway',
    advertiser: 'Safaricom Financial',
    advertiserEmail: 'digital@safaricom.co.ke',
    advertiserCountry: 'Kenya',
    countryFlag: '🇰🇪',
    status: 'active',
    adType: 'article',
    budgetTier: 'PREMIUM',
    rotationStrategy: 'pacing',
    dailyBudget: 400,
    totalBudget: 12000,
    spent: 6800,
    impressions: 670000,
    clicks: 13400,
    conversions: 804,
    ctr: 2.0,
    cpc: 0.51,
    cpm: 10.15,
    roas: 5.1,
    placements: ['homepage_hero', 'feed_native', 'mobile_interstitial'],
    startDate: '2025-01-12',
    endDate: '2025-02-12',
    aiScore: 96,
    createdAt: '2025-01-09',
    thumbnail: '📱',
  },
  {
    id: 'C005',
    name: 'Valr P2P Africa Promo',
    advertiser: 'Valr Exchange',
    advertiserEmail: 'growth@valr.com',
    advertiserCountry: 'South Africa',
    countryFlag: '🇿🇦',
    status: 'completed',
    adType: 'image',
    budgetTier: 'STANDARD',
    rotationStrategy: 'sequential',
    dailyBudget: 200,
    totalBudget: 6000,
    spent: 6000,
    impressions: 950000,
    clicks: 9500,
    conversions: 380,
    ctr: 1.0,
    cpc: 0.63,
    cpm: 6.32,
    roas: 2.5,
    placements: ['article_top', 'search_results'],
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    aiScore: 70,
    createdAt: '2024-11-28',
    thumbnail: '🔄',
  },
  {
    id: 'C006',
    name: 'JOY Token Airdrop Banner',
    advertiser: 'CoinDaily Internal',
    advertiserEmail: 'internal@coindaily.africa',
    advertiserCountry: 'Nigeria',
    countryFlag: '🇳🇬',
    status: 'active',
    adType: 'html5',
    budgetTier: 'LONG_TAIL',
    rotationStrategy: 'random',
    dailyBudget: 50,
    totalBudget: 1500,
    spent: 340,
    impressions: 180000,
    clicks: 3600,
    conversions: 720,
    ctr: 2.0,
    cpc: 0.09,
    cpm: 1.89,
    roas: 8.5,
    placements: ['notification_bar', 'exit_intent'],
    startDate: '2025-01-25',
    endDate: '2025-03-25',
    aiScore: 82,
    createdAt: '2025-01-24',
    thumbnail: '🪙',
  },
  {
    id: 'C007',
    name: 'BuyCoins Referral Wave 2',
    advertiser: 'BuyCoins Nigeria',
    advertiserEmail: 'marketing@buycoins.africa',
    advertiserCountry: 'Nigeria',
    countryFlag: '🇳🇬',
    status: 'pending',
    adType: 'post',
    budgetTier: 'STANDARD',
    rotationStrategy: 'optimized',
    dailyBudget: 200,
    totalBudget: 6000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    roas: 0,
    placements: ['feed_native', 'article_inline'],
    startDate: '2025-02-01',
    endDate: '2025-03-01',
    aiScore: 0,
    createdAt: '2025-01-28',
    thumbnail: '🚀',
  },
  {
    id: 'C008',
    name: 'Ice3X Zero-Fee Promo',
    advertiser: 'Ice3X Exchange',
    advertiserEmail: 'ads@ice3x.co.za',
    advertiserCountry: 'South Africa',
    countryFlag: '🇿🇦',
    status: 'rejected',
    adType: 'image',
    budgetTier: 'LONG_TAIL',
    rotationStrategy: 'even',
    dailyBudget: 80,
    totalBudget: 2400,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    roas: 0,
    placements: ['sidebar_sticky'],
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    aiScore: 0,
    createdAt: '2025-01-27',
    thumbnail: '❄️',
  },
  {
    id: 'C009',
    name: 'Luno Video Pre-roll: Trade Smarter',
    advertiser: 'Luno Exchange',
    advertiserEmail: 'marketing@luno.com',
    advertiserCountry: 'South Africa',
    countryFlag: '🇿🇦',
    status: 'active',
    adType: 'video_preroll',
    budgetTier: 'PREMIUM',
    rotationStrategy: 'optimized',
    dailyBudget: 600,
    totalBudget: 18000,
    spent: 4200,
    impressions: 320000,
    clicks: 9600,
    conversions: 480,
    ctr: 3.0,
    cpc: 0.44,
    cpm: 13.13,
    roas: 5.8,
    viewabilityRate: 78,
    videoCompletionRate: 62,
    placements: ['homepage_hero', 'article_top'],
    startDate: '2025-01-20',
    endDate: '2025-03-20',
    aiScore: 94,
    createdAt: '2025-01-18',
    thumbnail: '🎬',
  },
  {
    id: 'C010',
    name: 'Chipper Cash Outstream Explainer',
    advertiser: 'Chipper Cash',
    advertiserEmail: 'ads@chippercash.com',
    advertiserCountry: 'Ghana',
    countryFlag: '🇬🇭',
    status: 'active',
    adType: 'video_outstream',
    budgetTier: 'STANDARD',
    rotationStrategy: 'pacing',
    dailyBudget: 250,
    totalBudget: 7500,
    spent: 1800,
    impressions: 210000,
    clicks: 4200,
    conversions: 168,
    ctr: 2.0,
    cpc: 0.43,
    cpm: 8.57,
    roas: 3.2,
    viewabilityRate: 65,
    videoCompletionRate: 48,
    placements: ['article_inline', 'feed_native'],
    startDate: '2025-01-25',
    endDate: '2025-02-25',
    aiScore: 86,
    createdAt: '2025-01-23',
    thumbnail: '📹',
  },
  {
    id: 'C011',
    name: 'Binance Rich Media Interactive Quiz',
    advertiser: 'Binance Africa',
    advertiserEmail: 'ads@binance-africa.com',
    advertiserCountry: 'Nigeria',
    countryFlag: '🇳🇬',
    status: 'active',
    adType: 'rich_media',
    budgetTier: 'PREMIUM',
    rotationStrategy: 'weighted',
    dailyBudget: 450,
    totalBudget: 13500,
    spent: 3600,
    impressions: 280000,
    clicks: 14000,
    conversions: 840,
    ctr: 5.0,
    cpc: 0.26,
    cpm: 12.86,
    roas: 6.2,
    viewabilityRate: 82,
    placements: ['homepage_hero', 'mobile_interstitial'],
    startDate: '2025-01-22',
    endDate: '2025-03-22',
    aiScore: 97,
    createdAt: '2025-01-20',
    thumbnail: '🎮',
  },
];

const mockApprovals: ApprovalItem[] = [
  {
    id: 'A001',
    campaignName: 'BuyCoins Referral Wave 2',
    advertiser: 'BuyCoins Nigeria',
    adType: 'post',
    submittedAt: '2025-01-28 14:30',
    budget: 6000,
    placements: ['feed_native', 'article_inline'],
    previewUrl: '#',
    aiReviewScore: 78,
    aiFlags: [],
  },
  {
    id: 'A002',
    campaignName: 'CryptoKE Flash Sale',
    advertiser: 'CryptoKE',
    adType: 'image',
    submittedAt: '2025-01-28 09:15',
    budget: 3200,
    placements: ['homepage_hero', 'article_top'],
    previewUrl: '#',
    aiReviewScore: 62,
    aiFlags: ['Unverified token mention detected', 'High-risk promise language'],
  },
  {
    id: 'A003',
    campaignName: 'EcoCash Crypto Bridge',
    advertiser: 'EcoCash Zimbabwe',
    adType: 'html5',
    submittedAt: '2025-01-27 17:45',
    budget: 8500,
    placements: ['mobile_interstitial', 'feed_native', 'sidebar_sticky'],
    previewUrl: '#',
    aiReviewScore: 91,
    aiFlags: [],
  },
];

const mockInventory: InventorySlot[] = [
  { id: 'INV01', location: 'homepage_hero', label: 'Homepage Hero Banner', avgTraffic: 85000, fillRate: 94, avgCPM: 12.50, activeCampaigns: 3, status: 'active', revenue24h: 1062.5, supportsVideo: true, supportsRichMedia: true },
  { id: 'INV02', location: 'article_top', label: 'Article Top Leaderboard', avgTraffic: 120000, fillRate: 88, avgCPM: 8.20, activeCampaigns: 5, status: 'active', revenue24h: 984.0, supportsRichMedia: true },
  { id: 'INV03', location: 'article_inline', label: 'Article Inline Native', avgTraffic: 95000, fillRate: 72, avgCPM: 6.80, activeCampaigns: 4, status: 'active', revenue24h: 646.0, supportsVideo: true },
  { id: 'INV04', location: 'article_bottom', label: 'Article Bottom Banner', avgTraffic: 78000, fillRate: 55, avgCPM: 4.20, activeCampaigns: 2, status: 'active', revenue24h: 327.6 },
  { id: 'INV05', location: 'sidebar_sticky', label: 'Sidebar Sticky (Desktop)', avgTraffic: 62000, fillRate: 91, avgCPM: 9.40, activeCampaigns: 3, status: 'active', revenue24h: 582.8, supportsRichMedia: true },
  { id: 'INV06', location: 'sidebar_scroll', label: 'Sidebar Scroll Unit', avgTraffic: 58000, fillRate: 64, avgCPM: 5.00, activeCampaigns: 2, status: 'active', revenue24h: 290.0 },
  { id: 'INV07', location: 'feed_native', label: 'Feed Native Card', avgTraffic: 140000, fillRate: 82, avgCPM: 7.60, activeCampaigns: 4, status: 'active', revenue24h: 1064.0, supportsVideo: true },
  { id: 'INV08', location: 'search_results', label: 'Search Results Sponsored', avgTraffic: 35000, fillRate: 48, avgCPM: 10.80, activeCampaigns: 1, status: 'active', revenue24h: 378.0 },
  { id: 'INV09', location: 'category_banner', label: 'Category Page Banner', avgTraffic: 42000, fillRate: 60, avgCPM: 5.50, activeCampaigns: 2, status: 'active', revenue24h: 231.0, supportsRichMedia: true },
  { id: 'INV10', location: 'mobile_interstitial', label: 'Mobile Interstitial', avgTraffic: 95000, fillRate: 35, avgCPM: 15.00, activeCampaigns: 1, status: 'active', revenue24h: 1425.0, supportsVideo: true, supportsRichMedia: true },
  { id: 'INV11', location: 'notification_bar', label: 'Notification Bar Strip', avgTraffic: 180000, fillRate: 40, avgCPM: 2.20, activeCampaigns: 1, status: 'active', revenue24h: 396.0 },
  { id: 'INV12', location: 'exit_intent', label: 'Exit Intent Popup', avgTraffic: 25000, fillRate: 28, avgCPM: 18.00, activeCampaigns: 1, status: 'paused', revenue24h: 0, supportsRichMedia: true },
  // ── Video Slots ──
  { id: 'INV13', location: 'video_preroll', label: 'Video Pre-Roll (15-30s)', avgTraffic: 72000, fillRate: 15, avgCPM: 22.50, activeCampaigns: 2, status: 'active', revenue24h: 1620.0, supportsVideo: true },
  { id: 'INV14', location: 'video_midroll', label: 'Video Mid-Roll (15-30s)', avgTraffic: 48000, fillRate: 10, avgCPM: 18.00, activeCampaigns: 1, status: 'active', revenue24h: 864.0, supportsVideo: true },
  { id: 'INV15', location: 'video_outstream', label: 'Outstream In-Article Video', avgTraffic: 110000, fillRate: 25, avgCPM: 14.00, activeCampaigns: 2, status: 'active', revenue24h: 1540.0, supportsVideo: true },
  // ── Additional Special Slots ──
  { id: 'INV16', location: 'homepage_hero', label: 'Homepage Video Hero (Outstream)', avgTraffic: 85000, fillRate: 18, avgCPM: 20.00, activeCampaigns: 1, status: 'active', revenue24h: 1530.0, supportsVideo: true, supportsRichMedia: true },
  { id: 'INV17', location: 'feed_native', label: 'Feed In-Feed Video Card', avgTraffic: 140000, fillRate: 22, avgCPM: 11.50, activeCampaigns: 1, status: 'active', revenue24h: 1610.0, supportsVideo: true },
  { id: 'INV18', location: 'mobile_interstitial', label: 'Mobile Video Interstitial (15s)', avgTraffic: 68000, fillRate: 12, avgCPM: 25.00, activeCampaigns: 1, status: 'active', revenue24h: 850.0, supportsVideo: true, supportsRichMedia: true },
];

// ─── Helpers ────────────────────────────────────────────
const formatNumber = (n: number) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

const formatCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatCurrencyDecimal = (n: number) => `$${n.toFixed(2)}`;

const statusColor: Record<CampaignStatus, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  pending: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-gray-500/20 text-gray-400',
  rejected: 'bg-red-500/20 text-red-400',
  draft: 'bg-purple-500/20 text-purple-400',
};

const tierColor: Record<BudgetTier, string> = {
  PREMIUM: 'bg-amber-500/20 text-amber-400',
  STANDARD: 'bg-blue-500/20 text-blue-400',
  LONG_TAIL: 'bg-gray-500/20 text-gray-400',
};

const adTypeIcon: Record<AdType, React.ReactNode> = {
  image: <Image className="w-4 h-4" />,
  animated_image: <Sparkles className="w-4 h-4" />,
  html5: <Code2 className="w-4 h-4" />,
  rich_media: <Clapperboard className="w-4 h-4" />,
  video: <Film className="w-4 h-4" />,
  video_preroll: <Video className="w-4 h-4" />,
  video_outstream: <MonitorPlay className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
  post: <MessageSquare className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
};

// ─── Component ──────────────────────────────────────────
export default function SuperAdminAdsManagement() {
  const { user: admin } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<BudgetTier | 'all'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ─── Computed stats ────────────────────────────────────
  const stats = useMemo(() => {
    const active = mockCampaigns.filter(c => c.status === 'active');
    const totalSpent = mockCampaigns.reduce((s, c) => s + c.spent, 0);
    const totalImpressions = mockCampaigns.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = mockCampaigns.reduce((s, c) => s + c.clicks, 0);
    const totalConversions = mockCampaigns.reduce((s, c) => s + c.conversions, 0);
    const totalBudget = mockCampaigns.reduce((s, c) => s + c.totalBudget, 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgROAS = active.length > 0 ? active.reduce((s, c) => s + c.roas, 0) / active.length : 0;
    const pendingApprovals = mockApprovals.length;
    const inventoryFillRate = mockInventory.reduce((s, i) => s + i.fillRate, 0) / mockInventory.length;
    const dailyRevenue = mockInventory.reduce((s, i) => s + i.revenue24h, 0);

    return {
      activeCampaigns: active.length,
      totalCampaigns: mockCampaigns.length,
      totalSpent,
      totalBudget,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCTR,
      avgROAS,
      pendingApprovals,
      inventoryFillRate,
      dailyRevenue,
    };
  }, []);

  const filteredCampaigns = useMemo(() => {
    return mockCampaigns.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (tierFilter !== 'all' && c.budgetTier !== tierFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.advertiser.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, statusFilter, tierFilter]);

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Super Admin credentials required.</p>
        </div>
      </div>
    );
  }

  const openCampaignDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetailModal(true);
  };

  // ─── Tabs ─────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'campaigns', label: 'All Campaigns', icon: <Megaphone className="w-4 h-4" />, count: stats.totalCampaigns },
    { key: 'approvals', label: 'Pending Approvals', icon: <Clock className="w-4 h-4" />, count: stats.pendingApprovals },
    { key: 'inventory', label: 'Ad Inventory', icon: <Layers className="w-4 h-4" />, count: mockInventory.length },
    { key: 'ai-insights', label: 'AI Insights', icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 lg:p-8">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-orange-500" />
            Ads Management &amp; Rotation
          </h1>
          <p className="text-gray-400 mt-1">
            AI-powered ad engine &bull; DeepSeek R1 optimization &bull; Real-time rotation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Sync Agent
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
            <Activity className="w-4 h-4 animate-pulse" /> Agent Online
          </div>
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-gray-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Content ────────────────────────────────────────── */}
      {activeTab === 'overview' && <OverviewTab stats={stats} campaigns={mockCampaigns} inventory={mockInventory} />}
      {activeTab === 'campaigns' && (
        <CampaignsTab
          campaigns={filteredCampaigns}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
          onViewCampaign={openCampaignDetail}
        />
      )}
      {activeTab === 'approvals' && <ApprovalsTab approvals={mockApprovals} />}
      {activeTab === 'inventory' && <InventoryTab inventory={mockInventory} />}
      {activeTab === 'ai-insights' && <AIInsightsTab campaigns={mockCampaigns} inventory={mockInventory} />}

      {/* ─── Campaign Detail Modal ──────────────────────────── */}
      {showDetailModal && selectedCampaign && (
        <CampaignDetailModal campaign={selectedCampaign} onClose={() => setShowDetailModal(false)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  OVERVIEW TAB
// ═══════════════════════════════════════════════════════════
function OverviewTab({
  stats,
  campaigns,
  inventory,
}: {
  stats: ReturnType<typeof Object>;
  campaigns: Campaign[];
  inventory: InventorySlot[];
}) {
  const s = stats as any;

  const kpiCards = [
    { label: 'Active Campaigns', value: s.activeCampaigns, icon: <Megaphone className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/10', change: '+3', up: true },
    { label: 'Total Impressions', value: formatNumber(s.totalImpressions), icon: <Eye className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10', change: '+12.4%', up: true },
    { label: 'Total Clicks', value: formatNumber(s.totalClicks), icon: <MousePointerClick className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10', change: '+8.7%', up: true },
    { label: 'Avg CTR', value: `${s.avgCTR.toFixed(2)}%`, icon: <Target className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', change: '+0.15%', up: true },
    { label: 'Total Revenue', value: formatCurrency(s.totalSpent), icon: <DollarSign className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: '+18.2%', up: true },
    { label: 'Daily Revenue (24h)', value: formatCurrency(s.dailyRevenue), icon: <Wallet className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', change: '+5.3%', up: true },
    { label: 'Avg ROAS', value: `${s.avgROAS.toFixed(1)}x`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500/10', change: '+0.4x', up: true },
    { label: 'Inventory Fill Rate', value: `${s.inventoryFillRate.toFixed(0)}%`, icon: <Gauge className="w-5 h-5" />, color: 'text-rose-400', bg: 'bg-rose-500/10', change: '-2.1%', up: false },
    { label: 'Pending Approvals', value: s.pendingApprovals, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', change: '+1', up: false },
    { label: 'Total Conversions', value: formatNumber(s.totalConversions), icon: <Sparkles className="w-5 h-5" />, color: 'text-pink-400', bg: 'bg-pink-500/10', change: '+22.6%', up: true },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Agent Health & Top Performing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Health Panel */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" /> DeepSeek R1 Agent Health
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Agent Status', value: 'Online', status: 'green' },
              { label: 'Model', value: 'deepseek-r1:8b', status: 'blue' },
              { label: 'Avg Latency', value: '42ms', status: 'green' },
              { label: 'Decisions/min', value: '2,847', status: 'green' },
              { label: 'Optimization Score', value: '94/100', status: 'green' },
              { label: 'Uptime', value: '99.97%', status: 'green' },
              { label: 'Queue Depth', value: '12 tasks', status: 'yellow' },
              { label: 'Memory Usage', value: '3.2 GB / 8 GB', status: 'yellow' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{item.label}</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                  item.status === 'green' ? 'bg-green-500/20 text-green-400' :
                  item.status === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Campaigns */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-orange-400" /> Top Performing Campaigns
          </h3>
          <div className="space-y-3">
            {campaigns
              .filter(c => c.status === 'active')
              .sort((a, b) => b.roas - a.roas)
              .slice(0, 5)
              .map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-lg font-bold text-gray-500 w-6">#{i + 1}</span>
                  <span className="text-2xl">{c.thumbnail}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.advertiser} {c.countryFlag}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">{c.roas}x ROAS</div>
                    <div className="text-xs text-gray-400">{c.ctr}% CTR</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Budget Allocation by Tier */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" /> Budget Allocation by Tier
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['PREMIUM', 'STANDARD', 'LONG_TAIL'] as BudgetTier[]).map(tier => {
            const tierCampaigns = campaigns.filter(c => c.budgetTier === tier);
            const tierSpent = tierCampaigns.reduce((s, c) => s + c.spent, 0);
            const tierBudget = tierCampaigns.reduce((s, c) => s + c.totalBudget, 0);
            const pct = tierBudget > 0 ? (tierSpent / tierBudget) * 100 : 0;
            return (
              <div key={tier} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierColor[tier]}`}>{tier}</span>
                  <span className="text-sm text-gray-400">{tierCampaigns.length} campaigns</span>
                </div>
                <div className="text-xl font-bold mb-1">{formatCurrency(tierSpent)}</div>
                <div className="text-xs text-gray-400 mb-3">of {formatCurrency(tierBudget)} budget</div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      tier === 'PREMIUM' ? 'bg-amber-500' : tier === 'STANDARD' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{pct.toFixed(1)}% utilized</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Heatmap */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" /> Inventory Performance Heatmap
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {inventory.map(slot => {
            const intensity =
              slot.fillRate > 80 ? 'border-green-500 bg-green-500/10' :
              slot.fillRate > 50 ? 'border-yellow-500 bg-yellow-500/10' :
              'border-red-500 bg-red-500/10';
            return (
              <div key={slot.id} className={`rounded-lg p-3 border ${intensity}`}>
                <div className="text-sm font-medium truncate">{slot.label}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">Fill: {slot.fillRate}%</span>
                  <span className="text-xs font-medium text-emerald-400">{formatCurrencyDecimal(slot.avgCPM)} CPM</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{formatNumber(slot.avgTraffic)} imp/day</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CAMPAIGNS TAB
// ═══════════════════════════════════════════════════════════
function CampaignsTab({
  campaigns,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  tierFilter,
  setTierFilter,
  onViewCampaign,
}: {
  campaigns: Campaign[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: CampaignStatus | 'all';
  setStatusFilter: (s: CampaignStatus | 'all') => void;
  tierFilter: BudgetTier | 'all';
  setTierFilter: (t: BudgetTier | 'all') => void;
  onViewCampaign: (c: Campaign) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by campaign name, advertiser, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-orange-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value as BudgetTier | 'all')}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-orange-500 focus:outline-none"
        >
          <option value="all">All Tiers</option>
          <option value="PREMIUM">Premium</option>
          <option value="STANDARD">Standard</option>
          <option value="LONG_TAIL">Long Tail</option>
        </select>
      </div>

      {/* Campaigns Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Advertiser</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-right">Budget</th>
              <th className="px-4 py-3 font-medium text-right">Spent</th>
              <th className="px-4 py-3 font-medium text-right">Impressions</th>
              <th className="px-4 py-3 font-medium text-right">CTR</th>
              <th className="px-4 py-3 font-medium text-right">ROAS</th>
              <th className="px-4 py-3 font-medium text-right">Viewability</th>
              <th className="px-4 py-3 font-medium text-right">AI Score</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.thumbnail}</span>
                    <div>
                      <div className="font-medium text-white">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-white">{c.advertiser}</div>
                  <div className="text-xs text-gray-500">{c.countryFlag} {c.advertiserCountry}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierColor[c.budgetTier]}`}>
                    {c.budgetTier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    {adTypeIcon[c.adType]}
                    <span className="text-xs">{c.adType}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.totalBudget)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="font-medium">{formatCurrency(c.spent)}</div>
                  <div className="text-xs text-gray-500">{c.totalBudget > 0 ? ((c.spent / c.totalBudget) * 100).toFixed(0) : 0}%</div>
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(c.impressions)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={c.ctr >= 1.5 ? 'text-green-400' : c.ctr >= 1.0 ? 'text-yellow-400' : 'text-gray-400'}>
                    {c.ctr}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={c.roas >= 4.0 ? 'text-green-400 font-bold' : c.roas >= 2.5 ? 'text-yellow-400' : 'text-gray-400'}>
                    {c.roas > 0 ? `${c.roas}x` : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.viewabilityRate ? (
                    <div>
                      <span className={c.viewabilityRate >= 70 ? 'text-green-400' : c.viewabilityRate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                        {c.viewabilityRate}%
                      </span>
                      {c.videoCompletionRate !== undefined && (
                        <div className="text-xs text-gray-500 flex items-center justify-end gap-0.5">
                          <Film className="w-3 h-3" /> {c.videoCompletionRate}% VCR
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {c.aiScore > 0 ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.aiScore >= 90 ? 'bg-green-500/20 text-green-400' :
                      c.aiScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {c.aiScore}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onViewCampaign(c)}
                      className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {c.status === 'active' && (
                      <button className="p-1.5 hover:bg-yellow-500/20 rounded text-gray-400 hover:text-yellow-400 transition-colors" title="Pause">
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {c.status === 'paused' && (
                      <button className="p-1.5 hover:bg-green-500/20 rounded text-gray-400 hover:text-green-400 transition-colors" title="Resume">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {(c.status === 'active' || c.status === 'paused') && (
                      <button className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors" title="Cancel">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No campaigns match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APPROVALS TAB
// ═══════════════════════════════════════════════════════════
function ApprovalsTab({ approvals }: { approvals: ApprovalItem[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Ad Approvals
          <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
            {approvals.length} pending
          </span>
        </h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors">
          <CheckCircle className="w-4 h-4" /> Approve All Safe
        </button>
      </div>

      <div className="space-y-4">
        {approvals.map(item => (
          <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Ad Preview Placeholder */}
              <div className="w-full lg:w-64 h-40 bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                <div className="text-center text-gray-500">
                  {adTypeIcon[item.adType]}
                  <div className="text-xs mt-2">Ad Preview ({item.adType})</div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold">{item.campaignName}</h4>
                    <p className="text-sm text-gray-400 mt-1">by {item.advertiser}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold">{formatCurrency(item.budget)}</div>
                    <div className="text-xs text-gray-400">total budget</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <div className="text-xs text-gray-400">Ad Type</div>
                    <div className="flex items-center gap-1.5 mt-1 text-sm">
                      {adTypeIcon[item.adType]}
                      {item.adType}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Submitted</div>
                    <div className="text-sm mt-1">{item.submittedAt}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Placements</div>
                    <div className="text-sm mt-1">{item.placements.length} slots</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">AI Review Score</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      item.aiReviewScore >= 80 ? 'bg-green-500/20 text-green-400' :
                      item.aiReviewScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {item.aiReviewScore}/100
                    </span>
                  </div>
                </div>

                {/* AI Flags */}
                {item.aiFlags.length > 0 && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" /> AI Moderation Flags
                    </div>
                    <ul className="space-y-1">
                      {item.aiFlags.map((flag, i) => (
                        <li key={i} className="text-sm text-red-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.aiFlags.length === 0 && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <ShieldCheck className="w-4 h-4" /> AI Review: No issues detected — safe to approve
                    </div>
                  </div>
                )}

                {/* Placements */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {item.placements.map(p => (
                    <span key={p} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-6">
                  <button className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors">
                    <CheckCircle className="w-4 h-4" /> Approve &amp; Deploy
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                    <Brain className="w-4 h-4" /> Re-run AI Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {approvals.length === 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium">All Clear!</p>
          <p className="text-gray-400 mt-1">No pending approvals at this time.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  INVENTORY TAB
// ═══════════════════════════════════════════════════════════
function InventoryTab({ inventory }: { inventory: InventorySlot[] }) {
  const totalRevenue = inventory.reduce((s, i) => s + i.revenue24h, 0);
  const avgFill = inventory.reduce((s, i) => s + i.fillRate, 0) / inventory.length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Total Slots</div>
          <div className="text-2xl font-bold mt-1">{inventory.length}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Active Slots</div>
          <div className="text-2xl font-bold mt-1 text-green-400">{inventory.filter(s => s.status === 'active').length}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Avg Fill Rate</div>
          <div className="text-2xl font-bold mt-1 text-blue-400">{avgFill.toFixed(0)}%</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Daily Revenue</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">Slot</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium text-right">Avg Traffic</th>
              <th className="px-4 py-3 font-medium text-right">Fill Rate</th>
              <th className="px-4 py-3 font-medium text-right">Avg CPM</th>
              <th className="px-4 py-3 font-medium text-right">Active Campaigns</th>
              <th className="px-4 py-3 font-medium text-right">Revenue (24h)</th>
              <th className="px-4 py-3 font-medium text-center">Formats</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(slot => (
              <tr key={slot.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{slot.label}</div>
                  <div className="text-xs text-gray-500">{slot.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                    {slot.location.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(slot.avgTraffic)}/day</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-600 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          slot.fillRate > 80 ? 'bg-green-500' :
                          slot.fillRate > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${slot.fillRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{slot.fillRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrencyDecimal(slot.avgCPM)}</td>
                <td className="px-4 py-3 text-right">{slot.activeCampaigns}</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-400">{formatCurrency(slot.revenue24h)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400" title="Image">IMG</span>
                    {slot.supportsVideo && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400" title="Video">VID</span>
                    )}
                    {slot.supportsRichMedia && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400" title="Rich Media">RICH</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    slot.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    slot.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {slot.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors" title="Settings">
                      <Settings className="w-4 h-4" />
                    </button>
                    {slot.status === 'active' ? (
                      <button className="p-1.5 hover:bg-yellow-500/20 rounded text-gray-400 hover:text-yellow-400 transition-colors" title="Pause">
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="p-1.5 hover:bg-green-500/20 rounded text-gray-400 hover:text-green-400 transition-colors" title="Activate">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  AI INSIGHTS TAB
// ═══════════════════════════════════════════════════════════
function AIInsightsTab({ campaigns, inventory }: { campaigns: Campaign[]; inventory: InventorySlot[] }) {
  const insights = [
    {
      type: 'optimization',
      title: 'Increase Mobile Interstitial Fill Rate',
      description: 'Mobile interstitial slot has only 35% fill rate but the highest CPM ($15.00). Recommend prioritizing this slot for PREMIUM tier campaigns to maximize revenue.',
      impact: 'High',
      impactColor: 'text-red-400 bg-red-500/10',
      estimatedGain: '+$2,400/mo',
    },
    {
      type: 'budget',
      title: 'Reallocate Budget: Quidax Campaign Underperforming',
      description: 'Campaign C003 "Quidax Welcome Bonus" has ROAS of 2.9x vs platform avg of 4.1x. Suggest pausing and reallocating budget to higher-performing feed_native placements.',
      impact: 'Medium',
      impactColor: 'text-yellow-400 bg-yellow-500/10',
      estimatedGain: '+$800/mo',
    },
    {
      type: 'placement',
      title: 'Article Bottom Slot Needs Attention',
      description: 'article_bottom has 55% fill rate with declining CPM. Consider bundling with article_top at a discount or implementing scroll-triggered lazy-load to boost viewability.',
      impact: 'Medium',
      impactColor: 'text-yellow-400 bg-yellow-500/10',
      estimatedGain: '+$500/mo',
    },
    {
      type: 'new_opportunity',
      title: 'Enable Exit Intent Slot',
      description: 'Exit intent popup is currently paused but historically showed high conversion rates (2.8%). Re-enable with frequency cap of 1/session for PREMIUM campaigns.',
      impact: 'High',
      impactColor: 'text-red-400 bg-red-500/10',
      estimatedGain: '+$1,800/mo',
    },
    {
      type: 'rotation',
      title: 'Switch Luno Campaign to Pacing Strategy',
      description: 'Campaign C002 uses weighted rotation but traffic peaks at 14:00-18:00 WAT. Switching to pacing with dayparting would improve CTR by an estimated 15%.',
      impact: 'Low',
      impactColor: 'text-blue-400 bg-blue-500/10',
      estimatedGain: '+$300/mo',
    },
    {
      type: 'fraud',
      title: 'Anomalous Click Pattern Detected',
      description: 'Search results slot showing 2.4x normal CTR from Abuja IP range. Recommend enabling fraud filter and excluding suspect IPs from C002 metrics.',
      impact: 'High',
      impactColor: 'text-red-400 bg-red-500/10',
      estimatedGain: 'Prevent $1,200 loss',
    },
  ];

  const typeIcons: Record<string, React.ReactNode> = {
    optimization: <Rocket className="w-5 h-5 text-purple-400" />,
    budget: <DollarSign className="w-5 h-5 text-emerald-400" />,
    placement: <Layers className="w-5 h-5 text-blue-400" />,
    new_opportunity: <Sparkles className="w-5 h-5 text-amber-400" />,
    rotation: <RefreshCw className="w-5 h-5 text-cyan-400" />,
    fraud: <AlertTriangle className="w-5 h-5 text-red-400" />,
  };

  return (
    <div className="space-y-6">
      {/* AI Engine Summary */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold">DeepSeek R1 Ad Intelligence</h3>
            <p className="text-sm text-gray-400">Real-time AI-powered optimization insights &bull; Last analyzed: 3 min ago</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Optimization Score</div>
            <div className="text-2xl font-bold text-green-400 mt-1">94<span className="text-sm text-gray-500">/100</span></div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Active Insights</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{insights.length}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Est. Monthly Gain</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">$7,000</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Decisions Today</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">4,092</div>
          </div>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gray-700 rounded-lg shrink-0">
                {typeIcons[insight.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${insight.impactColor}`}>
                    {insight.impact} Impact
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{insight.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-emerald-400">{insight.estimatedGain}</span>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 rounded-lg text-xs font-medium transition-colors">
                    <Zap className="w-3.5 h-3.5" /> Apply Recommendation
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rotation Strategy Performance */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-400" /> Rotation Strategy Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(['sequential', 'random', 'optimized', 'even', 'weighted', 'pacing'] as RotationStrategy[]).map(strategy => {
            const strategyCampaigns = campaigns.filter(c => c.rotationStrategy === strategy);
            const avgCTR = strategyCampaigns.length > 0
              ? strategyCampaigns.reduce((s, c) => s + c.ctr, 0) / strategyCampaigns.length
              : 0;
            const avgROAS = strategyCampaigns.length > 0
              ? strategyCampaigns.reduce((s, c) => s + c.roas, 0) / strategyCampaigns.length
              : 0;
            return (
              <div key={strategy} className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 capitalize mb-2">{strategy}</div>
                <div className="text-lg font-bold">{avgCTR.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">avg CTR</div>
                <div className="text-sm font-medium text-emerald-400 mt-1">{avgROAS.toFixed(1)}x</div>
                <div className="text-xs text-gray-500">avg ROAS</div>
                <div className="text-xs text-gray-400 mt-2">{strategyCampaigns.length} campaigns</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CAMPAIGN DETAIL MODAL
// ═══════════════════════════════════════════════════════════
function CampaignDetailModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const c = campaign;
  const budgetUtilization = c.totalBudget > 0 ? (c.spent / c.totalBudget) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{c.thumbnail}</span>
              <div>
                <h2 className="text-xl font-bold">{c.name}</h2>
                <p className="text-sm text-gray-400">{c.advertiser} {c.countryFlag} &bull; {c.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status & Meta */}
          <div className="flex flex-wrap gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[c.status]}`}>{c.status}</span>
            <span className={`px-3 py-1 rounded text-sm font-medium ${tierColor[c.budgetTier]}`}>{c.budgetTier}</span>
            <span className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 flex items-center gap-1.5">
              {adTypeIcon[c.adType]} {c.adType}
            </span>
            <span className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300">
              Rotation: {c.rotationStrategy}
            </span>
            {c.aiScore > 0 && (
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                c.aiScore >= 90 ? 'bg-green-500/20 text-green-400' :
                c.aiScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                AI Score: {c.aiScore}/100
              </span>
            )}
          </div>

          {/* Budget */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Budget Utilization</span>
              <span className="text-sm font-medium">{formatCurrency(c.spent)} / {formatCurrency(c.totalBudget)}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  budgetUtilization > 90 ? 'bg-red-500' :
                  budgetUtilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{budgetUtilization.toFixed(1)}% used</span>
              <span>Daily: {formatCurrency(c.dailyBudget)}/day</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Impressions', value: formatNumber(c.impressions), icon: <Eye className="w-4 h-4 text-blue-400" /> },
              { label: 'Clicks', value: formatNumber(c.clicks), icon: <MousePointerClick className="w-4 h-4 text-purple-400" /> },
              { label: 'Conversions', value: formatNumber(c.conversions), icon: <Sparkles className="w-4 h-4 text-pink-400" /> },
              { label: 'CTR', value: `${c.ctr}%`, icon: <Target className="w-4 h-4 text-cyan-400" /> },
              { label: 'CPC', value: formatCurrencyDecimal(c.cpc), icon: <MousePointerClick className="w-4 h-4 text-amber-400" /> },
              { label: 'CPM', value: formatCurrencyDecimal(c.cpm), icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
              { label: 'ROAS', value: c.roas > 0 ? `${c.roas}x` : 'N/A', icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
              { label: 'Total Spent', value: formatCurrency(c.spent), icon: <DollarSign className="w-4 h-4 text-orange-400" /> },
              ...(c.viewabilityRate !== undefined ? [{ label: 'Viewability', value: `${c.viewabilityRate}%`, icon: <Eye className="w-4 h-4 text-teal-400" /> }] : []),
              ...(c.videoCompletionRate !== undefined ? [{ label: 'Video VCR', value: `${c.videoCompletionRate}%`, icon: <Film className="w-4 h-4 text-indigo-400" /> }] : []),
            ].map((metric, i) => (
              <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">{metric.icon}{metric.label}</div>
                <div className="text-lg font-bold">{metric.value}</div>
              </div>
            ))}
          </div>

          {/* Placements */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Active Placements</div>
            <div className="flex flex-wrap gap-2">
              {c.placements.map(p => (
                <span key={p} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-lg text-sm">
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Start Date</div>
              <div className="text-sm font-medium">{c.startDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">End Date</div>
              <div className="text-sm font-medium">{c.endDate}</div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Advertiser Contact</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                {c.advertiser.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{c.advertiser}</div>
                <div className="text-sm text-gray-400">{c.advertiserEmail}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-700 flex items-center gap-3">
          {c.status === 'active' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm font-medium transition-colors">
              <Pause className="w-4 h-4" /> Pause Campaign
            </button>
          )}
          {c.status === 'paused' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors">
              <Play className="w-4 h-4" /> Resume Campaign
            </button>
          )}
          {(c.status === 'active' || c.status === 'paused') && (
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors">
              <Ban className="w-4 h-4" /> Cancel Campaign
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors ml-auto">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
