/**
 * Affiliate Management Dashboard
 * Manage affiliates, track commissions, approve payouts, view performance analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Ban,
  UserCheck,
  UserX,
  Copy,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Wallet,
  Send,
  Shield,
  Star,
  Award,
  FileText,
  Globe,
  Link2,
} from 'lucide-react';

// ---- Types ----
interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingApplications: number;
  suspendedAffiliates: number;
  totalCommissionsEarned: number;
  totalCommissionsPaid: number;
  pendingPayouts: number;
  averageConversionRate: number;
  totalReferrals: number;
  totalRevenue: number;
  monthlyGrowth: number;
  topProduct: string;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  tier: 'bronze' | 'silver' | 'gold';
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  referrals: number;
  conversions: number;
  conversionRate: number;
  totalEarned: number;
  pendingPayout: number;
  lastPayout: string;
  payoutMethod: string;
  joinedAt: string;
  country: string;
  topProduct: string;
}

interface PayoutRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';
  requestedAt: string;
  processedAt?: string;
}

interface CommissionLog {
  id: string;
  affiliateId: string;
  affiliateName: string;
  product: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'reversed';
  createdAt: string;
  customerEmail: string;
}

interface AffiliateApplication {
  id: string;
  name: string;
  email: string;
  country: string;
  audienceSize: string;
  promotionMethod: string;
  reason: string;
  sites: { url: string; type: string }[];
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

// ---- Mock Data ----
const mockStats: AffiliateStats = {
  totalAffiliates: 342,
  activeAffiliates: 278,
  pendingApplications: 18,
  suspendedAffiliates: 7,
  totalCommissionsEarned: 48520,
  totalCommissionsPaid: 39200,
  pendingPayouts: 9320,
  averageConversionRate: 12.4,
  totalReferrals: 15680,
  totalRevenue: 198400,
  monthlyGrowth: 14.2,
  topProduct: 'Pro Membership',
};

const mockAffiliates: Affiliate[] = [
  { id: 'AFF-001', name: 'Chinedu Okafor', email: 'chinedu@cryptoNG.com', referralCode: 'CHINEDU20', tier: 'gold', status: 'active', referrals: 245, conversions: 82, conversionRate: 33.5, totalEarned: 8450, pendingPayout: 1240, lastPayout: '2026-02-15', payoutMethod: 'USDT TRC-20', joinedAt: '2025-06-12', country: 'Nigeria', topProduct: 'Pro Membership' },
  { id: 'AFF-002', name: 'Amina Wanjiku', email: 'amina@kenyacrypto.co.ke', referralCode: 'AMINA25', tier: 'gold', status: 'active', referrals: 198, conversions: 71, conversionRate: 35.9, totalEarned: 7120, pendingPayout: 890, lastPayout: '2026-02-10', payoutMethod: 'M-Pesa', joinedAt: '2025-07-03', country: 'Kenya', topProduct: 'Enterprise Sub' },
  { id: 'AFF-003', name: 'Kwame Asante', email: 'kwame@ghcrypto.com', referralCode: 'KWAME30', tier: 'silver', status: 'active', referrals: 134, conversions: 38, conversionRate: 28.4, totalEarned: 3960, pendingPayout: 520, lastPayout: '2026-02-08', payoutMethod: 'Bank Transfer', joinedAt: '2025-08-15', country: 'Ghana', topProduct: 'API Developer' },
  { id: 'AFF-004', name: 'Thabo Molefe', email: 'thabo@sacrypto.co.za', referralCode: 'THABO22', tier: 'silver', status: 'active', referrals: 112, conversions: 29, conversionRate: 25.9, totalEarned: 2870, pendingPayout: 440, lastPayout: '2026-01-28', payoutMethod: 'Bank Transfer', joinedAt: '2025-09-01', country: 'South Africa', topProduct: 'Pro Membership' },
  { id: 'AFF-005', name: 'Fatima Bello', email: 'fatima@coinreview.ng', referralCode: 'FATIMA15', tier: 'bronze', status: 'active', referrals: 67, conversions: 12, conversionRate: 17.9, totalEarned: 1080, pendingPayout: 280, lastPayout: '2026-01-20', payoutMethod: 'USDT TRC-20', joinedAt: '2025-10-10', country: 'Nigeria', topProduct: 'Marketplace' },
  { id: 'AFF-006', name: 'Emmanuel Addo', email: 'emmanuel@tradegh.io', referralCode: 'EMMA10', tier: 'bronze', status: 'active', referrals: 45, conversions: 8, conversionRate: 17.8, totalEarned: 640, pendingPayout: 190, lastPayout: '2026-01-15', payoutMethod: 'Bank Transfer', joinedAt: '2025-11-05', country: 'Ghana', topProduct: 'Pro Membership' },
  { id: 'AFF-007', name: 'Ngozi Eze', email: 'ngozi@blockng.com', referralCode: 'NGOZI99', tier: 'bronze', status: 'pending', referrals: 0, conversions: 0, conversionRate: 0, totalEarned: 0, pendingPayout: 0, lastPayout: '-', payoutMethod: 'USDT TRC-20', joinedAt: '2026-02-25', country: 'Nigeria', topProduct: '-' },
  { id: 'AFF-008', name: 'Samuel Mwangi', email: 'sam@kenycoin.co.ke', referralCode: 'SAM2026', tier: 'bronze', status: 'pending', referrals: 0, conversions: 0, conversionRate: 0, totalEarned: 0, pendingPayout: 0, lastPayout: '-', payoutMethod: 'M-Pesa', joinedAt: '2026-02-24', country: 'Kenya', topProduct: '-' },
  { id: 'AFF-009', name: 'David Mutua', email: 'david@spamaffiliate.xyz', referralCode: 'DSPAM', tier: 'bronze', status: 'suspended', referrals: 320, conversions: 2, conversionRate: 0.6, totalEarned: 120, pendingPayout: 0, lastPayout: '2025-12-01', payoutMethod: 'BTC', joinedAt: '2025-08-20', country: 'Kenya', topProduct: '-' },
  { id: 'AFF-010', name: 'Yemi Alade', email: 'yemi@defimusic.ng', referralCode: 'YEMI50', tier: 'silver', status: 'active', referrals: 89, conversions: 25, conversionRate: 28.1, totalEarned: 2340, pendingPayout: 670, lastPayout: '2026-02-12', payoutMethod: 'USDT TRC-20', joinedAt: '2025-09-18', country: 'Nigeria', topProduct: 'ECO Course' },
];

const mockPayouts: PayoutRequest[] = [
  { id: 'PAY-001', affiliateId: 'AFF-001', affiliateName: 'Chinedu Okafor', amount: 1240, currency: 'USDT', method: 'USDT TRC-20', destination: 'TXyz...abc', status: 'pending', requestedAt: '2026-02-25T10:30:00Z' },
  { id: 'PAY-002', affiliateId: 'AFF-002', affiliateName: 'Amina Wanjiku', amount: 890, currency: 'KES', method: 'M-Pesa', destination: '+254712***890', status: 'pending', requestedAt: '2026-02-24T14:20:00Z' },
  { id: 'PAY-003', affiliateId: 'AFF-003', affiliateName: 'Kwame Asante', amount: 520, currency: 'USD', method: 'Bank Transfer', destination: 'GH ***4521', status: 'approved', requestedAt: '2026-02-23T09:00:00Z', processedAt: '2026-02-24T16:00:00Z' },
  { id: 'PAY-004', affiliateId: 'AFF-010', affiliateName: 'Yemi Alade', amount: 670, currency: 'USDT', method: 'USDT TRC-20', destination: 'TQrs...def', status: 'processing', requestedAt: '2026-02-22T11:45:00Z', processedAt: '2026-02-23T08:30:00Z' },
  { id: 'PAY-005', affiliateId: 'AFF-004', affiliateName: 'Thabo Molefe', amount: 440, currency: 'ZAR', method: 'Bank Transfer', destination: 'SA ***7890', status: 'paid', requestedAt: '2026-02-18T12:00:00Z', processedAt: '2026-02-20T10:00:00Z' },
];

const mockCommissions: CommissionLog[] = [
  { id: 'COM-001', affiliateId: 'AFF-001', affiliateName: 'Chinedu Okafor', product: 'Pro Membership', saleAmount: 29, commissionRate: 30, commissionAmount: 8.70, status: 'confirmed', createdAt: '2026-02-26T08:12:00Z', customerEmail: 'new***@gmail.com' },
  { id: 'COM-002', affiliateId: 'AFF-002', affiliateName: 'Amina Wanjiku', product: 'Enterprise Sub', saleAmount: 199, commissionRate: 25, commissionAmount: 49.75, status: 'confirmed', createdAt: '2026-02-26T06:45:00Z', customerEmail: 'biz***@yahoo.com' },
  { id: 'COM-003', affiliateId: 'AFF-001', affiliateName: 'Chinedu Okafor', product: 'API Developer', saleAmount: 49, commissionRate: 30, commissionAmount: 14.70, status: 'pending', createdAt: '2026-02-25T22:30:00Z', customerEmail: 'dev***@mail.com' },
  { id: 'COM-004', affiliateId: 'AFF-010', affiliateName: 'Yemi Alade', product: 'ECO Course', saleAmount: 79, commissionRate: 25, commissionAmount: 19.75, status: 'confirmed', createdAt: '2026-02-25T15:00:00Z', customerEmail: 'learn***@pm.me' },
  { id: 'COM-005', affiliateId: 'AFF-005', affiliateName: 'Fatima Bello', product: 'Pro Membership', saleAmount: 29, commissionRate: 20, commissionAmount: 5.80, status: 'pending', createdAt: '2026-02-25T12:10:00Z', customerEmail: 'user***@gmail.com' },
  { id: 'COM-006', affiliateId: 'AFF-003', affiliateName: 'Kwame Asante', product: 'API Business', saleAmount: 199, commissionRate: 25, commissionAmount: 49.75, status: 'paid', createdAt: '2026-02-24T09:20:00Z', customerEmail: 'corp***@gh.com' },
  { id: 'COM-007', affiliateId: 'AFF-009', affiliateName: 'David Mutua', product: 'Pro Membership', saleAmount: 29, commissionRate: 20, commissionAmount: 5.80, status: 'reversed', createdAt: '2026-02-23T18:00:00Z', customerEmail: 'fake***@temp.com' },
];

const mockApplications: AffiliateApplication[] = [
  {
    id: 'APP-001', name: 'Ngozi Eze', email: 'ngozi@blockng.com', country: 'Nigeria', audienceSize: '10000-50000', promotionMethod: 'blog',
    reason: 'I run a crypto news blog focused on West African markets. I have 25K monthly readers and want to monetize my content through affiliate links.',
    sites: [
      { url: 'https://blockng.com', type: 'website' },
      { url: 'https://twitter.com/ngoziblockng', type: 'twitter' },
      { url: 'https://t.me/blockngcommunity', type: 'telegram' },
    ],
    status: 'pending', appliedAt: '2026-02-25T14:30:00Z',
  },
  {
    id: 'APP-002', name: 'Samuel Mwangi', email: 'sam@kenycoin.co.ke', country: 'Kenya', audienceSize: '1000-10000', promotionMethod: 'youtube',
    reason: 'I make YouTube tutorials on crypto for East African audiences. I explain exchange comparisons and want to promote CoinDaily tools.',
    sites: [
      { url: 'https://youtube.com/@samcryptoKE', type: 'youtube' },
      { url: 'https://tiktok.com/@samcryptoke', type: 'tiktok' },
    ],
    status: 'pending', appliedAt: '2026-02-24T09:15:00Z',
  },
  {
    id: 'APP-003', name: 'Grace Mensah', email: 'grace@cryptoqueen.gh', country: 'Ghana', audienceSize: '50000+', promotionMethod: 'twitter',
    reason: 'I am a crypto influencer with 60K+ followers. I regularly tweet about African crypto adoption and do Twitter Spaces on DeFi.',
    sites: [
      { url: 'https://twitter.com/cryptoqueengh', type: 'twitter' },
      { url: 'https://instagram.com/cryptoqueengh', type: 'instagram' },
      { url: 'https://cryptoqueen.gh/blog', type: 'blog' },
      { url: 'https://youtube.com/@cryptoqueengh', type: 'youtube' },
    ],
    status: 'pending', appliedAt: '2026-02-23T18:45:00Z',
  },
  {
    id: 'APP-004', name: 'Ibrahim Diallo', email: 'ibrahim@dakartech.sn', country: 'Senegal', audienceSize: '<1000', promotionMethod: 'telegram',
    reason: 'I run a small Telegram group for French-speaking crypto traders in West Africa.',
    sites: [
      { url: 'https://t.me/dakarcrypto', type: 'telegram' },
    ],
    status: 'pending', appliedAt: '2026-02-22T11:20:00Z',
  },
  {
    id: 'APP-005', name: 'Linda Osei', email: 'linda@finpodcast.com', country: 'Ghana', audienceSize: '10000-50000', promotionMethod: 'podcast',
    reason: 'I host "Crypto Africa Podcast" with 15K listeners per episode. I interview founders and review platforms—would love to do a CoinDaily feature.',
    sites: [
      { url: 'https://finpodcast.com', type: 'website' },
      { url: 'https://open.spotify.com/show/cryptoafrica', type: 'podcast' },
      { url: 'https://twitter.com/lindaosei', type: 'twitter' },
    ],
    status: 'pending', appliedAt: '2026-02-21T07:50:00Z',
  },
  {
    id: 'APP-006', name: 'Ahmed Hassan', email: 'ahmed@ethtrader.eg', country: 'Other', audienceSize: '1000-10000', promotionMethod: 'email',
    reason: 'I publish a weekly crypto newsletter for North African traders. 8K subscribers.',
    sites: [
      { url: 'https://ethtrader.eg', type: 'newsletter' },
      { url: 'https://twitter.com/ahmedcrypto', type: 'twitter' },
    ],
    status: 'approved', appliedAt: '2026-02-18T10:00:00Z', reviewedAt: '2026-02-19T14:30:00Z', reviewedBy: 'admin@coindaily.africa',
  },
  {
    id: 'APP-007', name: 'Spam Bot Account', email: 'bot@fakesites.xyz', country: 'Other', audienceSize: '<1000', promotionMethod: 'other',
    reason: 'make money fast crypto affiliate',
    sites: [
      { url: 'https://get-rich-crypto.xyz', type: 'website' },
    ],
    status: 'rejected', appliedAt: '2026-02-17T03:12:00Z', reviewedAt: '2026-02-17T09:00:00Z', reviewedBy: 'admin@coindaily.africa', notes: 'Spam/low-quality application',
  },
];

// ---- Helpers ----
const tierColors = {
  bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  silver: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};
const tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇' };

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  rejected: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  reversed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtDate = (d: string) => {
  if (!d || d === '-') return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ====== Component ======
export default function AffiliateManagementPage() {
  const [stats, setStats] = useState<AffiliateStats>(mockStats);
  const [affiliates, setAffiliates] = useState<Affiliate[]>(mockAffiliates);
  const [payouts, setPayouts] = useState<PayoutRequest[]>(mockPayouts);
  const [commissions, setCommissions] = useState<CommissionLog[]>(mockCommissions);
  const [applications, setApplications] = useState<AffiliateApplication[]>(mockApplications);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'affiliates' | 'payouts' | 'commissions' | 'settings'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{ action: string; id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    bronzeRate: 20,
    silverRate: 25,
    goldRate: 30,
    silverThreshold: 11,
    goldThreshold: 51,
    cookieDuration: 30,
    minPayout: 20,
    payoutSchedule: 'monthly',
    autoApprove: false,
    fraudDetection: true,
  });

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const showNotify = (type: 'success' | 'error', message: string) => setNotification({ type, message });

  // ---- Actions ----
  const handleApproveApplication = (id: string) => {
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: 'active' as const } : a));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1, activeAffiliates: prev.activeAffiliates + 1 }));
    showNotify('success', `Affiliate application approved`);
    setShowConfirmModal(null);
  };

  const handleRejectApplication = (id: string) => {
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as const } : a));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1 }));
    showNotify('success', `Affiliate application rejected`);
    setShowConfirmModal(null);
  };

  const handleSuspendAffiliate = (id: string) => {
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: 'suspended' as const } : a));
    setStats(prev => ({ ...prev, activeAffiliates: prev.activeAffiliates - 1, suspendedAffiliates: prev.suspendedAffiliates + 1 }));
    showNotify('success', `Affiliate suspended`);
    setShowConfirmModal(null);
  };

  const handleReinstateAffiliate = (id: string) => {
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: 'active' as const } : a));
    setStats(prev => ({ ...prev, activeAffiliates: prev.activeAffiliates + 1, suspendedAffiliates: prev.suspendedAffiliates - 1 }));
    showNotify('success', `Affiliate reinstated`);
    setShowConfirmModal(null);
  };

  const handleApprovePayout = (id: string) => {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' as const, processedAt: new Date().toISOString() } : p));
    showNotify('success', `Payout approved`);
    setShowConfirmModal(null);
  };

  const handleRejectPayout = (id: string) => {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' as const, processedAt: new Date().toISOString() } : p));
    showNotify('error', `Payout rejected`);
    setShowConfirmModal(null);
  };

  const handleUpgradeTier = (id: string) => {
    setAffiliates(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = a.tier === 'bronze' ? 'silver' : a.tier === 'silver' ? 'gold' : 'gold';
      return { ...a, tier: next as 'bronze' | 'silver' | 'gold' };
    }));
    showNotify('success', `Affiliate tier upgraded`);
  };

  // ---- Filtered Data ----
  const filteredAffiliates = affiliates.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchTier = tierFilter === 'all' || a.tier === tierFilter;
    return matchSearch && matchStatus && matchTier;
  });

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const pendingApps = applications.filter(a => a.status === 'pending');

  // ---- Application Actions ----
  const handleApproveApp = (id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'admin@coindaily.africa' } : a));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1, activeAffiliates: prev.activeAffiliates + 1, totalAffiliates: prev.totalAffiliates + 1 }));
    showNotify('success', `Application approved — affiliate account created`);
    setShowConfirmModal(null);
  };

  const handleRejectApp = (id: string, notes?: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'admin@coindaily.africa', notes: notes || 'Application rejected' } : a));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1 }));
    showNotify('success', `Application rejected`);
    setShowConfirmModal(null);
  };

  const [selectedApp, setSelectedApp] = useState<AffiliateApplication | null>(null);
  const [showAppDetail, setShowAppDetail] = useState(false);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');

  const filteredApps = applications.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(appSearchTerm.toLowerCase()) || a.email.toLowerCase().includes(appSearchTerm.toLowerCase());
    const matchStatus = appStatusFilter === 'all' || a.status === appStatusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'applications', label: `Applications (${pendingApps.length} new)`, icon: FileText },
    { key: 'affiliates', label: `Affiliates (${affiliates.length})`, icon: Users },
    { key: 'payouts', label: `Payouts (${pendingPayouts.length} pending)`, icon: Wallet },
    { key: 'commissions', label: `Commissions`, icon: DollarSign },
    { key: 'settings', label: 'Settings', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-orange-400" /> Affiliate Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage affiliates, review applications, track commissions, and process payouts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-800/50 rounded-xl p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ====== OVERVIEW TAB ====== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Affiliates', value: stats.totalAffiliates, icon: Users, color: 'text-blue-400', sub: `${stats.activeAffiliates} active` },
              { label: 'Pending Applications', value: stats.pendingApplications, icon: Clock, color: 'text-yellow-400', sub: 'Needs review' },
              { label: 'Total Commissions Earned', value: `$${fmt(stats.totalCommissionsEarned)}`, icon: DollarSign, color: 'text-green-400', sub: `$${fmt(stats.totalCommissionsPaid)} paid out` },
              { label: 'Pending Payouts', value: `$${fmt(stats.pendingPayouts)}`, icon: Wallet, color: 'text-orange-400', sub: `${pendingPayouts.length} requests` },
              { label: 'Total Referrals', value: fmt(stats.totalReferrals), icon: Send, color: 'text-purple-400', sub: `${stats.averageConversionRate}% avg conversion` },
              { label: 'Revenue from Affiliates', value: `$${fmt(stats.totalRevenue)}`, icon: TrendingUp, color: 'text-emerald-400', sub: `${stats.monthlyGrowth}% monthly growth` },
              { label: 'Suspended Affiliates', value: stats.suspendedAffiliates, icon: Ban, color: 'text-red-400', sub: 'Fraud / policy violation' },
              { label: 'Top Selling Product', value: stats.topProduct, icon: Award, color: 'text-cyan-400', sub: 'Highest affiliate revenue' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                    <span className="text-xs text-gray-400">{kpi.label}</span>
                  </div>
                  <p className="text-xl font-bold text-white">{kpi.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Top Affiliates Table (quick view) */}
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Top Performing Affiliates</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Affiliate</th>
                  <th className="text-left py-2 pr-4">Tier</th>
                  <th className="text-right py-2 pr-4">Referrals</th>
                  <th className="text-right py-2 pr-4">Conv. Rate</th>
                  <th className="text-right py-2 pr-4">Total Earned</th>
                  <th className="text-right py-2">Country</th>
                </tr></thead>
                <tbody>
                  {affiliates.filter(a => a.status === 'active').sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 5).map(a => (
                    <tr key={a.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium">{a.name}</p>
                        <p className="text-gray-500 text-xs">{a.referralCode}</p>
                      </td>
                      <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[a.tier]}`}>{tierIcons[a.tier]} {a.tier}</span></td>
                      <td className="py-3 pr-4 text-right text-white">{a.referrals}</td>
                      <td className="py-3 pr-4 text-right text-white">{a.conversionRate}%</td>
                      <td className="py-3 pr-4 text-right text-green-400 font-medium">${fmt(a.totalEarned)}</td>
                      <td className="py-3 text-right text-gray-400">{a.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Recent Commissions</h3>
            <div className="space-y-3">
              {commissions.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3">
                  <div>
                    <p className="text-white text-sm font-medium">{c.affiliateName} <span className="text-gray-500">→</span> {c.product}</p>
                    <p className="text-gray-500 text-xs">{fmtDate(c.createdAt)} · {c.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">${fmt(c.commissionAmount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====== APPLICATIONS TAB ====== */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending Review', count: applications.filter(a => a.status === 'pending').length, color: 'text-yellow-400', icon: Clock },
              { label: 'Approved', count: applications.filter(a => a.status === 'approved').length, color: 'text-green-400', icon: CheckCircle },
              { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'text-red-400', icon: XCircle },
              { label: 'Total Applications', count: applications.length, color: 'text-blue-400', icon: FileText },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                  <p className="text-xl font-bold text-white">{s.count}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name or email..." value={appSearchTerm} onChange={e => setAppSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <select value={appStatusFilter} onChange={e => setAppStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <p className="text-gray-500 text-sm">{filteredApps.length} application(s)</p>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApps.map(app => (
              <div key={app.id} className={`bg-gray-800 rounded-xl border p-5 ${app.status === 'pending' ? 'border-yellow-500/40' : 'border-gray-700/50'}`}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Applicant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        {app.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{app.name}</h4>
                        <p className="text-gray-400 text-xs">{app.email}</p>
                      </div>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status]}`}>{app.status}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                      <div><span className="text-gray-500">Country:</span> <span className="text-white ml-1">{app.country}</span></div>
                      <div><span className="text-gray-500">Audience:</span> <span className="text-white ml-1">{app.audienceSize}</span></div>
                      <div><span className="text-gray-500">Method:</span> <span className="text-white ml-1 capitalize">{app.promotionMethod}</span></div>
                      <div><span className="text-gray-500">Applied:</span> <span className="text-white ml-1">{fmtDate(app.appliedAt)}</span></div>
                    </div>

                    {app.reason && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Why they want to join:</p>
                        <p className="text-sm text-gray-300 bg-gray-700/30 rounded-lg p-3 italic">&ldquo;{app.reason}&rdquo;</p>
                      </div>
                    )}

                    {/* Sites */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> Sites &amp; Platforms ({app.sites.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {app.sites.map((site, i) => (
                          <a key={i} href={site.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-xs transition-all group">
                            <span className="text-gray-400 capitalize">{site.type}:</span>
                            <span className="text-blue-400 group-hover:text-blue-300 truncate max-w-[200px]">{site.url.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-400 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {app.notes && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Admin note: <span className="text-gray-400">{app.notes}</span>
                      </div>
                    )}
                    {app.reviewedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Reviewed {fmtDate(app.reviewedAt)} by {app.reviewedBy}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {app.status === 'pending' && (
                    <div className="flex lg:flex-col gap-2 flex-shrink-0">
                      <button onClick={() => setShowConfirmModal({ action: 'approve_app', id: app.id, name: app.name })}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-sm font-medium transition-all">
                        <UserCheck className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => setShowConfirmModal({ action: 'reject_app', id: app.id, name: app.name })}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-medium transition-all">
                        <UserX className="w-4 h-4" /> Reject
                      </button>
                      <button onClick={() => { setSelectedApp(app); setShowAppDetail(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-all">
                        <Eye className="w-4 h-4" /> Details
                      </button>
                    </div>
                  )}
                  {app.status !== 'pending' && (
                    <div className="flex-shrink-0">
                      <button onClick={() => { setSelectedApp(app); setShowAppDetail(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-all">
                        <Eye className="w-4 h-4" /> Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No applications match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* ====== APPLICATION DETAIL MODAL ====== */}
      {showAppDetail && selectedApp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAppDetail(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full p-6 border border-gray-700 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Application Details</h3>
              <button onClick={() => setShowAppDetail(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                  {selectedApp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-lg text-white font-semibold">{selectedApp.name}</h4>
                  <p className="text-gray-400 text-sm">{selectedApp.email}</p>
                </div>
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedApp.status]}`}>{selectedApp.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-700/30 rounded-xl p-4">
                <div><span className="text-gray-500">ID:</span> <span className="text-white font-mono ml-1">{selectedApp.id}</span></div>
                <div><span className="text-gray-500">Country:</span> <span className="text-white ml-1">{selectedApp.country}</span></div>
                <div><span className="text-gray-500">Audience:</span> <span className="text-white ml-1">{selectedApp.audienceSize}</span></div>
                <div><span className="text-gray-500">Primary Method:</span> <span className="text-white ml-1 capitalize">{selectedApp.promotionMethod}</span></div>
                <div><span className="text-gray-500">Applied:</span> <span className="text-white ml-1">{fmtDate(selectedApp.appliedAt)}</span></div>
                {selectedApp.reviewedAt && <div><span className="text-gray-500">Reviewed:</span> <span className="text-white ml-1">{fmtDate(selectedApp.reviewedAt)}</span></div>}
              </div>

              {selectedApp.reason && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Motivation</p>
                  <p className="text-sm text-gray-300 bg-gray-700/30 rounded-xl p-4">{selectedApp.reason}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider flex items-center gap-1"><Link2 className="w-3 h-3" /> Sites &amp; Platforms ({selectedApp.sites.length})</p>
                <div className="space-y-2">
                  {selectedApp.sites.map((site, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
                      <span className="text-xs text-gray-400 capitalize w-20 flex-shrink-0">{site.type}</span>
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 truncate flex-1">{site.url}</a>
                      <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {selectedApp.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Admin Notes</p>
                  <p className="text-sm text-gray-400 bg-gray-700/30 rounded-xl p-4">{selectedApp.notes}</p>
                </div>
              )}

              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-3 border-t border-gray-700">
                  <button onClick={() => { setShowAppDetail(false); setShowConfirmModal({ action: 'approve_app', id: selectedApp.id, name: selectedApp.name }); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all">
                    <UserCheck className="w-4 h-4" /> Approve Application
                  </button>
                  <button onClick={() => { setShowAppDetail(false); setShowConfirmModal({ action: 'reject_app', id: selectedApp.id, name: selectedApp.name }); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all">
                    <UserX className="w-4 h-4" /> Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== AFFILIATES TAB ====== */}
      {activeTab === 'affiliates' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, email or referral code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
              <option value="all">All Tiers</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>

          <p className="text-gray-500 text-sm">{filteredAffiliates.length} affiliate(s) found</p>

          {/* Affiliates Table */}
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-700 bg-gray-800/80">
                  <th className="text-left py-3 px-4">Affiliate</th>
                  <th className="text-left py-3 px-2">Code</th>
                  <th className="text-center py-3 px-2">Tier</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-right py-3 px-2">Referrals</th>
                  <th className="text-right py-3 px-2">Conv %</th>
                  <th className="text-right py-3 px-2">Earned</th>
                  <th className="text-right py-3 px-2">Pending</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredAffiliates.map(a => (
                    <tr key={a.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{a.name}</p>
                        <p className="text-gray-500 text-xs">{a.email}</p>
                      </td>
                      <td className="py-3 px-2">
                        <code className="text-orange-400 text-xs bg-gray-700/50 px-2 py-0.5 rounded">{a.referralCode}</code>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[a.tier]}`}>{tierIcons[a.tier]} {a.tier}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span>
                      </td>
                      <td className="py-3 px-2 text-right text-white">{a.referrals}</td>
                      <td className="py-3 px-2 text-right text-white">{a.conversionRate}%</td>
                      <td className="py-3 px-2 text-right text-green-400 font-medium">${fmt(a.totalEarned)}</td>
                      <td className="py-3 px-2 text-right text-orange-400">${fmt(a.pendingPayout)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setSelectedAffiliate(a); setShowDetailModal(true); }}
                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all" title="View Details">
                            <Eye className="w-3.5 h-3.5 text-gray-300" />
                          </button>
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => setShowConfirmModal({ action: 'approve', id: a.id, name: a.name })}
                                className="p-1.5 bg-green-600/20 hover:bg-green-600/40 rounded-lg transition-all" title="Approve">
                                <UserCheck className="w-3.5 h-3.5 text-green-400" />
                              </button>
                              <button onClick={() => setShowConfirmModal({ action: 'reject', id: a.id, name: a.name })}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded-lg transition-all" title="Reject">
                                <UserX className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </>
                          )}
                          {a.status === 'active' && (
                            <>
                              <button onClick={() => handleUpgradeTier(a.id)}
                                className="p-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-lg transition-all" title="Upgrade Tier">
                                <ArrowUpRight className="w-3.5 h-3.5 text-yellow-400" />
                              </button>
                              <button onClick={() => setShowConfirmModal({ action: 'suspend', id: a.id, name: a.name })}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded-lg transition-all" title="Suspend">
                                <Ban className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </>
                          )}
                          {a.status === 'suspended' && (
                            <button onClick={() => setShowConfirmModal({ action: 'reinstate', id: a.id, name: a.name })}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg transition-all" title="Reinstate">
                              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
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
        </div>
      )}

      {/* ====== PAYOUTS TAB ====== */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending', count: payouts.filter(p => p.status === 'pending').length, amount: payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0), color: 'text-yellow-400' },
              { label: 'Approved', count: payouts.filter(p => p.status === 'approved').length, amount: payouts.filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0), color: 'text-blue-400' },
              { label: 'Processing', count: payouts.filter(p => p.status === 'processing').length, amount: payouts.filter(p => p.status === 'processing').reduce((s, p) => s + p.amount, 0), color: 'text-purple-400' },
              { label: 'Paid', count: payouts.filter(p => p.status === 'paid').length, amount: payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), color: 'text-green-400' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
                <p className={`text-xs ${s.color} font-medium uppercase`}>{s.label}</p>
                <p className="text-xl font-bold text-white mt-1">{s.count}</p>
                <p className="text-xs text-gray-500">${fmt(s.amount)} total</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-700 bg-gray-800/80">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-2">Affiliate</th>
                  <th className="text-right py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Method</th>
                  <th className="text-left py-3 px-2">Destination</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Requested</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr></thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                      <td className="py-3 px-4 text-gray-400 text-xs font-mono">{p.id}</td>
                      <td className="py-3 px-2 text-white">{p.affiliateName}</td>
                      <td className="py-3 px-2 text-right text-green-400 font-bold">${fmt(p.amount)}</td>
                      <td className="py-3 px-2 text-gray-300">{p.method}</td>
                      <td className="py-3 px-2 text-gray-400 text-xs font-mono">{p.destination}</td>
                      <td className="py-3 px-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span></td>
                      <td className="py-3 px-2 text-gray-400 text-xs">{fmtDate(p.requestedAt)}</td>
                      <td className="py-3 px-4 text-center">
                        {p.status === 'pending' && (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setShowConfirmModal({ action: 'approve_payout', id: p.id, name: p.affiliateName })}
                              className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400 text-xs font-medium transition-all">
                              Approve
                            </button>
                            <button onClick={() => setShowConfirmModal({ action: 'reject_payout', id: p.id, name: p.affiliateName })}
                              className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400 text-xs font-medium transition-all">
                              Reject
                            </button>
                          </div>
                        )}
                        {p.status !== 'pending' && <span className="text-gray-600 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====== COMMISSIONS TAB ====== */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Commissions', value: commissions.length, sub: `$${fmt(commissions.reduce((s, c) => s + c.commissionAmount, 0))} total` },
              { label: 'Pending', value: commissions.filter(c => c.status === 'pending').length, sub: `$${fmt(commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0))}` },
              { label: 'Confirmed', value: commissions.filter(c => c.status === 'confirmed').length, sub: `$${fmt(commissions.filter(c => c.status === 'confirmed').reduce((s, c) => s + c.commissionAmount, 0))}` },
              { label: 'Reversed', value: commissions.filter(c => c.status === 'reversed').length, sub: `$${fmt(commissions.filter(c => c.status === 'reversed').reduce((s, c) => s + c.commissionAmount, 0))}` },
            ].map((s, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-white mt-1">{s.value}</p>
                <p className="text-xs text-gray-500">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-700 bg-gray-800/80">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-2">Affiliate</th>
                  <th className="text-left py-3 px-2">Product</th>
                  <th className="text-right py-3 px-2">Sale</th>
                  <th className="text-right py-3 px-2">Rate</th>
                  <th className="text-right py-3 px-2">Commission</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr></thead>
                <tbody>
                  {commissions.map(c => (
                    <tr key={c.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                      <td className="py-3 px-4 text-gray-400 text-xs font-mono">{c.id}</td>
                      <td className="py-3 px-2 text-white">{c.affiliateName}</td>
                      <td className="py-3 px-2 text-gray-300">{c.product}</td>
                      <td className="py-3 px-2 text-right text-white">${fmt(c.saleAmount)}</td>
                      <td className="py-3 px-2 text-right text-orange-400">{c.commissionRate}%</td>
                      <td className="py-3 px-2 text-right text-green-400 font-bold">${fmt(c.commissionAmount)}</td>
                      <td className="py-3 px-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span></td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====== SETTINGS TAB ====== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Commission Tiers */}
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Commission Tier Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { tier: 'Bronze', icon: '🥉', field: 'bronzeRate' as const, threshold: '0–10 referrals', color: 'border-orange-500' },
                { tier: 'Silver', icon: '🥈', field: 'silverRate' as const, threshold: `${settings.silverThreshold}–${settings.goldThreshold - 1} referrals`, color: 'border-gray-400' },
                { tier: 'Gold', icon: '🥇', field: 'goldRate' as const, threshold: `${settings.goldThreshold}+ referrals`, color: 'border-yellow-500' },
              ].map(t => (
                <div key={t.tier} className={`bg-gray-700/30 rounded-xl p-4 border-l-4 ${t.color}`}>
                  <p className="text-white font-medium mb-1">{t.icon} {t.tier} Tier</p>
                  <p className="text-gray-500 text-xs mb-3">{t.threshold}</p>
                  <label className="block text-gray-400 text-xs mb-1">Commission Rate (%)</label>
                  <input type="number" value={settings[t.field]} onChange={e => setSettings(prev => ({ ...prev, [t.field]: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm" min={1} max={50} />
                </div>
              ))}
            </div>
          </div>

          {/* Tier Thresholds */}
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Tier Thresholds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Silver Threshold (referrals)</label>
                <input type="number" value={settings.silverThreshold} onChange={e => setSettings(prev => ({ ...prev, silverThreshold: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Gold Threshold (referrals)</label>
                <input type="number" value={settings.goldThreshold} onChange={e => setSettings(prev => ({ ...prev, goldThreshold: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
              </div>
            </div>
          </div>

          {/* Payout Settings */}
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Payout Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Minimum Payout ($)</label>
                <input type="number" value={settings.minPayout} onChange={e => setSettings(prev => ({ ...prev, minPayout: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Cookie Duration (days)</label>
                <input type="number" value={settings.cookieDuration} onChange={e => setSettings(prev => ({ ...prev, cookieDuration: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Payout Schedule</label>
                <select value={settings.payoutSchedule} onChange={e => setSettings(prev => ({ ...prev, payoutSchedule: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Automation */}
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Automation & Security</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-white text-sm font-medium">Auto-approve Payouts Under Threshold</p>
                  <p className="text-gray-500 text-xs">Automatically approve payouts under $100 for Gold-tier affiliates</p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${settings.autoApprove ? 'bg-orange-600' : 'bg-gray-600'}`}
                  onClick={() => setSettings(prev => ({ ...prev, autoApprove: !prev.autoApprove }))}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${settings.autoApprove ? 'left-6' : 'left-0.5'}`} />
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-white text-sm font-medium">Fraud Detection</p>
                  <p className="text-gray-500 text-xs">Flag & suspend affiliates with abnormal click-to-conversion patterns</p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${settings.fraudDetection ? 'bg-orange-600' : 'bg-gray-600'}`}
                  onClick={() => setSettings(prev => ({ ...prev, fraudDetection: !prev.fraudDetection }))}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${settings.fraudDetection ? 'left-6' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
          </div>

          <button onClick={() => showNotify('success', 'Affiliate settings saved successfully!')}
            className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all">
            Save Settings
          </button>
        </div>
      )}

      {/* ====== DETAIL MODAL ====== */}
      {showDetailModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-lg w-full p-6 border border-gray-700 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{selectedAffiliate.name}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">ID</span><span className="text-white font-mono">{selectedAffiliate.id}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="text-white">{selectedAffiliate.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Referral Code</span><code className="text-orange-400 bg-gray-700/50 px-2 py-0.5 rounded">{selectedAffiliate.referralCode}</code></div>
              <div className="flex justify-between"><span className="text-gray-400">Tier</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[selectedAffiliate.tier]}`}>{tierIcons[selectedAffiliate.tier]} {selectedAffiliate.tier}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedAffiliate.status]}`}>{selectedAffiliate.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Country</span><span className="text-white">{selectedAffiliate.country}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Joined</span><span className="text-white">{fmtDate(selectedAffiliate.joinedAt)}</span></div>
              <hr className="border-gray-700" />
              <div className="flex justify-between"><span className="text-gray-400">Total Referrals</span><span className="text-white font-bold">{selectedAffiliate.referrals}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Conversions</span><span className="text-white font-bold">{selectedAffiliate.conversions}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Conversion Rate</span><span className="text-white font-bold">{selectedAffiliate.conversionRate}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Earned</span><span className="text-green-400 font-bold">${fmt(selectedAffiliate.totalEarned)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pending Payout</span><span className="text-orange-400 font-bold">${fmt(selectedAffiliate.pendingPayout)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Last Payout</span><span className="text-white">{fmtDate(selectedAffiliate.lastPayout)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Payout Method</span><span className="text-white">{selectedAffiliate.payoutMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Top Product</span><span className="text-white">{selectedAffiliate.topProduct}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ====== CONFIRM MODAL ====== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmModal(null)}>
          <div className="bg-gray-800 rounded-2xl max-w-sm w-full p-6 border border-gray-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Confirm Action</h3>
            <p className="text-gray-400 text-sm mb-6">
              {showConfirmModal.action === 'approve' && `Approve affiliate application from ${showConfirmModal.name}?`}
              {showConfirmModal.action === 'reject' && `Reject affiliate application from ${showConfirmModal.name}? This cannot be undone.`}
              {showConfirmModal.action === 'suspend' && `Suspend affiliate ${showConfirmModal.name}? They will lose access to the program.`}
              {showConfirmModal.action === 'reinstate' && `Reinstate affiliate ${showConfirmModal.name}? They will regain access to the program.`}
              {showConfirmModal.action === 'approve_payout' && `Approve payout for ${showConfirmModal.name}? Funds will be sent.`}
              {showConfirmModal.action === 'reject_payout' && `Reject payout for ${showConfirmModal.name}? Funds will be returned to their balance.`}
              {showConfirmModal.action === 'approve_app' && `Approve affiliate application from ${showConfirmModal.name}? They will be added to the affiliate program.`}
              {showConfirmModal.action === 'reject_app' && `Reject affiliate application from ${showConfirmModal.name}? They will be notified of the rejection.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-sm">
                Cancel
              </button>
              <button onClick={() => {
                const { action, id } = showConfirmModal;
                if (action === 'approve') handleApproveApplication(id);
                else if (action === 'reject') handleRejectApplication(id);
                else if (action === 'suspend') handleSuspendAffiliate(id);
                else if (action === 'reinstate') handleReinstateAffiliate(id);
                else if (action === 'approve_payout') handleApprovePayout(id);
                else if (action === 'reject_payout') handleRejectPayout(id);
                else if (action === 'approve_app') handleApproveApp(id);
                else if (action === 'reject_app') handleRejectApp(id);
              }}
                className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
                  showConfirmModal.action.includes('reject') || showConfirmModal.action === 'suspend'
                    ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
